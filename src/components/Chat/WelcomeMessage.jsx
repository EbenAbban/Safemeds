"use client";

import { motion } from "framer-motion";

const WelcomeMessage = () => {
  const features = [
    {
      icon: "🔒",
      title: "100% Anonymous",
      description: "No personal information required",
    },
    {
      icon: "👨‍⚕️",
      title: "Licensed Pharmacists",
      description: "Professional healthcare advice",
    },
    {
      icon: "⚡",
      title: "Real-time Support",
      description: "Instant responses and guidance",
    },
    {
      icon: "🛡️",
      title: "Secure & Private",
      description: "End-to-end encrypted chat",
    },
  ];

  const quickQuestions = [
    "What are the side effects of this medication?",
    "Can I take this with other medicines?",
    "What's the proper dosage?",
    "How long should I take this?",
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="text-center py-8 px-4"
    >
      {/* Welcome Header */}
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="mb-8"
      >
        <div className="text-6xl mb-4">👨‍⚕️</div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
          Welcome to SafeMeds Chat
        </h2>
        <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto">
          You're now connected to a licensed pharmacist. Feel free to ask any
          questions about medications, side effects, or health concerns.
        </p>
      </motion.div>

      {/* Features Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
      >
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 + index * 0.1, duration: 0.5 }}
            whileHover={{ scale: 1.05 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm"
          >
            <div className="text-2xl mb-2">{feature.icon}</div>
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm mb-1">
              {feature.title}
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">{feature.description}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick Questions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-gray-800 dark:to-gray-800 rounded-xl p-6 border border-blue-200 dark:border-gray-700"
      >
        <h3 className="font-semibold text-gray-800 dark:text-white mb-4">
          💡 Common Questions You Can Ask
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {quickQuestions.map((question, index) => (
            <motion.div
              key={question}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1 + index * 0.1, duration: 0.5 }}
              className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
            >
              {question}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Privacy Notice */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.6 }}
        className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4"
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="text-green-600">🔒</span>
          <span className="font-semibold text-green-800">
            Privacy Protected
          </span>
        </div>
        <p className="text-sm text-green-700">
          Your conversation is completely anonymous and secure. No personal
          information is stored or shared.
        </p>
      </motion.div>
    </motion.div>
  );
};

export default WelcomeMessage;
