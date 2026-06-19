"use client";

import { useState } from "react";
import axios from "axios";

const AnonymousForm = () => {
  const [message, setMessage] = useState("");
  const [dropPoint, setDropPoint] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Generate random ID if needed
      const generateId = () => {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let result = "";
        for (let i = 0; i < 8; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
      };

      const anonId = localStorage.getItem("anonId") || generateId();

      await axios.post("/api/consultations", {
        message,
        dropPoint,
        anonId,
      });

      localStorage.setItem("anonId", anonId);
      setSubmitted(true);
    } catch (err) {
      alert("Submission failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <p className="text-green-600 text-center">
        Your concern has been sent anonymously ✅
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
      <textarea
        required
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Describe your health concern"
        className="w-full border p-3 rounded h-32 resize-none"
      />
      <input
        type="text"
        value={dropPoint}
        onChange={(e) => setDropPoint(e.target.value)}
        placeholder="Enter drop location (optional)"
        className="w-full border p-3 rounded"
      />
      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded w-full"
      >
        {loading ? "Submitting..." : "Submit Anonymously"}
      </button>
    </form>
  );
};

export default AnonymousForm;
