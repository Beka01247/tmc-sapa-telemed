export enum UserType {
  DISTRICT_DOCTOR = "DISTRICT_DOCTOR", // Участковый врач
  SPECIALIST_DOCTOR = "SPECIALIST_DOCTOR", // Узкий специалист
  NURSE = "NURSE", // Медсестра
  PATIENT = "PATIENT", // Пациент
}

export const userTypeLabels = {
  [UserType.DISTRICT_DOCTOR]: "Участковый врач (ВОП, терапевт, педиатр)",
  [UserType.SPECIALIST_DOCTOR]: "Узкий специалист",
  [UserType.NURSE]: "Медсестра",
  [UserType.PATIENT]: "Пациент",
};

// Дополнительные поля для докторов
export const doctorFields = {
  [UserType.DISTRICT_DOCTOR]: {
    department: "Отделение",
    subdivision: "Подразделение",
    district: "Участок",
  },
  [UserType.SPECIALIST_DOCTOR]: {
    specialization: "Специальность",
    subdivision: "Подразделение",
  },
};
