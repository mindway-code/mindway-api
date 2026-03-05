
export type TaskStatus = "pending" | "in_progress" | "done" | "canceled";

export type ListTasksResponse = {
  items: unknown[];
  meta: { pagination: { page: number; pageSize: number; total: number; totalPages: number } };
};

export type CreateTaskDTO = {
  therapistId: string;
  userId: string;
  status?: TaskStatus;
  title: string;
  description?: string | null;
  feedback?: string | null;
  note?: string | null;
};

export type UpdateTaskDTO = {
  status: TaskStatus;
  title?: string;
  description?: string | null;
  feedback?: string | null;
  note?: string | null;
};

export type TaskRecord = {
  id: string;
  therapistId: string;
  userId: string;
  status: string;
  title: string;
  description: string | null;
  feedback: string | null;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;

  therapist?: { id: string; name: string; email: string | null };
  user?: { id: string; name: string; email: string | null };
};

export type CreateTaskInput = {
  therapistId: string;
  userId: string;
  status?: TaskStatus;
  title: string;
  description?: string | null;
  feedback?: string | null;
  note?: string | null;
};

export type ListTasksParams = {
  status?: TaskStatus;
  skip?: number;
  take?: number;
};

export type ListTasksResult = {
  items: TaskRecord[];
  total: number;
};

export type UpdateTaskInput = {
  status: TaskStatus;
  title?: string;
  description?: string | null;
  feedback?: string | null;
  note?: string | null;
};

export type DeleteTaskResult = { id: string };
