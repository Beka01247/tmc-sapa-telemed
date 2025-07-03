import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface UserDetail {
  id: string;
  fullName: string;
  email: string;
  telephone: string;
  dateOfBirth: string | null;
  gender: string | null;
  city: string;
  organization: string;
}

interface StatisticsUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserDetail[];
  measurementType: string;
  group: string;
}

export const StatisticsUsersModal: React.FC<StatisticsUsersModalProps> = ({
  isOpen,
  onClose,
  users,
  measurementType,
  group,
}) => {
  const getMeasurementLabel = (type: string) => {
    switch (type) {
      case "blood-pressure":
        return "АД";
      case "pulse":
        return "Пульс";
      default:
        return type;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Пользователи - {getMeasurementLabel(measurementType)} ({group})
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline">Всего пользователей: {users.length}</Badge>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ФИО</TableHead>
                  <TableHead>Город</TableHead>
                  <TableHead>Организация</TableHead>
                  <TableHead>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/dashboard/patients/${user.id}`}
                        className="hover:underline"
                      >
                        {user.fullName}
                      </Link>
                    </TableCell>
                    <TableCell>{user.city}</TableCell>
                    <TableCell>{user.organization}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboard/patients/${user.id}`}>
                          Подробнее
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {users.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              Нет данных для отображения
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
