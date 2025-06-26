"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StatisticsModal from "@/components/StatisticsModal";
import CriticalValuesModal from "@/components/CriticalValuesModal";
import { monitoringItems } from "@/components/MonitoringPage";
import { BluetoothIcon } from "@/components/ui/bluetooth-icon";

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

  const canSetCriticalValues = userType === "DOCTOR" || userType === "NURSE";

  const getActiveAlert = (itemId: string) => {
    return alerts.find(
      (alert) =>
        alert.measurementType === itemId && alert.alertStatus === "CRITICAL"
    );
  };

  const getActiveAlertsCount = (itemId: string) => {
    return alerts.filter(
      (alert) =>
        alert.measurementType === itemId && alert.alertStatus === "CRITICAL"
    ).length;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Мониторинг</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {monitoringItems.map((item) => {
              // Find the latest measurement for this type by sorting by createdAt desc
              const latestMeasurement = measurements
                .filter((m) => m.type === item.id)
                .sort(
                  (a, b) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime()
                )[0];
              const activeAlert = getActiveAlert(item.id);
              const alertsCount = getActiveAlertsCount(item.id);
              const isAlert = !!activeAlert;
              const hasBluetoothSupport =
                item.id === "blood-pressure" || item.id === "pulse";
              return (
                <Card
                  key={item.id}
                  className={isAlert ? "border-red-500 bg-red-50" : ""}
                >
                  <CardHeader>
                    <CardTitle
                      className={`flex items-center justify-between ${isAlert ? "text-red-700" : ""}`}
                    >
                      <span>{item.title}</span>
                      {hasBluetoothSupport && (
                        <BluetoothIcon size={20} className="text-blue-500" />
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isAlert && (
                      <div className="mb-3 p-2 bg-red-100 border border-red-300 rounded-md">
                        <p className="text-sm text-red-800 font-medium">
                          ⚠️ Предел!
                          {alertsCount > 1 && (
                            <span className="ml-1 text-xs">
                              ({alertsCount} предупреждений)
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-red-600">
                          {activeAlert?.message}
                        </p>
                      </div>
                    )}
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
                        Мониторинг
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
