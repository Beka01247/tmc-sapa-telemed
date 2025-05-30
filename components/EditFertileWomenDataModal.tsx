import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";

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

interface EditFertileWomenDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: FertileWomenRegisterData;
  patientId: string;
  onSave: (data: FertileWomenRegisterData) => void;
}

export const EditFertileWomenDataModal = ({
  isOpen,
  onClose,
  data: initialData,
  patientId,
  onSave,
}: EditFertileWomenDataModalProps) => {
  const [data, setData] = useState(initialData);
  const [isDeregisterDialogOpen, setIsDeregisterDialogOpen] = useState(false);
  const [deregisterReason, setDeregisterReason] = useState("");

  const handleSave = async () => {
    try {
      await fetch(`/api/patients/${patientId}/fertile-women-register`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      onSave(data);
      onClose();
      toast.success("Данные обновлены");
    } catch (error) {
      toast.error("Не удалось обновить данные");
    }
  };

  const handleDeregister = async () => {
    if (!deregisterReason.trim()) {
      toast.error("Укажите причину снятия с учета");
      return;
    }

    const updatedData = {
      ...data,
      deregistrationDate: new Date().toISOString(),
      reasonDeregistered: deregisterReason,
    };

    try {
      await fetch(`/api/patients/${patientId}/fertile-women-register`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });

      onSave(updatedData);
      setIsDeregisterDialogOpen(false);
      onClose();
      toast.success("Пациент снят с учета");
    } catch (error) {
      toast.error("Не удалось снять пациента с учета");
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Редактировать данные регистра</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pregnanciesCount">
                  Количество беременностей
                </Label>
                <Input
                  id="pregnanciesCount"
                  type="number"
                  min="0"
                  value={data.pregnanciesCount ?? ""}
                  onChange={(e) =>
                    setData({
                      ...data,
                      pregnanciesCount: e.target.value
                        ? parseInt(e.target.value)
                        : null,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthsCount">Количество родов</Label>
                <Input
                  id="birthsCount"
                  type="number"
                  min="0"
                  value={data.birthsCount ?? ""}
                  onChange={(e) =>
                    setData({
                      ...data,
                      birthsCount: e.target.value
                        ? parseInt(e.target.value)
                        : null,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="abortionsCount">Количество абортов</Label>
                <Input
                  id="abortionsCount"
                  type="number"
                  min="0"
                  value={data.abortionsCount ?? ""}
                  onChange={(e) =>
                    setData({
                      ...data,
                      abortionsCount: e.target.value
                        ? parseInt(e.target.value)
                        : null,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stillbirthsCount">
                  Количество мертворождений
                </Label>
                <Input
                  id="stillbirthsCount"
                  type="number"
                  min="0"
                  value={data.stillbirthsCount ?? ""}
                  onChange={(e) =>
                    setData({
                      ...data,
                      stillbirthsCount: e.target.value
                        ? parseInt(e.target.value)
                        : null,
                    })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastPregnancyDate">
                Дата последней беременности
              </Label>
              <Input
                id="lastPregnancyDate"
                type="date"
                value={data.lastPregnancyDate?.split("T")[0] ?? ""}
                onChange={(e) =>
                  setData({
                    ...data,
                    lastPregnancyDate: e.target.value
                      ? new Date(e.target.value).toISOString()
                      : null,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="chronicDiseases">Хронические заболевания</Label>
              <Input
                id="chronicDiseases"
                value={data.chronicDiseases ?? ""}
                onChange={(e) =>
                  setData({
                    ...data,
                    chronicDiseases: e.target.value || null,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="screeningStatus">Статус скрининга</Label>
              <Input
                id="screeningStatus"
                value={data.screeningStatus ?? ""}
                onChange={(e) =>
                  setData({
                    ...data,
                    screeningStatus: e.target.value || null,
                  })
                }
              />
            </div>

            <div className="flex justify-between pt-4">
              <Button
                variant="destructive"
                onClick={() => setIsDeregisterDialogOpen(true)}
                disabled={!!data.deregistrationDate}
              >
                Снять с учета
              </Button>
              <div className="space-x-2">
                <Button variant="outline" onClick={onClose}>
                  Отмена
                </Button>
                <Button onClick={handleSave}>Сохранить</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={isDeregisterDialogOpen}
        onOpenChange={setIsDeregisterDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Снятие с учета</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите снять пациента с учета? Это действие нельзя
              отменить. Пожалуйста, укажите причину:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={deregisterReason}
            onChange={(e) => setDeregisterReason(e.target.value)}
            placeholder="Причина снятия с учета"
            className="my-4"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeregister}>
              Подтвердить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
