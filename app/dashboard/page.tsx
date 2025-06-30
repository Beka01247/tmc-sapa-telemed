import DashboardLayout from "@/components/layouts/DashboardLayout";
import { UserType } from "@/constants/userTypes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db/drizzle";
import {
  invitations,
  users,
  patientScreenings,
  screenings,
  patientVaccinations,
  riskGroups,
  diagnoses,
  treatments,
  treatmentTimes,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { format, parse } from "date-fns";
import { MedicalActivityCard } from "@/components/MedicalActivityCard";
import { TreatmentCard } from "@/components/TreatmentCard";

interface MedicalActivity {
  id: string;
  type: "INVITATION" | "SCREENING" | "VACCINATION";
  title: string;
  date: string;
  doctor: string;
  status: string;
  notes?: string | null;
}

interface RiskGroup {
  id: string;
  name: string;
  createdAt: string;
}

interface Diagnosis {
  id: string;
  description: string;
  createdAt: string;
}

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
  createdAt: string;
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
  riskGroups: RiskGroup[];
  diagnoses: Diagnosis[];
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

    // Fetch risk groups for the user
    const userRiskGroups = await db
      .select({
        id: riskGroups.id,
        name: riskGroups.name,
        createdAt: riskGroups.createdAt,
      })
      .from(riskGroups)
      .where(eq(riskGroups.userId, userId));

    // Fetch diagnoses for the user
    const userDiagnoses = await db
      .select({
        id: diagnoses.id,
        description: diagnoses.description,
        createdAt: diagnoses.createdAt,
      })
      .from(diagnoses)
      .where(eq(diagnoses.userId, userId));

    return {
      ...user,
      userType: user.userType || "PATIENT",
      dateOfBirth: user.dateOfBirth
        ? new Date(user.dateOfBirth).toLocaleDateString("ru-RU", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : null,
      createdAt: format(new Date(user.createdAt!), "dd.MM.yyyy"),
      updatedAt: format(new Date(user.updatedAt!), "dd.MM.yyyy"),
      riskGroups: userRiskGroups.map((rg) => ({
        ...rg,
        createdAt: format(new Date(rg.createdAt!), "dd.MM.yyyy"),
      })),
      diagnoses: userDiagnoses.map((d) => ({
        ...d,
        createdAt: format(new Date(d.createdAt!), "dd.MM.yyyy"),
      })),
    };
  } catch (error) {
    console.error("Error fetching user info:", error);
    return null;
  }
}

async function fetchMedicalActivities(
  patientId: string
): Promise<MedicalActivity[]> {
  try {
    // Fetch invitations
    const invitationsData = await db
      .select({
        id: invitations.id,
        riskGroup: invitations.riskGroup,
        createdAt: invitations.createdAt,
        doctorName: users.fullName,
        status: invitations.status,
      })
      .from(invitations)
      .leftJoin(users, eq(users.id, invitations.providerId))
      .where(eq(invitations.patientId, patientId));

    // Fetch screenings
    const screeningsData = await db
      .select({
        id: patientScreenings.id,
        screeningName: screenings.name,
        scheduledDate: patientScreenings.scheduledDate,
        doctorName: users.fullName,
        status: patientScreenings.status,
        notes: patientScreenings.notes,
      })
      .from(patientScreenings)
      .leftJoin(users, eq(patientScreenings.confirmedBy, users.id))
      .leftJoin(screenings, eq(patientScreenings.screeningId, screenings.id))
      .where(eq(patientScreenings.patientId, patientId));

    // Fetch vaccinations
    const vaccinationsData = await db
      .select({
        id: patientVaccinations.id,
        name: patientVaccinations.name,
        scheduledDate: patientVaccinations.scheduledDate,
        doctorName: users.fullName,
        status: patientVaccinations.status,
        notes: patientVaccinations.notes,
      })
      .from(patientVaccinations)
      .leftJoin(users, eq(patientVaccinations.id, users.id))
      .where(eq(patientVaccinations.patientId, patientId));

    // Convert invitations to MedicalActivity
    const invitationActivities: MedicalActivity[] = invitationsData.map(
      (record) => ({
        id: record.id,
        type: "INVITATION",
        title: record.riskGroup,
        date: record.createdAt
          ? format(new Date(record.createdAt), "dd.MM.yyyy HH:mm")
          : "Дата не указана",
        doctor: record.doctorName || "Неизвестный врач",
        status: record.status || "PENDING",
      })
    );

    // Convert screenings to MedicalActivity
    const screeningActivities: MedicalActivity[] = screeningsData.map(
      (record) => ({
        id: record.id,
        type: "SCREENING",
        title: record.screeningName || "Без названия",
        date: record.scheduledDate
          ? format(new Date(record.scheduledDate), "dd.MM.yyyy")
          : "Дата не указана",
        doctor: record.doctorName || "Не назначен",
        status: record.status || "INVITED",
        notes: record.notes,
      })
    );

    // Convert vaccinations to MedicalActivity
    const vaccinationActivities: MedicalActivity[] = vaccinationsData.map(
      (record) => ({
        id: record.id,
        type: "VACCINATION",
        title: record.name || "Без названия",
        date: record.scheduledDate
          ? format(new Date(record.scheduledDate), "dd.MM.yyyy")
          : "Дата не указана",
        doctor: record.doctorName || "Не назначен",
        status: record.status || "INVITED",
        notes: record.notes,
      })
    );

    // Combine all activities and sort by date
    return [
      ...invitationActivities,
      ...screeningActivities,
      ...vaccinationActivities,
    ].sort((a, b) => {
      const dateA =
        a.date === "Дата не указана"
          ? new Date(0)
          : parse(a.date, "dd.MM.yyyy", new Date());
      const dateB =
        b.date === "Дата не указана"
          ? new Date(0)
          : parse(b.date, "dd.MM.yyyy", new Date());
      return dateB.getTime() - dateA.getTime();
    });
  } catch (error) {
    console.error("Error fetching medical activities:", error);
    return [];
  }
}

async function fetchPatientTreatments(patientId: string): Promise<Treatment[]> {
  try {
    // Fetch treatments with provider name
    const treatmentsData = await db
      .select({
        id: treatments.id,
        medication: treatments.medication,
        dosage: treatments.dosage,
        frequency: treatments.frequency,
        duration: treatments.duration,
        notes: treatments.notes,
        providerName: users.fullName,
        createdAt: treatments.createdAt,
      })
      .from(treatments)
      .leftJoin(users, eq(treatments.providerId, users.id))
      .where(eq(treatments.patientId, patientId));

    // Fetch treatment times for each treatment
    const treatmentsWithTimes = await Promise.all(
      treatmentsData.map(async (treatment) => {
        const times = await db
          .select({
            id: treatmentTimes.id,
            timeOfDay: treatmentTimes.timeOfDay,
          })
          .from(treatmentTimes)
          .where(eq(treatmentTimes.treatmentId, treatment.id));

        return {
          ...treatment,
          times: times.map((t) => ({ id: t.id, time: t.timeOfDay })),
          createdAt: format(new Date(treatment.createdAt!), "dd.MM.yyyy"),
        };
      })
    );

    return treatmentsWithTimes;
  } catch (error) {
    console.error("Error fetching patient treatments:", error);
    return [];
  }
}

// Helper functions for formatting user data
const formatGender = (gender: string | null) => {
  switch (gender) {
    case "МУЖСКОЙ":
      return "Мужской";
    case "ЖЕНСКИЙ":
      return "Женский";
    case "ДРУГОЙ":
      return "Другой";
    default:
      return "Не указан";
  }
};

const formatUserType = (userType: string | null) => {
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

const formatDoctorType = (doctorType: string | null) => {
  switch (doctorType) {
    case "GENERAL":
      return "Терапевт";
    case "SPECIALIST":
      return "Специалист";
    default:
      return "Неизвестно";
  }
};

const DashboardPage = async () => {
  const session = await auth();

  if (!session || !session.user?.id) {
    redirect("/sign-in");
  }

  const userType = session.user.userType as UserType;
  const userInfo = await fetchUserInfo(session.user.id);
  const medicalActivities =
    userType === UserType.PATIENT
      ? await fetchMedicalActivities(session.user.id)
      : [];

  const patientTreatments =
    userType === UserType.PATIENT
      ? await fetchPatientTreatments(session.user.id)
      : [];

  if (!userInfo) {
    return (
      <DashboardLayout
        userType={userType}
        session={{ fullName: session.user.fullName, id: session.user.id }}
      >
        <div className="text-red-500">Ошибка загрузки данных пользователя</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      userType={userType}
      session={{ fullName: session.user.fullName, id: session.user.id }}
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

            {/* Risk Groups Section - Only for Patients */}
            {userInfo.userType === "PATIENT" && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="font-semibold mb-2">Группы:</p>
                {userInfo.riskGroups.length === 0 ? (
                  <p className="text-gray-500 text-sm">
                    Группы риска не назначены
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {userInfo.riskGroups.map((group) => (
                      <span
                        key={group.id}
                        className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                      >
                        {group.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Diagnoses Section - Only for Patients */}
            {userInfo.userType === "PATIENT" && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="font-semibold mb-2">Диагнозы:</p>
                {userInfo.diagnoses.length === 0 ? (
                  <p className="text-gray-500 text-sm">
                    Диагнозы не установлены
                  </p>
                ) : (
                  <div className="space-y-2">
                    {userInfo.diagnoses.map((diagnosis) => (
                      <div
                        key={diagnosis.id}
                        className="p-3 bg-gray-50 rounded-lg border"
                      >
                        <p className="text-sm font-medium">
                          {diagnosis.description}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Дата: {diagnosis.createdAt}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {userInfo.userType === "PATIENT" && (
          <div className="space-y-6">
            {/* Treatments Section */}
            <div className="space-y-4">
              <h3 className="text-2xl font-bold">Лечения</h3>
              {patientTreatments.length === 0 ? (
                <p className="text-gray-500">Нет активных лечений</p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {patientTreatments.map((treatment) => (
                    <TreatmentCard
                      key={treatment.id}
                      treatment={treatment}
                      patientId={session.user.id}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Invitations Section */}
            <div className="space-y-4">
              <h3 className="text-2xl font-bold">Приглашения</h3>
              {medicalActivities.length === 0 ? (
                <p className="text-gray-500">Нет активных приглашений</p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {medicalActivities.map((activity) => (
                    <MedicalActivityCard
                      key={activity.id}
                      activity={activity}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;
