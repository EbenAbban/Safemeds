"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import ProtectedRoute from "@/components/Auth/ProtectedRoute";
import Navigation from "@/components/Common/Navigation";
import { useAuth } from "@/hooks/useAuth";
import { subscribeChatRooms, type ChatRoomSummary } from "@/lib/chatService";

// Pharmacist inbox: live list of student chat rooms, newest first. Click to open.
export default function InboxPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [rooms, setRooms] = useState<ChatRoomSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeChatRooms((r) => {
      setRooms(r);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const timeAgo = (ts: number) => {
    if (!ts) return "";
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return `${s}s ago`;
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  };

  return (
    <ProtectedRoute allowedRoles={["PHARMACY", "ADMIN"]}>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 dark:from-gray-900 dark:to-gray-800">
        <Navigation
          title="Patient Chats"
          userRole={(user?.role?.toLowerCase() as "pharmacy" | "admin") || "pharmacy"}
        />
        <main className="max-w-3xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Active Consultation Chats
          </h1>

          {loading ? (
            <p className="text-gray-600 dark:text-gray-400">Loading chats…</p>
          ) : rooms.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-8 text-center border border-gray-200 dark:border-gray-700">
              <div className="text-4xl mb-3">💬</div>
              <p className="text-gray-600 dark:text-gray-400">
                No patient chats yet. They appear here as students start consultations.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {rooms.map((room) => (
                <motion.button
                  key={room.chatId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.01 }}
                  onClick={() => router.push(`/chat/${room.chatId}`)}
                  className="w-full text-left bg-white dark:bg-gray-800 rounded-xl shadow p-4 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-400 to-green-500 flex items-center justify-center text-white font-medium shrink-0">
                      💊
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white truncate">
                        Session {room.chatId}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {room.lastSender === "pharmacist" ? "You: " : ""}
                        {room.lastMessage || "No messages yet"}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">
                    {timeAgo(room.updatedAt)}
                  </span>
                </motion.button>
              ))}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
