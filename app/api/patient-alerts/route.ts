import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db/drizzle";
import { patientAlerts, measurements, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

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
    const { alertId } = body;

    if (!alertId) {
      return NextResponse.json(
        { error: "Alert ID is required" },
        { status: 400 }
      );
    }

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
  } catch (error) {
    console.error("Error acknowledging alert:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
