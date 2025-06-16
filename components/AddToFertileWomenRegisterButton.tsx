import { useState } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
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
import { Input } from "./ui/input";
import { toast } from "sonner";

interface AddToFertileWomenRegisterProps {
  patientId: string;
  patientName: string;
  isRegistered: boolean;
  onSuccess: () => void;
}

export const AddToFertileWomenRegisterButton = ({
  patientId,
  patientName,
  isRegistered,
  onSuccess,
}: AddToFertileWomenRegisterProps) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
  const [removeReason, setRemoveReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAddToRegister = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/patients/${patientId}/fertile-women-register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!response.ok) {
        if (response.status === 409) {
          toast.error("Пациент уже находится в регистре ЖФВ");
        } else {
          toast.error("Не удалось добавить пациента в регистр ЖФВ");
        }
        return;
      }

      toast.success("Пациент успешно добавлен в регистр ЖФВ");
      setIsAddDialogOpen(false);
      onSuccess();
    } catch {
      toast.error("Произошла ошибка при добавлении пациента в регистр ЖФВ");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFromRegister = async () => {
    if (!removeReason.trim()) {
      toast.error("Укажите причину снятия с учета");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/patients/${patientId}/fertile-women-register`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: removeReason }),
        }
      );

      if (!response.ok) {
        toast.error("Не удалось снять пациента с учета");
        return;
      }

      toast.success("Пациент успешно снят с учета");
      setIsRemoveDialogOpen(false);
      onSuccess();
    } catch {
      toast.error("Произошла ошибка при снятии пациента с учета");
    } finally {
      setIsLoading(false);
    }
  };

  if (isRegistered) {
    return (
      <>
        <Button
          variant="destructive"
          onClick={() => setIsRemoveDialogOpen(true)}
        >
          Снять с учета ЖФВ
        </Button>

        <AlertDialog
          open={isRemoveDialogOpen}
          onOpenChange={setIsRemoveDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Снятие с учета ЖФВ</AlertDialogTitle>
              <AlertDialogDescription>
                Вы уверены, что хотите снять пациента {patientName} с учета ЖФВ?
                Пожалуйста, укажите причину снятия с учета:
              </AlertDialogDescription>
            </AlertDialogHeader>
            <Input
              value={removeReason}
              onChange={(e) => setRemoveReason(e.target.value)}
              placeholder="Причина снятия с учета"
              className="my-4"
            />
            <AlertDialogFooter>
              <AlertDialogCancel>Отмена</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleRemoveFromRegister}
                disabled={isLoading}
              >
                {isLoading ? "Загрузка..." : "Подтвердить"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  return (
    <>
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogTrigger asChild>
          <Button>Добавить в регистр ЖФВ</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавление в регистр ЖФВ</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p>
              Вы собираетесь добавить пациента <strong>{patientName}</strong> в
              регистр женщин фертильного возраста.
            </p>
            <p>
              Дата постановки на учет будет установлена на сегодняшний день.
              После добавления вы сможете редактировать дополнительные данные.
            </p>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleAddToRegister} disabled={isLoading}>
              {isLoading ? "Загрузка..." : "Добавить"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
