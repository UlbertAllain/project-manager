// ==================== SHARED TYPES ====================
// Mirror of Prisma models + frontend-only types

export interface Project {
  id: string;
  projectName: string;
  clientName: string;
  projectLead: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  techStack: string[];
  startDate: string;
  deadline: string;
  completedDate: string | null;
  budget: number;
  paidAmount: number;
  totalExpense: number;
  paymentStatus: string;
  progress: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
  tasks: Task[];
  attachments: LinkAttachment[];
  transactions: Transaction[];
  comments: Comment[];
  logs: ActivityLog[];
}

export interface Task {
  id: string;
  title: string;
  isCompleted: boolean;
  order: number;
  projectId: string;
}

export interface LinkAttachment {
  id: string;
  title: string;
  url: string;
  platform: string;
  projectId: string;
}

export interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  date: string;
  projectId: string;
  createdAt: string;
  project?: { projectName: string };
}

export interface Comment {
  id: string;
  userEmail: string;
  message: string;
  projectId: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  message: string;
  projectId: string;
  timestamp: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}
