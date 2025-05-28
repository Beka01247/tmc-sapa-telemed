import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db/drizzle";
import {
  users,
  consultations,
  diagnoses,
  riskGroups,
  invitations,
} from "@/db/schema";
import { eq, and, ilike } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { UserType } from "@/constants/userTypes";
import { ExaminationsClient } from "./ExaminationsClient";

interface Patient {
  id: string;
  name: string;
  age: number;
  diagnosis: string | null;
  lastVisit: string | null;
  isInvited: boolean;
}

function calculateAge(iin: string, currentDate: Date = new Date()): number {
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
}

async function fetchPatients(
  organization: string,
  city: string,
  riskGroup: string,
  age?: number
): Promise<Patient[]> {
  try {
    const ageFilters: any[] = [];
    if (riskGroup === "Скрининг" && age !== undefined && age > 0) {
      const currentYear = new Date().getFullYear();
      const targetYearMin = currentYear - age - 1;
      const targetYearMax = currentYear - age;
      ageFilters.push(
        sql`
          CASE
            WHEN to_date(substring(${users.iin} from 1 for 6), 'YYMMDD') IS NOT NULL
            THEN EXTRACT(YEAR FROM to_date(substring(${users.iin} from 1 for 6), 'YYMMDD')) BETWEEN ${targetYearMin} AND ${targetYearMax}
            ELSE FALSE
          END
        `
      );
    }

    let query = db
      .select({
        id: users.id,
        name: users.fullName,
        iin: users.iin,
        lastVisit: consultations.consultationDate,
        diagnoses: sql`string_agg(${diagnoses.description}, ', ')`.as(
          "diagnoses"
        ),
        invitationId: invitations.id,
      })
      .from(users)
      .leftJoin(consultations, eq(consultations.patientId, users.id))
      .leftJoin(diagnoses, eq(diagnoses.userId, users.id))
      .leftJoin(
        invitations,
        and(
          eq(invitations.patientId, users.id),
          eq(invitations.riskGroup, riskGroup),
          eq(invitations.status, "PENDING")
        )
      )
      .where(
        and(
          eq(users.userType, "PATIENT"),
          ilike(users.organization, organization),
          ilike(users.city, city),
          ...ageFilters
        )
      );

    // Apply risk group filter only for non-Скрининг and non-Вакцинация
    if (riskGroup !== "Скрининг" && riskGroup !== "Вакцинация") {
      query = query
        .innerJoin(riskGroups, eq(riskGroups.userId, users.id))
        .where(
          and(
            eq(users.userType, "PATIENT"),
            ilike(users.organization, organization),
            ilike(users.city, city),
            eq(riskGroups.name, riskGroup),
            ...ageFilters
          )
        );
    }

    const patientRecords = await query.groupBy(
      users.id,
      users.fullName,
      users.iin,
      consultations.consultationDate,
      invitations.id
    );

    return patientRecords.map((record) => ({
      id: record.id,
      name: record.name,
      age: calculateAge(record.iin),
      diagnosis: record.diagnoses || "Нет диагнозов",
      lastVisit: record.lastVisit
        ? new Date(record.lastVisit).toLocaleDateString("ru-RU", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : null,
      isInvited: !!record.invitationId,
    }));
  } catch (error) {
    console.error("Error fetching patients:", error);
    return [];
  }
}

const ExaminationsPage = async () => {
  const session = await auth();

  if (!session || !session.user) {
    redirect("/sign-in");
  }

  const userType = session.user.userType as UserType;

  if (userType === UserType.PATIENT) {
    redirect("/");
  }

  const patients = await fetchPatients(
    session.user.organization,
    session.user.city,
    "Скрининг"
  );

  return (
    <ExaminationsClient
      initialPatients={patients}
      userType={userType}
      userName={session.user.fullName}
      organization={session.user.organization}
      city={session.user.city}
    />
  );
};

export default ExaminationsPage;
