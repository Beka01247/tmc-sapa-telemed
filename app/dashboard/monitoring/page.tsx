import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { UserType } from "@/constants/userTypes";
import MonitoringPage from "@/components/MonitoringPage";

const MonitoringServerPage = async () => {
  const session = await auth();

  if (!session) {
    redirect("/sign-in");
  }

  if (session.user.userType !== UserType.PATIENT) {
    redirect("/dashboard");
  }

  return <MonitoringPage session={session} />;
};

export default MonitoringServerPage;
