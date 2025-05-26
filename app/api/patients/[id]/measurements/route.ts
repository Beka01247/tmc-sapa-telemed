import { db } from "@/db/drizzle";
import { measurements, users } from "@/db/schema";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { eq, and } from "drizzle-orm";

const measurementSchema = z.array(
  z.object({
    id: z.string().uuid(),
    type: z.string(),
    value1: z.string(),
    value2: z.string().nullable(),
    createdAt: z.string(),
  })
);

export const GET = async (
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
    const data = await db
      .select({
        id: measurements.id,
        type: measurements.type,
        value1: measurements.value1,
        value2: measurements.value2,
        createdAt: measurements.createdAt,
      })
      .from(measurements)
      .leftJoin(users, eq(measurements.userId, users.id))
      .where(
        and(
          eq(measurements.userId, params.id),
          eq(users.organization, session.user.organization),
          eq(users.city, session.user.city)
        )
      );

    const validated = measurementSchema.parse(
      data.map((item) => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
      }))
    );
    return NextResponse.json(validated);
  } catch (error) {
    console.error("GET /patients/[id]/measurements error:", error);
    return NextResponse.json(
      {
        error: "Не удалось получить данные мониторинга",
        details: error.message,
      },
      { status: 500 }
    );
  }
};
