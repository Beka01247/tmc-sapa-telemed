import { db } from "@/db/drizzle";
import { treatments, users } from "@/db/schema";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { eq, and } from "drizzle-orm";

const treatmentSchema = z.object({
  medication: z.string().min(1, "Медикамент обязателен"),
  dosage: z.string().min(1, "Дозировка обязательна"),
  frequency: z.string().min(1, "Частота обязательна"),
  duration: z.string().min(1, "Длительность обязательна"),
  notes: z.string().optional(),
});

export const GET = async (
  _: Request,
  { params }: { params: { id: string } }
) => {
  const session = await auth();
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "Неавторизован" }, { status: 401 });
  }

  try {
    // Verify patient exists and is accessible
    const [patient] = await db
      .select({ id: users.id })
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
      })
      .from(treatments)
      .leftJoin(users, eq(treatments.providerId, users.id))
      .where(eq(treatments.patientId, params.id));

    return NextResponse.json(treatmentsData);
  } catch (error) {
    console.error("GET /patients/[id]/treatments error:", error);
    return NextResponse.json(
      { error: "Не удалось получить лечения" },
      { status: 500 }
    );
  }
};

export const POST = async (
  request: Request,
  { params }: { params: { id: string } }
) => {
  const session = await auth();
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
    const body = await request.json();
    const validated = treatmentSchema.parse(body);

    const [patient] = await db
      .select({ id: users.id })
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

    const [newTreatment] = await db
      .insert(treatments)
      .values({
        patientId: params.id,
        providerId: session.user.id,
        medication: validated.medication,
        dosage: validated.dosage,
        frequency: validated.frequency,
        duration: validated.duration,
        notes: validated.notes,
      })
      .returning();

    return NextResponse.json(newTreatment);
  } catch (error) {
    console.error("POST /patients/[id]/treatments error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Не удалось создать лечение", details: error.message },
      { status: 500 }
    );
  }
};
