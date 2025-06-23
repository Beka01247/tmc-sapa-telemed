"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StatisticsModal from "@/components/StatisticsModal";
import CriticalValuesModal from "@/components/CriticalValuesModal";
import { monitoringItems } from "@/components/MonitoringPage";

interface Measurement {
  id: string;
  type: string;
  value1: string;
  value2?: string | null;
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

interface MonitoringTabProps {
  measurements: Measurement[];
  patientId: string;
  userType: string;
}

export const MonitoringTab = ({
  measurements,
  patientId,
  userType,
}: MonitoringTabProps) => {
  const [selectedStatsItem, setSelectedStatsItem] = useState<
    (typeof monitoringItems)[0] | null
  >(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await fetch(
          `/api/patient-alerts?patientId=${patientId}`
        );
        if (response.ok) {
          const alertsData = await response.json();
          setAlerts(alertsData);
        }
      } catch (error) {
        console.error("Error fetching alerts:", error);
      }
    };

    fetchAlerts();
  }, [patientId]);

  const hasActiveAlert = (itemId: string) => {
    return alerts.some(
      (alert) =>
        alert.measurementType === itemId &&
        alert.alertStatus === "CRITICAL" &&
        !alert.acknowledged
    );
  };

  const canSetCriticalValues = userType === "DOCTOR" || userType === "NURSE";

  return (
    <>
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
                      {latestMeasurement
                        ? item.inputType === "double" &&
                          latestMeasurement.value2
                          ? `${latestMeasurement.value1}/${latestMeasurement.value2}`
                          : latestMeasurement.value1
                        : item.defaultValue}{" "}
                      {item.unit}
                    </div>
                    <p className="text-sm text-gray-500">
                      Последнее измерение:{" "}
                      {latestMeasurement
                        ? new Date(
                            latestMeasurement.createdAt
                          ).toLocaleDateString("ru-RU")
                        : "Нет данных"}
                    </p>
                    <div className="flex space-x-2 mt-4">
                      <Button
                        variant="outline"
                        onClick={() => setSelectedStatsItem(item)}
                      >
                        Статистика
                      </Button>
                      {canSetCriticalValues && (
                        <CriticalValuesModal
                          patientId={patientId}
                          measurementType={item.id}
                          measurementTitle={item.title}
                          onSave={() => {
                            // Refresh alerts after saving critical values
                            const fetchAlerts = async () => {
                              try {
                                const response = await fetch(
                                  `/api/patient-alerts?patientId=${patientId}`
                                );
                                if (response.ok) {
                                  const alertsData = await response.json();
                                  setAlerts(alertsData);
                                }
                              } catch (error) {
                                console.error("Error fetching alerts:", error);
                              }
                            };
                            fetchAlerts();
                          }}
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {selectedStatsItem && (
        <StatisticsModal
          item={selectedStatsItem}
          measurements={measurements
            .filter((m) => m.type === selectedStatsItem.id)
            .map((m) => ({
              ...m,
              value2: m.value2 || null,
            }))}
          onClose={() => setSelectedStatsItem(null)}
        />
      )}
    </>
  );
};
