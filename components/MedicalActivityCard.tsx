"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { updateActivityStatus } from "@/lib/actions/medical-activities";
import { useTransition } from "react";
import { toast } from "sonner";

interface MedicalActivityCardProps {
  activity: {
    id: string;
    type: "INVITATION" | "SCREENING" | "VACCINATION";
    title: string;
    date: string;
    doctor: string;
    status: string;
    notes?: string | null;
  };
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "PENDING":
    case "INVITED":
      return "bg-blue-100 text-blue-800";
    case "COMPLETED":
      return "bg-yellow-100 text-yellow-800";
    case "CONFIRMED":
      return "bg-green-100 text-green-800";
    case "CANCELLED":
    case "REJECTED":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case "PENDING":
    case "INVITED":
      return "Приглашен";
    case "COMPLETED":
      return "Пройдено";
    case "CONFIRMED":
      return "Подтверждено";
    case "CANCELLED":
      return "Отменено";
    case "REJECTED":
      return "Отклонено";
    default:
      return status;
  }
};

export const MedicalActivityCard = ({
  activity: initialActivity,
}: MedicalActivityCardProps) => {
  const [isPending, startTransition] = useTransition();
  const [activity, setActivity] = React.useState(initialActivity);

  // Keep local state in sync with props
  React.useEffect(() => {
    setActivity(initialActivity);
  }, [initialActivity]);

  const handleMarkAsCompleted = () => {
    // Optimistic update
    setActivity({ ...activity, status: "COMPLETED" });

    startTransition(async () => {
      try {
        const result = await updateActivityStatus(
          activity.id,
          activity.type,
          "COMPLETED"
        );
        if (result.success) {
          toast.success("Статус успешно обновлен");
        } else {
          // Revert on failure
          setActivity({ ...activity, status: initialActivity.status });
          toast.error("Не удалось обновить статус");
        }
      } catch (error) {
        // Revert on error
        setActivity({ ...activity, status: initialActivity.status });
        toast.error(
          "Произошла ошибка при обновлении статуса: " +
            (error instanceof Error ? error.message : String(error))
        );
      }
    });
  };

  return (
    <Card key={activity.id} className="bg-white border border-gray-200">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{activity.title}</CardTitle>
            <p className="text-sm text-gray-500">{activity.type}</p>
          </div>
          <span
            className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusColor(
              activity.status
            )}`}
          >
            {getStatusText(activity.status)}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-sm">
            <span className="font-semibold">Дата:</span> {activity.date}
          </p>
          <p className="text-sm">
            <span className="font-semibold">Врач:</span> {activity.doctor}
          </p>
          {activity.notes && (
            <p className="text-sm">
              <span className="font-semibold">Примечания:</span>{" "}
              {activity.notes}
            </p>
          )}
          {(activity.status === "INVITED" || activity.status === "PENDING") && (
            <Button
              onClick={handleMarkAsCompleted}
              disabled={isPending}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white"
            >
              {isPending ? "Обновление..." : "Отметить как пройдено"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
