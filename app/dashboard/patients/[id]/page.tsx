import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { PatientDetailsClient } from "./PatientDetailsClient";
import { db } from "@/db/drizzle";
import {
  users,
  consultations,
  treatments,
  recommendations,
  files,
  measurements,
  diagnoses,
  riskGroups,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { UserType } from "@/constants/userTypes";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";

async function fetchPatientData(
  patientId: string,
  organization: string,
  city: string
) {
  try {
    const [patient] = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        iin: users.iin,
        email: users.email,
        telephone: users.telephone,
        city: users.city,
        organization: users.organization,
        dateOfBirth: users.dateOfBirth,
      })
      .from(users)
      .where(
        and(
          eq(users.id, patientId),
          eq(users.userType, "PATIENT"),
          eq(users.organization, organization),
          eq(users.city, city)
        )
      );

    if (!patient) {
      throw new Error("Пациент не найден");
    }

    const consultationsData = await db
      .select({
        id: consultations.id,
        consultationDate: consultations.consultationDate,
        notes: consultations.notes,
        status: consultations.status,
        providerName: users.fullName,
      })
      .from(consultations)
      .leftJoin(users, eq(consultations.providerId, users.id))
      .where(eq(consultations.patientId, patientId))
      .then((data) =>
        data.map((consultation) => ({
          ...consultation,
          consultationDate: consultation.consultationDate.toISOString(),
          status: consultation.status ?? "SCHEDULED",
        }))
      )
      .catch(() => []);

    const treatmentsData = await db
      .select({
        id: treatments.id,
        medication: treatments.medication,
        dosage: treatments.dosage,
        frequency: treatments.frequency,
        duration: treatments.duration,
        notes: treatments.notes,
        providerName: users.fullName,
      })
      .from(treatments)
      .leftJoin(users, eq(treatments.providerId, users.id))
      .where(eq(treatments.patientId, patientId))
      .catch(() => []);

    const recommendationsData = await db
      .select({
        id: recommendations.id,
        description: recommendations.description,
        providerName: users.fullName,
        createdAt: recommendations.createdAt,
      })
      .from(recommendations)
      .leftJoin(users, eq(recommendations.providerId, users.id))
      .where(eq(recommendations.patientId, patientId))
      .then((data) =>
        data.map((recommendation) => ({
          ...recommendation,
          createdAt:
            recommendation.createdAt?.toISOString() ?? new Date().toISOString(),
        }))
      )
      .catch(() => []);

    const filesData = await db
      .select({
        id: files.id,
        fileName: files.fileName,
        fileUrl: files.fileUrl,
        description: files.description,
        uploadedBy: users.fullName,
        createdAt: files.createdAt,
      })
      .from(files)
      .leftJoin(users, eq(files.uploadedBy, users.id))
      .where(eq(files.patientId, patientId))
      .then((data) =>
        data.map((file) => ({
          ...file,
          createdAt: file.createdAt?.toISOString() ?? new Date().toISOString(),
        }))
      )
      .catch(() => []);

    const measurementsData = await db
      .select({
        id: measurements.id,
        type: measurements.type,
        value1: measurements.value1,
        value2: measurements.value2,
        createdAt: measurements.createdAt,
      })
      .from(measurements)
      .where(eq(measurements.userId, patientId))
      .then((data) =>
        data.map((measurement) => ({
          ...measurement,
          createdAt:
            measurement.createdAt?.toISOString() ?? new Date().toISOString(),
        }))
      )
      .catch(() => []);

    const diagnosesData = await db
      .select({
        id: diagnoses.id,
        description: diagnoses.description,
      })
      .from(diagnoses)
      .where(eq(diagnoses.userId, patientId))
      .then((data) => data || []) // Ensure array
      .catch(() => []);

    const riskGroupsData = await db
      .select({
        id: riskGroups.id,
        name: riskGroups.name,
      })
      .from(riskGroups)
      .where(eq(riskGroups.userId, patientId))
      .then((data) => data || []) // Ensure array
      .catch(() => []);

    return {
      patient: {
        ...patient,
        diagnoses: diagnosesData,
        riskGroups: riskGroupsData,
      },
      consultations: consultationsData,
      treatments: treatmentsData,
      recommendations: recommendationsData,
      files: filesData,
      measurements: measurementsData,
    };
  } catch (err) {
    throw new Error(
      err instanceof Error
        ? err.message
        : "Не удалось загрузить данные пациента"
    );
  }
}

export default async function PatientDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();

  if (!session || !session.user?.id) {
    redirect("/sign-in");
  }

  try {
    const data = await fetchPatientData(
      params.id,
      session.user.organization,
      session.user.city
    );

    return (
      <PatientDetailsClient
        initialData={data}
        userType={(session.user.userType as UserType) || "DOCTOR"}
        userName={session.user.fullName || "Пользователь"}
        patientId={params.id}
      />
    );
  } catch (err) {
    return (
      <DashboardLayout
        userType={(session.user?.userType as UserType) || "DOCTOR"}
        session={{ fullName: session.user?.fullName || "Ошибка" }}
      >
        <div className="text-red-600 text-center">
          {err instanceof Error ? err.message : "Пациент не найден"}
        </div>
      </DashboardLayout>
    );
  }
}
