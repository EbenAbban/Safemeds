"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, PhoneOff, Video } from "lucide-react";
import { listenForIncomingCalls } from "@/lib/webrtcSignaling";
import VideoCall from "./VideoCall";

// Mounted on the pharmacist dashboard. Subscribes to ringing video rooms and
// shows an incoming-call prompt. Accepting opens the callee side of VideoCall,
// which answers the student's offer over Firestore signaling.
export default function IncomingCallListener() {
  const [incoming, setIncoming] = useState(null); // { roomId, callerName } awaiting answer
  const [activeCall, setActiveCall] = useState(null); // { roomId, callerName } in progress
  const [handledRooms] = useState(() => new Set()); // rooms already shown/answered

  useEffect(() => {
    const unsubscribe = listenForIncomingCalls((call) => {
      // Ignore stale rooms (>2 min old) and ones we've already handled.
      if (handledRooms.has(call.roomId)) return;
      if (Date.now() - call.createdAt > 120000) return;
      setIncoming((current) => current || call); // show one at a time
    });
    return () => unsubscribe();
  }, [handledRooms]);

  const acceptCall = () => {
    if (!incoming) return;
    handledRooms.add(incoming.roomId);
    setActiveCall(incoming);
    setIncoming(null);
  };

  const declineCall = () => {
    if (incoming) handledRooms.add(incoming.roomId);
    setIncoming(null);
  };

  return (
    <>
      {/* Incoming call prompt */}
      <AnimatePresence>
        {incoming && !activeCall && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-green-600 to-blue-600 p-4 text-white flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Video className="w-6 h-6" />
              </div>
              <div>
                <p className="font-semibold text-sm">Incoming video consultation</p>
                <p className="text-xs opacity-90">{incoming.callerName}</p>
              </div>
            </div>
            <div className="p-4 flex gap-3">
              <button
                onClick={declineCall}
                className="flex-1 flex items-center justify-center gap-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 py-2.5 rounded-xl text-sm font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
              >
                <PhoneOff className="w-4 h-4" /> Decline
              </button>
              <button
                onClick={acceptCall}
                className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-green-700 transition-colors"
              >
                <Phone className="w-4 h-4" /> Accept
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active call (callee side) rendered full-screen */}
      {activeCall && (
        <div className="fixed inset-0 z-50 bg-black">
          <VideoCall
            pharmacistName={activeCall.callerName}
            roomId={activeCall.roomId}
            useLiveSignaling
            role="callee"
            onEndCall={() => setActiveCall(null)}
          />
        </div>
      )}
    </>
  );
}
