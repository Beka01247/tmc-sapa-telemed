"use server";

import { db } from "@/db/drizzle";
import { receptions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const patientId = request.nextUrl.searchParams.get("patientId");

  if (!patientId) {
    return new NextResponse("No patientId provided", { status: 400 });
  }

  try {
    const data = await db
      .select()
      .from(receptions)
      .where(eq(receptions.patientId, patientId))
      .orderBy(receptions.createdAt);

    // Format dates
    const formattedData = data.map((reception) => ({
      ...reception,
      createdAt:
        reception.createdAt instanceof Date
          ? reception.createdAt.toISOString()
          : reception.createdAt,
    }));

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error("GET /receptions error:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const data = await request.json();

  if (!data.patientId) {
    return new NextResponse("No patientId provided", { status: 400 });
  }

  try {
    const result = await db
      .insert(receptions)
      .values({
        ...data,
        createdAt: new Date(),
      })
      .returning();

    const formattedResult = {
      ...result[0],
      createdAt:
        result[0].createdAt instanceof Date
          ? result[0].createdAt.toISOString()
          : result[0].createdAt,
    };

    return NextResponse.json(formattedResult);
  } catch (error) {
    console.error("POST /receptions error:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const data = await request.json();

  if (!data.id) {
    return new NextResponse("No reception id provided", { status: 400 });
  }

  try {
    const result = await db
      .update(receptions)
      .set(data)
      .where(eq(receptions.id, data.id))
      .returning();

    const formattedResult = {
      ...result[0],
      createdAt:
        result[0].createdAt instanceof Date
          ? result[0].createdAt.toISOString()
          : result[0].createdAt,
    };

    return NextResponse.json(formattedResult);
  } catch (error) {
    console.error("PUT /receptions error:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");

  if (!id) {
    return new NextResponse("No reception id provided", { status: 400 });
  }

  try {
    await db.delete(receptions).where(eq(receptions.id, id));
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("DELETE /receptions error:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
