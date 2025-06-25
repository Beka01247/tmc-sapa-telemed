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
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { toast } from "sonner";
import { Edit, Trash2 } from "lucide-react";
import { NewReceptionDialog } from "@/components/NewReceptionDialog";

interface Reception {
  id: string;
  anamnesis: string;
  complaints: string;
  objectiveStatus: string;
  diagnosis: string;
  examinations: string;
  treatment: string;
  recommendations: string;
  createdAt: string;
}

interface ConsultationsTabProps {
  receptions?: Reception[];
  isProvider: boolean;
  patientId: string;
}

export const ConsultationsTab = ({
  receptions = [],
  isProvider,
  patientId,
}: ConsultationsTabProps) => {
  const [viewingReception, setViewingReception] = useState<Reception | null>(
    null
  );
  const [editingReception, setEditingReception] = useState<Reception | null>(
    null
  );
  const [isAddingReception, setIsAddingReception] = useState(false);

  const formatDate = (date: string) => {
    return format(new Date(date), "dd.MM.yyyy HH:mm");
  };

  const handleEdit = (reception: Reception, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingReception(reception);
  };

  const handleDelete = async (receptionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch(`/api/receptions?id=${receptionId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete reception");

      toast.success("Прием успешно удален");
      window.location.reload();
    } catch (error) {
      toast.error("Не удалось удалить прием");
      console.error("Error deleting reception:", error);
    }
  };

  const onReceptionChange = () => {
    window.location.reload();
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Приемы</CardTitle>
          {isProvider && (
            <Button onClick={() => setIsAddingReception(true)}>
              Добавить прием
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Дата</TableHead>
                <TableHead>Анамнез</TableHead>
                <TableHead>Жалобы</TableHead>
                <TableHead>Объективный статус</TableHead>
                <TableHead>Обследования</TableHead>
                {isProvider && (
                  <TableHead className="w-[100px]">Действия</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {receptions.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={isProvider ? 6 : 5}
                    className="text-center"
                  >
                    Нет данных
                  </TableCell>
                </TableRow>
              ) : (
                receptions.map((reception) => (
                  <TableRow
                    key={reception.id}
                    className="cursor-pointer hover:bg-gray-100"
                    onClick={() => setViewingReception(reception)}
                  >
                    <TableCell>{formatDate(reception.createdAt)}</TableCell>
                    <TableCell>
                      {reception.anamnesis.slice(0, 30)}
                      {reception.anamnesis.length > 30 ? "..." : ""}
                    </TableCell>
                    <TableCell>
                      {reception.complaints.slice(0, 30)}
                      {reception.complaints.length > 30 ? "..." : ""}
                    </TableCell>
                    <TableCell>
                      {reception.objectiveStatus.slice(0, 30)}
                      {reception.objectiveStatus.length > 30 ? "..." : ""}
                    </TableCell>
                    <TableCell>
                      {reception.examinations.slice(0, 30)}
                      {reception.examinations.length > 30 ? "..." : ""}
                    </TableCell>
                    {isProvider && (
                      <TableCell className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleEdit(reception, e)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleDelete(reception.id, e)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {viewingReception && (
        <Dialog open={true} onOpenChange={() => setViewingReception(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Детали приема</DialogTitle>
              <DialogDescription>
                {formatDate(viewingReception.createdAt)}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Анамнез:</h4>
                <p className="text-sm">{viewingReception.anamnesis}</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Жалобы:</h4>
                <p className="text-sm">{viewingReception.complaints}</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Объективный статус:</h4>
                <p className="text-sm">{viewingReception.objectiveStatus}</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Диагноз:</h4>
                <p className="text-sm">{viewingReception.diagnosis}</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Обследования:</h4>
                <p className="text-sm">{viewingReception.examinations}</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Лечение:</h4>
                <p className="text-sm">{viewingReception.treatment}</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Рекомендации:</h4>
                <p className="text-sm">{viewingReception.recommendations}</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {(editingReception || isAddingReception) && (
        <NewReceptionDialog
          isOpen={true}
          onOpenChange={(open: boolean) => {
            if (!open) {
              setEditingReception(null);
              setIsAddingReception(false);
            }
          }}
          patientId={patientId}
          initialData={editingReception || undefined}
          onSuccess={onReceptionChange}
        />
      )}
    </>
  );
};
