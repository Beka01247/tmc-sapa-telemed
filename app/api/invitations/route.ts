import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { users, invitations } from "@/db/schema";
import { eq, and, ilike } from "drizzle-orm";
import { auth } from "@/auth";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

const postSchema = z.object({
  patientId: z.string().uuid(),
  riskGroup: z.enum([
    "Скрининг",
    "Вакцинация",
    "Беременные",
    "ЖФВ",
    "ДУ",
    "ПУЗ",
  ]),
});

export async function POST(request: Request) {
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

    const body = await request.json();
    const input = postSchema.parse(body);

    // Check if patient exists and is valid
    const patient = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.id, input.patientId),
          eq(users.userType, "PATIENT"),
          ilike(users.organization, session.user.organization),
          ilike(users.city, session.user.city)
        )
      )
      .limit(1);

    if (!patient.length) {
      return NextResponse.json({ error: "Пациент не найден" }, { status: 404 });
    }

    // Check if a PENDING invitation exists
    const existingInvitation = await db
      .select()
      .from(invitations)
      .where(
        and(
          eq(invitations.patientId, input.patientId),
          eq(invitations.riskGroup, input.riskGroup),
          eq(invitations.status, "PENDING")
        )
      )
      .limit(1);

    if (existingInvitation.length) {
      return NextResponse.json(
        { error: "Пациент уже приглашен для этой группы" },
        { status: 400 }
      );
    }

    // Create invitation
    await db.insert(invitations).values({
      id: uuidv4(),
      patientId: input.patientId,
      providerId: session.user.id,
      riskGroup: input.riskGroup,
      status: "PENDING",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json(
      { message: "Приглашение отправлено" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Ошибка при создании приглашения:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Не удалось создать приглашение" },
      { status: 500 }
    );
  }
}
