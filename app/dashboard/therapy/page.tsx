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

const dummyRecommendations = [
  {
    id: 1,
    text: "Принимать ибупрофен 200 мг дважды в день",
    date: "2025-05-15",
    doctor: "Иванов И.И.",
  },
];

const RecommendationsPage = async () => {
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
      }}
    >
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Лечение</h2>
          <Button>Добавить лечение</Button>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Рекомендация</TableHead>
                <TableHead>Дата</TableHead>
                <TableHead>Врач</TableHead>
                <TableHead>Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dummyRecommendations.map((recommendation) => (
                <TableRow key={recommendation.id}>
                  <TableCell>{recommendation.text}</TableCell>
                  <TableCell>{recommendation.date}</TableCell>
                  <TableCell>{recommendation.doctor}</TableCell>
                  <TableCell>
                    <div className="space-x-2">
                      <Button variant="outline" size="sm">
                        Отметить как выполненное
                      </Button>
                      <Button variant="outline" size="sm">
                        Подробнее
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

export default RecommendationsPage;
