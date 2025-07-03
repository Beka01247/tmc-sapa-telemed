"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { CalendarIcon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { UserType } from "@/constants/userTypes";
import { StatisticsUsersModal } from "@/components/StatisticsUsersModal";

interface MonitoringStatistics {
  bloodPressure: Record<string, number>;
  pulse: Record<string, number>;
}

interface UserDetail {
  id: string;
  fullName: string;
  email: string;
  telephone: string;
  dateOfBirth: string | null;
  gender: string | null;
  city: string;
  organization: string;
}

interface StatisticsClientProps {
  userType: UserType;
  userName: string;
  organization: string;
  city: string;
  userId: string;
}

export const StatisticsClient = ({
  userType,
  userName,
  organization,
  city,
  userId,
}: StatisticsClientProps) => {
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [statistics, setStatistics] = useState<MonitoringStatistics | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalUsers, setModalUsers] = useState<UserDetail[]>([]);
  const [modalMeasurementType, setModalMeasurementType] = useState<string>("");
  const [modalGroup, setModalGroup] = useState<string>("");

  const handleSearch = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFrom)
        params.append("dateFrom", dateFrom.toISOString().split("T")[0]);
      if (dateTo) params.append("dateTo", dateTo.toISOString().split("T")[0]);
      params.append("organization", organization);
      params.append("city", city);

      const response = await fetch(`/api/statistics?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setStatistics(data.statistics);
      } else {
        console.error("Error fetching statistics:", data.error);
      }
    } catch (error) {
      console.error("Error fetching statistics:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCellClick = async (measurementType: string, group: string) => {
    if (!statistics) {
      return;
    }

    // Convert measurement type to match the API response structure
    const apiMeasurementKey =
      measurementType === "blood-pressure" ? "bloodPressure" : "pulse";
    const measurementData =
      statistics[apiMeasurementKey as keyof MonitoringStatistics];

    if (
      !measurementData ||
      !measurementData[group] ||
      measurementData[group] === 0
    ) {
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("measurementType", measurementType);
      params.append("group", group);
      params.append("organization", organization);
      params.append("city", city);
      if (dateFrom)
        params.append("dateFrom", dateFrom.toISOString().split("T")[0]);
      if (dateTo) params.append("dateTo", dateTo.toISOString().split("T")[0]);

      const response = await fetch(
        `/api/statistics/users?${params.toString()}`
      );
      const data = await response.json();

      if (response.ok) {
        setModalUsers(data.users);
        setModalMeasurementType(measurementType);
        setModalGroup(group);
        setModalOpen(true);
      } else {
        console.error("Error fetching users:", data.error);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderStatisticsTable = () => {
    if (!statistics) return null;

    const groups = ["ПУЗ", "ДН", "Беременные", "ЖВФ", "Все"];

    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">Показатель</TableHead>
              {groups.map((group) => (
                <TableHead key={group} className="text-center">
                  {group}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">АД</TableCell>
              {groups.map((group) => (
                <TableCell
                  key={group}
                  className="text-center cursor-pointer hover:bg-muted transition-colors"
                  onClick={() => handleCellClick("blood-pressure", group)}
                >
                  <span className="text-black hover:text-gray-700">
                    {statistics.bloodPressure[group] || 0}
                  </span>
                </TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Пульс</TableCell>
              {groups.map((group) => (
                <TableCell
                  key={group}
                  className="text-center cursor-pointer hover:bg-muted transition-colors"
                  onClick={() => handleCellClick("pulse", group)}
                >
                  <span className="text-black hover:text-gray-700">
                    {statistics.pulse[group] || 0}
                  </span>
                </TableCell>
              ))}
            </TableRow>
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <DashboardLayout
      userType={userType}
      session={{ fullName: userName, id: userId }}
    >
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Статистика мониторинга</h2>

        <div className="space-y-6">
          <div className="flex flex-wrap gap-4 items-end justify-center">
            <div className="space-y-2">
              <Label>Дата от</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[240px] justify-start text-left font-normal",
                      !dateFrom && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom
                      ? format(dateFrom, "PPP", { locale: ru })
                      : "Выберите дату"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    initialFocus
                    locale={ru}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Дата до</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[240px] justify-start text-left font-normal",
                      !dateTo && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo
                      ? format(dateTo, "PPP", { locale: ru })
                      : "Выберите дату"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    initialFocus
                    locale={ru}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <Button onClick={handleSearch} className="px-8" disabled={loading}>
              {loading ? "Загрузка..." : "Поиск"}
            </Button>
          </div>

          {statistics && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                Количество людей по группам, проводящих мониторинг
              </h3>
              {renderStatisticsTable()}
            </div>
          )}

          {!statistics && (
            <div className="text-center text-muted-foreground py-8">
              Выберите период и нажмите &quot;Поиск&quot; для получения
              статистики
            </div>
          )}
        </div>
      </div>

      <StatisticsUsersModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
        }}
        users={modalUsers}
        measurementType={modalMeasurementType}
        group={modalGroup}
      />
    </DashboardLayout>
  );
};
