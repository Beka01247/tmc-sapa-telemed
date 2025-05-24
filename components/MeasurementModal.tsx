"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

interface MonitoringItem {
  id: string;
  title: string;
  unit: string;
  inputType: "single" | "double" | "text";
  defaultValue: string;
}

interface MeasurementModalProps {
  item: MonitoringItem;
  onClose: () => void;
  onSubmit: (data: { value1: string; value2?: string }) => void;
}

const MeasurementModal = ({
  item,
  onClose,
  onSubmit,
}: MeasurementModalProps) => {
  const [value1, setValue1] = useState("");
  const [value2, setValue2] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    if (item.inputType === "double" && (!value1 || !value2)) {
      setError("Пожалуйста, заполните оба поля.");
      return;
    }
    if (item.inputType !== "text" && !value1) {
      setError("Пожалуйста, введите значение.");
      return;
    }
    setError(null);
    onSubmit({
      value1,
      value2: item.inputType === "double" ? value2 : undefined,
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] text-black">
        <DialogHeader>
          <DialogTitle>Добавить измерение: {item.title}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {error && <div className="text-red-500 text-sm">{error}</div>}
          {item.inputType === "double" ? (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="value1" className="text-right">
                  Сист.
                </Label>
                <Input
                  id="value1"
                  type="number"
                  value={value1}
                  onChange={(e) => setValue1(e.target.value)}
                  className="col-span-3 text-black"
                  placeholder="120"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="value2" className="text-right">
                  Диас.
                </Label>
                <Input
                  id="value2"
                  type="number"
                  value={value2}
                  onChange={(e) => setValue2(e.target.value)}
                  className="col-span-3 text-black"
                  placeholder="80"
                />
              </div>
            </>
          ) : (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="value1" className="text-right">
                Значение
              </Label>
              <Input
                id="value1"
                type={item.inputType === "text" ? "text" : "number"}
                value={value1}
                onChange={(e) => setValue1(e.target.value)}
                className="col-span-3 text-black"
                placeholder={item.inputType === "text" ? "Введите данные" : "0"}
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            className=" hover:bg-red-400"
          >
            Отмена
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-blue-400 hover:bg-blue-500"
          >
            Сохранить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MeasurementModal;
