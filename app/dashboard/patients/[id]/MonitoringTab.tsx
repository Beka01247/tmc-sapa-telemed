"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StatisticsModal from "@/components/StatisticsModal";
import { monitoringItems } from "@/components/MonitoringPage";

interface Measurement {
  id: string;
  type: string;
  value1: string;
  value2?: string | null;
  createdAt: string;
}

interface MonitoringTabProps {
  measurements: Measurement[];
}

export const MonitoringTab = ({ measurements }: MonitoringTabProps) => {
  const [selectedStatsItem, setSelectedStatsItem] = useState<any | null>(null);

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
                    <p className="text-sm text-gray-500">
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
                      onClick={() => setSelectedStatsItem(item)}
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

      {selectedStatsItem && (
        <StatisticsModal
          item={selectedStatsItem}
          measurements={measurements.filter(
            (m) => m.type === selectedStatsItem.id
          )}
          onClose={() => setSelectedStatsItem(null)}
        />
      )}
    </>
  );
};
