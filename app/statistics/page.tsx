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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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

interface StatisticsData {
  total: number;
  completed: number;
  good: number;
  bad: number;
}

const analysisTypes = [
  { value: "DU", label: "ДУ" },
  { value: "PUZ", label: "ПУЗ" },
  { value: "JFV", label: "ЖФВ" },
];

// Mock data generator
const generateMockStats = (): StatisticsData => {
  const total = Math.floor(Math.random() * 100) + 50;
  const completed = Math.floor(Math.random() * total);
  const good = Math.floor(Math.random() * completed);
  const bad = completed - good;

  return {
    total,
    completed,
    good,
    bad,
  };
};

const StatisticsPage = () => {
  const [analysisType, setAnalysisType] = useState<string>("");
  const [age, setAge] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [stats, setStats] = useState<StatisticsData | null>(null);

  const handleSearch = () => {
    // In a real application, this would make an API call
    setStats(generateMockStats());
  };

  const renderStatisticsTable = () => {
    const completedPercent = (
      ((stats?.completed || 0) / (stats?.total || 1)) *
      100
    ).toFixed(1);
    const goodPercent = (
      ((stats?.good || 0) / (stats?.completed || 1)) *
      100
    ).toFixed(1);
    const badPercent = (
      ((stats?.bad || 0) / (stats?.completed || 1)) *
      100
    ).toFixed(1);

    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Показатель</TableHead>
              <TableHead>Количество</TableHead>
              <TableHead>Процент</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">Всего приглашено</TableCell>
              <TableCell>{stats?.total || 0}</TableCell>
              <TableCell>100%</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Прошли анализ</TableCell>
              <TableCell>{stats?.completed || 0}</TableCell>
              <TableCell>{completedPercent}%</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Хорошие результаты</TableCell>
              <TableCell className="text-green-600">
                {stats?.good || 0}
              </TableCell>
              <TableCell className="text-green-600">{goodPercent}%</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Плохие результаты</TableCell>
              <TableCell className="text-red-600">{stats?.bad || 0}</TableCell>
              <TableCell className="text-red-600">{badPercent}%</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <DashboardLayout
      userType={UserType.DOCTOR}
      session={{ fullName: "", id: "" }}
    >
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Статистика</h2>

        <div className="space-y-6">
          <div className="flex flex-wrap gap-4 items-end justify-center">
            <div className="w-64">
              <Label htmlFor="analysis-type">Тип анализа</Label>
              <Select value={analysisType} onValueChange={setAnalysisType}>
                <SelectTrigger id="analysis-type">
                  <SelectValue placeholder="Выберите тип анализа" />
                </SelectTrigger>
                <SelectContent>
                  {analysisTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-32">
              <Label htmlFor="age">Возраст</Label>
              <Input
                id="age"
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="Возраст"
                min="0"
                max="120"
              />
            </div>

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

            <Button onClick={handleSearch} className="px-8">
              Поиск
            </Button>
          </div>

          {stats && renderStatisticsTable()}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StatisticsPage;
