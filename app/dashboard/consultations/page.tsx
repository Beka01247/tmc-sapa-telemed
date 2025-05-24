import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { UserType } from "@/constants/userTypes";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const dummyConsultations = [
  {
    id: 1,
    date: "2025-05-25 14:00",
    status: "Запланирована",
    patient: "Анна Смирнова",
    doctor: "Иванов И.И.",
    specialization: "ВОП",
  },
  {
    id: 2,
    date: "2025-05-20 15:30",
    status: "Завершена",
    patient: "Петр Козлов",
    doctor: "Петров П.П.",
    specialization: "Кардиолог",
  },
];

const ConsultationsPage = async () => {
  const session = await auth();

  if (!session) {
    redirect("/sign-in");
  }

  const userType = session.user.userType as UserType;

  return (
    <DashboardLayout
      userType={userType}
      session={{
        fullName: session.user.fullName,
      }}
    >
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Прием</h2>
          {userType !== UserType.PATIENT && (
            <Button>Запланировать прием</Button>
          )}
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Дата и время</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>
                  {userType === UserType.PATIENT ? "Врач" : "Пациент"}
                </TableHead>
                <TableHead>Специальность</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dummyConsultations.map((consultation) => (
                <TableRow key={consultation.id}>
                  <TableCell>{consultation.date}</TableCell>
                  <TableCell>{consultation.status}</TableCell>
                  <TableCell>
                    {userType === UserType.PATIENT
                      ? consultation.doctor
                      : consultation.patient}
                  </TableCell>
                  <TableCell>{consultation.specialization}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ConsultationsPage;
