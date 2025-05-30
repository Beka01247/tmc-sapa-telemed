import { useState } from "react";
import { Button } from "./ui/button";
import { EditFertileWomenDataModal } from "./EditFertileWomenDataModal";

interface FertileWomenRegisterData {
  id: string;
  registrationDate: string | null;
  deregistrationDate: string | null;
  reasonDeregistered: string | null;
  pregnanciesCount: number | null;
  birthsCount: number | null;
  abortionsCount: number | null;
  stillbirthsCount: number | null;
  lastPregnancyDate: string | null;
  chronicDiseases: string | null;
  screeningStatus: string | null;
}

interface FertileWomenRegisterCardProps {
  data: FertileWomenRegisterData | null;
  patientId: string;
  isEditable?: boolean;
}

export const FertileWomenRegisterCard = ({
  data,
  patientId,
  isEditable = false,
}: FertileWomenRegisterCardProps) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  if (!data) {
    return null;
  }

  const handleSave = (updatedData: FertileWomenRegisterData) => {
    // Force a page reload to reflect the changes
    window.location.reload();
  };

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-semibold leading-none tracking-tight">
            Регистр женщин фертильного возраста
          </h3>
          {isEditable && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditModalOpen(true)}
            >
              Изменить
            </Button>
          )}
        </div>

        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium">Дата постановки на учет:</p>
              <p className="text-sm text-muted-foreground">
                {data.registrationDate || "Не указано"}
              </p>
            </div>

            {data.deregistrationDate && (
              <div>
                <p className="text-sm font-medium">Дата снятия с учета:</p>
                <p className="text-sm text-muted-foreground">
                  {data.deregistrationDate}
                  {data.reasonDeregistered && ` (${data.reasonDeregistered})`}
                </p>
              </div>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-sm font-medium">Беременности:</p>
              <p className="text-sm text-muted-foreground">
                {data.pregnanciesCount ?? "Нет данных"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Роды:</p>
              <p className="text-sm text-muted-foreground">
                {data.birthsCount ?? "Нет данных"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Аборты:</p>
              <p className="text-sm text-muted-foreground">
                {data.abortionsCount ?? "Нет данных"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Мертворождения:</p>
              <p className="text-sm text-muted-foreground">
                {data.stillbirthsCount ?? "Нет данных"}
              </p>
            </div>
          </div>

          {data.lastPregnancyDate && (
            <div>
              <p className="text-sm font-medium">
                Дата последней беременности:
              </p>
              <p className="text-sm text-muted-foreground">
                {data.lastPregnancyDate}
              </p>
            </div>
          )}

          {data.chronicDiseases && (
            <div>
              <p className="text-sm font-medium">Хронические заболевания:</p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {data.chronicDiseases}
              </p>
            </div>
          )}

          {data.screeningStatus && (
            <div>
              <p className="text-sm font-medium">Статус скрининга:</p>
              <p className="text-sm text-muted-foreground">
                {data.screeningStatus}
              </p>
            </div>
          )}
        </div>
      </div>
      {isEditable && (
        <EditFertileWomenDataModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          data={data}
          patientId={patientId}
          onSave={handleSave}
        />
      )}
    </div>
  );
};
