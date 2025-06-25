"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { monitoringItems } from "@/components/MonitoringPage";

interface CriticalValuesModalProps {
  patientId: string;
  measurementType?: string;
  measurementTitle?: string;
  onSave?: () => void;
}

interface CriticalValue {
  measurementType: string;
  minValue?: string;
  maxValue?: string;
  minValue2?: string;
  maxValue2?: string;
  notes?: string;
}

const CriticalValuesModal = ({
  patientId,
  measurementType,
  measurementTitle,
  onSave,
}: CriticalValuesModalProps) => {
  const [open, setOpen] = useState(false);
  const [selectedMeasurement, setSelectedMeasurement] = useState(
    measurementType || ""
  );
  const [formData, setFormData] = useState<CriticalValue>({
    measurementType: "",
    minValue: "",
    maxValue: "",
    minValue2: "",
    maxValue2: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);

  // Load existing critical values when modal opens
  const loadExistingValues = async () => {
    const typeToLoad = selectedMeasurement || measurementType;
    if (!typeToLoad) return;

    try {
      const response = await fetch(
        `/api/critical-values?patientId=${patientId}&measurementType=${typeToLoad}`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          const existing = data[0];
          setFormData({
            measurementType: existing.measurementType,
            minValue: existing.minValue || "",
            maxValue: existing.maxValue || "",
            minValue2: existing.minValue2 || "",
            maxValue2: existing.maxValue2 || "",
            notes: existing.notes || "",
          });
        }
      }
    } catch (error) {
      console.error("Error loading existing values:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/critical-values", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId,
          measurementType: selectedMeasurement,
          minValue: formData.minValue || null,
          maxValue: formData.maxValue || null,
          minValue2: formData.minValue2 || null,
          maxValue2: formData.maxValue2 || null,
          notes: formData.notes,
        }),
      });

      if (!response.ok) {
        throw new Error("Не удалось сохранить пределы");
      }

      setOpen(false);
      setFormData({
        measurementType: "",
        minValue: "",
        maxValue: "",
        minValue2: "",
        maxValue2: "",
        notes: "",
      });
      setSelectedMeasurement("");
      onSave?.();
    } catch (error) {
      console.error("Error saving critical values:", error);
      alert("Ошибка при сохранении предела");
    } finally {
      setLoading(false);
    }
  };

  const selectedMonitoringItem = monitoringItems.find(
    (item) => item.id === (selectedMeasurement || measurementType)
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        setOpen(newOpen);
        if (newOpen) {
          // Load existing values when opening modal
          loadExistingValues();
        }
        if (!newOpen) {
          // Reset form when closing
          if (!measurementType) {
            setSelectedMeasurement("");
            setFormData({
              measurementType: "",
              minValue: "",
              maxValue: "",
              minValue2: "",
              maxValue2: "",
              notes: "",
            });
          }
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          {measurementTitle ? "Пределы" : "Установить пределы"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Пределы
            {measurementTitle && ` - ${measurementTitle}`}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!measurementType && (
            <div>
              <Label htmlFor="measurement-type">Тип измерения</Label>
              <select
                id="measurement-type"
                value={selectedMeasurement}
                onChange={(e) => {
                  setSelectedMeasurement(e.target.value);
                  // Reset form data when changing measurement type
                  setFormData({
                    measurementType: "",
                    minValue: "",
                    maxValue: "",
                    minValue2: "",
                    maxValue2: "",
                    notes: "",
                  });
                }}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              >
                <option value="">Выберите тип измерения</option>
                {monitoringItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {(selectedMeasurement || measurementType) && (
            <>
              {selectedMonitoringItem?.inputType === "double" ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="min-value">Мин. систолическое</Label>
                    <Input
                      id="min-value"
                      type="number"
                      step="0.1"
                      value={formData.minValue}
                      onChange={(e) =>
                        setFormData({ ...formData, minValue: e.target.value })
                      }
                      placeholder="Мин"
                    />
                  </div>
                  <div>
                    <Label htmlFor="max-value">Макс. систолическое</Label>
                    <Input
                      id="max-value"
                      type="number"
                      step="0.1"
                      value={formData.maxValue}
                      onChange={(e) =>
                        setFormData({ ...formData, maxValue: e.target.value })
                      }
                      placeholder="Макс"
                    />
                  </div>
                  <div>
                    <Label htmlFor="min-value2">Мин. диастолическое</Label>
                    <Input
                      id="min-value2"
                      type="number"
                      step="0.1"
                      value={formData.minValue2}
                      onChange={(e) =>
                        setFormData({ ...formData, minValue2: e.target.value })
                      }
                      placeholder="Мин"
                    />
                  </div>
                  <div>
                    <Label htmlFor="max-value2">Макс. диастолическое</Label>
                    <Input
                      id="max-value2"
                      type="number"
                      step="0.1"
                      value={formData.maxValue2}
                      onChange={(e) =>
                        setFormData({ ...formData, maxValue2: e.target.value })
                      }
                      placeholder="Макс"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="min-value">Минимальное значение</Label>
                    <Input
                      id="min-value"
                      type="number"
                      step="0.1"
                      value={formData.minValue}
                      onChange={(e) =>
                        setFormData({ ...formData, minValue: e.target.value })
                      }
                      placeholder="Мин"
                    />
                  </div>
                  <div>
                    <Label htmlFor="max-value">Максимальное значение</Label>
                    <Input
                      id="max-value"
                      type="number"
                      step="0.1"
                      value={formData.maxValue}
                      onChange={(e) =>
                        setFormData({ ...formData, maxValue: e.target.value })
                      }
                      placeholder="Макс"
                    />
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="notes">Примечания</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Дополнительные заметки..."
                />
              </div>
            </>
          )}

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={loading || !selectedMeasurement}>
              {loading ? "Сохранение..." : "Сохранить"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CriticalValuesModal;
