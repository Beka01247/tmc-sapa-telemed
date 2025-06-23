"use client";

import DashboardLayout from "@/components/layouts/DashboardLayout";
import { UserType } from "@/constants/userTypes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useMemo } from "react";
import MeasurementModal from "@/components/MeasurementModal";
import StatisticsModal from "@/components/StatisticsModal";

interface MonitoringItem {
  id: string;
  title: string;
  unit: string;
  inputType: "single" | "double" | "text";
  defaultValue: string;
}

interface Measurement {
  id: string;
  type: string;
  value1: string;
  value2: string | null;
  createdAt: string;
}

interface Alert {
  id: string;
  patientId: string;
  measurementType: string;
  alertStatus: "NORMAL" | "WARNING" | "CRITICAL";
  message: string;
  acknowledged: boolean;
  createdAt: string;
}

interface Session {
  user: {
    fullName: string;
    userType: string;
    id?: string;
  };
}

interface MonitoringPageProps {
  session: Session;
}

export const monitoringItems: MonitoringItem[] = [
  {
    id: "blood-pressure",
    title: "Артериальное давление",
    unit: "",
    inputType: "double",
    defaultValue: "0/0",
  },
  {
    id: "pulse",
    title: "Пульс",
    unit: "уд/мин",
    inputType: "single",
    defaultValue: "0",
  },
  {
    id: "temperature",
    title: "Температура",
    unit: "°C",
    inputType: "single",
    defaultValue: "0",
  },
  {
    id: "glucose",
    title: "Глюкоза",
    unit: "ммоль",
    inputType: "single",
    defaultValue: "0",
  },
  {
    id: "oximeter",
    title: "Оксигинация крови",
    unit: "%",
    inputType: "single",
    defaultValue: "0",
  },
  {
    id: "spirometer",
    title: "Спирография",
    unit: "мл",
    inputType: "single",
    defaultValue: "0",
  },
  {
    id: "cholesterol",
    title: "Холестерин",
    unit: "ммоль/л",
    inputType: "single",
    defaultValue: "0",
  },
  {
    id: "hemoglobin",
    title: "Гемоглобин",
    unit: "г/л",
    inputType: "single",
    defaultValue: "0",
  },
  {
    id: "triglycerides",
    title: "Триглицериды",
    unit: "ммоль/л",
    inputType: "single",
    defaultValue: "0",
  },
  {
    id: "weight",
    title: "Вес",
    unit: "кг",
    inputType: "single",
    defaultValue: "0",
  },
  {
    id: "height",
    title: "Рост",
    unit: "см",
    inputType: "single",
    defaultValue: "0",
  },
  {
    id: "ultrasound",
    title: "УЗИ мобил",
    unit: "",
    inputType: "text",
    defaultValue: "Нет данных",
  },
  {
    id: "xray",
    title: "Рентген мобил",
    unit: "",
    inputType: "text",
    defaultValue: "Нет данных",
  },
  {
    id: "inr",
    title: "МНО",
    unit: "",
    inputType: "single",
    defaultValue: "0",
  },
  {
    id: "inr",
    title: "ЭКГ",
    unit: "",
    inputType: "single",
    defaultValue: "0",
  },
  {
    id: "inr",
    title: "Индекс массы тела (ИМТ)",
    unit: "",
    inputType: "single",
    defaultValue: "0",
  },
];

const MonitoringPage = ({ session }: MonitoringPageProps) => {
  const [selectedItem, setSelectedItem] = useState<MonitoringItem | null>(null);
  const [selectedStatsItem, setSelectedStatsItem] =
    useState<MonitoringItem | null>(null);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch measurements
        const measurementsResponse = await fetch("/api/measurements");
        if (!measurementsResponse.ok) {
          throw new Error("Не удалось загрузить измерения");
        }
        const measurementsData = await measurementsResponse.json();
        setMeasurements(measurementsData);

        // Fetch alerts for patient
        const alertsResponse = await fetch(
          `/api/patient-alerts?patientId=${session.user.id}`
        );
        if (alertsResponse.ok) {
          const alertsData = await alertsResponse.json();
          setAlerts(alertsData);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session.user.id]);

  // Sort monitoringItems based on latest measurement createdAt
  const sortedMonitoringItems = useMemo(() => {
    return [...monitoringItems].sort((a, b) => {
      const measurementA = measurements.find((m) => m.type === a.id);
      const measurementB = measurements.find((m) => m.type === b.id);

      const dateA = measurementA
        ? new Date(measurementA.createdAt).getTime()
        : 0;
      const dateB = measurementB
        ? new Date(measurementB.createdAt).getTime()
        : 0;

      return dateB - dateA; // Newest first
    });
  }, [measurements]);

  const handleAddMeasurement = (item: MonitoringItem) => {
    setSelectedItem(item);
  };

  const handleStatsClick = (item: MonitoringItem) => {
    setSelectedStatsItem(item);
  };

  const handleModalClose = () => {
    setSelectedItem(null);
  };

  const handleStatsModalClose = () => {
    setSelectedStatsItem(null);
  };

  const handleModalSubmit = async (data: {
    value1: string;
    value2?: string;
  }) => {
    if (!selectedItem) return;

    try {
      const response = await fetch("/api/measurements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: selectedItem.id,
          value1: data.value1,
          value2: data.value2,
        }),
      });

      if (!response.ok) {
        throw new Error("Не удалось сохранить измерение");
      }

      // Refresh measurements after successful POST
      const updatedResponse = await fetch("/api/measurements");
      if (updatedResponse.ok) {
        const updatedData = await updatedResponse.json();
        setMeasurements(updatedData);
      }

      setSelectedItem(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      alert(err instanceof Error ? err.message : "Unknown error");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getLatestMeasurement = (itemId: string) => {
    const measurement = measurements.find((m) => m.type === itemId);
    if (!measurement) {
      return {
        value: monitoringItems.find((i) => i.id === itemId)?.defaultValue,
        date: null,
      };
    }
    return {
      value:
        measurement.type === "blood-pressure" && measurement.value2
          ? `${measurement.value1}/${measurement.value2}`
          : measurement.value1,
      date: measurement.createdAt,
    };
  };

  const hasActiveAlert = (itemId: string) => {
    return alerts.some(
      (alert) =>
        alert.measurementType === itemId &&
        alert.alertStatus === "CRITICAL" &&
        !alert.acknowledged
    );
  };

  return (
    <DashboardLayout
      userType={session.user.userType as UserType}
      session={{
        fullName: session.user.fullName,
      }}
    >
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Мониторинг состояния</h2>

        {error && <div className="text-red-500 text-sm">{error}</div>}

        {loading ? (
          <div>Загрузка...</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sortedMonitoringItems.map((item) => {
              const { value, date } = getLatestMeasurement(item.id);
              const isAlert = hasActiveAlert(item.id);
              return (
                <Card
                  key={item.id}
                  className={isAlert ? "border-red-500 bg-red-50" : ""}
                >
                  <CardHeader>
                    <CardTitle className={isAlert ? "text-red-700" : ""}>
                      {item.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div
                      className={`text-2xl font-bold ${isAlert ? "text-red-700" : ""}`}
                    >
                      {value} {item.unit}
                    </div>
                    <p className="text-sm text-gray-400">
                      Последнее измерение:{" "}
                      {date ? formatDate(date) : "Нет данных"}
                    </p>
                    <Button
                      className="mt-4 hover:bg-blue-400 bg-blue-200"
                      variant="outline"
                      onClick={() => handleAddMeasurement(item)}
                    >
                      +
                    </Button>
                    <Button
                      className="mt-4 ml-4 hover:bg-blue-400"
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
        )}

        {selectedItem && (
          <MeasurementModal
            item={selectedItem}
            onClose={handleModalClose}
            onSubmit={handleModalSubmit}
          />
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

export default MonitoringPage;
