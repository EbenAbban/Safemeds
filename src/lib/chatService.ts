// Real-time chat over Firestore — replaces the mock canned-pharmacist replies.
// Student and pharmacist join the same room by chatId and exchange live messages.
//
// Doc layout: chatRooms/{chatId}/messages/{messageId}
//   { text, sender: "user" | "pharmacist" | "system", senderName, createdAt }

import {
  collection,
  doc,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db, ensureAuth } from "./firebase";

export type ChatSender = "user" | "pharmacist" | "system";

export interface ChatMessage {
  id: string;
  text: string;
  sender: ChatSender;
  senderName?: string;
  createdAt: number; // epoch ms (resolved client-side from serverTimestamp)
}

// Send a message into a room. Also stamps the room doc so it shows up in the
// pharmacist inbox (lastMessage / updatedAt).
export async function sendChatMessage(
  chatId: string,
  msg: { text: string; sender: ChatSender; senderName?: string }
): Promise<void> {
  await ensureAuth();
  const roomRef = doc(db, "chatRooms", chatId);
  await setDoc(
    roomRef,
    {
      chatId,
      lastMessage: msg.text,
      lastSender: msg.sender,
      updatedAt: Date.now(),
    },
    { merge: true }
  );
  await addDoc(collection(roomRef, "messages"), {
    text: msg.text,
    sender: msg.sender,
    senderName: msg.senderName ?? null,
    createdAt: serverTimestamp(),
    createdAtMs: Date.now(), // immediate ordering before server timestamp resolves
  });
}

export interface ChatRoomSummary {
  chatId: string;
  lastMessage: string;
  lastSender: ChatSender;
  updatedAt: number;
}

// Pharmacist inbox: subscribe to all rooms, newest activity first.
export function subscribeChatRooms(
  onRooms: (rooms: ChatRoomSummary[]) => void
): () => void {
  let unsub = () => {};
  let cancelled = false;
  ensureAuth()
    .then(() => {
      if (cancelled) return;
      const q = query(collection(db, "chatRooms"), orderBy("updatedAt", "desc"));
      unsub = onSnapshot(q, (snap) => {
        onRooms(
          snap.docs.map((d) => {
            const data = d.data();
            return {
              chatId: data.chatId ?? d.id,
              lastMessage: data.lastMessage ?? "",
              lastSender: (data.lastSender ?? "user") as ChatSender,
              updatedAt: data.updatedAt ?? 0,
            };
          })
        );
      });
    })
    .catch((e) => console.error("chat auth failed:", e));
  return () => {
    cancelled = true;
    unsub();
  };
}

// Subscribe to a room's messages in chronological order. Returns unsubscribe.
export function subscribeChatMessages(
  chatId: string,
  onMessages: (messages: ChatMessage[]) => void
): () => void {
  let unsub = () => {};
  let cancelled = false;
  ensureAuth()
    .then(() => {
      if (cancelled) return;
      const roomRef = doc(db, "chatRooms", chatId);
      const q = query(collection(roomRef, "messages"), orderBy("createdAtMs", "asc"));
      unsub = onSnapshot(q, (snap) => {
        onMessages(
          snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              text: data.text,
              sender: data.sender as ChatSender,
              senderName: data.senderName ?? undefined,
              createdAt: data.createdAtMs ?? Date.now(),
            };
          })
        );
      });
    })
    .catch((e) => console.error("chat auth failed:", e));
  return () => {
    cancelled = true;
    unsub();
  };
}
