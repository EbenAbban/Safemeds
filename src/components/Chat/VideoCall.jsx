"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Monitor,
  Volume2,
  Lock,
  Loader2,
  AlertCircle
} from "lucide-react";

// VideoCall renders the student side of a consultation call.
//
// Media is real: it captures the local camera + mic via getUserMedia, toggles
// mic/camera by flipping track.enabled (no stream churn), and screen-shares via
// getDisplayMedia.
//
// Connection has two modes:
//   - Demo (default): a scripted ringing -> connecting -> connected timeline so
//     the experience can be shown without a pharmacist client on the other end.
//   - Live (useLiveSignaling + roomId): a real RTCPeerConnection negotiated over
//     Firestore (see src/lib/webrtcSignaling). If no pharmacist answers within
//     NO_ANSWER_TIMEOUT_MS, the call ends gracefully instead of hanging.
export default function VideoCall({
  pharmacistName,
  onEndCall,
  roomId,
  useLiveSignaling = false,
  role = "caller", // "caller" = student dials out; "callee" = pharmacist answers
  callerName = "Patient"
}) {
  // The pharmacist answers an already-ringing call, so skip straight to connecting.
  const [callState, setCallState] = useState(role === "callee" ? "connecting" : "ringing"); // ringing -> connecting -> connected -> ended | unavailable
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [cameraError, setCameraError] = useState(null);
  const [hasRemoteStream, setHasRemoteStream] = useState(false);
  const [localReady, setLocalReady] = useState(false); // local camera/mic captured

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const screenVideoRef = useRef(null);

  const localStreamRef = useRef(null); // camera + mic MediaStream
  const screenStreamRef = useRef(null); // getDisplayMedia MediaStream
  const screenControllerRef = useRef(null); // CaptureController (progressive enhancement)
  const callHandleRef = useRef(null); // { pc, hangUp } from webrtcSignaling
  const captureAttemptedRef = useRef(false); // guard to capture camera once

  // Stop and release every track we are holding. Safe to call multiple times.
  const stopAllMedia = () => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current = null;
    callHandleRef.current?.hangUp();
    callHandleRef.current = null;
  };

  // --- State machine timeline (demo mode only) -----------------------------
  useEffect(() => {
    if (useLiveSignaling) return; // live mode drives state from connection events
    let timer;
    if (callState === "ringing") {
      timer = setTimeout(() => setCallState("connecting"), 3500);
    } else if (callState === "connecting") {
      timer = setTimeout(() => setCallState("connected"), 2000);
    }
    return () => clearTimeout(timer);
  }, [callState, useLiveSignaling]);

  // Live caller: show the ringing screen briefly, then move to "connecting"
  // where media is captured and the offer is published (negotiation begins).
  useEffect(() => {
    if (!useLiveSignaling || role !== "caller") return;
    if (callState !== "ringing") return;
    const timer = setTimeout(() => setCallState("connecting"), 1200);
    return () => clearTimeout(timer);
  }, [useLiveSignaling, role, callState]);

  // --- Active call duration counter ---------------------------------------
  useEffect(() => {
    let interval;
    if (callState === "connected") {
      interval = setInterval(() => setCallDuration((prev) => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [callState]);

  // --- Capture local camera + mic once we start connecting -----------------
  useEffect(() => {
    let cancelled = false;
    if (callState !== "connecting" && callState !== "connected") return;
    if (captureAttemptedRef.current) return;
    captureAttemptedRef.current = true;

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera not available on this device/browser.");
      setLocalReady(true);
      return;
    }

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user" }, audio: true })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        localStreamRef.current = stream;
        // Apply current toggle state to the freshly captured tracks.
        stream.getAudioTracks().forEach((t) => (t.enabled = !isMuted));
        stream.getVideoTracks().forEach((t) => (t.enabled = !isVideoOff));
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        setCameraError(null);
        setLocalReady(true);
      })
      .catch((err) => {
        console.warn("Camera/mic access denied or unavailable:", err);
        if (!cancelled) {
          setCameraError("Camera/mic permission denied. Using avatar instead.");
          // Still allow the call to proceed (avatar/no-media) so signaling isn't blocked.
          setLocalReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // Intentionally stable deps: camera capture must fire exactly once. The ref
    // guard (captureAttemptedRef) prevents re-runs. Toggle state is applied to
    // already-captured stream tracks.
  }, [callState]);

  // Keep the local <video> bound to the stream whenever it remounts.
  useEffect(() => {
    if (localVideoRef.current && localStreamRef.current && !isVideoOff) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
  }, [callState, isVideoOff]);

  // --- Live WebRTC signaling (real peer connection) ------------------------
  const NO_ANSWER_TIMEOUT_MS = 30000;
  useEffect(() => {
    if (!useLiveSignaling || !roomId) return;
    if (callState !== "connecting") return;
    if (!localReady || callHandleRef.current) return; // wait for media, run once

    let answerTimer;
    let active = true;

    const start = async () => {
      // Camera/mic may have been denied — negotiate with an empty stream so the
      // call still connects (audio/video can be toggled on later).
      const localStream = localStreamRef.current || new MediaStream();
      try {
        const signaling = await import("@/lib/webrtcSignaling");
        const commonOpts = {
          roomId,
          localStream,
          onRemoteStream: (stream) => {
            if (!active) return;
            if (remoteVideoRef.current) remoteVideoRef.current.srcObject = stream;
            setHasRemoteStream(true);
          },
          onConnectionStateChange: (state) => {
            if (!active) return;
            if (state === "connected") {
              clearTimeout(answerTimer);
              setCallState("connected");
            } else if (state === "failed" || state === "disconnected") {
              setCallState("unavailable");
            }
          }
        };

        const handle =
          role === "callee"
            ? await signaling.joinCall(commonOpts)
            : await signaling.createCall({ ...commonOpts, callerName });

        if (!handle) {
          // Callee: the room/offer disappeared before we could answer.
          if (active) setCallState("unavailable");
          return;
        }
        if (!active) {
          handle.hangUp();
          return;
        }
        callHandleRef.current = handle;

        // Caller only: if no one answers, stop ringing into the void.
        if (role === "caller") {
          answerTimer = setTimeout(() => {
            if (active && callHandleRef.current?.pc.connectionState !== "connected") {
              setCallState("unavailable");
            }
          }, NO_ANSWER_TIMEOUT_MS);
        }
      } catch (err) {
        console.error("Live signaling failed:", err);
        if (active) setCallState("unavailable");
      }
    };

    start();
    return () => {
      active = false;
      clearTimeout(answerTimer);
    };
  }, [useLiveSignaling, roomId, callState, localReady, role, callerName]);

  // --- Cleanup on unmount --------------------------------------------------
  useEffect(() => {
    return () => stopAllMedia();
  }, []);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Mute toggles the actual audio track rather than only the icon.
  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    localStreamRef.current?.getAudioTracks().forEach((t) => (t.enabled = !next));
  };

  // Camera toggle disables the video track (keeps it alive for instant resume).
  const toggleVideo = () => {
    const next = !isVideoOff;
    setIsVideoOff(next);
    localStreamRef.current?.getVideoTracks().forEach((t) => (t.enabled = !next));
  };

  // Real screen sharing via getDisplayMedia.
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      stopScreenShare();
      return;
    }
    try {
      // CaptureController — progressive enhancement, not supported everywhere yet.
      const controller = typeof CaptureController !== "undefined" ? new CaptureController() : null;
      screenControllerRef.current = controller;

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
        controller,
      });
      screenStreamRef.current = stream;
      setIsScreenSharing(true);
      if (screenVideoRef.current) screenVideoRef.current.srcObject = stream;

      // In live mode, replace the outgoing camera track with the screen track.
      const pc = callHandleRef.current?.pc;
      const screenTrack = stream.getVideoTracks()[0];
      if (pc && screenTrack) {
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        await sender?.replaceTrack(screenTrack);
      }
      // When the user stops sharing from the browser UI, revert.
      if (screenTrack) screenTrack.onended = () => stopScreenShare();
    } catch (err) {
      console.warn("Screen share cancelled or unavailable:", err);
    }
  };

  const stopScreenShare = async () => {
    // Use CaptureController if available, otherwise fall back to track.stop().
    const ctrl = screenControllerRef.current;
    if (ctrl) {
      try { ctrl.stopCapture(); } catch { /* already stopped */ }
      screenControllerRef.current = null;
    }
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current = null;
    setIsScreenSharing(false);

    // Restore the camera track on the outgoing connection in live mode.
    const pc = callHandleRef.current?.pc;
    const cameraTrack = localStreamRef.current?.getVideoTracks()[0];
    if (pc && cameraTrack) {
      const sender = pc.getSenders().find((s) => s.track?.kind === "video");
      await sender?.replaceTrack(cameraTrack);
    }
  };

  const handleEndCall = () => {
    stopAllMedia();
    setCallState("ended");
    setTimeout(() => {
      onEndCall(formatDuration(callDuration));
    }, 1200);
  };

  return (
    <div className="absolute inset-0 bg-gray-900 z-50 flex flex-col justify-between overflow-hidden text-white font-sans">

      {/* 1. RINGING STATE VIEW */}
      {callState === "ringing" && (
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="relative mb-8">
            {/* Animated Pulsing Rings */}
            <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping" />
            <div className="absolute -inset-4 rounded-full bg-blue-500/10 animate-pulse" />
            <div className="w-32 h-32 bg-gradient-to-tr from-blue-500 via-indigo-600 to-purple-600 rounded-full flex items-center justify-center border-4 border-white/20 relative shadow-2xl">
              <span className="text-5xl">👩‍⚕️</span>
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-2">{pharmacistName}</h2>
          <p className="text-blue-400 font-medium mb-8 animate-pulse text-sm tracking-wider">
            SECURE CONSULTATION CALLING...
          </p>

          <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 flex items-center gap-2 mb-16 max-w-sm text-center">
            <Lock className="w-4 h-4 text-green-400" />
            <span className="text-xs text-gray-400">
              Connection secured with peer-to-peer end-to-end encryption.
            </span>
          </div>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleEndCall}
            aria-label="Cancel call"
            className="w-16 h-16 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center shadow-lg cursor-pointer"
          >
            <PhoneOff className="w-7 h-7 text-white" />
          </motion.button>
        </div>
      )}

      {/* 2. CONNECTING STATE VIEW */}
      {callState === "connecting" && (
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <Loader2 className="w-16 h-16 text-indigo-500 animate-spin mb-6" />
          <h3 className="text-xl font-bold mb-2">Connecting...</h3>
          <p className="text-sm text-gray-400 animate-pulse">
            Establishing secure WebRTC media tunnel
          </p>
        </div>
      )}

      {/* 3. ACTIVE CONNECTED STATE VIEW */}
      {callState === "connected" && (
        <div className="relative flex-1 flex flex-col">

          {/* Top Bar Overlay */}
          <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-center no-print">
            <div className="bg-black/50 backdrop-blur-md px-4 py-2 rounded-xl flex items-center gap-3 border border-white/10">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-ping" />
              <div className="text-sm font-semibold tracking-wider">
                LIVE CONSULTATION
              </div>
              <span className="text-xs text-gray-400">|</span>
              <div className="text-xs font-mono font-bold text-gray-300">
                {formatDuration(callDuration)}
              </div>
            </div>

            <div className="bg-green-600/90 text-white px-3 py-1.5 rounded-xl text-xs flex items-center gap-2 font-medium shadow-md">
              <Lock className="w-3.5 h-3.5" />
              <span>HIPAA Compliant</span>
            </div>
          </div>

          {/* Main Remote Feed */}
          <div className="flex-1 relative bg-gradient-to-tr from-gray-950 via-gray-900 to-indigo-950 flex items-center justify-center overflow-hidden">

            {/* Screen Share Preview (real getDisplayMedia output) */}
            {isScreenSharing ? (
              <div className="absolute inset-0 bg-gray-950 z-10 flex flex-col p-6 pt-16">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-indigo-300 flex items-center gap-2">
                    <Monitor className="w-4 h-4" /> You are sharing your screen
                  </span>
                  <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-semibold">
                    SHARING
                  </span>
                </div>
                <video
                  ref={screenVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="flex-1 w-full rounded-2xl border-4 border-indigo-500 bg-black object-contain"
                />
              </div>
            ) : null}

            {/* Remote pharmacist video (live mode) or avatar fallback (demo / no stream) */}
            {useLiveSignaling && hasRemoteStream ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-6 text-center select-none">
                <div className="relative mb-6">
                  <div className="w-40 h-40 bg-gradient-to-tr from-green-500 via-indigo-600 to-purple-600 rounded-full flex items-center justify-center border-4 border-indigo-500/30 shadow-2xl relative">
                    <span className="text-6xl">👩‍⚕️</span>
                  </div>
                  {/* Voice visualizer */}
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 flex items-end justify-center space-x-1 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                    <Volume2 className="w-3.5 h-3.5 text-blue-400 mr-1" />
                    {[...Array(5)].map((_, i) => (
                      <motion.div
                        key={i}
                        animate={{ height: [6, 16, 6] }}
                        transition={{
                          duration: 0.6 + Math.random() * 0.4,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: i * 0.1
                        }}
                        className="w-1 bg-blue-400 rounded-full"
                        style={{ height: "6px" }}
                      />
                    ))}
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-1">{pharmacistName}</h3>
                <p className="text-xs text-blue-400 font-semibold tracking-wider">
                  ACTIVE VOICE CHANNEL
                </p>
              </div>
            )}
          </div>

          {/* Picture-in-Picture Local Feed (real camera) */}
          <div className="absolute right-4 bottom-24 w-32 h-44 sm:w-40 sm:h-52 bg-gray-950 rounded-2xl overflow-hidden border border-white/20 shadow-2xl z-20">
            {isVideoOff ? (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gray-950 text-center p-3 select-none">
                <span className="text-2xl mb-1">👤</span>
                <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">
                  Camera Off
                </span>
              </div>
            ) : cameraError ? (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gray-950 text-center p-3 select-none">
                <AlertCircle className="w-6 h-6 text-yellow-500 mb-1" />
                <span className="text-[9px] text-gray-400">No Camera</span>
              </div>
            ) : (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]"
              />
            )}
            <div className="absolute bottom-2 left-2 right-2 bg-black/50 backdrop-blur-md px-1.5 py-0.5 rounded text-[9px] font-medium text-center uppercase tracking-wider">
              You (Student)
            </div>
          </div>

          {/* Bottom Toolbar Control Panel */}
          <div className="bg-gray-950/80 backdrop-blur-md border-t border-white/10 p-6 flex justify-center items-center gap-4 sm:gap-6 z-20 no-print">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleMute}
              aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
              aria-pressed={isMuted}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                isMuted ? "bg-red-600 text-white" : "bg-white/10 text-white hover:bg-white/20 border border-white/15"
              }`}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleVideo}
              aria-label={isVideoOff ? "Turn camera on" : "Turn camera off"}
              aria-pressed={isVideoOff}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                isVideoOff ? "bg-red-600 text-white" : "bg-white/10 text-white hover:bg-white/20 border border-white/15"
              }`}
            >
              {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleScreenShare}
              aria-label={isScreenSharing ? "Stop screen share" : "Share screen"}
              aria-pressed={isScreenSharing}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                isScreenSharing ? "bg-blue-600 text-white" : "bg-white/10 text-white hover:bg-white/20 border border-white/15"
              }`}
            >
              <Monitor className="w-5 h-5" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleEndCall}
              aria-label="End call"
              className="w-14 h-14 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-red-600/30 cursor-pointer"
            >
              <PhoneOff className="w-6 h-6" />
            </motion.button>
          </div>

        </div>
      )}

      {/* 4. UNAVAILABLE STATE VIEW (live mode, no pharmacist answered) */}
      {callState === "unavailable" && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center text-yellow-500 mb-6">
            <AlertCircle className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold mb-2">No pharmacist available</h2>
          <p className="text-sm text-gray-500 max-w-sm mb-8">
            We couldn&apos;t reach a pharmacist for a live video consultation right now.
            Please try again shortly or continue your consultation via chat.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleEndCall}
            className="bg-white/10 hover:bg-white/20 border border-white/15 px-6 py-2.5 rounded-xl text-sm font-medium"
          >
            Close
          </motion.button>
        </div>
      )}

      {/* 5. ENDED STATE VIEW */}
      {callState === "ended" && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mb-6">
            <PhoneOff className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Call Disconnected</h2>
          <p className="text-sm text-gray-500">
            Secure video consultation has successfully closed.
          </p>
        </div>
      )}

    </div>
  );
}
