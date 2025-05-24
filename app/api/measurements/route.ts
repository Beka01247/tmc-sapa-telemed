import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { measurements } from "@/db/schema";
import { auth } from "@/auth";
import { eq, desc } from "drizzle-orm";

export const POST = async (req: Request) => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { type, value1, value2 } = await req.json();

  try {
    await db.insert(measurements).values({
      userId: session.user.id,
      type,
      value1,
      value2: value2 || null,
    });
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
