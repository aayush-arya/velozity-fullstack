export type Role = "ADMIN" | "PM" | "DEVELOPER";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";
export type Priority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type ActivityAction = "TASK_CREATED" | "STATUS_CHANGED" | "TASK_ASSIGNED" | "TASK_UPDATED" | "TASK_OVERDUE";
export type NotificationType = "TASK_ASSIGNED" | "TASK_IN_REVIEW" | "TASK_OVERDUE";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Client {
  id: string;
  name: string;
  contact: string | null;
}

export interface ProjectSummary {
  id: string;
  name: string;
  description: string | null;
  clientId: string;
  createdById: string;
  createdAt: string;
  client: Client;
  createdBy: { id: string; name: string; email: string };
  _count: { tasks: number };
}

export interface TaskUserRef {
  id: string;
  name: string;
  email?: string;
}

export interface Task {
  id: string;
  number: number;
  projectId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  dueDate: string;
  isOverdue: boolean;
  createdAt: string;
  updatedAt: string;
  assignedTo: TaskUserRef | null;
  createdBy: TaskUserRef;
  project: { id: string; name: string; createdById: string };
}

export interface TaskActivityEntry {
  id: string;
  action: ActivityAction;
  fromStatus: TaskStatus | null;
  toStatus: TaskStatus | null;
  message: string;
  createdAt: string;
  user: { id: string; name: string } | null;
}

export interface TaskWithHistory extends Task {
  activityLog: TaskActivityEntry[];
}

export interface ActivityFeedEvent {
  id: string;
  taskId: string;
  projectId: string;
  action: ActivityAction;
  fromStatus: TaskStatus | null;
  toStatus: TaskStatus | null;
  message: string;
  createdAt: string;
  user: { id: string; name: string } | null;
  task?: { id: string; number: number; title: string };
}

export interface NotificationItem {
  id: string;
  type: NotificationType;
  message: string;
  relatedTaskId: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface PaginatedTasks {
  items: Task[];
  total: number;
  page: number;
  limit: number;
}

export interface TaskFilters {
  projectId?: string;
  status?: TaskStatus;
  priority?: Priority;
  assignedToId?: string;
  overdue?: boolean;
  dueDateFrom?: string;
  dueDateTo?: string;
  page?: number;
  limit?: number;
}

export interface AdminDashboardData {
  totalProjects: number;
  totalTasks: number;
  tasksByStatus: Record<TaskStatus, number>;
  overdueCount: number;
  onlineUsers: number;
}

export interface PmDashboardData {
  projects: ProjectSummary[];
  tasksByPriority: Record<Priority, number>;
  upcomingDueDates: Task[];
  overdueCount: number;
}

export interface DeveloperDashboardData {
  tasks: Task[];
  tasksByStatus: Record<TaskStatus, number>;
}
