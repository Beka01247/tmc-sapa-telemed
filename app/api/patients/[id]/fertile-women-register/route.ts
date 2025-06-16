import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { fertileWomenRegister } from "@/db/schema";
import { eq } from "drizzle-orm";

import { auth } from "@/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const patientId = params.id;

    const result = await db
      .select()
      .from(fertileWomenRegister)
      .where(eq(fertileWomenRegister.userId, patientId));

    if (result.length === 0) {
      return NextResponse.json(null);
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("[FERTILE_WOMEN_REGISTER_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Only allow doctors to update the register
    if (!session.user.userType?.includes("DOCTOR")) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const data = await request.json();
    const patientId = params.id;

    await db
      .update(fertileWomenRegister)
      .set({
        registrationDate: data.registrationDate,
        deregistrationDate: data.deregistrationDate,
        reasonDeregistered: data.reasonDeregistered,
        pregnanciesCount: data.pregnanciesCount,
        birthsCount: data.birthsCount,
        abortionsCount: data.abortionsCount,
        stillbirthsCount: data.stillbirthsCount,
        lastPregnancyDate: data.lastPregnancyDate,
        chronicDiseases: data.chronicDiseases,
        screeningStatus: data.screeningStatus,
      })
      .where(eq(fertileWomenRegister.userId, patientId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[FERTILE_WOMEN_REGISTER_UPDATE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Only allow doctors to add to the register
    if (!session.user.userType?.includes("DOCTOR")) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const patientId = params.id;

    // Check if patient is already in the register
    const existingRecord = await db
      .select()
      .from(fertileWomenRegister)
      .where(eq(fertileWomenRegister.userId, patientId));

    if (existingRecord.length > 0) {
      // If patient is already in register but has been deregistered,
      // we'll allow them to be re-registered by updating the existing record
      if (existingRecord[0].deregistrationDate) {
        await db
          .update(fertileWomenRegister)
          .set({
            registrationDate: new Date().toISOString(),
            deregistrationDate: null,
            reasonDeregistered: null,
          })
          .where(eq(fertileWomenRegister.userId, patientId));

        return NextResponse.json({ success: true });
      }

      // Otherwise, they're already actively registered
      return new NextResponse("Patient already in register", { status: 409 });
    }

    // Add patient to register
    const result = await db.insert(fertileWomenRegister).values({
      userId: patientId,
      registrationDate: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, id: result });
  } catch (error) {
    console.error("[FERTILE_WOMEN_REGISTER_ADD]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Only allow doctors to remove from the register
    if (!session.user.userType?.includes("DOCTOR")) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const { reason } = await request.json();

    if (!reason || reason.trim() === "") {
      return new NextResponse("Reason is required", { status: 400 });
    }

    const patientId = params.id;

    // Update patient record with deregistration info instead of deleting
    await db
      .update(fertileWomenRegister)
      .set({
        deregistrationDate: new Date().toISOString(),
        reasonDeregistered: reason,
      })
      .where(eq(fertileWomenRegister.userId, patientId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[FERTILE_WOMEN_REGISTER_REMOVE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
