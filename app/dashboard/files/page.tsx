import { auth } from "@/auth";
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/layouts/DashboardLayout";
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

const dummyFiles = [
  {
    id: 1,
    name: "Анализы крови",
    date: "2025-05-15",
    type: "PDF",
    doctor: "Иванов И.И.",
  },
  {
    id: 2,
    name: "Рентген",
    date: "2025-05-10",
    type: "DICOM",
    doctor: "Петров П.П.",
  },
  {
    id: 3,
    name: "ЭКГ",
    date: "2025-05-01",
    type: "PDF",
    doctor: "Сидоров С.С.",
  },
];

const FilesPage = async () => {
  const session = await auth();

  if (!session) {
    redirect("/sign-in");
  }

  const userType = session.user.userType as UserType;

  if (userType !== UserType.PATIENT) {
    redirect("/dashboard");
  }

  return (
    <DashboardLayout
      userType={userType}
      session={{
        fullName: session.user.fullName,
        id: session.user.id,
      }}
    >
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Медицинские файлы</h2>
          <Button>Загрузить новый файл</Button>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Название</TableHead>
                <TableHead>Дата</TableHead>
                <TableHead>Тип файла</TableHead>
                <TableHead>Врач</TableHead>
                <TableHead>Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dummyFiles.map((file) => (
                <TableRow key={file.id}>
                  <TableCell>{file.name}</TableCell>
                  <TableCell>{file.date}</TableCell>
                  <TableCell>{file.type}</TableCell>
                  <TableCell>{file.doctor}</TableCell>
                  <TableCell>
                    <div className="space-x-2">
                      <Button variant="outline" size="sm">
                        Просмотреть
                      </Button>
                      <Button variant="outline" size="sm">
                        Скачать
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default FilesPage;
