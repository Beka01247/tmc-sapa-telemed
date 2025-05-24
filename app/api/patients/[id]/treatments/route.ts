import { db } from "@/db/drizzle";
import { treatments, users } from "@/db/schema";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { eq, and } from "drizzle-orm";

const treatmentSchema = z.array(
  z.object({
    id: z.string().uuid(),
    medication: z.string(),
    dosage: z.string(),
    frequency: z.string(),
    duration: z.string(),
    notes: z.string().nullable(),
    providerName: z.string().nullable(),
  })
);

export const GET = async (
  request: Request,
  { params }: { params: { id: string } }
) => {
  const session = await auth();
  console.log("GET /patients/[id]/treatments session:", session);
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
    const data = await db
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
      .where(
        and(
          eq(treatments.patientId, params.id),
          eq(users.organization, session.user.organization),
          eq(users.city, session.user.city)
        )
      );

    const validated = treatmentSchema.parse(data);
    console.log("GET /patients/[id]/treatments data:", validated);
    return NextResponse.json(validated);
  } catch (error) {
    console.error("GET /patients/[id]/treatments error:", error);
    return NextResponse.json(
      { error: "Не удалось получить лечения", details: error.message },
      { status: 500 }
    );
  }
};
