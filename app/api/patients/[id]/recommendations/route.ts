import { db } from "@/db/drizzle";
import { recommendations, users } from "@/db/schema";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { eq, and } from "drizzle-orm";

const recommendationSchema = z.object({
  description: z.string().min(1, "Описание обязательно"),
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

    // Fetch recommendations with provider name
    const recommendationsData = await db
      .select({
        id: recommendations.id,
        description: recommendations.description,
        providerName: users.fullName,
        createdAt: recommendations.createdAt,
      })
      .from(recommendations)
      .leftJoin(users, eq(recommendations.providerId, users.id))
      .where(eq(recommendations.patientId, params.id));

    return NextResponse.json(recommendationsData);
  } catch (error) {
    console.error("GET /patients/[id]/recommendations error:", error);
    return NextResponse.json(
      { error: "Не удалось получить рекомендации" },
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
    const validated = recommendationSchema.parse(body);

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

    const [newRecommendation] = await db
      .insert(recommendations)
      .values({
        patientId: params.id,
        providerId: session.user.id,
        description: validated.description,
      })
      .returning();

    return NextResponse.json(newRecommendation);
  } catch (error) {
    console.error("POST /patients/[id]/recommendations error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Не удалось создать рекомендацию", details: error.message },
      { status: 500 }
    );
  }
};
