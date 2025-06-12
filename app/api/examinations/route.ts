import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getPatients } from "@/lib/services/examinations";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const filters = {
      riskGroup: searchParams.get("riskGroup") || "Скрининг",
      organization: searchParams.get("organization") || "",
      city: searchParams.get("city") || "",
      age: searchParams.get("age")
        ? parseInt(searchParams.get("age")!)
        : undefined,
    };

    const patients = await getPatients(filters);
    return NextResponse.json(patients);
  } catch (error) {
    console.error("Error in examinations API:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
