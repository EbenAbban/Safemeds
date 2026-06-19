"use client";

import ChatWindow from "@/components/Chat/ChatWindow";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import ProtectedRoute from "@/components/Auth/ProtectedRoute";
import Navigation from "@/components/Common/Navigation";
import { useAuth } from "@/hooks/useAuth";

export default function ChatPage() {
  const [anonId, setAnonId] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [sessionInfo, setSessionInfo] = useState<{
    startTime: string | null;
    messageCount: number;
    isActive: boolean;
  }>({
    startTime: null,
    messageCount: 0,
    isActive: false,
  });

  const { user } = useAuth();

  useEffect(() => {
    const initializeSession = async () => {
      setIsInitializing(true);

      let id = localStorage.getItem("anonId");
      if (!id) {
        // Generate random ID
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let result = "";
        for (let i = 0; i < 8; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        id = result;
        localStorage.setItem("anonId", id);
      }

      // Get or create session info
      const existingSession = localStorage.getItem("chatSession");
      if (existingSession) {
        setSessionInfo(JSON.parse(existingSession));
      } else {
        const newSession = {
          startTime: new Date().toISOString(),
          messageCount: 0,
          isActive: true,
        };
        localStorage.setItem("chatSession", JSON.stringify(newSession));
        setSessionInfo(newSession);
      }

      setAnonId(id);
      setIsInitializing(false);
    };

    initializeSession();
  }, []);

  const resetSession = () => {
    localStorage.removeItem("anonId");
    localStorage.removeItem("chatSession");
    localStorage.removeItem("chatMessages");
    window.location.reload();
  };

  const getSessionDuration = () => {
    if (!sessionInfo.startTime) return "0m";
    const duration = Date.now() - new Date(sessionInfo.startTime).getTime();
    const minutes = Math.floor(duration / (1000 * 60));
    return `${minutes}m`;
  };

  return (
    <ProtectedRoute allowedRoles={["CLIENT", "PHARMACY"]}>
      <div className="min-h-screen bg-gradient-to-br from-green-100 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Navigation */}
        <Navigation
          title="Chat with Pharmacist"
          userRole={
            (user?.role?.toLowerCase() as "client" | "pharmacy" | "admin") ||
            "client"
          }
        />

        {isInitializing ? (
          <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <motion.div
                animate={{
                  rotate: 360,
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                  scale: { duration: 1, repeat: Infinity, ease: "easeInOut" },
                }}
                className="text-4xl mb-4"
              >
                🔐
              </motion.div>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0 }}
                className="text-gray-600 text-lg font-medium"
              >
                Initializing secure chat session...
              </motion.p>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="mt-4 flex justify-center"
              >
                <div className="flex space-x-1">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                    className="w-2 h-2 bg-blue-500 rounded-full"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                    className="w-2 h-2 bg-blue-500 rounded-full"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                    className="w-2 h-2 bg-blue-500 rounded-full"
                  />
                </div>
              </motion.div>
            </motion.div>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto px-4 py-8">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-8"
            >
              <motion.h1
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0, duration: 0.5 }}
                className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent mb-4"
              >
                💬 Chat with Pharmacist
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0, duration: 0.5 }}
                className="text-gray-600 text-lg max-w-2xl mx-auto"
              >
                Get instant consultation and medication advice from licensed
                pharmacists. Your privacy is our priority.
              </motion.p>
            </motion.div>

            {/* Session Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0, duration: 0.5 }}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg p-4 mb-6 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <span className="text-green-500">🟢</span>
                    <span className="text-gray-700 dark:text-gray-300">Session Active</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-blue-500">⏱️</span>
                    <span className="text-gray-700 dark:text-gray-300">
                      Duration: {getSessionDuration()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-purple-500">💬</span>
                    <span className="text-gray-700 dark:text-gray-300">
                      Messages: {sessionInfo.messageCount}
                    </span>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={resetSession}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
                >
                  Reset Session
                </motion.button>
              </div>
            </motion.div>

            {/* Chat Window */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0, duration: 0.5 }}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <ChatWindow
                chatId={anonId?.slice(0, 8) || "default"}
                sender={user?.role === "PHARMACY" ? "pharmacist" : "user"}
                senderName={user?.name}
                onMessageCountChange={(count: number) =>
                  setSessionInfo((prev) => ({ ...prev, messageCount: count }))
                }
              />
            </motion.div>

            {/* Features Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.5 }}
              className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-6 border border-green-200 dark:border-gray-700"
              >
                <div className="text-2xl mb-3">🔒</div>
                <h3 className="font-semibold text-gray-800 dark:text-white mb-2">
                  Secure & Private
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  End-to-end encrypted conversations with complete privacy
                  protection.
                </p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-6 border border-blue-200 dark:border-gray-700"
              >
                <div className="text-2xl mb-3">👨‍⚕️</div>
                <h3 className="font-semibold text-gray-800 dark:text-white mb-2">
                  Licensed Pharmacists
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Get advice from certified healthcare professionals with years
                  of experience.
                </p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-6 border border-purple-200 dark:border-gray-700"
              >
                <div className="text-2xl mb-3">⚡</div>
                <h3 className="font-semibold text-gray-800 dark:text-white mb-2">
                  Instant Response
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Real-time messaging with quick responses to your health
                  concerns.
                </p>
              </motion.div>
            </motion.div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
