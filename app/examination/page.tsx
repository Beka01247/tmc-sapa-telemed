import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { UserType } from "@/constants/userTypes";
import { ExaminationsClient } from "./ExaminationsClient";

interface Patient {
  id: string;
  name: string;
  age: number;
  diagnosis: string;
  isInvited: boolean | undefined;
  completedScreenings: string;
}

async function fetchPatients(
  organization: string,
  city: string,
  riskGroup: string,
  age?: number
): Promise<Patient[]> {
  try {
    const params = new URLSearchParams({
      organization,
      city,
      riskGroup,
    });

    if (age !== undefined) {
      params.append("age", age.toString());
    }

    const response = await fetch(`/api/examinations?${params.toString()}`);
    if (!response.ok) {
      throw new Error("Failed to fetch patients");
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching patients:", error);
    return [];
  }
}

const ExaminationsPage = async () => {
  const session = await auth();

  if (!session || !session.user) {
    redirect("/sign-in");
  }

  const userType = session.user.userType as UserType;

  if (userType === UserType.PATIENT) {
    redirect("/");
  }

  // Fetch both screening and ЖФВ patients initially
  const [screeningPatients, jfvPatients] = await Promise.all([
    fetchPatients(session.user.organization, session.user.city, "Скрининг"),
    fetchPatients(session.user.organization, session.user.city, "ЖФВ"),
  ]);

  return (
    <ExaminationsClient
      initialPatients={screeningPatients}
      jfvPatients={jfvPatients}
      userType={userType}
      userName={session.user.fullName}
      organization={session.user.organization}
      city={session.user.city}
      userId={session.user.id}
    />
  );
};

export default ExaminationsPage;
