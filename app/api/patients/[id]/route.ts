import { db } from "@/db/drizzle";
import { users } from "@/db/schema";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { eq, and } from "drizzle-orm";

const patientSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string(),
  iin: z.string(),
  email: z.string().email(),
  telephone: z.string(),
  city: z.string(),
  organization: z.string(),
  dateOfBirth: z.string().nullable(),
});

export const GET = async (
  request: Request,
  { params }: { params: { id: string } }
) => {
  const session = await auth();
  console.log("GET /patients/[id] session:", session);
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "Неавторизован" }, { status: 401 });
  }

  if (!["DOCTOR", "NURSE"].includes(session.user.userType)) {
    return NextResponse.json(
      { error: "Доступ запрещен: требуется роль врача или медсестры" },
      { status: 403 }
    );
  }

  try {
    const [patient] = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        iin: users.iin,
        email: users.email,
        telephone: users.telephone,
        city: users.city,
        organization: users.organization,
        dateOfBirth: users.dateOfBirth,
      })
      .from(users)
      .where(
        and(
          eq(users.id, params.id),
          eq(users.userType, "PATIENT"),
          eq(users.organization, session.user.organization),
          eq(users.city, session.user.city)
        )
      );

    if (!patient) {
      return NextResponse.json({ error: "Пациент не найден" }, { status: 404 });
    }

    const validated = patientSchema.parse(patient);
    console.log("GET /patients/[id] data:", validated);
    return NextResponse.json(validated);
  } catch (error) {
    console.error("GET /patients/[id] error:", error);
    return NextResponse.json(
      { error: "Не удалось получить данные пациента", details: error.message },
      { status: 500 }
    );
  }
};
