"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { format } from "date-fns";

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
  notes: string | null;
  providerName: string | null;
  times: TreatmentTime[];
  createdAt: string;
}

interface TreatmentLog {
  id: string;
  treatmentTimeId: string;
  logDate: string;
  isTaken: boolean;
  takenAt: string | null;
}

interface TreatmentCardProps {
  treatment: Treatment;
  patientId: string;
}

export const TreatmentCard = ({ treatment, patientId }: TreatmentCardProps) => {
  const [logs, setLogs] = useState<TreatmentLog[]>([]);
  const [loading, setLoading] = useState(true);
  const today = format(new Date(), "yyyy-MM-dd");

  const fetchTreatmentLogs = useCallback(async () => {
    try {
      const response = await fetch(`/api/patients/${patientId}/treatment-logs`);
      if (response.ok) {
        const data = await response.json();
        setLogs(
          data.filter((log: TreatmentLog) =>
            treatment.times.some((time) => time.id === log.treatmentTimeId)
          )
        );
      }
    } catch (error) {
      console.error("Failed to fetch treatment logs:", error);
    } finally {
      setLoading(false);
    }
  }, [patientId, treatment.times]);

  useEffect(() => {
    fetchTreatmentLogs();
  }, [fetchTreatmentLogs]);

  const handleTreatmentTaken = async (
    treatmentTimeId: string,
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
            treatmentId: treatment.id,
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
    return (
      <Card>
        <CardContent className="p-4">
          <div className="text-center text-sm text-gray-500">Загрузка...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-start justify-between">
          <span className="font-semibold">{treatment.medication}</span>
          <Badge variant="outline" className="ml-2">
            {treatment.dosage}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2 text-sm">
          <div>
            <span className="font-medium">Частота:</span> {treatment.frequency}
          </div>
          <div>
            <span className="font-medium">Длительность:</span>{" "}
            {treatment.duration}
          </div>
          {treatment.providerName && (
            <div>
              <span className="font-medium">Врач:</span>{" "}
              {treatment.providerName}
            </div>
          )}
          {treatment.notes && (
            <div>
              <span className="font-medium">Заметки:</span> {treatment.notes}
            </div>
          )}
        </div>

        <div className="border-t pt-3">
          <h4 className="font-medium text-sm mb-3">Время приема на сегодня:</h4>

          {treatment.times.length === 0 ? (
            <p className="text-sm text-gray-500">Время не указано</p>
          ) : (
            <div className="space-y-2">
              {treatment.times.map((time) => {
                const log = getTodayLog(time.id);
                const isTaken = log?.isTaken || false;

                return (
                  <div
                    key={time.id}
                    className="flex items-center justify-between p-2 border rounded-lg bg-gray-50"
                  >
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary" className="text-xs">
                        {time.time}
                      </Badge>
                      {log?.takenAt && (
                        <span className="text-xs text-green-600">
                          Принято в {format(new Date(log.takenAt), "HH:mm")}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={isTaken}
                        onCheckedChange={(checked) =>
                          handleTreatmentTaken(time.id, checked as boolean)
                        }
                      />
                      <label className="text-xs cursor-pointer">Принято</label>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="text-xs text-gray-500 pt-2 border-t">
          Назначено: {treatment.createdAt}
        </div>
      </CardContent>
    </Card>
  );
};
