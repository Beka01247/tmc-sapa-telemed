"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { AddConsultationForm } from "@/components/AddConsultationForm";
import { toast } from "sonner";

interface Consultation {
  id: string;
  consultationDate: string;
  notes: string | null;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
  providerName: string | null;
}

interface ConsultationsTabProps {
  consultations: Consultation[];
  isProvider: boolean;
  patientId: string;
}

export const ConsultationsTab = ({
  consultations,
  isProvider,
  patientId,
}: ConsultationsTabProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAddSuccess = async () => {
    setIsModalOpen(false);
    toast.success("Прием добавлен");
    // Trigger page refresh
    window.location.reload();
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Приемы</CardTitle>
          {isProvider && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsModalOpen(true)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Добавить прием</TooltipContent>
            </Tooltip>
          )}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Дата</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Врач</TableHead>
                <TableHead>Заметки</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {consultations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    Нет данных
                  </TableCell>
                </TableRow>
              ) : (
                consultations.map((consultation) => (
                  <TableRow key={consultation.id}>
                    <TableCell>
                      {new Date(
                        consultation.consultationDate
                      ).toLocaleDateString("ru-RU")}
                    </TableCell>
                    <TableCell>
                      {consultation.status === "SCHEDULED"
                        ? "Запланировано"
                        : consultation.status === "COMPLETED"
                          ? "Завершено"
                          : "Отменено"}
                    </TableCell>
                    <TableCell>
                      {consultation.providerName || "Не указан"}
                    </TableCell>
                    <TableCell>{consultation.notes || "Нет"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Добавить прием</DialogTitle>
          </DialogHeader>
          <AddConsultationForm
            patientId={patientId}
            onSuccess={handleAddSuccess}
            onCancel={() => setIsModalOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};
