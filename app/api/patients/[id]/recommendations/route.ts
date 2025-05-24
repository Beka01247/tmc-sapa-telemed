import { db } from "@/db/drizzle";
import { recommendations, users } from "@/db/schema";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { eq, and } from "drizzle-orm";

const recommendationSchema = z.array(
  z.object({
    id: z.string().uuid(),
    description: z.string(),
    providerName: z.string().nullable(),
    createdAt: z.string(),
  })
);

export const GET = async (
  request: Request,
  { params }: { params: { id: string } }
) => {
  const session = await auth();
  console.log("GET /patients/[id]/recommendations session:", session);
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
        id: recommendations.id,
        description: recommendations.description,
        providerName: users.fullName,
        createdAt: recommendations.createdAt,
      })
      .from(recommendations)
      .leftJoin(users, eq(recommendations.providerId, users.id))
      .where(
        and(
          eq(recommendations.patientId, params.id),
          eq(users.organization, session.user.organization),
          eq(users.city, session.user.city)
        )
      );

    const validated = recommendationSchema.parse(
      data.map((item) => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
      }))
    );
    console.log("GET /patients/[id]/recommendations data:", validated);
    return NextResponse.json(validated);
  } catch (error) {
    console.error("GET /patients/[id]/recommendations error:", error);
    return NextResponse.json(
      { error: "Не удалось получить рекомендации", details: error.message },
      { status: 500 }
    );
  }
};
