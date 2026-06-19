"use client";

import OtpField from "@/components/Delivery/OtpField";
import { useState } from "react";
import axios from "axios";

export default function VerifyPage() {
  const [success, setSuccess] = useState(false);

  const handleOtpSubmit = async (otp) => {
    try {
      const res = await axios.post("/api/otp/verify", {
        otp,
        anonId: localStorage.getItem("anonId")
      });

      if (res.data.verified) setSuccess(true);
      else alert("Invalid OTP");
    } catch {
      alert("Verification failed");
    }
  };

  return (
    <section className="py-10 px-4 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-6">Delivery Verification</h1>
      {success ? (
        <p className="text-green-600">OTP Verified ✅</p>
      ) : (
        <OtpField onSubmit={handleOtpSubmit} />
      )}
    </section>
  );
}
