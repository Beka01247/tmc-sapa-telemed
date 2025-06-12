"use client";

import { useSearchParams, useRouter } from "next/navigation";
import ChatWrapper from "@/components/ChatWrapper";
import { Card } from "@/components/ui/card";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/layouts/DashboardLayout";

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
          <p className="text-gray-600">Загрузка...</p>
        </Card>
      </div>
    );
  }

  // Handle unauthenticated users
  if (status === "unauthenticated") {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-red-600">
            Доступ запрещен
          </h2>
          <p className="text-gray-600 mb-4">
            Пожалуйста, войдите в систему для доступа к чату.
          </p>
          <Button onClick={() => router.push("/sign-in")}>Войти</Button>
        </Card>
      </div>
    );
  }

  // Check for patient ID
  if (!patientId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-red-600">Ошибка</h2>
          <p className="text-gray-600 mb-4">
            Не указан ID пациента. Пожалуйста, перейдите в профиль пациента для
            доступа.
          </p>
          <Button onClick={() => router.push("/dashboard/patients")}>
            Перейти к пациентам
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
    <DashboardLayout
      userType={session.user.userType}
      session={{ fullName: session.user.fullName, id: session.user.id }}
    >
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-center">
          Чат консультации с пациентом
        </h2>
        <div className="max-w-4xl mx-auto w-full">
          <ChatWrapper patientId={patientId} currentUser={currentUser} />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ChatPage;
