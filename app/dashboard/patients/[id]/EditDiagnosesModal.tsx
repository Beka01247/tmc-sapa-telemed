"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface Diagnosis {
  id?: string;
  description: string;
}

interface EditDiagnosesModalProps {
  isOpen: boolean;
  onClose: () => void;
  diagnoses: Diagnosis[] | undefined;
  patientId: string;
  onSave: (diagnoses: Diagnosis[]) => void;
}

export const EditDiagnosesModal = ({
  isOpen,
  onClose,
  diagnoses: initialDiagnoses = [],
  patientId,
  onSave,
}: EditDiagnosesModalProps) => {
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>(initialDiagnoses);
  const [newDiagnosis, setNewDiagnosis] = useState("");

  const handleAddDiagnosis = async () => {
    if (!newDiagnosis.trim()) {
      toast.error("Введите действительный диагноз");
      return;
    }

    try {
      const response = await fetch(`/api/patients/${patientId}/diagnoses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: newDiagnosis.trim() }),
      });

      if (!response.ok) {
        throw new Error("Не удалось добавить диагноз");
      }

      const addedDiagnosis: Diagnosis = await response.json();
      setDiagnoses([...diagnoses, addedDiagnosis]);
      setNewDiagnosis("");
      toast.success("Диагноз добавлен");
    } catch (error) {
      console.error("Ошибка при добавлении диагноза:", error);
      toast.error("Ошибка при добавлении диагноза");
    }
  };

  const handleUpdateDiagnosis = async (index: number, description: string) => {
    if (!description.trim()) {
      toast.error("Диагноз не может быть пустым");
      return;
    }

    const diagnosis = diagnoses[index];
    if (!diagnosis.id) {
      toast.error("Неверный ID диагноза");
      return;
    }

    try {
      const response = await fetch(`/api/patients/${patientId}/diagnoses`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: diagnosis.id,
          description: description.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("Не удалось обновить диагноз");
      }

      const updatedDiagnosis: Diagnosis = await response.json();
      const newDiagnoses = [...diagnoses];
      newDiagnoses[index] = updatedDiagnosis;
      setDiagnoses(newDiagnoses);
      toast.success("Диагноз обновлен");
    } catch (error) {
      console.error("Ошибка при обновлении диагноза:", error);
      toast.error("Ошибка при обновлении диагноза");
    }
  };

  const handleRemoveDiagnosis = async (index: number) => {
    const diagnosis = diagnoses[index];
    if (!diagnosis.id) {
      setDiagnoses(diagnoses.filter((_, i) => i !== index));
      return;
    }

    try {
      const response = await fetch(`/api/patients/${patientId}/diagnoses`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: diagnosis.id }),
      });

      if (!response.ok) {
        throw new Error("Не удалось удалить диагноз");
      }

      setDiagnoses(diagnoses.filter((_, i) => i !== index));
      toast.success("Диагноз удален");
    } catch (error) {
      console.error("Ошибка при удалении диагноза:", error);
      toast.error("Ошибка при удалении диагноза");
    }
  };

  const handleSave = () => {
    onSave(diagnoses);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Редактировать диагнозы</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {diagnoses.length > 0 ? (
            diagnoses.map((diagnosis, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={diagnosis.description}
                  onChange={(e) => handleUpdateDiagnosis(index, e.target.value)}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemoveDiagnosis(index)}
                >
                  Удалить
                </Button>
              </div>
            ))
          ) : (
            <p className="text-gray-500">Диагнозы отсутствуют</p>
          )}
          <div className="flex items-center gap-2">
            <Input
              value={newDiagnosis}
              onChange={(e) => setNewDiagnosis(e.target.value)}
              placeholder="Введите новый диагноз"
              className="flex-1"
            />
            <Button onClick={handleAddDiagnosis}>Добавить</Button>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <Button onClick={handleSave}>Сохранить</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
