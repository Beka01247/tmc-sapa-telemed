import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import {
  measurements,
  criticalValues,
  patientAlerts,
  measurementTypeEnum,
} from "@/db/schema";
import { auth } from "@/auth";
import { eq, desc, and } from "drizzle-orm";

// Helper function to check critical values and create alerts
async function checkAndCreateAlert(
  patientId: string,
  measurementId: string,
  measurementType: string,
  value1: string,
  value2?: string
) {
  try {
    // Get critical values for this patient and measurement type
    const criticalValueData = await db
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

    if (criticalValueData.length === 0) {
      return; // No critical values set
    }

    const critical = criticalValueData[0];
    let alertStatus = "NORMAL";
    let message = "";

    const val1 = parseFloat(value1);
    const val2 = value2 ? parseFloat(value2) : null;

    // Check critical thresholds
    if (measurementType === "blood-pressure" && val2) {
      // For blood pressure, check both systolic and diastolic
      const systolicHigh = critical.maxValue
        ? parseFloat(critical.maxValue.toString())
        : null;
      const systolicLow = critical.minValue
        ? parseFloat(critical.minValue.toString())
        : null;
      const diastolicHigh = critical.maxValue2
        ? parseFloat(critical.maxValue2.toString())
        : null;
      const diastolicLow = critical.minValue2
        ? parseFloat(critical.minValue2.toString())
        : null;

      if (
        (systolicHigh && val1 > systolicHigh) ||
        (diastolicHigh && val2 > diastolicHigh) ||
        (systolicLow && val1 < systolicLow) ||
        (diastolicLow && val2 < diastolicLow)
      ) {
        alertStatus = "CRITICAL";
        message = `Артериальное давление ${val1}/${val2} вне нормальных значений`;
      }
    } else {
      // For single value measurements
      const maxVal = critical.maxValue
        ? parseFloat(critical.maxValue.toString())
        : null;
      const minVal = critical.minValue
        ? parseFloat(critical.minValue.toString())
        : null;

      if ((maxVal && val1 > maxVal) || (minVal && val1 < minVal)) {
        alertStatus = "CRITICAL";
        message = `Значение ${measurementType}: ${val1} вне нормальных значений`;
      }
    }

    // Create alert if critical
    if (alertStatus === "CRITICAL") {
      await db.insert(patientAlerts).values({
        patientId,
        measurementId,
        alertStatus,
        criticalValueId: critical.id,
        message,
      });
    }
  } catch (error) {
    console.error("Error checking critical values:", error);
  }
}

export const POST = async (req: Request) => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { type, value1, value2 } = await req.json();

  try {
    // Insert the measurement
    const newMeasurement = await db
      .insert(measurements)
      .values({
        userId: session.user.id,
        type,
        value1,
        value2: value2 || null,
      })
      .returning();

    // Check for critical values and create alerts
    const measurementId = newMeasurement[0].id;
    await checkAndCreateAlert(
      session.user.id,
      measurementId,
      type,
      value1,
      value2
    );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error saving measurement:", error);
    return NextResponse.json(
      { error: "Failed to save measurement" },
      { status: 500 }
    );
  }
};

export const GET = async () => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const latestMeasurements = await db
      .select({
        id: measurements.id,
        type: measurements.type,
        value1: measurements.value1,
        value2: measurements.value2,
        createdAt: measurements.createdAt,
      })
      .from(measurements)
      .where(eq(measurements.userId, session.user.id))
      .orderBy(desc(measurements.createdAt))
      .limit(14); // One per measurement type
    return NextResponse.json(latestMeasurements, { status: 200 });
  } catch (error) {
    console.error("Error fetching measurements:", error);
    return NextResponse.json(
      { error: "Failed to fetch measurements" },
      { status: 500 }
    );
  }
};
