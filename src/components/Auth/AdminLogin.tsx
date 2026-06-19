"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

const AdminLogin = () => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const router = useRouter();

  // Check for existing token on component mount
  useEffect(() => {
    // Only run in browser environment
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("adminToken");
      setAdminToken(token);
      
      // If token exists, redirect to admin dashboard
      if (token) {
        router.push("/admin-dashboard");
      }
    }
  }, [router]);

  const login = async (e?: React.FormEvent) => {
    e?.preventDefault(); // Prevent form submission if called from form
    
    if (!password.trim()) {
      setError("Please enter a password");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await axios.post("/api/admin/login", { password });
      
      // Store token safely
      if (typeof window !== "undefined") {
        localStorage.setItem("adminToken", res.data.token);
        setAdminToken(res.data.token);
      }
      
      router.push("/admin-dashboard");
    } catch (err: any) {
      console.error("Admin login error:", err);
      
      // Handle different error cases
      if (err.response?.status === 401) {
        setError("Invalid password. Please try again.");
      } else if (err.response?.status === 429) {
        setError("Too many login attempts. Please try again later.");
      } else if (err.code === "NETWORK_ERROR" || !err.response) {
        setError("Network error. Please check your connection and try again.");
      } else {
        setError("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      login();
    }
  };

  // Show loading state while checking existing token
  if (adminToken) {
    return (
      <div className="max-w-sm mx-auto mt-20 p-6 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to admin dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto mt-20 space-y-4 p-6 border rounded-lg shadow-md bg-white">
      <h2 className="text-xl font-semibold text-gray-800 text-center">Admin Login</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      <form onSubmit={login} className="space-y-4">
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            Admin Password
          </label>
          <input
            id="password"
            type="password"
            placeholder="Enter admin password"
            className="w-full border border-gray-300 p-3 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
            autoComplete="current-password"
            required
          />
        </div>
        
        <button
          type="submit"
          onClick={login}
          disabled={loading || !password.trim()}
          className="bg-blue-600 text-white px-4 py-2 rounded-md w-full font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Logging in...</span>
            </div>
          ) : (
            "Login"
          )}
        </button>
      </form>
    </div>
  );
};

export default AdminLogin;