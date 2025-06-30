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
import { AddTreatmentForm } from "@/components/AddTreatmentForm";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";

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

  const handleAddSuccess = async () => {
    setIsModalOpen(false);
    toast.success("Лечение добавлено");
    window.location.reload();
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
                <TableHead>Время приема</TableHead>
                <TableHead>Длительность</TableHead>
                <TableHead>Врач</TableHead>
                <TableHead>Заметки</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {treatments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    Нет данных
                  </TableCell>
                </TableRow>
              ) : (
                treatments.map((treatment) => (
                  <TableRow key={treatment.id}>
                    <TableCell>{treatment.medication}</TableCell>
                    <TableCell>{treatment.dosage}</TableCell>
                    <TableCell>{treatment.frequency}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {treatment.times?.map((time) => (
                          <Badge key={time.id} variant="outline">
                            {time.time}
                          </Badge>
                        )) || "Не указано"}
                      </div>
                    </TableCell>
                    <TableCell>{treatment.duration}</TableCell>
                    <TableCell>
                      {treatment.providerName || "Не указан"}
                    </TableCell>
                    <TableCell>{treatment.notes || "Нет"}</TableCell>
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
    </>
  );
};
