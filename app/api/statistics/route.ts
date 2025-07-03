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
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const organization = searchParams.get("organization");
    const city = searchParams.get("city");

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

    // Add organization and city filters
    const orgCityConditions = [];
    if (organization) {
      orgCityConditions.push(eq(users.organization, organization));
    }
    if (city) {
      orgCityConditions.push(eq(users.city, city));
    }

    // Get blood pressure monitoring statistics by group
    const bloodPressureByGroup = await db
      .select({
        groupName: sql<string>`CASE 
          WHEN ${users.userType} = 'PATIENT' AND EXISTS(
            SELECT 1 FROM ${pregnancies} p WHERE p.user_id = ${users.id}
          ) THEN 'Беременные'
          WHEN ${users.userType} = 'PATIENT' AND EXISTS(
            SELECT 1 FROM ${fertileWomenRegister} f WHERE f.user_id = ${users.id}
          ) THEN 'ЖВФ'
          WHEN ${users.userType} = 'PATIENT' AND EXISTS(
            SELECT 1 FROM ${riskGroups} r WHERE r.user_id = ${users.id} AND r.name = 'ПУЗ'
          ) THEN 'ПУЗ'
          WHEN ${users.userType} = 'PATIENT' AND EXISTS(
            SELECT 1 FROM ${riskGroups} r WHERE r.user_id = ${users.id} AND r.name = 'ДН'
          ) THEN 'ДН'
          ELSE 'Другие'
        END`,
        userCount: sql<number>`COUNT(DISTINCT ${users.id})`,
      })
      .from(measurements)
      .innerJoin(users, eq(measurements.userId, users.id))
      .where(
        and(
          eq(measurements.type, "blood-pressure"),
          ...dateConditions,
          ...orgCityConditions
        )
      ).groupBy(sql`CASE 
        WHEN ${users.userType} = 'PATIENT' AND EXISTS(
          SELECT 1 FROM ${pregnancies} p WHERE p.user_id = ${users.id}
        ) THEN 'Беременные'
        WHEN ${users.userType} = 'PATIENT' AND EXISTS(
          SELECT 1 FROM ${fertileWomenRegister} f WHERE f.user_id = ${users.id}
        ) THEN 'ЖВФ'
        WHEN ${users.userType} = 'PATIENT' AND EXISTS(
          SELECT 1 FROM ${riskGroups} r WHERE r.user_id = ${users.id} AND r.name = 'ПУЗ'
        ) THEN 'ПУЗ'
        WHEN ${users.userType} = 'PATIENT' AND EXISTS(
          SELECT 1 FROM ${riskGroups} r WHERE r.user_id = ${users.id} AND r.name = 'ДН'
        ) THEN 'ДН'
        ELSE 'Другие'
      END`);

    // Get total blood pressure monitoring users
    const totalBloodPressureUsers = await db
      .select({
        count: sql<number>`COUNT(DISTINCT ${users.id})`,
      })
      .from(measurements)
      .innerJoin(users, eq(measurements.userId, users.id))
      .where(
        and(
          eq(measurements.type, "blood-pressure"),
          ...dateConditions,
          ...orgCityConditions
        )
      );

    // Get pulse monitoring statistics by group
    const pulseByGroup = await db
      .select({
        groupName: sql<string>`CASE 
          WHEN ${users.userType} = 'PATIENT' AND EXISTS(
            SELECT 1 FROM ${pregnancies} p WHERE p.user_id = ${users.id}
          ) THEN 'Беременные'
          WHEN ${users.userType} = 'PATIENT' AND EXISTS(
            SELECT 1 FROM ${fertileWomenRegister} f WHERE f.user_id = ${users.id}
          ) THEN 'ЖВФ'
          WHEN ${users.userType} = 'PATIENT' AND EXISTS(
            SELECT 1 FROM ${riskGroups} r WHERE r.user_id = ${users.id} AND r.name = 'ПУЗ'
          ) THEN 'ПУЗ'
          WHEN ${users.userType} = 'PATIENT' AND EXISTS(
            SELECT 1 FROM ${riskGroups} r WHERE r.user_id = ${users.id} AND r.name = 'ДН'
          ) THEN 'ДН'
          ELSE 'Другие'
        END`,
        userCount: sql<number>`COUNT(DISTINCT ${users.id})`,
      })
      .from(measurements)
      .innerJoin(users, eq(measurements.userId, users.id))
      .where(
        and(
          eq(measurements.type, "pulse"),
          ...dateConditions,
          ...orgCityConditions
        )
      ).groupBy(sql`CASE 
        WHEN ${users.userType} = 'PATIENT' AND EXISTS(
          SELECT 1 FROM ${pregnancies} p WHERE p.user_id = ${users.id}
        ) THEN 'Беременные'
        WHEN ${users.userType} = 'PATIENT' AND EXISTS(
          SELECT 1 FROM ${fertileWomenRegister} f WHERE f.user_id = ${users.id}
        ) THEN 'ЖВФ'
        WHEN ${users.userType} = 'PATIENT' AND EXISTS(
          SELECT 1 FROM ${riskGroups} r WHERE r.user_id = ${users.id} AND r.name = 'ПУЗ'
        ) THEN 'ПУЗ'
        WHEN ${users.userType} = 'PATIENT' AND EXISTS(
          SELECT 1 FROM ${riskGroups} r WHERE r.user_id = ${users.id} AND r.name = 'ДН'
        ) THEN 'ДН'
        ELSE 'Другие'
      END`);

    // Get total pulse monitoring users
    const totalPulseUsers = await db
      .select({
        count: sql<number>`COUNT(DISTINCT ${users.id})`,
      })
      .from(measurements)
      .innerJoin(users, eq(measurements.userId, users.id))
      .where(
        and(
          eq(measurements.type, "pulse"),
          ...dateConditions,
          ...orgCityConditions
        )
      );

    // Initialize result structure
    const groups = ["ПУЗ", "ДН", "Беременные", "ЖВФ", "Все"];
    const statistics = {
      bloodPressure: {} as Record<string, number>,
      pulse: {} as Record<string, number>,
    };

    // Initialize all groups with 0
    groups.forEach((group) => {
      statistics.bloodPressure[group] = 0;
      statistics.pulse[group] = 0;
    });

    // Fill in blood pressure data by group
    bloodPressureByGroup.forEach((stat) => {
      if (stat.groupName !== "Другие") {
        statistics.bloodPressure[stat.groupName] = stat.userCount;
      }
    });

    // Set total blood pressure users (including all groups and ungrouped users)
    statistics.bloodPressure["Все"] = totalBloodPressureUsers[0]?.count || 0;

    // Fill in pulse data by group
    pulseByGroup.forEach((stat) => {
      if (stat.groupName !== "Другие") {
        statistics.pulse[stat.groupName] = stat.userCount;
      }
    });

    // Set total pulse users (including all groups and ungrouped users)
    statistics.pulse["Все"] = totalPulseUsers[0]?.count || 0;

    return NextResponse.json({ statistics });
  } catch (error) {
    console.error("Error fetching statistics:", error);
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 }
    );
  }
}
