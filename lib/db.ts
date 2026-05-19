// Firestore utility functions that mirror Prisma operations
// This replaces the old lib/db.ts (Prisma) with Firebase Firestore equivalents

import { collections, adminDb } from '@/lib/firebase-admin';
import {
  DocumentSnapshot,
  QuerySnapshot,
  QueryDocumentSnapshot,
  FieldValue,
} from 'firebase-admin/firestore';
import type { Project, Task, LinkAttachment, Transaction, Comment, ActivityLog, AuthUser } from '@/lib/types';

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

function toTimestamp(date: Date | string | FieldValue): string {
  if (typeof date === 'string') return date;
  if (date instanceof Date) return date.toISOString();
  return new Date().toISOString();
}

// ==================== PROJECT OPERATIONS ====================

async function getProjectWithRelations(projectId: string) {
  const projectDoc = await collections.projects.doc(projectId).get();
  if (!projectDoc.exists) return null;

  const projectData = projectDoc.data()!;

  // Fetch related collections
  const [tasksSnap, attachmentsSnap, transactionsSnap, commentsSnap, logsSnap] = await Promise.all([
    collections.tasks.where('projectId', '==', projectId).orderBy('order', 'asc').get(),
    collections.attachments.where('projectId', '==', projectId).get(),
    collections.transactions.where('projectId', '==', projectId).orderBy('date', 'desc').get(),
    collections.comments.where('projectId', '==', projectId).orderBy('createdAt', 'desc').get(),
    collections.activityLogs.where('projectId', '==', projectId).orderBy('timestamp', 'desc').get(),
  ]);

  return {
    id: projectDoc.id,
    ...projectData,
    techStack: JSON.parse(projectData.techStack || '[]'),
    tasks: tasksSnap.docs.map((d) => docToObj<Task>(d)),
    attachments: attachmentsSnap.docs.map((d) => docToObj<LinkAttachment>(d)),
    transactions: transactionsSnap.docs.map((d) => docToObj<Transaction>(d)),
    comments: commentsSnap.docs.map((d) => docToObj<Comment>(d)),
    logs: logsSnap.docs.map((d) => docToObj<ActivityLog>(d)),
  };
}

// ==================== DB OBJECT (mirrors Prisma API) ====================

export const db = {
  // ===== USER =====
  user: {
    findUnique: async ({ where }: { where: { id?: string; email?: string } }) => {
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

    upsert: async ({ where, update, create }: { where: { email: string }; update: Record<string, unknown>; create: Record<string, unknown> }) => {
      const snap = await collections.users.where('email', '==', where.email).limit(1).get();
      if (!snap.empty) {
        const existingDoc = snap.docs[0];
        await collections.users.doc(existingDoc.id).update(update);
        return docToObj<AuthUser & { password?: string }>(await collections.users.doc(existingDoc.id).get());
      }
      const id = generateId();
      const now = new Date().toISOString();
      const data = { ...create, createdAt: now, updatedAt: now };
      await collections.users.doc(id).set(data);
      return { id, ...data } as AuthUser & { password?: string };
    },

    update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
      await collections.users.doc(where.id).update({ ...data, updatedAt: new Date().toISOString() });
      const doc = await collections.users.doc(where.id).get();
      return docToObj<AuthUser>(doc);
    },

    create: async ({ data }: { data: Record<string, unknown> }) => {
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
    }) => {
      let query = collections.projects.orderBy('createdAt', 'desc');

      if (opts?.where) {
        // Apply where filters
        for (const [key, value] of Object.entries(opts.where)) {
          if (key === 'id' && typeof value === 'object' && value !== null && 'in' in (value as object)) {
            query = query.where(key, 'in', (value as { in: string[] }).in);
          } else {
            query = query.where(key, '==', value);
          }
        }
      }

      const snap = await query.get();
      const projects = [];

      for (const doc of snap.docs) {
        const projectData = doc.data();
        let project: Record<string, unknown> = {
          id: doc.id,
          ...projectData,
          techStack: JSON.parse(projectData.techStack || '[]'),
        };

        if (opts?.include) {
          if ('tasks' in opts.include) {
            const tasksSnap = await collections.tasks.where('projectId', '==', doc.id).orderBy('order', 'asc').get();
            project.tasks = tasksSnap.docs.map((d) => docToObj<Task>(d));
          }
          if ('attachments' in opts.include) {
            const attSnap = await collections.attachments.where('projectId', '==', doc.id).get();
            project.attachments = attSnap.docs.map((d) => docToObj<LinkAttachment>(d));
          }
          if ('transactions' in opts.include) {
            const txSnap = await collections.transactions.where('projectId', '==', doc.id).orderBy('date', 'desc').get();
            project.transactions = txSnap.docs.map((d) => docToObj<Transaction>(d));
          }
          if ('comments' in opts.include) {
            const cmSnap = await collections.comments.where('projectId', '==', doc.id).orderBy('createdAt', 'desc').get();
            project.comments = cmSnap.docs.map((d) => docToObj<Comment>(d));
          }
          if ('logs' in opts.include) {
            const logSnap = await collections.activityLogs.where('projectId', '==', doc.id).orderBy('timestamp', 'desc').get();
            project.logs = logSnap.docs.map((d) => docToObj<ActivityLog>(d));
          }
        }

        projects.push(project);
      }

      return projects;
    },

    findUnique: async ({ where, include }: { where: { id: string }; include?: Record<string, unknown> }) => {
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
      };
    },

    create: async ({ data, include }: { data: Record<string, unknown>; include?: Record<string, unknown> }) => {
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
        return getProjectWithRelations(id);
      }

      const doc = await collections.projects.doc(id).get();
      return { id: doc.id, ...doc.data()!, techStack: JSON.parse(doc.data()!.techStack || '[]') };
    },

    update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
      await collections.projects.doc(where.id).update({
        ...data,
        updatedAt: new Date().toISOString(),
      });
      const doc = await collections.projects.doc(where.id).get();
      return { id: doc.id, ...doc.data()!, techStack: JSON.parse(doc.data()!.techStack || '[]') };
    },

    delete: async ({ where }: { where: { id: string } }) => {
      // Delete all related records first (cascade)
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
    create: async ({ data }: { data: Record<string, unknown> }) => {
      const id = generateId();
      await collections.tasks.doc(id).set(data);
      return { id, ...data } as Task;
    },

    update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
      await collections.tasks.doc(where.id).update(data);
      const doc = await collections.tasks.doc(where.id).get();
      return docToObj<Task>(doc);
    },

    delete: async ({ where }: { where: { id: string } }) => {
      await collections.tasks.doc(where.id).delete();
      return { success: true };
    },
  },

  // ===== ATTACHMENT =====
  attachment: {
    create: async ({ data }: { data: Record<string, unknown> }) => {
      const id = generateId();
      await collections.attachments.doc(id).set(data);
      return { id, ...data } as LinkAttachment;
    },

    delete: async ({ where }: { where: { id: string } }) => {
      await collections.attachments.doc(where.id).delete();
      return { success: true };
    },
  },

  // ===== TRANSACTION =====
  transaction: {
    findMany: async (opts?: { where?: Record<string, unknown>; orderBy?: Record<string, string>; include?: Record<string, unknown> }) => {
      let query = collections.transactions.orderBy('date', 'desc');

      if (opts?.where) {
        for (const [key, value] of Object.entries(opts.where)) {
          if (key === 'date' && typeof value === 'object' && value !== null) {
            // Date range filter
            const dateFilter = value as Record<string, string>;
            if (dateFilter.gte) query = query.where('date', '>=', dateFilter.gte);
            if (dateFilter.lte) query = query.where('date', '<=', dateFilter.lte);
          } else {
            query = query.where(key, '==', value);
          }
        }
      }

      const snap = await query.get();
      const transactions = [];

      for (const doc of snap.docs) {
        const txData: Record<string, unknown> = { id: doc.id, ...doc.data() };

        if (opts?.include?.project) {
          const projectDoc = await collections.projects.doc(doc.data().projectId).get();
          txData.project = projectDoc.exists ? { projectName: projectDoc.data()!.projectName } : null;
        }

        transactions.push(txData);
      }

      return transactions;
    },

    findUnique: async ({ where }: { where: { id: string } }) => {
      const doc = await collections.transactions.doc(where.id).get();
      if (!doc.exists) return null;
      return docToObj<Transaction>(doc);
    },

    create: async ({ data }: { data: Record<string, unknown> }) => {
      const id = generateId();
      const now = new Date().toISOString();
      const docData = { ...data, createdAt: now };
      await collections.transactions.doc(id).set(docData);
      return { id, ...docData } as Transaction;
    },

    update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
      await collections.transactions.doc(where.id).update(data);
      const doc = await collections.transactions.doc(where.id).get();
      return docToObj<Transaction>(doc);
    },

    delete: async ({ where }: { where: { id: string } }) => {
      await collections.transactions.doc(where.id).delete();
      return { success: true };
    },
  },

  // ===== COMMENT =====
  comment: {
    findMany: async (opts?: { where?: Record<string, unknown>; orderBy?: Record<string, string> }) => {
      let query = collections.comments.orderBy('createdAt', 'desc');
      if (opts?.where?.projectId) {
        query = query.where('projectId', '==', opts.where.projectId);
      }
      const snap = await query.get();
      return snap.docs.map((d) => docToObj<Comment>(d));
    },

    create: async ({ data }: { data: Record<string, unknown> }) => {
      const id = generateId();
      const now = new Date().toISOString();
      const docData = { ...data, createdAt: now };
      await collections.comments.doc(id).set(docData);
      return { id, ...docData } as Comment;
    },
  },

  // ===== ACTIVITY LOG =====
  activityLog: {
    findMany: async (opts?: { where?: Record<string, unknown>; orderBy?: Record<string, string>; take?: number; include?: Record<string, unknown> }) => {
      let query = collections.activityLogs.orderBy('timestamp', 'desc');

      if (opts?.where?.projectId) {
        query = query.where('projectId', '==', opts.where.projectId);
      }

      if (opts?.take) {
        query = query.limit(opts.take);
      }

      const snap = await query.get();
      const logs = [];

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

      return logs;
    },

    create: async ({ data }: { data: Record<string, unknown> }) => {
      const id = generateId();
      const now = new Date().toISOString();
      const docData = { ...data, timestamp: now };
      await collections.activityLogs.doc(id).set(docData);
      return { id, ...docData } as ActivityLog;
    },
  },
};
