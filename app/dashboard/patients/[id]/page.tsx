"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { UserType } from "@/constants/userTypes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import StatisticsModal from "@/components/StatisticsModal";
import { monitoringItems } from "@/components/MonitoringPage";
import { AddTreatmentForm } from "@/components/AddTreatmentForm";
import { AddRecommendationForm } from "@/components/AddRecommendationForm";
import { AddConsultationForm } from "@/components/AddConsultationForm";
import { toast } from "sonner";
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

const PatientDetailsPage = ({ params }: { params: { id: string } }) => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [selectedTab, setSelectedTab] = useState<
    | "consultations"
    | "treatments"
    | "recommendations"
    | "files"
    | "monitoring"
    | null
  >(null);
  const [selectedStatsItem, setSelectedStatsItem] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTreatmentModalOpen, setIsTreatmentModalOpen] = useState(false);
  const [isRecommendationModalOpen, setIsRecommendationModalOpen] =
    useState(false);
  const [isConsultationModalOpen, setIsConsultationModalOpen] = useState(false);

  // Redirect to sign-in if session is missing
  useEffect(() => {
    if (status === "unauthenticated") {
      toast.error("Пожалуйста, войдите в систему");
      router.push("/sign-in");
    }
  }, [status, router]);

  // Fetch patient data
  const fetchPatientData = async () => {
    if (status !== "authenticated") return;

    setLoading(true);
    try {
      const responses = await Promise.all([
        fetch(`/api/patients/${params.id}`, { credentials: "include" }),
        fetch(`/api/patients/${params.id}/consultations`, {
          credentials: "include",
        }),
        fetch(`/api/patients/${params.id}/treatments`, {
          credentials: "include",
        }),
        fetch(`/api/patients/${params.id}/recommendations`, {
          credentials: "include",
        }),
        fetch(`/api/patients/${params.id}/files`, { credentials: "include" }),
        fetch(`/api/patients/${params.id}/measurements`, {
          credentials: "include",
        }),
      ]);

      for (const res of responses) {
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(
            `HTTP ${res.status}: ${errorText || "Не удалось загрузить данные"}`
          );
        }
      }

      const [
        patientData,
        consultationsData,
        treatmentsData,
        recommendationsData,
        filesData,
        measurementsData,
      ] = await Promise.all(responses.map((res) => res.json()));

      if (patientData.error) throw new Error(patientData.error);

      setPatient(patientData);
      setConsultations(consultationsData);
      setTreatments(treatmentsData);
      setRecommendations(recommendationsData);
      setFiles(filesData);
      setMeasurements(measurementsData);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Не удалось загрузить данные пациента";
      console.error("Fetch error:", err);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientData();
  }, [params.id, status]);

  const handleTabClick = (tab: typeof selectedTab) => {
    setSelectedTab(tab);
    setSelectedStatsItem(null);
  };

  const handleStatsClick = (item: any) => {
    setSelectedStatsItem(item);
  };

  const handleStatsModalClose = () => {
    setSelectedStatsItem(null);
  };

  const handleGoBack = () => {
    router.push("/dashboard/patients");
  };

  const handleAddSuccess = () => {
    fetchPatientData();
    setIsTreatmentModalOpen(false);
    setIsRecommendationModalOpen(false);
    setIsConsultationModalOpen(false);
  };

  if (status === "loading" || loading) {
    return (
      <DashboardLayout userType="DOCTOR" session={{ fullName: "Загрузка..." }}>
        <div className="flex items-center justify-center min-h-[50vh]">
          Загрузка...
        </div>
      </DashboardLayout>
    );
  }

  if (!session) {
    return null; // Redirect handled by useEffect
  }

  if (!patient || error) {
    return (
      <DashboardLayout
        userType={(session.user?.userType as UserType) || "DOCTOR"}
        session={{ fullName: session.user?.fullName || "Ошибка" }}
      >
        <div className="text-red-600 text-center">
          {error || "Пациент не найден"}
        </div>
      </DashboardLayout>
    );
  }

  const isProvider = ["DOCTOR", "NURSE"].includes(session.user?.userType || "");

  return (
    <DashboardLayout
      userType={(session.user?.userType as UserType) || "DOCTOR"}
      session={{ fullName: session.user?.fullName || "Пользователь" }}
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
              <CardTitle>Информация о пациенте</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p>
                <strong>ФИО:</strong> {patient.fullName}
              </p>
              <p>
                <strong>Возраст:</strong> {calculateAge(patient.iin)}
              </p>
              <p>
                <strong>ИИН:</strong> {patient.iin}
              </p>
              <p>
                <strong>Email:</strong> {patient.email}
              </p>
              <p>
                <strong>Телефон:</strong> {patient.telephone}
              </p>
              <p>
                <strong>Город:</strong> {patient.city}
              </p>
              <p>
                <strong>Организация:</strong> {patient.organization}
              </p>
            </CardContent>
          </Card>

          <div className="flex justify-center">
            <div className="flex flex-wrap gap-4">
              <Button
                variant={
                  selectedTab === "consultations" ? "default" : "outline"
                }
                onClick={() => handleTabClick("consultations")}
              >
                Приемы
              </Button>
              <Button
                variant={selectedTab === "treatments" ? "default" : "outline"}
                onClick={() => handleTabClick("treatments")}
              >
                Лечения
              </Button>
              <Button
                variant={
                  selectedTab === "recommendations" ? "default" : "outline"
                }
                onClick={() => handleTabClick("recommendations")}
              >
                Рекомендации
              </Button>
              <Button
                variant={selectedTab === "files" ? "default" : "outline"}
                onClick={() => handleTabClick("files")}
              >
                Файлы
              </Button>
              <Button
                variant={selectedTab === "monitoring" ? "default" : "outline"}
                onClick={() => handleTabClick("monitoring")}
              >
                Мониторинг
              </Button>
            </div>
          </div>

          {selectedTab === "consultations" && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Приемы</CardTitle>
                {isProvider && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsConsultationModalOpen(true)}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Добавить прием</TooltipContent>
                  </Tooltip>
                )}
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Дата</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead>Врач</TableHead>
                      <TableHead>Заметки</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {consultations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center">
                          Нет данных
                        </TableCell>
                      </TableRow>
                    ) : (
                      consultations.map((consultation) => (
                        <TableRow key={consultation.id}>
                          <TableCell>
                            {new Date(
                              consultation.consultationDate
                            ).toLocaleDateString("ru-RU")}
                          </TableCell>
                          <TableCell>
                            {consultation.status === "SCHEDULED"
                              ? "Запланировано"
                              : consultation.status === "COMPLETED"
                                ? "Завершено"
                                : "Отменено"}
                          </TableCell>
                          <TableCell>
                            {consultation.providerName || "Не указан"}
                          </TableCell>
                          <TableCell>{consultation.notes || "Нет"}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {selectedTab === "treatments" && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Лечения</CardTitle>
                {isProvider && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsTreatmentModalOpen(true)}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Добавить лечение</TooltipContent>
                  </Tooltip>
                )}
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Медикамент</TableHead>
                      <TableHead>Дозировка</TableHead>
                      <TableHead>Частота</TableHead>
                      <TableHead>Длительность</TableHead>
                      <TableHead>Врач</TableHead>
                      <TableHead>Заметки</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {treatments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">
                          Нет данных
                        </TableCell>
                      </TableRow>
                    ) : (
                      treatments.map((treatment) => (
                        <TableRow key={treatment.id}>
                          <TableCell>{treatment.medication}</TableCell>
                          <TableCell>{treatment.dosage}</TableCell>
                          <TableCell>{treatment.frequency}</TableCell>
                          <TableCell>{treatment.duration}</TableCell>
                          <TableCell>
                            {treatment.providerName || "Не указан"}
                          </TableCell>
                          <TableCell>{treatment.notes || "Нет"}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {selectedTab === "recommendations" && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Рекомендации</CardTitle>
                {isProvider && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsRecommendationModalOpen(true)}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Добавить рекомендацию</TooltipContent>
                  </Tooltip>
                )}
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Описание</TableHead>
                      <TableHead>Врач</TableHead>
                      <TableHead>Дата</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recommendations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center">
                          Нет данных
                        </TableCell>
                      </TableRow>
                    ) : (
                      recommendations.map((recommendation) => (
                        <TableRow key={recommendation.id}>
                          <TableCell>{recommendation.description}</TableCell>
                          <TableCell>
                            {recommendation.providerName || "Не указан"}
                          </TableCell>
                          <TableCell>
                            {new Date(
                              recommendation.createdAt
                            ).toLocaleDateString("ru-RU")}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {selectedTab === "files" && (
            <Card>
              <CardHeader>
                <CardTitle>Файлы</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Имя файла</TableHead>
                      <TableHead>Описание</TableHead>
                      <TableHead>Загрузил</TableHead>
                      <TableHead>Дата</TableHead>
                      <TableHead>Ссылка</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {files.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center">
                          Нет данных
                        </TableCell>
                      </TableRow>
                    ) : (
                      files.map((file) => (
                        <TableRow key={file.id}>
                          <TableCell>{file.fileName}</TableCell>
                          <TableCell>{file.description || "Нет"}</TableCell>
                          <TableCell>
                            {file.uploadedBy || "Не указан"}
                          </TableCell>
                          <TableCell>
                            {new Date(file.createdAt).toLocaleDateString(
                              "ru-RU"
                            )}
                          </TableCell>
                          <TableCell>
                            <a
                              href={file.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:underline"
                            >
                              Скачать
                            </a>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {selectedTab === "monitoring" && (
            <Card>
              <CardHeader>
                <CardTitle>Мониторинг</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {monitoringItems.map((item) => {
                    const latestMeasurement = measurements.find(
                      (m) => m.type === item.id
                    );
                    return (
                      <Card key={item.id}>
                        <CardHeader>
                          <CardTitle>{item.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {latestMeasurement
                              ? item.inputType === "double" &&
                                latestMeasurement.value2
                                ? `${latestMeasurement.value1}/${latestMeasurement.value2}`
                                : latestMeasurement.value1
                              : item.defaultValue}{" "}
                            {item.unit}
                          </div>
                          <p className="text-sm text-gray-400">
                            Последнее измерение:{" "}
                            {latestMeasurement
                              ? new Date(
                                  latestMeasurement.createdAt
                                ).toLocaleDateString("ru-RU")
                              : "Нет данных"}
                          </p>
                          <Button
                            className="mt-4"
                            variant="outline"
                            onClick={() => handleStatsClick(item)}
                          >
                            Статистика
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {selectedStatsItem && (
            <StatisticsModal
              item={selectedStatsItem}
              measurements={measurements.filter(
                (m) => m.type === selectedStatsItem.id
              )}
              onClose={handleStatsModalClose}
            />
          )}

          <Dialog
            open={isTreatmentModalOpen}
            onOpenChange={setIsTreatmentModalOpen}
          >
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Добавить лечение</DialogTitle>
              </DialogHeader>
              <AddTreatmentForm
                patientId={params.id}
                onSuccess={handleAddSuccess}
                onCancel={() => setIsTreatmentModalOpen(false)}
              />
            </DialogContent>
          </Dialog>

          <Dialog
            open={isRecommendationModalOpen}
            onOpenChange={setIsRecommendationModalOpen}
          >
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Добавить рекомендацию</DialogTitle>
              </DialogHeader>
              <AddRecommendationForm
                patientId={params.id}
                onSuccess={handleAddSuccess}
                onCancel={() => setIsRecommendationModalOpen(false)}
              />
            </DialogContent>
          </Dialog>

          <Dialog
            open={isConsultationModalOpen}
            onOpenChange={setIsConsultationModalOpen}
          >
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Добавить прием</DialogTitle>
              </DialogHeader>
              <AddConsultationForm
                patientId={params.id}
                onSuccess={handleAddSuccess}
                onCancel={() => setIsConsultationModalOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </TooltipProvider>
    </DashboardLayout>
  );
};

const PatientDetailsPageWithErrorBoundary = (props: {
  params: { id: string };
}) => (
  <ErrorBoundary>
    <PatientDetailsPage {...props} />
  </ErrorBoundary>
);

export default PatientDetailsPageWithErrorBoundary;
