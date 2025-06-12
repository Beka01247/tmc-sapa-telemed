import { db } from "@/db/drizzle";
import {
  users,
  diagnoses,
  riskGroups,
  invitations,
  fertileWomenRegister,
  patientScreenings,
  screenings,
  patientVaccinations,
  pregnancies,
} from "@/db/schema";
import { SQL, sql, eq, and, ilike } from "drizzle-orm";

export interface ExaminationFilters {
  organization: string;
  city: string;
  riskGroup: string;
  age?: number;
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

function buildAgeFilter(age: number): SQL {
  const currentYear = new Date().getFullYear();
  const targetYearMin = currentYear - age - 1;
  const targetYearMax = currentYear - age;

  return sql`
    CASE
      WHEN to_date(left(${users.iin}, 6), 'YYMMDD') IS NOT NULL
      THEN EXTRACT(YEAR FROM to_date(left(${users.iin}, 6), 'YYMMDD')) BETWEEN ${targetYearMin} AND ${targetYearMax}
      ELSE FALSE
    END
  `;
}

function buildScreeningsQuery(filters: ExaminationFilters) {
  const { organization, city, riskGroup, age } = filters;

  const ageFilters: SQL[] = [];
  if (riskGroup === "Скрининг" && age !== undefined && age > 0) {
    ageFilters.push(buildAgeFilter(age));
  }

  const ps = patientScreenings;
  const s = screenings;
  const pv = patientVaccinations;
  const pg = pregnancies;
  const rg = riskGroups;
  const inv = invitations;

  let baseQuery = db
    .select({
      id: users.id,
      name: users.fullName,
      iin: users.iin,
      diagnoses: sql`STRING_AGG(DISTINCT ${diagnoses.description}, ', ')`,
      completedScreenings:
        riskGroup === "Скрининг"
          ? sql`STRING_AGG(DISTINCT CASE WHEN ${ps.status} = 'CONFIRMED' THEN COALESCE(${s.name}, ${ps.customScreeningName}) END, ', ')`
          : sql`NULL`,
      completedVaccinations:
        riskGroup === "Вакцинация"
          ? sql`STRING_AGG(DISTINCT CASE WHEN ${pv.status} = 'CONFIRMED' THEN ${pv.name} END, ', ')`
          : sql`NULL`,
      pregnancyLmp: riskGroup === "Беременные" ? pg.lmp : sql`NULL`,
      invitationId:
        riskGroup === "ДУ" || riskGroup === "ПУЗ" ? inv.id : sql`NULL`,
    })
    .from(users)
    .leftJoin(diagnoses, eq(diagnoses.userId, users.id));

  // Add specific joins based on tab
  switch (riskGroup) {
    case "Скрининг":
      baseQuery = baseQuery
        .leftJoin(ps, eq(ps.patientId, users.id))
        .leftJoin(s, eq(s.id, ps.screeningId));
      break;

    case "Вакцинация":
      baseQuery = baseQuery.leftJoin(pv, eq(pv.patientId, users.id));
      break;

    case "Беременные":
      baseQuery = baseQuery.innerJoin(
        pg,
        and(eq(pg.userId, users.id), eq(pg.status, "active"))
      );
      break;

    case "ЖФВ":
      baseQuery = baseQuery.innerJoin(
        fertileWomenRegister,
        and(
          eq(fertileWomenRegister.userId, users.id),
          sql`${fertileWomenRegister.deregistrationDate} IS NULL`
        )
      );
      break;

    case "ДУ":
    case "ПУЗ":
      baseQuery = baseQuery
        .innerJoin(rg, and(eq(rg.userId, users.id), eq(rg.name, riskGroup)))
        .leftJoin(
          inv,
          and(
            eq(inv.patientId, users.id),
            eq(inv.riskGroup, riskGroup),
            eq(inv.status, "PENDING")
          )
        );
      break;
  }

  // Add base where conditions
  baseQuery = baseQuery.where(
    and(
      eq(users.userType, "PATIENT"),
      ilike(users.organization, organization || ""),
      ilike(users.city, city || ""),
      ...ageFilters
    )
  );

  return baseQuery;
}

export async function getPatients(filters: ExaminationFilters) {
  try {
    const query = buildScreeningsQuery(filters);

    // Different columns need to be grouped based on the tab
    const groupByColumns = [users.id, users.fullName, users.iin];

    if (filters.riskGroup === "Беременные") {
      groupByColumns.push(pregnancies.lmp);
    } else if (["ДУ", "ПУЗ"].includes(filters.riskGroup)) {
      groupByColumns.push(invitations.id);
    }

    const patients = await query.groupBy(...groupByColumns);

    return patients.map((patient) => ({
      id: patient.id,
      name: patient.name,
      age: calculateAge(patient.iin),
      diagnosis: (patient.diagnoses as string) || "Нет диагнозов",
      isInvited: ["ДУ", "ПУЗ"].includes(filters.riskGroup)
        ? !!patient.invitationId
        : undefined,
      completedScreenings:
        filters.riskGroup === "Скрининг"
          ? (patient.completedScreenings as string) ||
            "Нет пройденных скринингов"
          : undefined,
      completedVaccinations:
        filters.riskGroup === "Вакцинация"
          ? (patient.completedVaccinations as string) ||
            "Нет пройденных вакцинаций"
          : undefined,
      pregnancyWeek:
        filters.riskGroup === "Беременные" && patient.pregnancyLmp
          ? calculatePregnancyWeek(new Date(patient.pregnancyLmp as string))
          : undefined,
    }));
  } catch (error) {
    console.error("Error in examinations service:", error);
    throw error;
  }
}

function calculatePregnancyWeek(lmp: Date): number {
  const now = new Date();
  const differenceInMilliseconds = now.getTime() - lmp.getTime();
  const differenceInWeeks = Math.floor(
    differenceInMilliseconds / (1000 * 60 * 60 * 24 * 7)
  );
  return differenceInWeeks;
}
