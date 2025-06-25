"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
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
  DialogDescription,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { Eye } from "lucide-react";

interface Reception {
  id: string;
  patientId: string;
  providerId: string | null;
  providerName: string | null;
  anamnesis: string;
  complaints: string;
  objectiveStatus: string;
  diagnosis: string;
  examinations: string;
  treatment: string;
  recommendations: string;
  createdAt: string;
  updatedAt: string;
}

interface ConsultationsClientProps {
  receptions: Reception[];
}

const ConsultationsClient = ({ receptions }: ConsultationsClientProps) => {
  const [viewingReception, setViewingReception] = useState<Reception | null>(
    null
  );

  const formatDate = (date: string) => {
    return format(new Date(date), "dd.MM.yyyy HH:mm");
  };

  const handleView = (reception: Reception) => {
    setViewingReception(reception);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Мои приемы</h2>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Дата приема</TableHead>
              <TableHead>Врач</TableHead>
              <TableHead>Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {receptions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center">
                  У вас пока нет записей о приемах
                </TableCell>
              </TableRow>
            ) : (
              receptions.map((reception) => (
                <TableRow key={reception.id}>
                  <TableCell>{formatDate(reception.createdAt)}</TableCell>
                  <TableCell>
                    {reception.providerName || "Врач не указан"}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleView(reception)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* View Reception Dialog */}
      {viewingReception && (
        <Dialog open={true} onOpenChange={() => setViewingReception(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Детали приема</DialogTitle>
              <DialogDescription>
                Врач: {viewingReception.providerName} •{" "}
                {formatDate(viewingReception.createdAt)}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Анамнез:</h4>
                <p className="text-sm bg-gray-50 p-3 rounded">
                  {viewingReception.anamnesis}
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Жалобы:</h4>
                <p className="text-sm bg-gray-50 p-3 rounded">
                  {viewingReception.complaints}
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Объективный статус:</h4>
                <p className="text-sm bg-gray-50 p-3 rounded">
                  {viewingReception.objectiveStatus}
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Диагноз:</h4>
                <p className="text-sm bg-gray-50 p-3 rounded">
                  {viewingReception.diagnosis}
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Обследования:</h4>
                <p className="text-sm bg-gray-50 p-3 rounded">
                  {viewingReception.examinations}
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Лечение:</h4>
                <p className="text-sm bg-gray-50 p-3 rounded">
                  {viewingReception.treatment}
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Рекомендации:</h4>
                <p className="text-sm bg-gray-50 p-3 rounded">
                  {viewingReception.recommendations}
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ConsultationsClient;
