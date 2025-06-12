"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { format } from "date-fns";
import { VaccinationSelectorDialog } from "./VaccinationSelectorDialog";

interface VaccinationCardProps {
  patientId: string;
  vaccinations: Array<{
    id: string;
    name: string | null;
    scheduledDate: string;
    administeredDate: string | null;
    status: "INVITED" | "COMPLETED" | "CONFIRMED" | "CANCELLED" | "REJECTED";
    notes: string | null;
  }>;
  isDoctor: boolean;
}

export const VaccinationsCard = ({
  patientId,
  vaccinations,
  isDoctor,
}: VaccinationCardProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleVaccinationCreated = () => {
    window.location.reload();
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "INVITED":
        return "Запланировано";
      case "COMPLETED":
        return "Выполнено";
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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Вакцинации</CardTitle>
        {isDoctor && (
          <Button onClick={() => setIsDialogOpen(true)}>
            Добавить вакцинацию
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {vaccinations.length === 0 ? (
          <p className="text-center text-muted-foreground">
            Нет запланированных вакцинаций
          </p>
        ) : (
          <div className="space-y-4 h-[300px] overflow-y-auto pr-2">
            {vaccinations.map((vaccination) => (
              <div
                key={vaccination.id}
                className="flex items-center justify-between border-b pb-2"
              >
                <div>
                  <p className="font-medium">
                    {vaccination.name || "Без названия"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Запланировано на:{" "}
                    {format(new Date(vaccination.scheduledDate), "dd.MM.yyyy")}
                  </p>
                  {vaccination.administeredDate && (
                    <p className="text-sm text-muted-foreground">
                      Выполнено:{" "}
                      {format(
                        new Date(vaccination.administeredDate),
                        "dd.MM.yyyy"
                      )}
                    </p>
                  )}
                  {vaccination.notes && (
                    <p className="text-sm text-muted-foreground">
                      Примечания: {vaccination.notes}
                    </p>
                  )}
                </div>
                <div className="text-sm">
                  Статус: {getStatusText(vaccination.status)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <VaccinationSelectorDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        patientId={patientId}
        onVaccinationCreated={handleVaccinationCreated}
      />
    </Card>
  );
};
