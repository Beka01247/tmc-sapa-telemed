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
import { SQL, sql, eq, and, ilike } from "drizzle-orm";
import { UserType } from "@/constants/userTypes";
import { ExaminationsClient } from "./ExaminationsClient";

interface Patient {
  id: string;
  name: string;
  age: number;
  diagnosis: string | null;
  isInvited: boolean | undefined;
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

interface PatientRecord {
  id: string;
  name: string;
  iin: string;
  diagnoses: string | null;
  invitationId?: string;
}

async function fetchPatients(
  organization: string,
  city: string,
  riskGroup: string,
  age?: number
): Promise<Patient[]> {
  try {
    const ageFilters: Array<SQL> = [];
    if (riskGroup === "Скрининг" && age !== undefined && age > 0) {
      const currentYear = new Date().getFullYear();
      const targetYearMin = currentYear - age - 1;
      const targetYearMax = currentYear - age;
      ageFilters.push(
        sql`
          CASE
            WHEN to_date(left(${users.iin}, 6), 'YYMMDD') IS NOT NULL
            THEN EXTRACT(YEAR FROM to_date(left(${users.iin}, 6), 'YYMMDD')) BETWEEN ${targetYearMin} AND ${targetYearMax}
            ELSE FALSE
          END
        `
      );
    }

    const selectObj = {
      id: users.id,
      name: users.fullName,
      iin: users.iin,
      diagnoses: sql`STRING_AGG(DISTINCT ${diagnoses.description}, ', ')`,
    };

    // Only include invitation status for non-ЖФВ groups
    if (riskGroup !== "ЖФВ") {
      Object.assign(selectObj, {
        invitationId: invitations.id,
      });
    }

    // Base query
    let baseQuery = db
      .select(selectObj)
      .from(users)
      .leftJoin(diagnoses, eq(diagnoses.userId, users.id))
      .where(
        and(
          eq(users.userType, "PATIENT"),
          ilike(users.organization, organization),
          ilike(users.city, city),
          ...ageFilters
        )
      );

    // Add invitation join for non-ЖФВ groups
    if (riskGroup !== "ЖФВ") {
      baseQuery = baseQuery.leftJoin(
        invitations,
        and(
          eq(invitations.patientId, users.id),
          eq(invitations.riskGroup, riskGroup),
          eq(invitations.status, "PENDING")
        )
      );
    }

    // Apply risk group filter for non-Скрининг groups
    if (riskGroup !== "Скрининг") {
      baseQuery = baseQuery.innerJoin(
        riskGroups,
        and(eq(riskGroups.userId, users.id), eq(riskGroups.name, riskGroup))
      );
    }

    const patientRecords = await baseQuery.groupBy(
      users.id,
      users.fullName,
      users.iin
    );

    return patientRecords.map((record: PatientRecord) => ({
      id: record.id,
      name: record.name,
      age: calculateAge(record.iin),
      diagnosis: record.diagnoses || "Нет диагнозов",
      isInvited: riskGroup === "ЖФВ" ? undefined : !!record.invitationId,
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
      userId={session.user.id}
    />
  );
};

export default ExaminationsPage;
