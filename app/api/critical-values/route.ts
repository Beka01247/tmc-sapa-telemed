import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db/drizzle";
import { criticalValues } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patientId");
    const measurementType = searchParams.get("measurementType");

    if (!patientId) {
      return NextResponse.json(
        { error: "Patient ID required" },
        { status: 400 }
      );
    }

    let criticalValuesData;
    if (measurementType) {
      criticalValuesData = await db
        .select()
        .from(criticalValues)
        .where(
          and(
            eq(criticalValues.patientId, patientId),
            eq(
              criticalValues.measurementType,
              measurementType as
                | "blood-pressure"
                | "pulse"
                | "temperature"
                | "glucose"
                | "oximeter"
                | "spirometer"
                | "cholesterol"
                | "hemoglobin"
                | "triglycerides"
                | "weight"
                | "height"
                | "ultrasound"
                | "xray"
                | "inr"
            )
          )
        );
    } else {
      criticalValuesData = await db
        .select()
        .from(criticalValues)
        .where(eq(criticalValues.patientId, patientId));
    }

    return NextResponse.json(criticalValuesData);
  } catch (error) {
    console.error("Error fetching critical values:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only doctors and nurses can set critical values
    if (session.user.userType === "PATIENT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const {
      patientId,
      measurementType,
      minValue,
      maxValue,
      minValue2,
      maxValue2,
      notes,
    } = body;

    if (!patientId || !measurementType) {
      return NextResponse.json(
        { error: "Patient ID and measurement type are required" },
        { status: 400 }
      );
    }

    // Check if critical values already exist for this patient and measurement type
    const existing = await db
      .select()
      .from(criticalValues)
      .where(
        and(
          eq(criticalValues.patientId, patientId),
          eq(criticalValues.measurementType, measurementType)
        )
      );

    if (existing.length > 0) {
      // Update existing
      const updated = await db
        .update(criticalValues)
        .set({
          minValue: minValue ? minValue.toString() : null,
          maxValue: maxValue ? maxValue.toString() : null,
          minValue2: minValue2 ? minValue2.toString() : null,
          maxValue2: maxValue2 ? maxValue2.toString() : null,
          notes,
          providerId: session.user.id,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(criticalValues.patientId, patientId),
            eq(criticalValues.measurementType, measurementType)
          )
        )
        .returning();

      return NextResponse.json(updated[0]);
    } else {
      // Create new
      const newCriticalValue = await db
        .insert(criticalValues)
        .values({
          patientId,
          providerId: session.user.id,
          measurementType,
          minValue: minValue ? minValue.toString() : null,
          maxValue: maxValue ? maxValue.toString() : null,
          minValue2: minValue2 ? minValue2.toString() : null,
          maxValue2: maxValue2 ? maxValue2.toString() : null,
          notes,
        })
        .returning();

      return NextResponse.json(newCriticalValue[0]);
    }
  } catch (error) {
    console.error("Error saving critical values:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
