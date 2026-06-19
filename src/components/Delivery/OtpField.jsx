"use client";

import { useState } from "react";

const OtpField = ({ onSubmit }) => {
  const [otp, setOtp] = useState("");

  const handleChange = (e) => {
    const val = e.target.value.replace(/\D/g, "");
    setOtp(val.slice(0, 6));
  };

  return (
    <div className="flex flex-col gap-4">
      <input
        value={otp}
        onChange={handleChange}
        maxLength={6}
        className="border border-gray-300 p-3 rounded text-center tracking-widest text-lg"
        placeholder="Enter 6-digit OTP"
      />
      <button
        onClick={() => onSubmit(otp)}
        className="bg-green-600 text-white py-2 px-4 rounded"
      >
        Verify
      </button>
    </div>
  );
};

export default OtpField;
