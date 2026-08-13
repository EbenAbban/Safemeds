"use client";

import OtpField from "@/components/Delivery/OtpField";
import { useState } from "react";
import axios from "axios";

export default function VerifyPage() {
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [issued, setIssued] = useState(null);
  const [busy, setBusy] = useState(false);

  const anonId = () =>
    typeof window === "undefined" ? null : localStorage.getItem("anonId");

  const handleRequestCode = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await axios.post("/api/otp/issue", { anonId: anonId() });
      setIssued(res.data.otp);
    } catch (err) {
      setError(err.response?.data?.error || "Could not issue a code");
    } finally {
      setBusy(false);
    }
  };

  const handleOtpSubmit = async (otp) => {
    setBusy(true);
    setError("");
    try {
      const res = await axios.post("/api/otp/verify", {
        otp,
        anonId: anonId(),
      });

      if (res.data.verified) setSuccess(true);
      else setError(res.data.error || "Invalid code");
    } catch (err) {
      setError(err.response?.data?.error || "Verification failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="py-10 px-4 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-6">Delivery Verification</h1>
      {success ? (
        <p className="text-secondary">OTP Verified ✅</p>
      ) : (
        <div className="flex flex-col gap-4">
          <OtpField onSubmit={handleOtpSubmit} />

          {issued && (
            <p className="text-sm">
              Your code is{" "}
              <span className="font-mono font-bold tracking-widest">
                {issued}
              </span>{" "}
              — show it to the courier at handoff. It expires in 10 minutes.
            </p>
          )}

          <button
            onClick={handleRequestCode}
            disabled={busy}
            className="text-sm underline disabled:opacity-50"
          >
            {issued ? "Send a new code" : "Get my verification code"}
          </button>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      )}
    </section>
  );
}
