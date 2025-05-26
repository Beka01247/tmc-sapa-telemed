"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { AddRecommendationForm } from "@/components/AddRecommendationForm";
import { toast } from "sonner";

interface Recommendation {
  id: string;
  description: string;
  providerName: string | null;
  createdAt: string;
}

interface RecommendationsTabProps {
  recommendations: Recommendation[];
  isProvider: boolean;
  patientId: string;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
}

export const RecommendationsTab = ({
  recommendations,
  isProvider,
  patientId,
  isModalOpen,
  setIsModalOpen,
}: RecommendationsTabProps) => {
  const handleAddSuccess = async () => {
    setIsModalOpen(false);
    toast.success("Рекомендация добавлена");
    window.location.reload();
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Рекомендации</CardTitle>
          {isProvider && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsModalOpen(true)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Добавить рекомендацию</TooltipContent>
            </Tooltip>
          )}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Описание</TableHead>
                <TableHead>Врач</TableHead>
                <TableHead>Дата</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recommendations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center">
                    Нет данных
                  </TableCell>
                </TableRow>
              ) : (
                recommendations.map((recommendation) => (
                  <TableRow key={recommendation.id}>
                    <TableCell>{recommendation.description}</TableCell>
                    <TableCell>
                      {recommendation.providerName || "Не указан"}
                    </TableCell>
                    <TableCell>
                      {new Date(recommendation.createdAt).toLocaleDateString(
                        "ru-RU"
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Добавить рекомендацию</DialogTitle>
          </DialogHeader>
          <AddRecommendationForm
            patientId={patientId}
            onSuccess={handleAddSuccess}
            onCancel={() => setIsModalOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};
