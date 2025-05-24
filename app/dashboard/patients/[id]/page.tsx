"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import StatisticsModal from "@/components/StatisticsModal";
import { monitoringItems } from "@/components/MonitoringPage";

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
  description: string | null;
  uploadedBy: string | null;
  createdAt: string;
}

interface Measurement {
  id: string;
  type: string;
  value1: string;
  value2: string | null;
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

  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        const endpoints = [
          `/api/patients/${params.id}`,
          `/api/patients/${params.id}/consultations`,
          `/api/patients/${params.id}/treatments`,
          `/api/patients/${params.id}/recommendations`,
          `/api/patients/${params.id}/files`,
          `/api/patients/${params.id}/measurements`,
        ];

        const responses = await Promise.all(
          endpoints.map((endpoint) =>
            fetch(endpoint, { credentials: "include" }).then((res) =>
              res.json()
            )
          )
        );

        const [
          patientData,
          consultationsData,
          treatmentsData,
          recommendationsData,
          filesData,
          measurementsData,
        ] = responses;

        if (patientData.error) throw new Error(patientData.error);
        setPatient(patientData);
        setConsultations(consultationsData);
        setTreatments(treatmentsData);
        setRecommendations(recommendationsData);
        setFiles(filesData);
        setMeasurements(measurementsData);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err.message || "Не удалось загрузить данные пациента");
      } finally {
        setLoading(false);
      }
    };

    fetchPatientData();
  }, [params.id]);

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

  if (loading) {
    return (
      <DashboardLayout userType="DOCTOR" session={{ fullName: "Загрузка..." }}>
        <div>Загрузка...</div>
      </DashboardLayout>
    );
  }

  if (!patient || error) {
    return (
      <DashboardLayout userType="DOCTOR" session={{ fullName: "Ошибка" }}>
        <div className="text-red-500">{error || "Пациент не найден"}</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType="DOCTOR" session={{ fullName: patient.fullName }}>
      <div className="space-y-4">
        <Button variant="outline" onClick={handleGoBack}>
          Назад
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Информация о пациенте</CardTitle>
          </CardHeader>
          <CardContent>
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

        <div className="flex space-x-4">
          <Button onClick={() => handleTabClick("consultations")}>
            Приемы
          </Button>
          <Button onClick={() => handleTabClick("treatments")}>Лечения</Button>
          <Button onClick={() => handleTabClick("recommendations")}>
            Рекомендации
          </Button>
          <Button onClick={() => handleTabClick("files")}>Файлы</Button>
          <Button onClick={() => handleTabClick("monitoring")}>
            Мониторинг
          </Button>
        </div>

        {selectedTab === "consultations" && (
          <Card>
            <CardHeader>
              <CardTitle>Приемы</CardTitle>
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
                      <TableCell colSpan={4}>Нет данных</TableCell>
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
                            ? "Запланирован"
                            : consultation.status === "COMPLETED"
                              ? "Завершен"
                              : "Отменен"}
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
            <CardHeader>
              <CardTitle>Лечения</CardTitle>
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
                      <TableCell colSpan={6}>Нет данных</TableCell>
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
            <CardHeader>
              <CardTitle>Рекомендации</CardTitle>
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
                      <TableCell colSpan={3}>Нет данных</TableCell>
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
                      <TableCell colSpan={5}>Нет данных</TableCell>
                    </TableRow>
                  ) : (
                    files.map((file) => (
                      <TableRow key={file.id}>
                        <TableCell>{file.fileName}</TableCell>
                        <TableCell>{file.description || "Нет"}</TableCell>
                        <TableCell>{file.uploadedBy || "Не указан"}</TableCell>
                        <TableCell>
                          {new Date(file.createdAt).toLocaleDateString("ru-RU")}
                        </TableCell>
                        <TableCell>
                          <a
                            href={file.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
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
      </div>
    </DashboardLayout>
  );
};

export default PatientDetailsPage;
