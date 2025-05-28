"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { UserType } from "@/constants/userTypes";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Link from "next/link";

interface Patient {
  id: string;
  name: string;
  age: number;
  diagnosis: string | null;
  isInvited: boolean;
}

interface ExaminationsClientProps {
  initialPatients: Patient[];
  userType: UserType;
  userName: string;
  organization: string;
  city: string;
}

export const ExaminationsClient = ({
  initialPatients,
  userType,
  userName,
  organization,
  city,
}: ExaminationsClientProps) => {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>(initialPatients);
  const [age, setAge] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("Скрининг");
  const [patientCount, setPatientCount] = useState<number>(
    initialPatients.length
  );

  const riskGroups = [
    "Скрининг",
    "Вакцинация",
    "Беременные",
    "ЖФВ",
    "ДУ",
    "ПУЗ",
  ];

  useEffect(() => {
    fetchPatients();
  }, [activeTab, age]);

  const fetchPatients = async () => {
    try {
      const params = new URLSearchParams();

      if (activeTab === "Скрининг") {
        params.append("noRiskGroupFilter", "true");
      } else {
        params.append("riskGroup", activeTab);
      }

      if (activeTab === "Скрининг" && age) {
        params.append("age", age);
      }

      const response = await fetch(`/api/patients?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Не удалось загрузить пациентов");
      }
      const data = await response.json();
      setPatients(data);
      setPatientCount(data.length);
    } catch (error) {
      console.error("Ошибка при загрузке пациентов:", error);
      toast.error("Ошибка при загрузке пациентов");
    }
  };

  const handleInvite = async (patientId: string) => {
    try {
      const response = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId,
          riskGroup: activeTab,
        }),
      });

      if (!response.ok) {
        throw new Error("Не удалось отправить приглашение");
      }

      setPatients(
        patients.map((p) =>
          p.id === patientId ? { ...p, isInvited: true } : p
        )
      );
      toast.success("Приглашение отправлено");
    } catch (error) {
      console.error("Ошибка при отправке приглашения:", error);
      toast.error("Ошибка при отправке приглашения");
    }
  };

  const handleAgeFilterChange = () => {
    const ageValue = age ? parseInt(age) : undefined;
    if (
      ageValue !== undefined &&
      (isNaN(ageValue) || ageValue < 0 || ageValue > 120)
    ) {
      toast.error("Введите корректный возраст (0-120)");
      return;
    }
    fetchPatients();
  };

  const renderPatientTable = () => (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ФИО</TableHead>
            <TableHead>Возраст</TableHead>
            <TableHead>Диагноз</TableHead>
            <TableHead>Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {patients.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center">
                Нет пациентов в группе риска
              </TableCell>
            </TableRow>
          ) : (
            patients.map((patient) => (
              <TableRow key={patient.id}>
                <TableCell>{patient.name}</TableCell>
                <TableCell>{patient.age}</TableCell>
                <TableCell>{patient.diagnosis}</TableCell>
                <TableCell className="flex space-x-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/patients/${patient.id}`}>
                      Подробнее
                    </Link>
                  </Button>
                  <Button
                    variant={patient.isInvited ? "secondary" : "default"}
                    size="sm"
                    onClick={() => handleInvite(patient.id)}
                    disabled={patient.isInvited}
                  >
                    {patient.isInvited ? "Приглашен(а)" : "Пригласить"}
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <DashboardLayout userType={userType} session={{ fullName: userName }}>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Обследования</h2>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            {riskGroups.map((group) => (
              <TabsTrigger key={group} value={group}>
                {group}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="Скрининг">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-2 mx-auto">
                <span className="font-medium">Возраст:</span>
                <Input
                  id="age"
                  type="number"
                  placeholder="0"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  min="0"
                  max="120"
                  className="w-24"
                />
                <Button onClick={handleAgeFilterChange}>Применить</Button>
              </div>
              <div className="whitespace-nowrap">
                Найдено пациентов: {patientCount}
              </div>
            </div>
            <div className="mt-4">{renderPatientTable()}</div>
          </TabsContent>
          {riskGroups.slice(1).map((group) => (
            <TabsContent key={group} value={group}>
              <div className="space-y-4">
                <div className="text-center">
                  Найдено пациентов: {patients.length}
                </div>
                {renderPatientTable()}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </DashboardLayout>
  );
};
