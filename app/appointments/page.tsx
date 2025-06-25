"use client";

import { useState, useEffect } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { toast } from "sonner";
import { Edit, Eye, Trash2 } from "lucide-react";
import { NewReceptionDialog } from "@/components/NewReceptionDialog";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { UserType } from "@/constants/userTypes";
import { useSession } from "next-auth/react";

interface Reception {
  id: string;
  patientId: string;
  patientName: string;
  anamnesis: string;
  complaints: string;
  objectiveStatus: string;
  diagnosis: string;
  examinations: string;
  treatment: string;
  createdAt: string;
  updatedAt: string;
}

const AppointmentsPage = () => {
  const { data: session } = useSession();
  const [appointments, setAppointments] = useState<Reception[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingReception, setViewingReception] = useState<Reception | null>(
    null
  );
  const [editingReception, setEditingReception] = useState<Reception | null>(
    null
  );

  const fetchAppointments = async () => {
    try {
      const response = await fetch("/api/appointments");
      if (!response.ok) throw new Error("Failed to fetch appointments");
      const data = await response.json();
      setAppointments(data);
    } catch (error) {
      toast.error("Не удалось загрузить приемы");
      console.error("Error fetching appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const formatDate = (date: string) => {
    return format(new Date(date), "dd.MM.yyyy HH:mm");
  };

  const handleView = (reception: Reception) => {
    setViewingReception(reception);
  };

  const handleEdit = (reception: Reception, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingReception(reception);
  };

  const handleDelete = async (receptionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Вы уверены, что хотите удалить этот прием?")) {
      return;
    }

    try {
      const response = await fetch(`/api/receptions?id=${receptionId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete reception");

      toast.success("Прием успешно удален");
      fetchAppointments();
    } catch (error) {
      toast.error("Не удалось удалить прием");
      console.error("Error deleting reception:", error);
    }
  };

  const onReceptionChange = () => {
    fetchAppointments();
  };

  if (loading) {
    return (
      <DashboardLayout
        userType={UserType.DOCTOR}
        session={session?.user || null}
      >
        <div className="flex items-center justify-center h-32">
          <div className="text-lg">Загрузка приемов...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType={UserType.DOCTOR} session={session?.user || null}>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Приемы</h2>

        <Card>
          <CardHeader>
            <CardTitle>Все приемы пациентов</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Дата</TableHead>
                  <TableHead>Пациент</TableHead>
                  <TableHead>Анамнез</TableHead>
                  <TableHead>Диагноз</TableHead>
                  <TableHead className="w-[150px]">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      Нет данных о приемах
                    </TableCell>
                  </TableRow>
                ) : (
                  appointments.map((appointment) => (
                    <TableRow
                      key={appointment.id}
                      className="cursor-pointer hover:bg-gray-100"
                      onClick={() => handleView(appointment)}
                    >
                      <TableCell>{formatDate(appointment.createdAt)}</TableCell>
                      <TableCell className="font-medium">
                        {appointment.patientName}
                      </TableCell>
                      <TableCell>
                        {appointment.anamnesis.slice(0, 50)}
                        {appointment.anamnesis.length > 50 ? "..." : ""}
                      </TableCell>
                      <TableCell>
                        {appointment.diagnosis.slice(0, 50)}
                        {appointment.diagnosis.length > 50 ? "..." : ""}
                      </TableCell>
                      <TableCell className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleView(appointment);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleEdit(appointment, e)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleDelete(appointment.id, e)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* View Reception Dialog */}
        {viewingReception && (
          <Dialog open={true} onOpenChange={() => setViewingReception(null)}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Детали приема</DialogTitle>
                <DialogDescription>
                  Пациент: {viewingReception.patientName} •{" "}
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
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Edit Reception Dialog */}
        {editingReception && (
          <NewReceptionDialog
            isOpen={true}
            onOpenChange={(open: boolean) => {
              if (!open) {
                setEditingReception(null);
              }
            }}
            patientId={editingReception.patientId}
            initialData={{
              id: editingReception.id,
              anamnesis: editingReception.anamnesis,
              complaints: editingReception.complaints,
              objectiveStatus: editingReception.objectiveStatus,
              diagnosis: editingReception.diagnosis,
              examinations: editingReception.examinations,
              treatment: editingReception.treatment,
            }}
            onSuccess={onReceptionChange}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default AppointmentsPage;
