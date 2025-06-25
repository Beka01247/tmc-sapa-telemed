import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db/drizzle";
import { receptions, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { UserType } from "@/constants/userTypes";
import ConsultationsClient from "./ConsultationsClient";

interface Reception {
  id: string;
  patientId: string;
  providerId: string | null;
  providerName: string | null;
  anamnesis: string;
  complaints: string;
  objectiveStatus: string;
  diagnosis: string;
  examinations: string;
  treatment: string;
  recommendations: string;
  createdAt: string;
  updatedAt: string;
}

const ConsultationsPage = async () => {
  const session = await auth();

  if (!session) {
    redirect("/sign-in");
  }

  const userType = session.user.userType as UserType;

  // Only fetch receptions for patients
  let patientReceptions: Reception[] = [];

  if (userType === UserType.PATIENT) {
    try {
      // Get all receptions for this patient with provider information
      const data = await db
        .select({
          id: receptions.id,
          patientId: receptions.patientId,
          providerId: receptions.providerId,
          providerName: users.fullName,
          anamnesis: receptions.anamnesis,
          complaints: receptions.complaints,
          objectiveStatus: receptions.objectiveStatus,
          diagnosis: receptions.diagnosis,
          examinations: receptions.examinations,
          treatment: receptions.treatment,
          recommendations: receptions.recommendations,
          createdAt: receptions.createdAt,
          updatedAt: receptions.updatedAt,
        })
        .from(receptions)
        .leftJoin(users, eq(receptions.providerId, users.id))
        .where(eq(receptions.patientId, session.user.id))
        .orderBy(receptions.createdAt);

      // Format dates
      patientReceptions = data.map((reception) => ({
        ...reception,
        createdAt:
          reception.createdAt instanceof Date
            ? reception.createdAt.toISOString()
            : reception.createdAt || new Date().toISOString(),
        updatedAt:
          reception.updatedAt instanceof Date
            ? reception.updatedAt.toISOString()
            : reception.updatedAt || new Date().toISOString(),
      }));
    } catch (error) {
      console.error("Error fetching receptions:", error);
      patientReceptions = [];
    }
  }

  return (
    <DashboardLayout
      userType={userType}
      session={{
        fullName: session.user.fullName,
        id: session.user.id,
      }}
    >
      <ConsultationsClient receptions={patientReceptions} />
    </DashboardLayout>
  );
};

export default ConsultationsPage;
