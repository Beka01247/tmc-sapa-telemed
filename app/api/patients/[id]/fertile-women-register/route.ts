import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { fertileWomenRegister } from "@/db/schema";
import { eq } from "drizzle-orm";

import { auth } from "@/auth";

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
