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
import { db } from "@/db/drizzle";
import { users, diagnoses, patientAlerts, measurements } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { sql } from "drizzle-orm";
import Link from "next/link";

// Helper function to translate measurement types to Russian
function getMeasurementTypeInRussian(measurementType: string): string {
  const translations: Record<string, string> = {
    "blood-pressure": "Артериальное давление",
    pulse: "Пульс",
    temperature: "Температура",
    glucose: "Глюкоза",
    oximeter: "Оксигинация крови",
    spirometer: "Спирография",
    cholesterol: "Холестерин",
    hemoglobin: "Гемоглобин",
    triglycerides: "Триглицериды",
    weight: "Вес",
    height: "Рост",
    ultrasound: "УЗИ мобил",
    xray: "Рентген мобил",
    inr: "МНО",
  };

  return translations[measurementType] || measurementType;
}

interface Patient {
  id: string;
  name: string;
  age: number;
  diagnosis: string | null;
  alertStatus: "NORMAL" | "CRITICAL";
  unacknowledgedAlerts: number;
  alertMeasurements: string[];
}

const calculateAge = (iin: string, currentDate: Date = new Date()): number => {
  const year = parseInt(iin.slice(0, 2), 10);
  const month = parseInt(iin.slice(2, 4), 10) - 1;
  const day = parseInt(iin.slice(4, 6), 10);
  const fullYear = year < 50 ? 2000 + year : 1900 + year;
  const birthDate = new Date(fullYear, month, day);
  let age = currentDate.getFullYear() - birthDate.getFullYear();
  const monthDiff = currentDate.getMonth() - birthDate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && currentDate.getDate() < birthDate.getDate())
  ) {
    age--;
  }
  return age;
};

const PatientsPage = async () => {
  const session = await auth();

  if (!session) {
    redirect("/sign-in");
  }

  const userType = session.user.userType as UserType;

  if (userType === UserType.PATIENT) {
    redirect("/dashboard");
  }

  let patients: Patient[] = [];
  try {
    // First, get all patients
    const patientRecords = await db
      .select({
        id: users.id,
        name: users.fullName,
        iin: users.iin,
        diagnoses: sql`string_agg(DISTINCT ${diagnoses.description}, ', ')`.as(
          "diagnoses"
        ),
      })
      .from(users)
      .leftJoin(diagnoses, eq(diagnoses.userId, users.id))
      .where(
        and(
          eq(users.userType, "PATIENT"),
          eq(users.organization, session.user.organization),
          eq(users.city, session.user.city)
        )
      )
      .groupBy(users.id, users.fullName, users.iin);

    // Then, get alert information for each patient
    const patientsWithAlerts = await Promise.all(
      patientRecords.map(async (record) => {
        const alertsData = await db
          .select({
            measurementType: measurements.type,
            alertStatus: patientAlerts.alertStatus,
            acknowledged: patientAlerts.acknowledged,
          })
          .from(patientAlerts)
          .leftJoin(
            measurements,
            eq(measurements.id, patientAlerts.measurementId)
          )
          .where(
            and(
              eq(patientAlerts.patientId, record.id),
              eq(patientAlerts.alertStatus, "CRITICAL"),
              eq(patientAlerts.acknowledged, false)
            )
          );

        const criticalAlerts = alertsData.length;
        const uniqueMeasurementTypes = [
          ...new Set(
            alertsData.map((alert) => alert.measurementType).filter(Boolean)
          ),
        ];

        const alertMeasurements = uniqueMeasurementTypes.map((type) =>
          getMeasurementTypeInRussian(type as string)
        );

        return {
          id: record.id,
          name: record.name,
          age: calculateAge(record.iin),
          diagnosis: (record.diagnoses as string) || "Нет диагнозов",
          alertStatus:
            criticalAlerts > 0 ? ("CRITICAL" as const) : ("NORMAL" as const),
          unacknowledgedAlerts: criticalAlerts,
          alertMeasurements,
        };
      })
    );

    patients = patientsWithAlerts.sort((a, b) => {
      // Sort critical patients first
      if (a.alertStatus === "CRITICAL" && b.alertStatus === "NORMAL") return -1;
      if (a.alertStatus === "NORMAL" && b.alertStatus === "CRITICAL") return 1;
      return a.name.localeCompare(b.name);
    });
  } catch (error) {
    console.error("Error fetching patients:", error);
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
          <h2 className="text-2xl font-bold">Список пациентов</h2>
          <Button>Добавить пациента</Button>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Статус</TableHead>
                <TableHead>ФИО</TableHead>
                <TableHead>Возраст</TableHead>
                <TableHead>Диагноз</TableHead>
                <TableHead>Критические показатели</TableHead>
                <TableHead>Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    Нет пациентов в вашей организации и городе
                  </TableCell>
                </TableRow>
              ) : (
                patients.map((patient) => (
                  <TableRow
                    key={patient.id}
                    className={
                      patient.alertStatus === "CRITICAL" ? "bg-red-50" : ""
                    }
                  >
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            patient.alertStatus === "CRITICAL"
                              ? "bg-red-500"
                              : "bg-green-500"
                          }`}
                        />
                      </div>
                    </TableCell>
                    <TableCell
                      className={
                        patient.alertStatus === "CRITICAL" ? "font-medium" : ""
                      }
                    >
                      {patient.name}
                    </TableCell>
                    <TableCell>{patient.age}</TableCell>
                    <TableCell>{patient.diagnosis}</TableCell>
                    <TableCell>
                      {patient.alertMeasurements.length > 0 ? (
                        <div className="text-sm">
                          <span className="text-red-600 font-medium">
                            {patient.alertMeasurements.join(", ")}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-500 text-sm">
                          Нет критических показателей
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboard/patients/${patient.id}`}>
                          Подробнее
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PatientsPage;
