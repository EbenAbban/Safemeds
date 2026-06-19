"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import WelcomeMessage from "./WelcomeMessage";
import VideoCall from "./VideoCall";
import { subscribeChatMessages, sendChatMessage } from "@/lib/chatService";

// `sender` = who this client is in the conversation ("user" = student,
// "pharmacist" = pharmacist). Both sides share the room by chatId.
const ChatWindow = ({
  chatId,
  onMessageCountChange,
  sender = "user",
  senderName,
}) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isVideoCallActive, setIsVideoCallActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pharmacistTyping] = useState(false);
  const chatRef = useRef(null);
  const inputRef = useRef(null);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const text = input;
    setInput("");
    setIsLoading(true);
    try {
      await sendChatMessage(chatId, { text, sender, senderName });
    } catch (error) {
      console.error("Error sending message:", error);
      setInput(text); // restore on failure
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Live subscription to the shared room — real two-way messaging, no polling.
  useEffect(() => {
    if (!chatId) return;
    const unsubscribe = subscribeChatMessages(chatId, (msgs) => {
      const transformed = msgs.map((m) => ({
        text: m.text,
        sender: m.sender,
        timestamp: m.createdAt,
      }));
      setMessages(transformed);
      if (onMessageCountChange) onMessageCountChange(transformed.length);
    });
    return () => unsubscribe();
  }, [chatId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    chatRef.current?.scrollTo(0, chatRef.current.scrollHeight);
  }, [messages, pharmacistTyping]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex flex-col h-[70vh] bg-white dark:bg-gray-900 relative">
      <AnimatePresence>
        {isVideoCallActive && (
          <VideoCall
            pharmacistName="Dr. Sarah Johnson, PharmD"
            roomId={chatId}
            useLiveSignaling={true}
            role="caller"
            callerName="Student (Patient)"
            onEndCall={async (duration) => {
              setIsVideoCallActive(false);
              try {
                await sendChatMessage(chatId, {
                  text: `Video consultation ended. Duration: ${duration}.`,
                  sender: "system",
                });
              } catch (err) {
                console.error("Error saving system call message:", err);
              }
            }}
          />
        )}
      </AnimatePresence>

      {/* Chat Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-3 h-3 bg-green-400 rounded-full"
            />
            <div>
              <h3 className="font-semibold">Dr. Sarah Johnson, PharmD</h3>
              <p className="text-sm opacity-90">Licensed Pharmacist</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsVideoCallActive(true)}
              className="bg-white/10 hover:bg-white/20 px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 font-semibold text-xs border border-white/15 cursor-pointer shadow-sm hover:shadow"
            >
              📹 <span className="hidden sm:inline">Start Video Call</span>
            </button>
            <div className="text-right">
              <p className="text-sm opacity-90">Online</p>
              <p className="text-xs opacity-75">
                Usually responds in 2-3 minutes
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div
        ref={chatRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800"
      >
        {/* Welcome Message for New Sessions */}
        {messages.length === 0 && <WelcomeMessage />}

        <AnimatePresence>
          {Array.isArray(messages) &&
            messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.18 }}
                className={`flex ${
                  msg.sender === "system"
                    ? "justify-center w-full"
                    : msg.sender === "user"
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <div
                  className={`${
                    msg.sender === "system"
                      ? "max-w-[85%]"
                      : "max-w-[70%]"
                  } ${
                    msg.sender === "user" ? "order-2" : "order-1"
                  }`}
                >
                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    className={`p-4 rounded-2xl shadow-sm ${
                      msg.sender === "system"
                        ? "bg-slate-100/90 dark:bg-gray-800/80 text-slate-500 dark:text-gray-400 text-xs font-semibold border border-slate-200 dark:border-gray-700 text-center flex items-center justify-center gap-2"
                        : msg.sender === "user"
                        ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                        : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100"
                    }`}
                  >
                    {msg.sender === "system" && <span className="text-base">📹</span>}
                    <div>
                      <p className="text-sm leading-relaxed">{msg.text}</p>
                      {msg.sender !== "system" && (
                        <p
                          className={`text-xs mt-2 ${
                            msg.sender === "user"
                              ? "text-blue-100"
                              : "text-gray-500"
                          }`}
                        >
                          {formatTime(msg.timestamp)}
                        </p>
                      )}
                    </div>
                  </motion.div>
                </div>

                {/* Avatar */}
                {msg.sender !== "system" && (
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                      msg.sender === "user"
                        ? "bg-gradient-to-r from-blue-400 to-blue-500 order-1 ml-2"
                        : "bg-gradient-to-r from-green-400 to-green-500 order-2 mr-2"
                    }`}
                  >
                    {msg.sender === "user" ? "U" : "P"}
                  </div>
                )}
              </motion.div>
            ))}
        </AnimatePresence>

        {/* Pharmacist Typing Indicator */}
        <AnimatePresence>
          {pharmacistTyping && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex justify-start"
            >
              <div className="order-1">
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="flex space-x-1">
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{
                          duration: 0.6,
                          repeat: Infinity,
                          delay: 0,
                        }}
                        className="w-2 h-2 bg-gray-400 rounded-full"
                      />
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{
                          duration: 0.6,
                          repeat: Infinity,
                          delay: 0.2,
                        }}
                        className="w-2 h-2 bg-gray-400 rounded-full"
                      />
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{
                          duration: 0.6,
                          repeat: Infinity,
                          delay: 0.4,
                        }}
                        className="w-2 h-2 bg-gray-400 rounded-full"
                      />
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Pharmacist is typing...
                    </span>
                  </div>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-400 to-green-500 flex items-center justify-center text-white text-sm font-medium order-2 mr-2">
                P
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
        <div className="flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message here..."
              className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-xl p-3 pr-12 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-black dark:text-white"
              rows="1"
              style={{ minHeight: "44px", maxHeight: "120px" }}
            />
            <div className="absolute right-3 bottom-3 flex items-center gap-2">
              <button className="text-gray-400 hover:text-gray-600 transition-colors">
                😊
              </button>
              <button className="text-gray-400 hover:text-gray-600 transition-colors">
                📎
              </button>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
              input.trim() && !isLoading
                ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            {isLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
              />
            ) : (
              "Send"
            )}
          </motion.button>
        </div>

        {/* Quick Actions */}
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            "Medication questions",
            "Side effects",
            "Dosage concerns",
            "Drug interactions",
          ].map((action, index) => (
            <motion.button
              key={action}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setInput(action)}
              className="text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-3 py-1 rounded-full transition-colors"
            >
              {action}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
