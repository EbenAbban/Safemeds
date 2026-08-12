"use client";

import { useParams } from "next/navigation";
import ChatWindow from "@/components/Chat/ChatWindow";
import ProtectedRoute from "@/components/Auth/ProtectedRoute";
import Navigation from "@/components/Common/Navigation";
import { useAuth } from "@/hooks/useAuth";

// Chat for a specific consultation/room id (e.g. opened from Track or Orders).
export default function ChatByIdPage() {
  const params = useParams();
  const chatId = String(params?.id || "default");
  const { user } = useAuth();

  return (
    <ProtectedRoute allowedRoles={["CLIENT", "PHARMACY"]}>
      <div className="min-h-screen bg-gradient-to-br from-green-100 via-blue-50 to-purple-50 dark:from-surface-dark dark:via-gray-800 dark:to-surface-dark">
        <Navigation
          title="Consultation Chat"
          userRole={
            (user?.role?.toLowerCase() as "client" | "pharmacy" | "admin") ||
            "client"
          }
        />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-surface-container-lowest/80 dark:bg-surface-container/80 backdrop-blur-sm rounded-2xl shadow-xl border border-outline-variant/60 overflow-hidden">
            <ChatWindow
              chatId={chatId}
              sender={user?.role === "PHARMACY" ? "pharmacist" : "user"}
              senderName={user?.name}
              onMessageCountChange={() => {}}
            />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
