import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { UserType } from "@/constants/userTypes";
import { StatisticsClient } from "./StatisticsClient";

const StatisticsPage = async () => {
  const session = await auth();

  if (!session || !session.user) {
    redirect("/sign-in");
  }

  const userType = session.user.userType as UserType;

  if (userType === UserType.PATIENT) {
    redirect("/");
  }

  return (
    <StatisticsClient
      userType={userType}
      userName={session.user.fullName}
      organization={session.user.organization}
      city={session.user.city}
      userId={session.user.id}
    />
  );
};

export default StatisticsPage;
