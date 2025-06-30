"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format, subDays, startOfDay } from "date-fns";
import { ru } from "date-fns/locale";

interface TreatmentTime {
  id: string;
  time: string;
}

interface Treatment {
  id: string;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  times: TreatmentTime[];
}

interface TreatmentLog {
  id: string;
  treatmentTimeId: string;
  logDate: string;
  isTaken: boolean;
  takenAt: string | null;
}

interface TreatmentComplianceProps {
  patientId: string;
  treatments: Treatment[];
}

export const TreatmentCompliance = ({
  patientId,
  treatments,
}: TreatmentComplianceProps) => {
  const [logs, setLogs] = useState<TreatmentLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTreatmentLogs = useCallback(async () => {
    try {
      const response = await fetch(`/api/patients/${patientId}/treatment-logs`);
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      }
    } catch (error) {
      console.error("Failed to fetch treatment logs:", error);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchTreatmentLogs();
  }, [fetchTreatmentLogs]);

  const getComplianceForDate = (treatmentTimeId: string, date: string) => {
    return logs.find(
      (log) => log.treatmentTimeId === treatmentTimeId && log.logDate === date
    );
  };

  const getComplianceRate = (treatmentId: string, days: number = 7) => {
    const treatment = treatments.find((t) => t.id === treatmentId);
    if (!treatment) return 0;

    const dates = Array.from({ length: days }, (_, i) =>
      format(subDays(new Date(), i), "yyyy-MM-dd")
    );

    let totalSlots = 0;
    let completedSlots = 0;

    dates.forEach((date) => {
      treatment.times.forEach((time) => {
        totalSlots++;
        const log = getComplianceForDate(time.id, date);
        if (log?.isTaken) {
          completedSlots++;
        }
      });
    });

    return totalSlots > 0 ? Math.round((completedSlots / totalSlots) * 100) : 0;
  };

  const renderComplianceTable = (days: number) => {
    const dates = Array.from({ length: days }, (_, i) =>
      subDays(new Date(), i)
    ).reverse();

    return (
      <div className="space-y-6">
        {treatments.map((treatment) => (
          <Card key={treatment.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{treatment.medication}</span>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">{treatment.dosage}</Badge>
                  <Badge
                    variant={
                      getComplianceRate(treatment.id, days) >= 80
                        ? "default"
                        : "destructive"
                    }
                  >
                    {getComplianceRate(treatment.id, days)}% соблюдение
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Время</TableHead>
                    {dates.map((date) => (
                      <TableHead key={date.toISOString()}>
                        {format(date, "dd.MM", { locale: ru })}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {treatment.times.map((time) => (
                    <TableRow key={time.id}>
                      <TableCell className="font-medium">{time.time}</TableCell>
                      {dates.map((date) => {
                        const dateStr = format(date, "yyyy-MM-dd");
                        const log = getComplianceForDate(time.id, dateStr);
                        const isToday =
                          format(date, "yyyy-MM-dd") ===
                          format(new Date(), "yyyy-MM-dd");
                        const isPastDate = date < startOfDay(new Date());

                        return (
                          <TableCell key={dateStr}>
                            {log?.isTaken ? (
                              <div className="flex flex-col items-center">
                                <Badge variant="default" className="mb-1">
                                  ✓
                                </Badge>
                                {log.takenAt && (
                                  <span className="text-xs text-gray-500">
                                    {format(new Date(log.takenAt), "HH:mm")}
                                  </span>
                                )}
                              </div>
                            ) : isPastDate ? (
                              <Badge variant="destructive">✗</Badge>
                            ) : isToday ? (
                              <Badge variant="secondary">—</Badge>
                            ) : (
                              <Badge variant="outline">—</Badge>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  if (loading) {
    return <div>Загрузка...</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Соблюдение лечения пациентом</h3>

      <Tabs defaultValue="7days" className="w-full">
        <TabsList>
          <TabsTrigger value="7days">7 дней</TabsTrigger>
          <TabsTrigger value="14days">14 дней</TabsTrigger>
          <TabsTrigger value="30days">30 дней</TabsTrigger>
        </TabsList>

        <TabsContent value="7days" className="mt-4">
          {renderComplianceTable(7)}
        </TabsContent>

        <TabsContent value="14days" className="mt-4">
          {renderComplianceTable(14)}
        </TabsContent>

        <TabsContent value="30days" className="mt-4">
          {renderComplianceTable(30)}
        </TabsContent>
      </Tabs>

      {treatments.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">Нет активных лечений</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
