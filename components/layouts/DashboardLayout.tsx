"use client";

import { cn } from "@/lib/utils";
import { UserType } from "@/constants/userTypes";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "next-auth/react";

interface NavItem {
  title: string;
  href: string;
}

interface SessionUser {
  id?: string;
  fullName?: string;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  userType: UserType;
  session: SessionUser | null;
}

const doctorNavItems: NavItem[] = [
  { title: "Аккаунт", href: "/dashboard" },
  { title: "Мониторинг", href: "/dashboard/patients" },
  { title: "Обследование", href: "/examination" },
  { title: "Статистика", href: "/statistics" },
];

const nurseNavItems: NavItem[] = [
  { title: "Аккаунт", href: "/dashboard" },
  { title: "Пациенты", href: "/dashboard/patients" },
  { title: "Обследование", href: "/examination" },
  { title: "Статистика", href: "/statistics" },
];

// Function to create patient nav items with chat link containing their ID
const getPatientNavItems = (userId: string): NavItem[] => [
  { title: "Аккаунт", href: "/dashboard" },
  { title: "Чат с медсестрой", href: `/chat?patientId=${userId}` },
  { title: "Мониторинг состояния", href: "/dashboard/monitoring" },
  { title: "Лечение", href: "/dashboard/therapy" },
  { title: "Рекомендации", href: "/dashboard/recomendations" },
  { title: "Прием", href: "/dashboard/consultations" },
];

const DashboardLayout = ({
  children,
  userType,
  session,
}: DashboardLayoutProps) => {
  const pathname = usePathname();

  const navItems =
    userType === UserType.PATIENT
      ? getPatientNavItems(session?.id || "")
      : userType === UserType.NURSE
        ? nurseNavItems
        : doctorNavItems;

  // Extract user name and avatar from session prop
  const userName = session?.fullName || "User";
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-card border-r">
        <div className="p-6">
          <h2 className="text-2xl font-semibold text-primary">Sapa Telemed</h2>
        </div>
        <nav className="px-4 py-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center px-4 py-2 my-1 text-sm rounded-md transition-colors",
                pathname === item.href
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              )}
            >
              {item.title}
            </Link>
          ))}
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1">
        <header className="h-16 border-b flex items-center px-6 bg-card">
          <h1 className="text-lg font-semibold flex-1">
            {navItems.find((item) => item.href === pathname)?.title ||
              "Dashboard"}
          </h1>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div
                className={cn(
                  "flex items-center space-x-3 cursor-pointer",
                  "px-3 py-1.5 rounded-md bg-muted/50 hover:bg-muted transition-colors border border-border"
                )}
              >
                <Avatar>
                  <AvatarImage alt={userName} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{userName}</span>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => signOut({ callbackUrl: "/sign-in" })}
              >
                Выйти
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
