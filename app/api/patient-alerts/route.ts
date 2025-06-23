import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db/drizzle";
import { patientAlerts, measurements, users } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patientId");

    let whereClause;
    if (patientId) {
      whereClause = eq(patientAlerts.patientId, patientId);
    } else if (session.user.userType === "PATIENT") {
      whereClause = eq(patientAlerts.patientId, session.user.id);
    } else {
      // For doctors/nurses, get all alerts from their organization
      whereClause = eq(patientAlerts.acknowledged, false);
    }

    const alerts = await db
      .select({
        id: patientAlerts.id,
        patientId: patientAlerts.patientId,
        patientName: users.fullName,
        measurementType: measurements.type,
        alertStatus: patientAlerts.alertStatus,
        message: patientAlerts.message,
        acknowledged: patientAlerts.acknowledged,
        createdAt: patientAlerts.createdAt,
      })
      .from(patientAlerts)
      .leftJoin(measurements, eq(patientAlerts.measurementId, measurements.id))
      .leftJoin(users, eq(patientAlerts.patientId, users.id))
      .where(whereClause)
      .orderBy(desc(patientAlerts.createdAt));

    return NextResponse.json(alerts);
  } catch (error) {
    console.error("Error fetching patient alerts:", error);
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

    const body = await request.json();
    const { measurementId, patientId, alertStatus, message, criticalValueId } =
      body;

    if (!measurementId || !patientId || !alertStatus) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const newAlert = await db
      .insert(patientAlerts)
      .values({
        patientId,
        measurementId,
        alertStatus,
        criticalValueId,
        message,
      })
      .returning();

    return NextResponse.json(newAlert[0]);
  } catch (error) {
    console.error("Error creating patient alert:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { alertId, patientId, measurementType } = body;

    // If alertId is provided, acknowledge single alert (legacy support)
    if (alertId) {
      const updatedAlert = await db
        .update(patientAlerts)
        .set({
          acknowledged: true,
          acknowledgedBy: session.user.id,
          acknowledgedAt: new Date(),
        })
        .where(eq(patientAlerts.id, alertId))
        .returning();

      return NextResponse.json(updatedAlert[0]);
    }

    // If patientId and measurementType are provided, acknowledge all alerts for that measurement type
    if (patientId && measurementType) {
      const updatedAlerts = await db
        .update(patientAlerts)
        .set({
          acknowledged: true,
          acknowledgedBy: session.user.id,
          acknowledgedAt: new Date(),
        })
        .from(measurements)
        .where(
          and(
            eq(patientAlerts.patientId, patientId),
            eq(measurements.type, measurementType),
            eq(patientAlerts.measurementId, measurements.id),
            eq(patientAlerts.acknowledged, false)
          )
        )
        .returning();

      return NextResponse.json(updatedAlerts);
    }

    return NextResponse.json(
      {
        error: "Either alertId or (patientId and measurementType) are required",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error acknowledging alert:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
