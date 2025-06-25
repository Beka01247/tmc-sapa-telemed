import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface MonitoringItem {
  id: string;
  title: string;
  unit: string;
  inputType: "single" | "double" | "text";
  defaultValue: string;
}

interface Measurement {
  id: string;
  type: string;
  value1: string;
  value2: string | null;
  createdAt: string;
}

interface StatisticsModalProps {
  item: MonitoringItem;
  measurements: Measurement[];
  onClose: () => void;
}

const StatisticsModal = ({
  item,
  measurements,
  onClose,
}: StatisticsModalProps) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("ru-RU", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Prepare chart data
  const chartData = {
    labels: measurements.map((m) => formatDate(m.createdAt)),
    datasets: [
      {
        label: item.inputType === "double" ? "Значение 1" : "Значение",
        data: measurements.map((m) => parseFloat(m.value1) || 0),
        borderColor: "rgb(75, 192, 192)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        tension: 0.1,
      },
      ...(item.inputType === "double"
        ? [
            {
              label: "Значение 2",
              data: measurements.map((m) => parseFloat(m.value2 || "0") || 0),
              borderColor: "rgb(255, 99, 132)",
              backgroundColor: "rgba(255, 99, 132, 0.2)",
              tension: 0.1,
            },
          ]
        : []),
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          color: "#000000",
        },
      },
      title: {
        display: true,
        text: `График изменений: ${item.title}`,
        color: "#000000",
      },
    },
    scales: {
      x: {
        ticks: {
          color: "#000000",
        },
        grid: {
          color: "#374151",
        },
      },
      y: {
        ticks: {
          color: "#000000",
        },
        grid: {
          color: "#374151",
        },
        title: {
          display: true,
          text: item.unit || "Значение",
          color: "#000000",
        },
      },
    },
  };

  return (
    <Dialog open={!!item} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-white text-black">
        <DialogHeader>
          <DialogTitle>Мониторинг: {item.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Line data={chartData} options={chartOptions} />
          <Card className="bg-white">
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-2">Все измерения</h3>
              {measurements.length === 0 ? (
                <p className="text-gray-400">Нет данных</p>
              ) : (
                <ul className="space-y-2">
                  {measurements.map((m) => (
                    <li key={m.id} className="text-sm">
                      {formatDate(m.createdAt)}: {m.value1}
                      {item.inputType === "double" &&
                        m.value2 &&
                        `/${m.value2}`}{" "}
                      {item.unit}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StatisticsModal;
