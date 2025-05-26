import { db } from "@/db/drizzle";
import { consultations, users } from "@/db/schema";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { eq, and } from "drizzle-orm";

const consultationSchema = z.object({
  consultationDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Неверный формат даты",
  }),
  notes: z.string().optional(),
  status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED"]).default("SCHEDULED"),
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

    // Fetch consultations with provider name
    const consultationsData = await db
      .select({
        id: consultations.id,
        consultationDate: consultations.consultationDate,
        notes: consultations.notes,
        status: consultations.status,
        providerName: users.fullName,
      })
      .from(consultations)
      .leftJoin(users, eq(consultations.providerId, users.id))
      .where(eq(consultations.patientId, params.id));

    return NextResponse.json(consultationsData);
  } catch (error) {
    console.error("GET /patients/[id]/consultations error:", error);
    return NextResponse.json(
      { error: "Не удалось получить приемы" },
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
    const validated = consultationSchema.parse(body);

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

    const [newConsultation] = await db
      .insert(consultations)
      .values({
        patientId: params.id,
        providerId: session.user.id,
        consultationDate: new Date(validated.consultationDate),
        notes: validated.notes,
        status: validated.status,
      })
      .returning();

    return NextResponse.json(newConsultation);
  } catch (error) {
    console.error("POST /patients/[id]/consultations error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Не удалось создать прием", details: error.message },
      { status: 500 }
    );
  }
};
