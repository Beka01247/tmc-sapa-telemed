import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { chatMessages, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patientId");

    if (!patientId) {
      return NextResponse.json(
        { error: "Patient ID is required" },
        { status: 400 }
      );
    }

    // Get chat messages for the patient
    const messages = await db
      .select({
        id: chatMessages.id,
        message: chatMessages.message,
        createdAt: chatMessages.createdAt,
        sender: {
          id: users.id,
          name: users.fullName,
          role: users.userType,
        },
      })
      .from(chatMessages)
      .innerJoin(users, eq(chatMessages.senderId, users.id))
      .where(eq(chatMessages.patientId, patientId))
      .orderBy(chatMessages.createdAt)
      .limit(100);

    return NextResponse.json(messages);
  } catch (error) {
    console.error("Error fetching chat messages:", error);
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

    const { patientId, message } = await request.json();

    if (!patientId || !message) {
      return NextResponse.json(
        { error: "Patient ID and message are required" },
        { status: 400 }
      );
    }

    // Store the message in the database
    const newMessage = await db
      .insert(chatMessages)
      .values({
        patientId,
        senderId: session.user.id,
        message,
      })
      .returning({
        id: chatMessages.id,
        message: chatMessages.message,
        createdAt: chatMessages.createdAt,
      });

    // Get sender info
    const sender = await db
      .select({
        id: users.id,
        name: users.fullName,
        role: users.userType,
      })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    const response = {
      ...newMessage[0],
      sender: sender[0],
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error saving chat message:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
