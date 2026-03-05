export type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "completed"
  | "canceled"
  | "no_show";

export type AppointmentRecord = {
  id: string;
  therapistId: string;
  userId: string;
  status: AppointmentStatus;
  title: string | null;
  startsAt: Date;
  endsAt: Date;
  note: string | null;
  feedback: string | null;
  createdAt: Date;
  updatedAt: Date;
  therapist: { id: string; name: string; email?: string | null };
  user: { id: string; name: string; email?: string | null };
};

export type CreateAppointmentInput = {
  therapistId: string;
  userId: string;
  status?: AppointmentStatus;
  title?: string | null;
  startsAt: Date;
  endsAt: Date;
  note?: string | null;
  feedback?: string | null;
};

export type CreateAppointmentDTO = {
  therapistId?: string;
  userId?: string;
  status?: AppointmentStatus;
  title?: string | null;
  startsAt?: string | Date;
  endsAt?: string | Date;
  note?: string | null;
  feedback?: string | null;
};

export type ListAppointmentsParams = {
  status?: AppointmentStatus;
  skip?: number;
  take?: number;
};

export type ListAppointmentsResult = {
  items: AppointmentRecord[];
  total: number;
};

export type ListAppointmentsResponse = {
  items: AppointmentRecord[];
  meta: { pagination: { page: number; pageSize: number; total: number; totalPages: number } };
};

export type UpdateAppointmentInput = {
  status?: AppointmentStatus;
  title?: string | null;
  startsAt?: Date;
  endsAt?: Date;
  note?: string | null;
  feedback?: string | null;
};

export type UpdateAppointmentDTO = {
  status?: AppointmentStatus;
  title?: string | null;
  startsAt?: Date;
  endsAt?: Date;
  note?: string | null;
  feedback?: string | null;
};

export type DeleteAppointmentResult = { id: string };
