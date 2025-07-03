import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import {
  measurements,
  users,
  riskGroups,
  pregnancies,
  fertileWomenRegister,
} from "@/db/schema";
import { sql, and, gte, lte, eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const measurementType = searchParams.get("measurementType");
    const group = searchParams.get("group");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const organization = searchParams.get("organization");
    const city = searchParams.get("city");

    if (!measurementType || !group) {
      return NextResponse.json(
        { error: "measurementType and group are required" },
        { status: 400 }
      );
    }

    // Build date filter conditions
    const dateConditions = [];
    if (dateFrom) {
      dateConditions.push(gte(measurements.createdAt, new Date(dateFrom)));
    }
    if (dateTo) {
      dateConditions.push(
        lte(measurements.createdAt, new Date(dateTo + "T23:59:59.999Z"))
      );
    }

    const whereConditions = [
      eq(measurements.type, measurementType as "blood-pressure" | "pulse"),
      ...dateConditions,
    ];

    // Add organization and city filters if provided
    if (organization) {
      whereConditions.push(eq(users.organization, organization));
    }
    if (city) {
      whereConditions.push(eq(users.city, city));
    }

    // Add group-specific conditions
    const additionalConditions = [];
    if (group === "ПУЗ") {
      additionalConditions.push(
        sql`EXISTS(SELECT 1 FROM ${riskGroups} r WHERE r.user_id = ${users.id} AND r.name = 'ПУЗ')`
      );
    } else if (group === "ДН") {
      additionalConditions.push(
        sql`EXISTS(SELECT 1 FROM ${riskGroups} r WHERE r.user_id = ${users.id} AND r.name = 'ДН')`
      );
    } else if (group === "Беременные") {
      additionalConditions.push(
        sql`EXISTS(SELECT 1 FROM ${pregnancies} p WHERE p.user_id = ${users.id})`
      );
    } else if (group === "ЖВФ") {
      additionalConditions.push(
        sql`EXISTS(SELECT 1 FROM ${fertileWomenRegister} f WHERE f.user_id = ${users.id})`
      );
    }
    // For "Все" group, no additional conditions needed

    const allConditions = [...whereConditions, ...additionalConditions];

    const usersData = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        telephone: users.telephone,
        dateOfBirth: users.dateOfBirth,
        gender: users.gender,
        city: users.city,
        organization: users.organization,
      })
      .from(measurements)
      .innerJoin(users, eq(measurements.userId, users.id))
      .where(and(...allConditions))
      .groupBy(
        users.id,
        users.fullName,
        users.email,
        users.telephone,
        users.dateOfBirth,
        users.gender,
        users.city,
        users.organization
      )
      .orderBy(users.fullName);

    return NextResponse.json({ users: usersData });
  } catch (error) {
    console.error("Error fetching users data:", error);
    return NextResponse.json(
      { error: "Failed to fetch users data" },
      { status: 500 }
    );
  }
}
