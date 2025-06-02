"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { UserType } from "@/constants/userTypes";
import { ScreeningCard } from "./ScreeningCard";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ConsultationsTab } from "./ConsultationsTab";
import { TreatmentsTab } from "./TreatmentsTab";
import { RecommendationsTab } from "./RecommendationsTab";
import { FilesTab } from "./FilesTab";
import { MonitoringTab } from "./MonitoringTab";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { EditDiagnosesModal } from "./EditDiagnosesModal";
import { EditRiskGroupsModal } from "./EditRiskGroupsModal";
import { toast } from "sonner";
import { PregnancyCard } from "./PregnancyCard";
import { FertileWomenRegisterCard } from "@/components/FertileWomenRegisterCard";
import { VaccinationsCard } from "@/components/VaccinationsCard";

interface Diagnosis {
  id?: string;
  description: string;
}

interface RiskGroup {
  id?: string;
  name: string;
}

interface FertileWomenRegister {
  id: string;
  registrationDate: string | null;
  deregistrationDate: string | null;
  reasonDeregistered: string | null;
  pregnanciesCount: number | null;
  birthsCount: number | null;
  abortionsCount: number | null;
  stillbirthsCount: number | null;
  lastPregnancyDate: string | null;
  chronicDiseases: string | null;
  screeningStatus: string | null;
}

interface Patient {
  id: string;
  fullName: string;
  iin: string;
  email: string;
  telephone: string;
  city: string;
  organization: string;
  dateOfBirth: string | null;
  gender: "МУЖСКОЙ" | "ЖЕНСКИЙ" | null;
  diagnoses: Diagnosis[];
  riskGroups: RiskGroup[];
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

interface PatientScreening {
  id: string;
  screeningId: string;
  customScreeningName: string | null;
  scheduledDate: string;
  status: "INVITED" | "COMPLETED" | "CONFIRMED" | "CANCELLED" | "REJECTED";
  result: string | null;
  notes: string | null;
  completedAt: string | null;
  confirmedAt: string | null;
  confirmedBy: string | null;
  createdAt: string;
  screening: {
    id: string;
    name: string;
    description: string | null;
    testName: string | null;
  };
}

interface Vaccination {
  id: string;
  name: string;
  scheduledDate: string;
  administeredDate: string | null;
  status: "INVITED" | "COMPLETED" | "CONFIRMED" | "CANCELLED" | "REJECTED";
  notes: string | null;
}

interface InitialData {
  patient: Patient;
  consultations: Consultation[];
  treatments: Treatment[];
  recommendations: Recommendation[];
  files: File[];
  measurements: Measurement[];
  screenings: PatientScreening[];
  fertileWomenData: FertileWomenRegister | null;
  vaccinations: Vaccination[];
}

// Utility functions
const calculateAge = (iin: string, currentDate = new Date()): string => {
  const year = parseInt(iin.slice(0, 2), 10);
  const month = parseInt(iin.slice(2, 4), 10) - 1;
  const day = parseInt(iin.slice(4, 6), 10);

  const fullYear = year < 50 ? 2000 + year : 1900 + year;
  const birthDate = new Date(fullYear, month, day);

  const ageInMilliseconds = currentDate.getTime() - birthDate.getTime();
  const ageInYears = Math.floor(ageInMilliseconds / 31557600000); // Approximate milliseconds in a year

  return `${ageInYears} лет`;
};

const formatDate = (date: string | null): string => {
  if (!date) return "Не указана";
  return format(new Date(date), "dd.MM.yyyy");
};

const formatGender = (
  gender: "МУЖСКОЙ" | "ЖЕНСКИЙ" | "ДРУГОЙ" | null
): string => {
  switch (gender) {
    case "МУЖСКОЙ":
      return "М";
    case "ЖЕНСКИЙ":
      return "Ж";
    case "ДРУГОЙ":
      return "Другое";
    default:
      return "Не указан";
  }
};

export const PatientDetailsClient = ({
  initialData,
  userType,
  userName,
  patientId,
  userId,
}: {
  initialData: InitialData;
  userType: UserType;
  userName: string;
  patientId: string;
  userId: string;
}) => {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState<
    | "consultations"
    | "treatments"
    | "recommendations"
    | "files"
    | "monitoring"
    | null
  >("consultations");
  const [isRecommendationModalOpen, setIsRecommendationModalOpen] =
    useState(false);
  const [isDiagnosisModalOpen, setIsDiagnosisModalOpen] = useState(false);
  const [isRiskGroupModalOpen, setIsRiskGroupModalOpen] = useState(false);

  const handleGoBack = () => {
    router.push("/dashboard/patients");
  };

  const handleSaveDiagnoses = (diagnoses: Diagnosis[]) => {
    initialData.patient.diagnoses = diagnoses;
    toast.success("Диагнозы обновлены");
  };

  const handleSaveRiskGroups = (riskGroups: RiskGroup[]) => {
    initialData.patient.riskGroups = riskGroups;
    toast.success("Группы риска обновлены");
  };

  const isFemale = initialData.patient.gender === "ЖЕНСКИЙ";
  const isDoctor =
    userType === UserType.DISTRICT_DOCTOR ||
    userType === UserType.SPECIALIST_DOCTOR ||
    userType === "DOCTOR";
  const isProvider = isDoctor || userType === "NURSE";

  return (
    <DashboardLayout
      userType={userType}
      session={{ fullName: userName, id: userId }}
    >
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
              <CardTitle className="text-center">
                Информация о пациенте
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 items-center pl-24">
                <div className="col-span-1 flex items-center gap-2">
                  <strong>ФИО:</strong> {initialData.patient.fullName}
                  {isProvider && (
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/chat?patientId=${patientId}`}>Чат</Link>
                    </Button>
                  )}
                </div>
                <div className="col-span-1">
                  <strong>Возраст:</strong>{" "}
                  {calculateAge(initialData.patient.iin)}
                </div>
                <div className="col-span-1">
                  <strong>Дата рождения:</strong>{" "}
                  {formatDate(initialData.patient.dateOfBirth)}
                </div>
                <div className="col-span-1">
                  <strong>Пол:</strong>{" "}
                  {formatGender(initialData.patient.gender)}
                </div>
                <div className="col-span-1">
                  <strong>ИИН:</strong> {initialData.patient.iin}
                </div>
                <div className="col-span-1">
                  <strong>Email:</strong> {initialData.patient.email}
                </div>
                <div className="col-span-1">
                  <strong>Телефон:</strong> {initialData.patient.telephone}
                </div>
                <div className="col-span-1">
                  <strong>Город:</strong> {initialData.patient.city}
                </div>
                <div className="col-span-1">
                  <strong>Организация:</strong>{" "}
                  {initialData.patient.organization}
                </div>

                <div className="col-span-2 flex items-center gap-2">
                  <strong>Группы:</strong>
                  {initialData.patient.riskGroups?.length ? (
                    <span>
                      {initialData.patient.riskGroups
                        .map((rg) => rg.name)
                        .join(", ")}
                    </span>
                  ) : (
                    <span className="text-gray-500">Нет групп риска</span>
                  )}
                  {isDoctor && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="ml-2"
                      onClick={() => setIsRiskGroupModalOpen(true)}
                    >
                      Изменить
                    </Button>
                  )}
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <strong>Диагнозы:</strong>
                  {initialData.patient.diagnoses?.length ? (
                    <span>
                      {initialData.patient.diagnoses
                        .map((d) => d.description)
                        .join(", ")}
                    </span>
                  ) : (
                    <span className="text-gray-500">Нет диагнозов</span>
                  )}
                  {isDoctor && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="ml-2"
                      onClick={() => setIsDiagnosisModalOpen(true)}
                    >
                      Изменить
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {isFemale && (
              <>
                <PregnancyCard patientId={patientId} isDoctor={isDoctor} />
                {isDoctor && (
                  <FertileWomenRegisterCard
                    data={initialData.fertileWomenData}
                    patientId={patientId}
                    isEditable={isDoctor}
                  />
                )}
              </>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ScreeningCard
              patientId={patientId}
              screenings={initialData.screenings}
              patientGender={initialData.patient.gender}
              patientAge={parseInt(calculateAge(initialData.patient.iin), 10)}
              onScreeningUpdated={() => window.location.reload()}
              userType={userType}
            />
            <VaccinationsCard
              patientId={patientId}
              vaccinations={initialData.vaccinations}
              isDoctor={isDoctor}
            />
          </div>

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

          <EditDiagnosesModal
            isOpen={isDiagnosisModalOpen}
            onClose={() => setIsDiagnosisModalOpen(false)}
            diagnoses={initialData.patient.diagnoses}
            patientId={patientId}
            onSave={handleSaveDiagnoses}
          />

          <EditRiskGroupsModal
            isOpen={isRiskGroupModalOpen}
            onClose={() => setIsRiskGroupModalOpen(false)}
            riskGroups={initialData.patient.riskGroups}
            patientId={patientId}
            onSave={handleSaveRiskGroups}
          />
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
}) => (
  <ErrorBoundary>
    <PatientDetailsClient {...props} />
  </ErrorBoundary>
);
