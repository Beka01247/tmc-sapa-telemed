import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { UserType } from "@/constants/userTypes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { db } from "@/db/drizzle";
import { invitations, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";

interface Invitation {
  id: string;
  riskGroup: string;
  date: string; // Formatted createdAt
  doctor: string; // Provider's fullName
}

interface UserInfo {
  id: string;
  fullName: string;
  email: string;
  city: string;
  organization: string;
  subdivision: string | null;
  district: string | null;
  userType: "DOCTOR" | "NURSE" | "PATIENT";
  doctorType: "GENERAL" | "SPECIALIST" | null;
  department: string | null;
  specialization: string | null;
  avatar: string | null;
  iin: string;
  telephone: string;
  dateOfBirth: string | null;
  gender: "МУЖСКОЙ" | "ЖЕНСКИЙ" | "ДРУГОЙ" | null;
  createdAt: string;
  updatedAt: string;
}

async function fetchUserInfo(userId: string): Promise<UserInfo | null> {
  try {
    const [user] = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        city: users.city,
        organization: users.organization,
        subdivision: users.subdivision,
        district: users.district,
        userType: users.userType,
        doctorType: users.doctorType,
        department: users.department,
        specialization: users.specialization,
        avatar: users.avatar,
        iin: users.iin,
        telephone: users.telephone,
        dateOfBirth: users.dateOfBirth,
        gender: users.gender,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) return null;

    return {
      ...user,
      dateOfBirth: user.dateOfBirth
        ? new Date(user.dateOfBirth).toLocaleDateString("ru-RU", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : null,
    };
  } catch (error) {
    console.error("Error fetching user info:", error);
    return null;
  }
}

async function fetchInvitations(patientId: string): Promise<Invitation[]> {
  try {
    const data = await db
      .select({
        id: invitations.id,
        riskGroup: invitations.riskGroup,
        createdAt: invitations.createdAt,
        doctorName: users.fullName,
      })
      .from(invitations)
      .leftJoin(users, eq(users.id, invitations.providerId))
      .where(
        and(
          eq(invitations.patientId, patientId),
          eq(invitations.status, "PENDING")
        )
      );

    return data.map((record) => ({
      id: record.id,
      riskGroup: record.riskGroup,
      date: new Date(record.createdAt).toLocaleDateString("ru-RU", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      doctor: record.doctorName || "Неизвестный врач",
    }));
  } catch (error) {
    console.error("Error fetching invitations:", error);
    return [];
  }
}

const formatGender = (
  gender: "МУЖСКОЙ" | "ЖЕНСКИЙ" | "ДРУГОЙ" | null
): string => {
  switch (gender) {
    case "МУЖСКОЙ":
      return "М";
    case "ЖЕНСКИЙ":
      return "Ж";
    case "ДРУГОЙ":
      return "Другое";
    default:
      return "Неизвестно";
  }
};

const formatUserType = (userType: "DOCTOR" | "NURSE" | "PATIENT"): string => {
  switch (userType) {
    case "DOCTOR":
      return "Врач";
    case "NURSE":
      return "Медсестра";
    case "PATIENT":
      return "Пациент";
    default:
      return "Неизвестно";
  }
};

const formatDoctorType = (
  doctorType: "GENERAL" | "SPECIALIST" | null
): string => {
  if (!doctorType) return "Не указано";
  return doctorType === "GENERAL" ? "Общий" : "Специалист";
};

const DashboardPage = async () => {
  const session = await auth();

  if (!session || !session.user?.id) {
    redirect("/sign-in");
  }

  const userType = session.user.userType as UserType;
  const userInfo = await fetchUserInfo(session.user.id);
  const invitations =
    userType === UserType.PATIENT
      ? await fetchInvitations(session.user.id)
      : [];

  if (!userInfo) {
    return (
      <DashboardLayout
        userType={userType}
        session={{ fullName: session.user.fullName }}
      >
        <div className="text-red-500">Ошибка загрузки данных пользователя</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      userType={userType}
      session={{ fullName: session.user.fullName }}
    >
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Мой профиль</h2>

        <Card className="bg-white text-black border-gray-600">
          <CardHeader>
            <CardTitle>Информация о пользователе</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p>
              <span className="font-semibold">ФИО:</span> {userInfo.fullName}
            </p>
            <p>
              <span className="font-semibold">ИИН:</span> {userInfo.iin}
            </p>
            <p>
              <span className="font-semibold">Дата рождения:</span>{" "}
              {userInfo.dateOfBirth || "Не указана"}
            </p>
            <p>
              <span className="font-semibold">Пол:</span>{" "}
              {formatGender(userInfo.gender)}
            </p>
            <p>
              <span className="font-semibold">Email:</span> {userInfo.email}
            </p>
            <p>
              <span className="font-semibold">Телефон:</span>{" "}
              {userInfo.telephone}
            </p>
            <p>
              <span className="font-semibold">Город:</span> {userInfo.city}
            </p>
            <p>
              <span className="font-semibold">Организация:</span>{" "}
              {userInfo.organization}
            </p>
            <p>
              <span className="font-semibold">Подразделение:</span>{" "}
              {userInfo.subdivision || "Не указано"}
            </p>
            <p>
              <span className="font-semibold">Район:</span>{" "}
              {userInfo.district || "Не указано"}
            </p>
            <p>
              <span className="font-semibold">Тип пользователя:</span>{" "}
              {formatUserType(userInfo.userType)}
            </p>
            {userInfo.userType === "DOCTOR" && (
              <>
                <p>
                  <span className="font-semibold">Тип врача:</span>{" "}
                  {formatDoctorType(userInfo.doctorType)}
                </p>
                <p>
                  <span className="font-semibold">Отделение:</span>{" "}
                  {userInfo.department || "Не указано"}
                </p>
                <p>
                  <span className="font-semibold">Специализация:</span>{" "}
                  {userInfo.specialization || "Не указано"}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {userInfo.userType === "PATIENT" && (
          <div className="space-y-4">
            <h3 className="text-2xl font-bold">Приглашения на анализы</h3>
            {invitations.length === 0 ? (
              <p className="text-gray-500">Нет активных приглашений</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {invitations.map((invitation) => (
                  <Card
                    key={invitation.id}
                    className="bg-gray-800 text-white border-gray-600"
                  >
                    <CardHeader>
                      <CardTitle>{invitation.riskGroup}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>{invitation.date}</p>
                      <p className="text-gray-400">
                        Доктор: {invitation.doctor}
                      </p>
                      <Button className="mt-4 bg-gray-600 hover:bg-gray-500">
                        Отметить как пройдено
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;
