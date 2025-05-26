"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { UserType } from "@/constants/userTypes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ConsultationsTab } from "./ConsultationsTab";
import { TreatmentsTab } from "./TreatmentsTab";
import { RecommendationsTab } from "./RecommendationsTab";
import { FilesTab } from "./FilesTab";
import { MonitoringTab } from "./MonitoringTab";
import { ErrorBoundary } from "@/components/ErrorBoundary";

interface Patient {
  id: string;
  fullName: string;
  iin: string;
  email: string;
  telephone: string;
  city: string;
  organization: string;
  dateOfBirth: string | null;
}

interface Consultation {
  id: string;
  consultationDate: string;
  notes: string | null;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
  providerName: string | null;
}

interface Treatment {
  id: string;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes: string | null;
  providerName: string | null;
}

interface Recommendation {
  id: string;
  description: string;
  providerName: string | null;
  createdAt: string;
}

interface File {
  id: string;
  fileName: string;
  fileUrl: string;
  description?: string | null;
  uploadedBy?: string | null;
  createdAt: string;
}

interface Measurement {
  id: string;
  type: string;
  value1: string;
  value2?: string | null;
  createdAt: string;
}

interface InitialData {
  patient: Patient;
  consultations: Consultation[];
  treatments: Treatment[];
  recommendations: Recommendation[];
  files: File[];
  measurements: Measurement[];
}

interface PatientDetailsClientProps {
  initialData: InitialData;
  userType: UserType;
  userName: string;
  patientId: string;
}

const calculateAge = (iin: string, currentDate: Date = new Date()): number => {
  const year = parseInt(iin.slice(0, 2), 10);
  const month = parseInt(iin.slice(2, 4), 10) - 1;
  const day = parseInt(iin.slice(4, 6), 10);
  const fullYear = year < 50 ? 2000 + year : 1900 + year;
  const birthDate = new Date(fullYear, month, day);
  let age = currentDate.getFullYear() - birthDate.getFullYear();
  const monthDiff = currentDate.getMonth() - birthDate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && currentDate.getDate() < birthDate.getDate())
  ) {
    age--;
  }
  return age;
};

export const PatientDetailsClient = ({
  initialData,
  userType,
  userName,
  patientId,
}: PatientDetailsClientProps) => {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState<
    | "consultations"
    | "treatments"
    | "recommendations"
    | "files"
    | "monitoring"
    | null
  >(null);
  const [isRecommendationModalOpen, setIsRecommendationModalOpen] =
    useState(false);

  const isProvider = ["DOCTOR", "NURSE"].includes(userType);

  const handleGoBack = () => {
    router.push("/dashboard/patients");
  };

  return (
    <DashboardLayout userType={userType} session={{ fullName: userName }}>
      <TooltipProvider>
        <div className="space-y-6">
          <Button
            variant="outline"
            onClick={handleGoBack}
            className="w-full sm:w-auto"
          >
            Назад
          </Button>

          <Card>
            <CardHeader>
              <CardTitle>Информация о пациенте</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p>
                <strong>ФИО:</strong> {initialData.patient.fullName}
              </p>
              <p>
                <strong>Возраст:</strong>{" "}
                {calculateAge(initialData.patient.iin)}
              </p>
              <p>
                <strong>ИИН:</strong> {initialData.patient.iin}
              </p>
              <p>
                <strong>Email:</strong> {initialData.patient.email}
              </p>
              <p>
                <strong>Телефон:</strong> {initialData.patient.telephone}
              </p>
              <p>
                <strong>Город:</strong> {initialData.patient.city}
              </p>
              <p>
                <strong>Организация:</strong> {initialData.patient.organization}
              </p>
            </CardContent>
          </Card>

          <div className="flex justify-center">
            <div className="flex flex-wrap gap-4">
              <Button
                variant={
                  selectedTab === "consultations" ? "default" : "outline"
                }
                onClick={() => setSelectedTab("consultations")}
              >
                Приемы
              </Button>
              <Button
                variant={selectedTab === "treatments" ? "default" : "outline"}
                onClick={() => setSelectedTab("treatments")}
              >
                Лечения
              </Button>
              <Button
                variant={
                  selectedTab === "recommendations" ? "default" : "outline"
                }
                onClick={() => setSelectedTab("recommendations")}
              >
                Рекомендации
              </Button>
              <Button
                variant={selectedTab === "files" ? "default" : "outline"}
                onClick={() => setSelectedTab("files")}
              >
                Файлы
              </Button>
              <Button
                variant={selectedTab === "monitoring" ? "default" : "outline"}
                onClick={() => setSelectedTab("monitoring")}
              >
                Мониторинг
              </Button>
            </div>
          </div>

          {selectedTab === "consultations" && (
            <ConsultationsTab
              consultations={initialData.consultations}
              isProvider={isProvider}
              patientId={patientId}
            />
          )}
          {selectedTab === "treatments" && (
            <TreatmentsTab
              treatments={initialData.treatments}
              isProvider={isProvider}
              patientId={patientId}
            />
          )}
          {selectedTab === "recommendations" && (
            <RecommendationsTab
              recommendations={initialData.recommendations}
              isProvider={isProvider}
              patientId={patientId}
              isModalOpen={isRecommendationModalOpen}
              setIsModalOpen={setIsRecommendationModalOpen}
            />
          )}
          {selectedTab === "files" && <FilesTab files={initialData.files} />}
          {selectedTab === "monitoring" && (
            <MonitoringTab measurements={initialData.measurements} />
          )}
        </div>
      </TooltipProvider>
    </DashboardLayout>
  );
};

export const PatientDetailsPageWithErrorBoundary = (props: {
  initialData: InitialData;
  userType: UserType;
  userName: string;
  patientId: string;
}) => {
  return (
    <ErrorBoundary>
      <PatientDetailsClient {...props} />
    </ErrorBoundary>
  );
};
