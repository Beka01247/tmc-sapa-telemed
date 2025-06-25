"use server";

import { db } from "@/db/drizzle";
import { receptions, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get all receptions created by this doctor with patient information
    const data = await db
      .select({
        id: receptions.id,
        patientId: receptions.patientId,
        patientName: users.fullName,
        anamnesis: receptions.anamnesis,
        complaints: receptions.complaints,
        objectiveStatus: receptions.objectiveStatus,
        diagnosis: receptions.diagnosis,
        examinations: receptions.examinations,
        treatment: receptions.treatment,
        recommendations: receptions.recommendations,
        createdAt: receptions.createdAt,
        updatedAt: receptions.updatedAt,
      })
      .from(receptions)
      .innerJoin(users, eq(receptions.patientId, users.id))
      .where(eq(receptions.providerId, session.user.id))
      .orderBy(receptions.createdAt);

    // Format dates
    const formattedData = data.map((reception) => ({
      ...reception,
      createdAt:
        reception.createdAt instanceof Date
          ? reception.createdAt.toISOString()
          : reception.createdAt,
      updatedAt:
        reception.updatedAt instanceof Date
          ? reception.updatedAt.toISOString()
          : reception.updatedAt,
    }));

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error("GET /appointments error:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
