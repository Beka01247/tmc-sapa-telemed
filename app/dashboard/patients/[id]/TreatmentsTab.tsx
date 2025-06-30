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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { AddTreatmentForm } from "@/components/AddTreatmentForm";
import { toast } from "sonner";

interface TreatmentTime {
  id: string;
  time: string;
}

interface Treatment {
  id: string;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes: string | null;
  providerName: string | null;
  times: TreatmentTime[];
}

interface TreatmentsTabProps {
  treatments: Treatment[];
  isProvider: boolean;
  patientId: string;
}

export const TreatmentsTab = ({
  treatments,
  isProvider,
  patientId,
}: TreatmentsTabProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [treatmentToDelete, setTreatmentToDelete] = useState<string | null>(
    null
  );

  const handleAddSuccess = async () => {
    setIsModalOpen(false);
    toast.success("Лечение добавлено");
    window.location.reload();
  };

  const handleDeleteTreatment = (treatmentId: string) => {
    setTreatmentToDelete(treatmentId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!treatmentToDelete) return;

    try {
      const response = await fetch(
        `/api/patients/${patientId}/treatments/${treatmentToDelete}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (response.ok) {
        toast.success("Лечение успешно удалено");
        setDeleteDialogOpen(false);
        setTreatmentToDelete(null);
        window.location.reload();
      } else {
        const error = await response.json();
        throw new Error(error.error || "Не удалось удалить лечение");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Ошибка при удалении лечения";
      toast.error(errorMessage);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Лечения</CardTitle>
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
              <TooltipContent>Добавить лечение</TooltipContent>
            </Tooltip>
          )}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Медикамент</TableHead>
                <TableHead>Дозировка</TableHead>
                <TableHead>Частота</TableHead>
                <TableHead>Длительность</TableHead>
                <TableHead>Врач</TableHead>
                <TableHead>Заметки</TableHead>
                {isProvider && <TableHead>Действия</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {treatments.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={isProvider ? 7 : 6}
                    className="text-center"
                  >
                    Нет данных
                  </TableCell>
                </TableRow>
              ) : (
                treatments.map((treatment) => (
                  <TableRow key={treatment.id}>
                    <TableCell>{treatment.medication}</TableCell>
                    <TableCell>{treatment.dosage}</TableCell>
                    <TableCell>{treatment.frequency}</TableCell>
                    <TableCell>{treatment.duration}</TableCell>
                    <TableCell>
                      {treatment.providerName || "Не указан"}
                    </TableCell>
                    <TableCell>{treatment.notes || "Нет"}</TableCell>
                    {isProvider && (
                      <TableCell>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleDeleteTreatment(treatment.id)
                              }
                              className="text-red-600 hover:text-red-800 hover:bg-red-50"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Удалить лечение</TooltipContent>
                        </Tooltip>
                      </TableCell>
                    )}
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
            <DialogTitle>Добавить лечение</DialogTitle>
          </DialogHeader>
          <AddTreatmentForm
            patientId={patientId}
            onSuccess={handleAddSuccess}
            onCancel={() => setIsModalOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить лечение?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Лечение и все связанные с ним записи
              будут удалены навсегда.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTreatmentToDelete(null)}>
              Отмена
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
