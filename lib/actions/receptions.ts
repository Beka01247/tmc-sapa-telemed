"use server";

import { db } from "@/db/drizzle";
import { receptions } from "@/db/schema";
import { eq } from "drizzle-orm";

const formatDate = (date: Date | string | null): string => {
  if (!date) return new Date().toISOString();
  return new Date(date).toISOString();
};

export async function createReception(data: {
  patientId: string;
  anamnesis: string;
  complaints: string;
  objectiveStatus: string;
  diagnosis: string;
  examinations: string;
  treatment: string;
}) {
  try {
    const result = await db
      .insert(receptions)
      .values({
        ...data,
        createdAt: new Date(),
      })
      .returning();

    // Ensure we have a result
    if (!result.length) {
      throw new Error("Failed to create reception");
    }

    const reception = result[0];
    return {
      success: true,
      data: {
        ...reception,
        createdAt: formatDate(reception.createdAt),
      },
    };
  } catch (error) {
    console.error("Error creating reception:", error);
    return { success: false, error: "Failed to create reception" };
  }
}

export async function updateReception(
  receptionId: string,
  data: {
    anamnesis: string;
    complaints: string;
    objectiveStatus: string;
    diagnosis: string;
    examinations: string;
    treatment: string;
  }
) {
  try {
    // Get the current reception to preserve timestamps
    const currentReception = await db
      .select()
      .from(receptions)
      .where(eq(receptions.id, receptionId))
      .limit(1);

    if (!currentReception.length) {
      throw new Error("Reception not found");
    }

    const result = await db
      .update(receptions)
      .set({
        ...data,
        createdAt: currentReception[0].createdAt, // Preserve the original createdAt
      })
      .where(eq(receptions.id, receptionId))
      .returning();

    if (!result.length) {
      throw new Error("Failed to update reception");
    }

    const reception = result[0];
    return {
      success: true,
      data: {
        ...reception,
        createdAt: formatDate(reception.createdAt),
      },
    };
  } catch (error) {
    console.error("Error updating reception:", error);
    return { success: false, error: "Failed to update reception" };
  }
}

export async function deleteReception(receptionId: string) {
  try {
    await db.delete(receptions).where(eq(receptions.id, receptionId));
    return { success: true };
  } catch (error) {
    console.error("Error deleting reception:", error);
    return { success: false, error: "Failed to delete reception" };
  }
}

export async function getReceptions(patientId: string) {
  try {
    const result = await db
      .select()
      .from(receptions)
      .where(eq(receptions.patientId, patientId))
      .orderBy(receptions.createdAt);

    const formattedResult = result.map((reception) => ({
      ...reception,
      createdAt: formatDate(reception.createdAt),
    }));

    return { success: true, data: formattedResult };
  } catch (error) {
    console.error("Error getting receptions:", error);
    return { success: false, error: "Failed to get receptions" };
  }
}
