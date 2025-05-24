import { db } from "@/db/drizzle";
import { consultations, users } from "@/db/schema";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { eq, and } from "drizzle-orm";

const consultationSchema = z.array(
  z.object({
    id: z.string().uuid(),
    consultationDate: z.string(),
    notes: z.string().nullable(),
    status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED"]),
    providerName: z.string().nullable(),
  })
);

export const GET = async (
  request: Request,
  { params }: { params: { id: string } }
) => {
  const session = await auth();
  console.log("GET /patients/[id]/consultations session:", session);
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
        id: consultations.id,
        consultationDate: consultations.consultationDate,
        notes: consultations.notes,
        status: consultations.status,
        providerName: users.fullName,
      })
      .from(consultations)
      .leftJoin(users, eq(consultations.providerId, users.id))
      .where(
        and(
          eq(consultations.patientId, params.id),
          eq(users.organization, session.user.organization),
          eq(users.city, session.user.city)
        )
      );

    const validated = consultationSchema.parse(
      data.map((item) => ({
        ...item,
        consultationDate: item.consultationDate.toISOString(),
      }))
    );
    console.log("GET /patients/[id]/consultations data:", validated);
    return NextResponse.json(validated);
  } catch (error) {
    console.error("GET /patients/[id]/consultations error:", error);
    return NextResponse.json(
      { error: "Не удалось получить консультации", details: error.message },
      { status: 500 }
    );
  }
};
