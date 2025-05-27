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
import { eq, and, inArray } from "drizzle-orm";
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
    const riskGroupPatients = await db
      .select({ userId: riskGroups.userId })
      .from(riskGroups)
      .where(eq(riskGroups.name, riskGroup));

    if (!riskGroupPatients.length) {
      return [];
    }

    const patientIds = riskGroupPatients.map((p) => p.userId);

    const ageFilters: any[] = [];
    if (age !== undefined) {
      const targetYear = new Date().getFullYear() - age;
      ageFilters.push(
        sql`EXTRACT(YEAR FROM to_date(substring(${users.iin} from 1 for 6), 'YYMMDD')) = ${targetYear}`
      );
    }

    const patientRecords = await db
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
          eq(invitations.riskGroup, riskGroup)
        )
      )
      .where(
        and(
          eq(users.userType, "PATIENT"),
          eq(users.organization, organization),
          eq(users.city, city),
          inArray(users.id, patientIds),
          ...ageFilters
        )
      )
      .groupBy(
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

export default async function ExaminationsPage() {
  const session = await auth();

  if (!session || !session.user) {
    redirect("/sign-in");
  }

  const userType = session.user.userType as UserType;

  if (userType === UserType.PATIENT) {
    redirect("/dashboard");
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
}
