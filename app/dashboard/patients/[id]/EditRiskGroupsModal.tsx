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

interface RiskGroup {
  id?: string;
  name: string;
}

interface EditRiskGroupsModalProps {
  isOpen: boolean;
  onClose: () => void;
  riskGroups: RiskGroup[] | undefined;
  patientId: string;
  onSave: (riskGroups: RiskGroup[]) => void;
}

export const EditRiskGroupsModal = ({
  isOpen,
  onClose,
  riskGroups: initialRiskGroups = [],
  patientId,
  onSave,
}: EditRiskGroupsModalProps) => {
  const [riskGroups, setRiskGroups] = useState<RiskGroup[]>(initialRiskGroups);
  const [newRiskGroup, setNewRiskGroup] = useState("");

  const handleAddRiskGroup = async () => {
    if (!newRiskGroup.trim()) {
      toast.error("Введите действительную группу риска");
      return;
    }

    try {
      const response = await fetch(`/api/patients/${patientId}/risk-groups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newRiskGroup.trim() }),
      });

      if (!response.ok) {
        throw new Error("Не удалось добавить группу риска");
      }

      const addedRiskGroup: RiskGroup = await response.json();
      setRiskGroups([...riskGroups, addedRiskGroup]);
      setNewRiskGroup("");
      toast.success("Группа добавлена");
    } catch (error) {
      console.error("Ошибка при добавлении группы:", error);
      toast.error("Ошибка при добавлении группы");
    }
  };

  const handleUpdateRiskGroup = async (index: number, name: string) => {
    if (!name.trim()) {
      toast.error("Группа не может быть пустой");
      return;
    }

    const riskGroup = riskGroups[index];
    if (!riskGroup.id) {
      toast.error("Неверный ID группы");
      return;
    }

    try {
      const response = await fetch(`/api/patients/${patientId}/risk-groups`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: riskGroup.id, name: name.trim() }),
      });

      if (!response.ok) {
        throw new Error("Не удалось обновить группу риска");
      }

      const updatedRiskGroup: RiskGroup = await response.json();
      const newRiskGroups = [...riskGroups];
      newRiskGroups[index] = updatedRiskGroup;
      setRiskGroups(newRiskGroups);
      toast.success("Группа обновлена");
    } catch (error) {
      console.error("Ошибка при обновлении группы:", error);
      toast.error("Ошибка при обновлении группы");
    }
  };

  const handleRemoveRiskGroup = async (index: number) => {
    const riskGroup = riskGroups[index];
    if (!riskGroup.id) {
      setRiskGroups(riskGroups.filter((_, i) => i !== index));
      return;
    }

    try {
      const response = await fetch(`/api/patients/${patientId}/risk-groups`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: riskGroup.id }),
      });

      if (!response.ok) {
        throw new Error("Не удалось удалить группу риска");
      }

      setRiskGroups(riskGroups.filter((_, i) => i !== index));
      toast.success("Группа удалена");
    } catch (error) {
      console.error("Ошибка при удалении группы:", error);
      toast.error("Ошибка при удалении группы");
    }
  };

  const handleSave = () => {
    onSave(riskGroups);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Редактировать группы</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {riskGroups.length > 0 ? (
            riskGroups.map((riskGroup, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={riskGroup.name}
                  onChange={(e) => handleUpdateRiskGroup(index, e.target.value)}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemoveRiskGroup(index)}
                >
                  Удалить
                </Button>
              </div>
            ))
          ) : (
            <p className="text-gray-500">Группы отсутствуют</p>
          )}
          <div className="flex items-center gap-2">
            <Input
              value={newRiskGroup}
              onChange={(e) => setNewRiskGroup(e.target.value)}
              placeholder="Введите новую группу риска"
              className="flex-1"
            />
            <Button onClick={handleAddRiskGroup}>Добавить</Button>
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
