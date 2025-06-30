"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { format } from "date-fns";
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

interface TreatmentTrackerProps {
  patientId: string;
  treatments: Treatment[];
  isPatient: boolean;
}

export const TreatmentTracker = ({
  patientId,
  treatments,
  isPatient,
}: TreatmentTrackerProps) => {
  const [logs, setLogs] = useState<TreatmentLog[]>([]);
  const [loading, setLoading] = useState(true);
  const today = format(new Date(), "yyyy-MM-dd");

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

  const handleTreatmentTaken = async (
    treatmentTimeId: string,
    treatmentId: string,
    isTaken: boolean
  ) => {
    try {
      const response = await fetch(
        `/api/patients/${patientId}/treatment-logs`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            treatmentTimeId,
            treatmentId,
            logDate: today,
            isTaken,
            takenAt: isTaken ? new Date().toISOString() : null,
          }),
        }
      );

      if (response.ok) {
        toast.success(
          isTaken
            ? "Лечение отмечено как принятое"
            : "Отметка о приеме отменена"
        );
        fetchTreatmentLogs();
      } else {
        throw new Error("Failed to update treatment log");
      }
    } catch {
      toast.error("Ошибка при обновлении записи о лечении");
    }
  };

  const getTodayLog = (treatmentTimeId: string) => {
    return logs.find(
      (log) => log.treatmentTimeId === treatmentTimeId && log.logDate === today
    );
  };

  if (loading) {
    return <div>Загрузка...</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">
        {isPatient ? "Мои лечения на сегодня" : "Лечения пациента"}
      </h3>

      {treatments.map((treatment) => (
        <Card key={treatment.id}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{treatment.medication}</span>
              <Badge variant="outline">{treatment.dosage}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Частота: {treatment.frequency} | Длительность:{" "}
                {treatment.duration}
              </p>

              <div className="space-y-2">
                <p className="font-medium">Время приема на сегодня:</p>
                {treatment.times.map((time) => {
                  const log = getTodayLog(time.id);
                  const isTaken = log?.isTaken || false;

                  return (
                    <div
                      key={time.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <Badge variant="secondary">{time.time}</Badge>
                        {log?.takenAt && (
                          <span className="text-sm text-green-600">
                            Принято в{" "}
                            {format(new Date(log.takenAt), "HH:mm", {
                              locale: ru,
                            })}
                          </span>
                        )}
                      </div>

                      {isPatient && (
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={isTaken}
                            onCheckedChange={(checked) =>
                              handleTreatmentTaken(
                                time.id,
                                treatment.id,
                                checked as boolean
                              )
                            }
                          />
                          <label className="text-sm">Принято</label>
                        </div>
                      )}

                      {!isPatient && (
                        <Badge variant={isTaken ? "default" : "secondary"}>
                          {isTaken ? "Принято" : "Не принято"}
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

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
