// Firestore utility functions that mirror Prisma operations
// This replaces the old Prisma db client with Firebase Firestore equivalents

import { collections, adminDb } from '@/lib/firebase-admin';
import {
  DocumentSnapshot,
  QueryDocumentSnapshot,
} from 'firebase-admin/firestore';
import type { Project, Task, LinkAttachment, Transaction, Comment, ActivityLog, AuthUser } from '@/lib/types';

// ==================== SHARED TYPES ====================

type ProjectWithRelations = Project & {
  tasks: Task[];
  attachments: LinkAttachment[];
  transactions: Transaction[];
  comments: Comment[];
  logs: ActivityLog[];
};

type ProjectCreateResult = {
  id: string;
  projectName: string;
  clientName: string;
  projectLead: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  techStack: string | string[];
  startDate: string;
  deadline: string;
  completedDate: string | null;
  budget: number;
  paidAmount: number;
  totalExpense: number;
  paymentStatus: string;
  progress: number;
  notes: string;
  coverImage: string | null;
  createdAt: string;
  updatedAt: string;
};

// ==================== HELPERS ====================

function docToObj<T>(doc: DocumentSnapshot | QueryDocumentSnapshot): T {
  const data = doc.data();
  if (!data) return null as T;
  return {
    id: doc.id,
    ...data,
  } as T;
}

function generateId(): string {
  return adminDb.collection('_tmp').doc().id;
}

// ==================== PROJECT OPERATIONS ====================

async function getProjectWithRelations(projectId: string): Promise<ProjectWithRelations | null> {
  const projectDoc = await collections.projects.doc(projectId).get();
  if (!projectDoc.exists) return null;

  const projectData = projectDoc.data()!;

  // Fetch related collections in parallel — use get() without orderBy to avoid index issues
  const [tasksSnap, attachmentsSnap, transactionsSnap, commentsSnap, logsSnap] = await Promise.all([
    collections.tasks.where('projectId', '==', projectId).get(),
    collections.attachments.where('projectId', '==', projectId).get(),
    collections.transactions.where('projectId', '==', projectId).get(),
    collections.comments.where('projectId', '==', projectId).get(),
    collections.activityLogs.where('projectId', '==', projectId).get(),
  ]);

  // Sort in memory instead of Firestore to avoid composite index requirements
  const tasks = tasksSnap.docs.map((d) => docToObj<Task>(d)).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const transactions = transactionsSnap.docs.map((d) => docToObj<Transaction>(d)).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const comments = commentsSnap.docs.map((d) => docToObj<Comment>(d)).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const logs = logsSnap.docs.map((d) => docToObj<ActivityLog>(d)).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return {
    id: projectDoc.id,
    ...projectData,
    techStack: JSON.parse(projectData.techStack || '[]'),
    tasks,
    attachments: attachmentsSnap.docs.map((d) => docToObj<LinkAttachment>(d)),
    transactions,
    comments,
    logs,
  } as ProjectWithRelations;
}

// ==================== DB OBJECT (mirrors Prisma API) ====================

export const db = {
  // ===== USER =====
  user: {
    findUnique: async ({ where }: { where: { id?: string; email?: string } }): Promise<(AuthUser & { password?: string }) | null> => {
      if (where.email) {
        const snap = await collections.users.where('email', '==', where.email).limit(1).get();
        if (snap.empty) return null;
        return docToObj<AuthUser & { password?: string }>(snap.docs[0]);
      }
      if (where.id) {
        const doc = await collections.users.doc(where.id).get();
        if (!doc.exists) return null;
        return docToObj<AuthUser & { password?: string }>(doc);
      }
      return null;
    },

    upsert: async ({ where, update, create }: { where: { email: string }; update: Record<string, unknown>; create: Record<string, unknown> }): Promise<AuthUser & { password?: string }> => {
      const snap = await collections.users.where('email', '==', where.email).limit(1).get();
      if (!snap.empty) {
        const existingDoc = snap.docs[0];
        await collections.users.doc(existingDoc.id).update(update);
        const updatedDoc = await collections.users.doc(existingDoc.id).get();
        return docToObj<AuthUser & { password?: string }>(updatedDoc);
      }
      const id = generateId();
      const now = new Date().toISOString();
      const data = { ...create, createdAt: now, updatedAt: now };
      await collections.users.doc(id).set(data);
      return { id, ...data } as AuthUser & { password?: string };
    },

    update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }): Promise<AuthUser> => {
      await collections.users.doc(where.id).update({ ...data, updatedAt: new Date().toISOString() });
      const doc = await collections.users.doc(where.id).get();
      return docToObj<AuthUser>(doc);
    },

    create: async ({ data }: { data: Record<string, unknown> }): Promise<AuthUser & { password?: string }> => {
      const id = generateId();
      const now = new Date().toISOString();
      const docData = { ...data, createdAt: now, updatedAt: now };
      await collections.users.doc(id).set(docData);
      return { id, ...docData } as AuthUser & { password?: string };
    },
  },

  // ===== PROJECT =====
  project: {
    findMany: async (opts?: {
      orderBy?: Record<string, string>;
      include?: Record<string, unknown>;
      where?: Record<string, unknown>;
    }): Promise<Record<string, unknown>[]> => {
      // Use simple get() without orderBy to avoid index issues
      // Sort in memory instead
      let query = collections.projects;

      if (opts?.where) {
        let q = collections.projects;
        for (const [key, value] of Object.entries(opts.where)) {
          if (key === 'id' && typeof value === 'object' && value !== null && 'in' in (value as object)) {
            q = q.where(key, 'in', (value as { in: string[] }).in);
          } else {
            q = q.where(key, '==', value);
          }
        }
        query = q;
      }

      const snap = await query.get();
      const projects: Record<string, unknown>[] = [];

      for (const doc of snap.docs) {
        const projectData = doc.data();
        const project: Record<string, unknown> = {
          id: doc.id,
          ...projectData,
          techStack: JSON.parse(projectData.techStack || '[]'),
        };

        if (opts?.include) {
          // Use simple where queries without orderBy to avoid composite index requirements
          if ('tasks' in opts.include) {
            const tasksSnap = await collections.tasks.where('projectId', '==', doc.id).get();
            project.tasks = tasksSnap.docs.map((d) => docToObj<Task>(d)).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
          }
          if ('attachments' in opts.include) {
            const attSnap = await collections.attachments.where('projectId', '==', doc.id).get();
            project.attachments = attSnap.docs.map((d) => docToObj<LinkAttachment>(d));
          }
          if ('transactions' in opts.include) {
            const txSnap = await collections.transactions.where('projectId', '==', doc.id).get();
            project.transactions = txSnap.docs.map((d) => docToObj<Transaction>(d)).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          }
          if ('comments' in opts.include) {
            const cmSnap = await collections.comments.where('projectId', '==', doc.id).get();
            project.comments = cmSnap.docs.map((d) => docToObj<Comment>(d)).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          }
          if ('logs' in opts.include) {
            const logSnap = await collections.activityLogs.where('projectId', '==', doc.id).get();
            project.logs = logSnap.docs.map((d) => docToObj<ActivityLog>(d)).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          }
        }

        projects.push(project);
      }

      // Sort in memory by createdAt desc (handle missing field gracefully)
      projects.sort((a, b) => {
        const dateA = new Date((a.createdAt as string) || 0).getTime();
        const dateB = new Date((b.createdAt as string) || 0).getTime();
        return dateB - dateA;
      });

      return projects;
    },

    findUnique: async ({ where, include }: { where: { id: string }; include?: Record<string, unknown> }): Promise<ProjectWithRelations | Project | null> => {
      if (include) {
        return getProjectWithRelations(where.id);
      }
      const doc = await collections.projects.doc(where.id).get();
      if (!doc.exists) return null;
      const data = doc.data()!;
      return {
        id: doc.id,
        ...data,
        techStack: JSON.parse(data.techStack || '[]'),
      } as Project;
    },

    create: async ({ data, include }: { data: Record<string, unknown>; include?: Record<string, unknown> }): Promise<ProjectCreateResult> => {
      const id = generateId();
      const now = new Date().toISOString();

      // Separate nested creates (tasks, attachments, transactions, comments)
      const { tasks, attachments, transactions, comments, ...projectData } = data as Record<string, unknown>;
      const docData: Record<string, unknown> = {
        ...projectData,
        createdAt: now,
        updatedAt: now,
      };

      await collections.projects.doc(id).set(docData);

      // Create nested items if provided
      if (tasks && typeof tasks === 'object' && 'create' in (tasks as object)) {
        const taskItems = (tasks as { create: unknown[] }).create;
        for (const t of taskItems) {
          const taskId = generateId();
          await collections.tasks.doc(taskId).set({
            ...(t as Record<string, unknown>),
            projectId: id,
          });
        }
      }

      if (attachments && typeof attachments === 'object' && 'create' in (attachments as object)) {
        const items = (attachments as { create: unknown[] }).create;
        for (const a of items) {
          const aId = generateId();
          await collections.attachments.doc(aId).set({
            ...(a as Record<string, unknown>),
            projectId: id,
          });
        }
      }

      if (transactions && typeof transactions === 'object' && 'create' in (transactions as object)) {
        const items = (transactions as { create: unknown[] }).create;
        for (const t of items) {
          const tId = generateId();
          await collections.transactions.doc(tId).set({
            ...(t as Record<string, unknown>),
            projectId: id,
            createdAt: now,
          });
        }
      }

      if (comments && typeof comments === 'object' && 'create' in (comments as object)) {
        const items = (comments as { create: unknown[] }).create;
        for (const c of items) {
          const cId = generateId();
          await collections.comments.doc(cId).set({
            ...(c as Record<string, unknown>),
            projectId: id,
            createdAt: now,
          });
        }
      }

      if (include) {
        const result = await getProjectWithRelations(id);
        return result as unknown as ProjectCreateResult;
      }

      const doc = await collections.projects.doc(id).get();
      const docDataResult = doc.data()!;
      return {
        id: doc.id,
        ...docDataResult,
        techStack: JSON.parse(docDataResult.techStack || '[]'),
      } as unknown as ProjectCreateResult;
    },

    update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }): Promise<Project> => {
      await collections.projects.doc(where.id).update({
        ...data,
        updatedAt: new Date().toISOString(),
      });
      const doc = await collections.projects.doc(where.id).get();
      const docData = doc.data()!;
      return {
        id: doc.id,
        ...docData,
        techStack: JSON.parse(docData.techStack || '[]'),
      } as Project;
    },

    delete: async ({ where }: { where: { id: string } }): Promise<{ success: boolean }> => {
      const projectId = where.id;

      const [tasksSnap, attachmentsSnap, transactionsSnap, commentsSnap, logsSnap] = await Promise.all([
        collections.tasks.where('projectId', '==', projectId).get(),
        collections.attachments.where('projectId', '==', projectId).get(),
        collections.transactions.where('projectId', '==', projectId).get(),
        collections.comments.where('projectId', '==', projectId).get(),
        collections.activityLogs.where('projectId', '==', projectId).get(),
      ]);

      const batch = adminDb.batch();
      tasksSnap.docs.forEach((d) => batch.delete(d.ref));
      attachmentsSnap.docs.forEach((d) => batch.delete(d.ref));
      transactionsSnap.docs.forEach((d) => batch.delete(d.ref));
      commentsSnap.docs.forEach((d) => batch.delete(d.ref));
      logsSnap.docs.forEach((d) => batch.delete(d.ref));
      batch.delete(collections.projects.doc(projectId));
      await batch.commit();

      return { success: true };
    },
  },

  // ===== TASK =====
  task: {
    create: async ({ data }: { data: Record<string, unknown> }): Promise<Task> => {
      const id = generateId();
      await collections.tasks.doc(id).set(data);
      return { id, ...data } as unknown as Task;
    },

    update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }): Promise<Task> => {
      await collections.tasks.doc(where.id).update(data);
      const doc = await collections.tasks.doc(where.id).get();
      return docToObj<Task>(doc);
    },

    delete: async ({ where }: { where: { id: string } }): Promise<{ success: boolean }> => {
      await collections.tasks.doc(where.id).delete();
      return { success: true };
    },
  },

  // ===== ATTACHMENT =====
  attachment: {
    create: async ({ data }: { data: Record<string, unknown> }): Promise<LinkAttachment> => {
      const id = generateId();
      await collections.attachments.doc(id).set(data);
      return { id, ...data } as unknown as LinkAttachment;
    },

    delete: async ({ where }: { where: { id: string } }): Promise<{ success: boolean }> => {
      await collections.attachments.doc(where.id).delete();
      return { success: true };
    },
  },

  // ===== TRANSACTION =====
  transaction: {
    findMany: async (opts?: { where?: Record<string, unknown>; orderBy?: Record<string, string>; include?: Record<string, unknown> }): Promise<Record<string, unknown>[]> => {
      // Use simple get() without orderBy to avoid composite index requirements
      let query = collections.transactions;

      if (opts?.where) {
        let q = collections.transactions;
        for (const [key, value] of Object.entries(opts.where)) {
          if (key === 'date' && typeof value === 'object' && value !== null) {
            const dateFilter = value as Record<string, string>;
            if (dateFilter.gte) q = q.where('date', '>=', dateFilter.gte);
            if (dateFilter.lte) q = q.where('date', '<=', dateFilter.lte);
          } else if (key === 'projectId') {
            q = q.where(key, '==', value);
          }
        }
        query = q;
      }

      const snap = await query.get();
      const transactions: Record<string, unknown>[] = [];

      for (const doc of snap.docs) {
        const txData: Record<string, unknown> = { id: doc.id, ...doc.data() };

        if (opts?.include?.project) {
          const projectDoc = await collections.projects.doc(doc.data().projectId).get();
          txData.project = projectDoc.exists ? { projectName: projectDoc.data()!.projectName } : null;
        }

        transactions.push(txData);
      }

      // Sort in memory by date desc
      transactions.sort((a, b) => {
        const dateA = new Date((a.date as string) || 0).getTime();
        const dateB = new Date((b.date as string) || 0).getTime();
        return dateB - dateA;
      });

      return transactions;
    },

    findUnique: async ({ where }: { where: { id: string } }): Promise<Transaction | null> => {
      const doc = await collections.transactions.doc(where.id).get();
      if (!doc.exists) return null;
      return docToObj<Transaction>(doc);
    },

    create: async ({ data }: { data: Record<string, unknown> }): Promise<Transaction> => {
      const id = generateId();
      const now = new Date().toISOString();
      const docData = { ...data, createdAt: now };
      await collections.transactions.doc(id).set(docData);
      return { id, ...docData } as unknown as Transaction;
    },

    update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }): Promise<Transaction> => {
      await collections.transactions.doc(where.id).update(data);
      const doc = await collections.transactions.doc(where.id).get();
      return docToObj<Transaction>(doc);
    },

    delete: async ({ where }: { where: { id: string } }): Promise<{ success: boolean }> => {
      await collections.transactions.doc(where.id).delete();
      return { success: true };
    },
  },

  // ===== COMMENT =====
  comment: {
    findMany: async (opts?: { where?: Record<string, unknown>; orderBy?: Record<string, string> }): Promise<Comment[]> => {
      let query = collections.comments;
      if (opts?.where?.projectId) {
        query = query.where('projectId', '==', opts.where.projectId as string);
      }
      const snap = await query.get();
      const comments = snap.docs.map((d) => docToObj<Comment>(d));
      // Sort in memory by createdAt desc
      return comments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },

    create: async ({ data }: { data: Record<string, unknown> }): Promise<Comment> => {
      const id = generateId();
      const now = new Date().toISOString();
      const docData = { ...data, createdAt: now };
      await collections.comments.doc(id).set(docData);
      return { id, ...docData } as unknown as Comment;
    },
  },

  // ===== ACTIVITY LOG =====
  activityLog: {
    findMany: async (opts?: { where?: Record<string, unknown>; orderBy?: Record<string, string>; take?: number; include?: Record<string, unknown> }): Promise<Record<string, unknown>[]> => {
      let query = collections.activityLogs;

      if (opts?.where?.projectId) {
        query = query.where('projectId', '==', opts.where.projectId as string);
      }

      // Don't use orderBy in Firestore — sort in memory
      const snap = await (opts?.take ? query.limit(opts.take) : query).get();
      const logs: Record<string, unknown>[] = [];

      for (const doc of snap.docs) {
        const logData: Record<string, unknown> = { id: doc.id, ...doc.data() };

        if (opts?.include?.project) {
          const projectDoc = await collections.projects.doc(doc.data().projectId).get();
          logData.project = projectDoc.exists
            ? { projectName: projectDoc.data()!.projectName, id: projectDoc.id }
            : null;
        }

        logs.push(logData);
      }

      // Sort in memory by timestamp desc
      logs.sort((a, b) => {
        const dateA = new Date((a.timestamp as string) || 0).getTime();
        const dateB = new Date((b.timestamp as string) || 0).getTime();
        return dateB - dateA;
      });

      return logs;
    },

    create: async ({ data }: { data: Record<string, unknown> }): Promise<ActivityLog> => {
      const id = generateId();
      const now = new Date().toISOString();
      const docData = { ...data, timestamp: now };
      await collections.activityLogs.doc(id).set(docData);
      return { id, ...docData } as unknown as ActivityLog;
    },
  },
};
