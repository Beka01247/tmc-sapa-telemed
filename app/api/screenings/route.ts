import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { screenings } from "@/db/schema";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Неавторизованный доступ" },
        { status: 401 }
      );
    }

    const allScreenings = await db.select().from(screenings);
    return NextResponse.json(allScreenings);
  } catch (error) {
    console.error("Error fetching screenings:", error);
    return NextResponse.json(
      { error: "Не удалось получить список скринингов" },
      { status: 500 }
    );
  }
}
