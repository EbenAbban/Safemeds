// Firestore-based WebRTC signaling for SafeMeds video consultations.
//
// Why Firestore: the app already initializes Firestore (`db` in ./firebase) and
// there is no standalone WebSocket signaling server. Firestore's realtime
// listeners are enough to exchange the SDP offer/answer and ICE candidates that
// WebRTC needs to negotiate a peer-to-peer media connection.
//
// Room layout:
//   videoRooms/{roomId}                        -> { offer, answer }
//   videoRooms/{roomId}/callerCandidates/{id}  -> ICE from the caller (student)
//   videoRooms/{roomId}/calleeCandidates/{id}  -> ICE from the callee (pharmacist)
//
// The student client calls `createCall` (creates the offer); a future pharmacist
// client would call `joinCall` (answers it). Until that pharmacist client exists,
// `createCall` simply never receives an answer — handle that with a timeout in
// the UI rather than hanging forever.

import {
  collection,
  doc,
  setDoc,
  getDoc,
  addDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  type DocumentData,
} from "firebase/firestore";
import { db, ensureAuth } from "./firebase";

// Public STUN servers are enough for NAT traversal on most networks.
// For symmetric NATs a TURN server is required — add one here in production.
const iceServers: RTCIceServer[] = [
  { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] },
];

// Only add a TURN server when it's fully configured. An entry with an empty
// username/credential makes RTCPeerConnection throw InvalidAccessError.
const turnUrl = process.env.NEXT_PUBLIC_TURN_URL;
const turnUser = process.env.NEXT_PUBLIC_TURN_USERNAME;
const turnCred = process.env.NEXT_PUBLIC_TURN_CREDENTIAL;
if (turnUrl && turnUser && turnCred) {
  iceServers.push({ urls: turnUrl, username: turnUser, credential: turnCred });
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers,
  iceCandidatePoolSize: 10,
};

export interface CallHandle {
  pc: RTCPeerConnection;
  // Tear down listeners and close the peer connection.
  hangUp: () => void;
}

export interface CreateCallOptions {
  roomId: string;
  localStream: MediaStream;
  // Label shown to the pharmacist on the incoming-call prompt.
  callerName?: string;
  // Called with the combined remote MediaStream once tracks arrive.
  onRemoteStream: (stream: MediaStream) => void;
  // Called on every connection state change (e.g. "connected", "failed").
  onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
}

// Caller side (student). Publishes an offer + ICE, waits for the pharmacist's answer.
export async function createCall({
  roomId,
  localStream,
  callerName = "Patient",
  onRemoteStream,
  onConnectionStateChange,
}: CreateCallOptions): Promise<CallHandle> {
  await ensureAuth();
  const pc = new RTCPeerConnection(ICE_SERVERS);
  const unsubscribers: Array<() => void> = [];

  // Push every local track onto the connection so the peer receives our media.
  localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

  // Surface remote tracks as a single stream for the <video> element.
  const remoteStream = new MediaStream();
  pc.ontrack = (event) => {
    event.streams[0]?.getTracks().forEach((t) => remoteStream.addTrack(t));
    onRemoteStream(remoteStream);
  };

  if (onConnectionStateChange) {
    pc.onconnectionstatechange = () => onConnectionStateChange(pc.connectionState);
  }

  const roomRef = doc(db, "videoRooms", roomId);
  const callerCandidates = collection(roomRef, "callerCandidates");
  const calleeCandidates = collection(roomRef, "calleeCandidates");

  // Send our ICE candidates to Firestore as they are discovered.
  pc.onicecandidate = (event) => {
    if (event.candidate) {
      void addDoc(callerCandidates, event.candidate.toJSON());
    }
  };

  // Create + store the SDP offer.
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  await setDoc(roomRef, {
    offer: { type: offer.type, sdp: offer.sdp },
    createdAt: Date.now(),
    status: "ringing", // "ringing" -> "answered" (set by the pharmacist via joinCall)
    callerName,
  });

  // Apply the pharmacist's answer when it appears.
  unsubscribers.push(
    onSnapshot(roomRef, (snapshot) => {
      const data = snapshot.data() as DocumentData | undefined;
      if (data?.answer && !pc.currentRemoteDescription) {
        void pc.setRemoteDescription(new RTCSessionDescription(data.answer));
      }
    })
  );

  // Apply the pharmacist's ICE candidates as they arrive.
  unsubscribers.push(
    onSnapshot(calleeCandidates, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          void pc.addIceCandidate(new RTCIceCandidate(change.doc.data()));
        }
      });
    })
  );

  const hangUp = () => {
    unsubscribers.forEach((u) => u());
    pc.getSenders().forEach((s) => s.track?.stop());
    pc.close();
  };

  return { pc, hangUp };
}

export interface IncomingCall {
  roomId: string;
  callerName: string;
  createdAt: number;
}

// Pharmacist side: subscribe to rooms still waiting for an answer ("ringing").
// Fires `onCall` for each new incoming consultation call. Returns an unsubscribe fn.
export function listenForIncomingCalls(
  onCall: (call: IncomingCall) => void
): () => void {
  let unsub = () => {};
  let cancelled = false;
  ensureAuth()
    .then(() => {
      if (cancelled) return;
      const roomsRef = collection(db, "videoRooms");
      const ringingQuery = query(roomsRef, where("status", "==", "ringing"));
      unsub = onSnapshot(ringingQuery, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            const data = change.doc.data();
            onCall({
              roomId: change.doc.id,
              callerName: data.callerName || "Patient",
              createdAt: data.createdAt || Date.now(),
            });
          }
        });
      });
    })
    .catch((e) => console.error("call listener auth failed:", e));
  return () => {
    cancelled = true;
    unsub();
  };
}

export type JoinCallOptions = CreateCallOptions;

// Callee side (pharmacist client — not yet built). Reads the offer, sends an answer.
// Provided so the future pharmacist UI can complete the handshake without
// re-deriving the room layout.
export async function joinCall({
  roomId,
  localStream,
  onRemoteStream,
  onConnectionStateChange,
}: JoinCallOptions): Promise<CallHandle | null> {
  await ensureAuth();
  const roomRef = doc(db, "videoRooms", roomId);
  const roomSnap = await getDoc(roomRef);
  if (!roomSnap.exists() || !roomSnap.data()?.offer) {
    return null; // No active call to join.
  }

  const pc = new RTCPeerConnection(ICE_SERVERS);
  const unsubscribers: Array<() => void> = [];

  localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

  const remoteStream = new MediaStream();
  pc.ontrack = (event) => {
    event.streams[0]?.getTracks().forEach((t) => remoteStream.addTrack(t));
    onRemoteStream(remoteStream);
  };

  if (onConnectionStateChange) {
    pc.onconnectionstatechange = () => onConnectionStateChange(pc.connectionState);
  }

  const callerCandidates = collection(roomRef, "callerCandidates");
  const calleeCandidates = collection(roomRef, "calleeCandidates");

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      void addDoc(calleeCandidates, event.candidate.toJSON());
    }
  };

  await pc.setRemoteDescription(
    new RTCSessionDescription(roomSnap.data()!.offer)
  );
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  await updateDoc(roomRef, {
    answer: { type: answer.type, sdp: answer.sdp },
    status: "answered",
  });

  unsubscribers.push(
    onSnapshot(callerCandidates, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          void pc.addIceCandidate(new RTCIceCandidate(change.doc.data()));
        }
      });
    })
  );

  const hangUp = () => {
    unsubscribers.forEach((u) => u());
    pc.getSenders().forEach((s) => s.track?.stop());
    pc.close();
  };

  return { pc, hangUp };
}
