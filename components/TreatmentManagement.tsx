"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TreatmentTracker } from "@/components/TreatmentTracker";
import { TreatmentCompliance } from "@/components/TreatmentCompliance";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TreatmentTime {
  id: string;
  time: string;
}

interface Treatment {
  id: string;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes: string | null;
  providerName: string | null;
  times: TreatmentTime[];
}

interface TreatmentManagementProps {
  patientId: string;
  isPatient?: boolean;
  isProvider?: boolean;
}

export const TreatmentManagement = ({
  patientId,
  isPatient = false,
  isProvider = false,
}: TreatmentManagementProps) => {
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTreatments = useCallback(async () => {
    try {
      const response = await fetch(`/api/patients/${patientId}/treatments`);
      if (response.ok) {
        const data = await response.json();
        setTreatments(data);
      }
    } catch (error) {
      console.error("Failed to fetch treatments:", error);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchTreatments();
  }, [fetchTreatments]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Загрузка...</div>
        </CardContent>
      </Card>
    );
  }

  if (isPatient) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Мои лечения</CardTitle>
        </CardHeader>
        <CardContent>
          <TreatmentTracker
            patientId={patientId}
            treatments={treatments}
            isPatient={true}
          />
        </CardContent>
      </Card>
    );
  }

  if (isProvider) {
    return (
      <Tabs defaultValue="tracker" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tracker">Текущие лечения</TabsTrigger>
          <TabsTrigger value="compliance">Соблюдение лечения</TabsTrigger>
        </TabsList>

        <TabsContent value="tracker" className="mt-4">
          <TreatmentTracker
            patientId={patientId}
            treatments={treatments}
            isPatient={false}
          />
        </TabsContent>

        <TabsContent value="compliance" className="mt-4">
          <TreatmentCompliance patientId={patientId} treatments={treatments} />
        </TabsContent>
      </Tabs>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="text-center text-gray-500">
          У вас нет доступа к этой информации
        </div>
      </CardContent>
    </Card>
  );
};
