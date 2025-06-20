"use client";
import { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";

export const metadata = {
  title: "My App",
  description: "My description",
};

export interface AuthContextProps {
  children: React.ReactNode;
  session: Session;
}

const AuthContext = ({ children }: AuthContextProps) => {
  return <SessionProvider>{children}</SessionProvider>;
};

export default AuthContext;
