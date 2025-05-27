import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import {
  users,
  consultations,
  diagnoses,
  riskGroups,
  invitations,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { auth } from "@/auth";
import { z } from "zod";

const querySchema = z.object({
  riskGroup: z
    .enum(["Скрининг", "Вакцинация", "Беременные", "ЖФВ", "ДУ", "ПУЗ"])
    .optional()
    .default("Скрининг")
    .transform((val) => decodeURIComponent(val)), // Decode URL-encoded values
  minAge: z.coerce.number().min(0).max(120).optional(),
  maxAge: z.coerce.number().min(0).max(120).optional(),
  noRiskGroupFilter: z
    .enum(["true", "false"])
    .optional()
    .default("false")
    .transform((val) => val === "true"),
});

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

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (
      !session ||
      !session.user?.id ||
      !["DOCTOR", "NURSE"].includes(session.user.userType)
    ) {
      return NextResponse.json(
        { error: "Неавторизованный доступ" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    console.log("Raw searchParams: ", Object.fromEntries(searchParams));

    // Prepare the query object with proper fallbacks
    const queryInput = {
      riskGroup: searchParams.get("riskGroup") || undefined,
      minAge: searchParams.get("minAge") || undefined,
      maxAge: searchParams.get("maxAge") || undefined,
      noRiskGroupFilter: searchParams.get("noRiskGroupFilter") || undefined,
    };

    console.log("Query input: ", queryInput);

    const query = querySchema.parse(queryInput);
    console.log("Parsed query: ", query);

    const riskGroup = query.riskGroup;

    // Build age filters
    const ageFilters: any[] = [];
    if (query.minAge !== undefined) {
      const minYear = new Date().getFullYear() - query.minAge;
      ageFilters.push(
        sql`EXTRACT(YEAR FROM to_date(substring(${users.iin} from 1 for 6), 'YYMMDD')) <= ${minYear}`
      );
    }
    if (query.maxAge !== undefined) {
      const maxYear = new Date().getFullYear() - query.maxAge;
      ageFilters.push(
        sql`EXTRACT(YEAR FROM to_date(substring(${users.iin} from 1 for 6), 'YYMMDD')) >= ${maxYear}`
      );
    }

    // Build risk group filter
    const riskGroupFilter = query.noRiskGroupFilter
      ? sql`TRUE`
      : eq(riskGroups.name, riskGroup);

    // Fetch patients
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
      .leftJoin(
        riskGroups,
        and(eq(riskGroups.userId, users.id), riskGroupFilter)
      )
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
          eq(users.organization, session.user.organization),
          eq(users.city, session.user.city),
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

    const patients = patientRecords.map((record) => ({
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

    return NextResponse.json(patients, { status: 200 });
  } catch (error) {
    console.error("Ошибка при загрузке пациентов:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Не удалось загрузить пациентов" },
      { status: 500 }
    );
  }
}
