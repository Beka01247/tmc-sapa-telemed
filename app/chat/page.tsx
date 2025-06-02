"use client";

import { useSearchParams, useRouter } from "next/navigation";
import ChatWrapper from "@/components/ChatWrapper";
import { Card } from "@/components/ui/card";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

const ChatPage = () => {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const patientId = searchParams.get("patientId");

  // Handle loading state
  if (status === "loading") {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6">
          <p className="text-gray-600">Loading...</p>
        </Card>
      </div>
    );
  }

  // Handle unauthenticated users
  if (status === "unauthenticated") {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-red-600">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            Please sign in to access the chat.
          </p>
          <Button onClick={() => router.push("/sign-in")}>Sign In</Button>
        </Card>
      </div>
    );
  }

  // Check for patient ID
  if (!patientId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-red-600">Error</h2>
          <p className="text-gray-600 mb-4">
            No patient ID provided. Please access this chat through a
            patient&apos;s profile.
          </p>
          <Button onClick={() => router.push("/dashboard/patients")}>
            Go to Patients
          </Button>
        </Card>
      </div>
    );
  }

  // Transform session user data into the format expected by the chat
  const currentUser = {
    id: session.user.id,
    name: session.user.fullName,
    role: session.user.userType.toUpperCase() as "DOCTOR" | "NURSE" | "PATIENT",
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <main>
        <h1 className="text-3xl font-bold mb-8 text-center">
          Patient Consultation Chat
        </h1>
        <div className="max-w-4xl mx-auto">
          <ChatWrapper patientId={patientId} currentUser={currentUser} />
        </div>
      </main>
    </div>
  );
};

export default ChatPage;
