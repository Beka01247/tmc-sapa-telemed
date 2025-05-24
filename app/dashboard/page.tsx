import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { UserType } from "@/constants/userTypes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";

const DashboardPage = async () => {
  const session = await auth();

  if (!session) redirect("/sign-in");

  if (!session?.user?.userType) {
    console.error("User session is missing required data:", session);
    return <div>Error loading user data</div>;
  }

  const userType = session.user.userType as UserType;

  return (
    <DashboardLayout
      userType={userType}
      session={{
        fullName: session.user.fullName,
      }}
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Добро пожаловать!</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Выберите нужный раздел в меню слева для начала работы.</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 text-white border-gray-600">
          <CardHeader>
            <CardTitle>Следующий прием</CardTitle>
          </CardHeader>
          <CardContent>
            <p>25 мая 2025, 14:00</p>
            <p className="text-gray-400">Доктор: Иванов И.И.</p>
            <Button className="mt-4 bg-gray-600 hover:bg-gray-500">
              Подключиться
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;
