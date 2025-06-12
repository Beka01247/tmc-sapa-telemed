"use server";

import { db } from "@/db/drizzle";
import { receptions } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getReceptionsForPatient(patientId: string) {
  return await db
    .select()
    .from(receptions)
    .where(eq(receptions.patientId, patientId))
    .orderBy(receptions.createdAt);
}
