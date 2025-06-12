"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { createReception, updateReception } from "@/lib/actions/receptions";
import { toast } from "sonner";

interface NewReceptionDialogProps {
  patientId: string;
  open?: boolean;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  initialData?: {
    id?: string;
    anamnesis: string;
    complaints: string;
    objectiveStatus: string;
    diagnosis: string;
    examinations: string;
    treatment: string;
  };
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

const fieldLabels: Record<string, string> = {
  anamnesis: "Анамнез",
  complaints: "Жалобы",
  objectiveStatus: "Объективный статус",
  diagnosis: "Диагноз",
  examinations: "Обследования",
  treatment: "Лечение",
};

const NewReceptionDialog: React.FC<NewReceptionDialogProps> = ({
  isOpen,
  open,
  onOpenChange,
  onClose,
  patientId,
  initialData,
  onSuccess,
  trigger,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(isOpen || open || false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [formData, setFormData] = useState(
    initialData || {
      anamnesis: "",
      complaints: "",
      objectiveStatus: "",
      diagnosis: "",
      examinations: "",
      treatment: "",
    }
  );

  const handleOpenChange = (open: boolean) => {
    if (open === false) {
      handleClose();
    } else {
      setIsDialogOpen(true);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      let result;
      if (initialData?.id) {
        result = await updateReception(initialData.id, formData);
      } else {
        result = await createReception({ patientId, ...formData });
      }

      if (result.success) {
        toast.success("Прием сохранен");
        onSuccess?.();
        handleClose(true);
      } else {
        toast.error("Ошибка при сохранении приема");
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Ошибка при сохранении приема");
    }
  };

  const handleClose = (force = false) => {
    const hasChanges = Object.entries(formData).some(([key, value]) =>
      initialData
        ? value !== initialData[key as keyof typeof initialData]
        : value !== ""
    );

    if (hasChanges && !force) {
      setShowCloseConfirm(true);
    } else {
      setIsDialogOpen(false);
      onOpenChange?.(false);
      onClose?.();
    }
  };

  return (
    <>
      {trigger && <div onClick={() => setIsDialogOpen(true)}>{trigger}</div>}

      <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {initialData ? "Редактировать прием" : "Новый прием"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {Object.keys(fieldLabels).map((key) => (
              <div key={key}>
                <label className="block font-medium mb-1">
                  {fieldLabels[key]}
                </label>
                <Textarea
                  value={formData[key as keyof typeof formData]}
                  onChange={(e) => handleChange(key, e.target.value)}
                />
              </div>
            ))}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => handleClose()}>
                Отмена
              </Button>
              <Button onClick={handleSave}>Сохранить</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showCloseConfirm} onOpenChange={setShowCloseConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Вы действительно хотите закрыть окно?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Все несохраненные изменения будут потеряны.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleClose(true)}>
              Закрыть
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export { NewReceptionDialog };
