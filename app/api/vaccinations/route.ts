import { auth } from "@/auth";
import { db } from "@/db/drizzle";
import { patientVaccinations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patientId");

    if (!patientId) {
      return new NextResponse("Patient ID is required", { status: 400 });
    }

    const vaccinations = await db
      .select()
      .from(patientVaccinations)
      .where(eq(patientVaccinations.patientId, patientId));

    return NextResponse.json(vaccinations);
  } catch (error) {
    console.error("[VACCINATIONS_GET]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { patientId, name, scheduledDate, notes } = body;

    if (!patientId || !name || !scheduledDate) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const vaccination = await db.insert(patientVaccinations).values({
      patientId,
      name,
      scheduledDate,
      notes,
      status: "INVITED",
    });

    return NextResponse.json(vaccination);
  } catch (error) {
    console.error("[VACCINATIONS_POST]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
