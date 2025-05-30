"use server";

export async function getStatusColor(status: string) {
  switch (status) {
    case "PENDING":
    case "INVITED":
      return "bg-blue-100 text-blue-800";
    case "COMPLETED":
      return "bg-yellow-100 text-yellow-800";
    case "CONFIRMED":
      return "bg-green-100 text-green-800";
    case "CANCELLED":
    case "REJECTED":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export async function getStatusText(status: string) {
  switch (status) {
    case "PENDING":
    case "INVITED":
      return "Приглашен";
    case "COMPLETED":
      return "Пройдено";
    case "CONFIRMED":
      return "Подтверждено";
    case "CANCELLED":
      return "Отменено";
    case "REJECTED":
      return "Отклонено";
    default:
      return status;
  }
}
