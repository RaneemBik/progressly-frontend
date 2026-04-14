/**
 * api.ts — HTTP API Client
 *
 * Single module for all backend communication. Exports the `api` object
 * with namespaced methods matching the backend's route structure.
 *
 * API_BASE resolution (in order of priority):
 *  1. VITE_API_URL env var (set this in .env for production)
 *  2. VITE_API_BASE_URL env var (alternative name)
 *  3. Auto-detect: localhost → http://localhost:3001/api
 *                  production → <origin>/_/backend/api (Vercel monorepo)
 *
 * Authentication: every request automatically includes
 *   'Authorization: Bearer <token>' if a token exists in localStorage.
 *
 * Error handling: non-2xx responses are thrown as Error objects with the
 *   backend's error message extracted from the JSON body.
 *
 * tokenStore: utilities to persist/restore the JWT and user object
 *   across page refreshes using localStorage.
 */
import { User, Project, Task, ProjectMember, Role, DependencyGraph } from '../types';

const env = (import.meta as any).env || {};
function normalizeApiBase(url: string): string {
  const trimmed = url.trim().replace(/\/$/, '');
  return /\/api$/i.test(trimmed) ? trimmed : `${trimmed}/api`;
}

const configuredApiBase = env.VITE_API_URL || env.VITE_API_BASE_URL;
const API_BASE = configuredApiBase ? normalizeApiBase(configuredApiBase) : (() => {
  if (typeof window !== 'undefined' && window.location) {
    const origin = window.location.origin;
    const hostname = window.location.hostname;
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';

    if (isLocal) {
      return 'http://localhost:3001/api';
    }

    // Production: use environment variable or direct API call
    // Default assumes backend is at same domain
    return `${origin}/api`;
  }

  return 'http://localhost:3001/api';
})();

function stripApiSuffix(url: string): string {
  return url.replace(/\/api$/i, '');
}

function shouldRetryWithApi(res: Response, bodyText: string): boolean {
  return res.status === 404 && /cannot\s+post\s+\/auth\//i.test(bodyText);
}
const TOKEN_KEY = 'progressly_token';
const USER_KEY  = 'progressly_user';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); },
  saveUser: (u: User) => localStorage.setItem(USER_KEY, JSON.stringify(u)),
  loadUser: (): User | null => { try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); } catch { return null; } },
};

async function req<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = tokenStore.get();
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(options.headers as any) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const initialBase = configuredApiBase ? stripApiSuffix(configuredApiBase.trim().replace(/\/$/, '')) : API_BASE;
  const primaryRes = await fetch(`${initialBase}${path}`, { ...options, headers });
  let res = primaryRes;

  if (!primaryRes.ok) {
    const primaryText = await primaryRes.clone().text();
    const retryBase = normalizeApiBase(initialBase);
    const isDifferentBase = retryBase !== initialBase;

    if (isDifferentBase && shouldRetryWithApi(primaryRes, primaryText)) {
      res = await fetch(`${retryBase}${path}`, { ...options, headers });
    }
  }

  if (!res.ok) {
    let msg = `Error ${res.status}`;
    try { const b = await res.json(); msg = Array.isArray(b.message) ? b.message.join(', ') : (b.message || msg); } catch {}
    throw new Error(msg);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  auth: {
    login: async (email: string, password: string): Promise<User> => {
      const d = await req<{ access_token: string; user: User }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      tokenStore.set(d.access_token); tokenStore.saveUser(d.user); return d.user;
    },
    register: async (name: string, email: string, password: string): Promise<User> => {
      const d = await req<{ access_token: string; user: User }>('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) });
      tokenStore.set(d.access_token); tokenStore.saveUser(d.user); return d.user;
    },
    logout: () => tokenStore.clear(),
    isAuthenticated: () => !!tokenStore.get(),
    getStoredUser: () => tokenStore.loadUser(),
  },
  projects: {
    getAll:    ()                                => req<Project[]>('/projects'),
    getTrash:  ()                                => req<Project[]>('/projects/trash'),
    getById:   (id: string)                      => req<Project>(`/projects/${id}`),
    create:    (d: Partial<Project>)             => req<Project>('/projects', { method: 'POST', body: JSON.stringify({ name: d.name, description: d.description, dependencyMode: d.dependencyMode }) }),
    update:    (id: string, d: Partial<Project>) => req<Project>(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
    trash:     (id: string)                      => req<void>(`/projects/${id}`, { method: 'DELETE' }),
    restore:   (id: string)                      => req<Project>(`/projects/${id}/restore`, { method: 'PATCH' }),
    hardDelete:(id: string)                      => req<void>(`/projects/${id}/permanent`, { method: 'DELETE' }),
  },
  tasks: {
    getByProject: (projectId: string) => req<Task[]>(`/projects/${projectId}/tasks`),
    create: (task: Partial<Task>) => req<Task>(`/projects/${task.projectId}/tasks`, {
      method: 'POST',
      body: JSON.stringify({ title: task.title, description: task.description, status: task.status, priority: task.priority, assigneeId: task.assigneeId, dependsOn: task.dependsOn }),
    }),
    update: (id: string, updates: Partial<Task>) => {
      if (!updates.projectId) throw new Error('projectId required');
      return req<Task>(`/projects/${updates.projectId}/tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ title: updates.title, description: updates.description, status: updates.status, priority: updates.priority, assigneeId: updates.assigneeId ?? null, dependsOn: updates.dependsOn }),
      });
    },
    delete: (id: string, projectId?: string) => {
      if (!projectId) throw new Error('projectId required');
      return req<void>(`/projects/${projectId}/tasks/${id}`, { method: 'DELETE' });
    },
    getGraph:         (projectId: string)                               => req<DependencyGraph>(`/projects/${projectId}/tasks/graph`),
    addDependency:    (projectId: string, taskId: string, depId: string) => req<Task>(`/projects/${projectId}/tasks/${taskId}/dependencies`, { method: 'POST', body: JSON.stringify({ dependsOnTaskId: depId }) }),
    removeDependency: (projectId: string, taskId: string, depId: string) => req<Task>(`/projects/${projectId}/tasks/${taskId}/dependencies/${depId}`, { method: 'DELETE' }),
  },
  members: {
    getByProject: (projectId: string) => req<ProjectMember[]>(`/projects/${projectId}/members`),
    invite: (projectId: string, email: string, role: Role) =>
      req<any>(`/projects/${projectId}/members/invite`, { method: 'POST', body: JSON.stringify({ email, role }) }),
    updateRole: (projectId: string, memberId: string, role: Role) =>
      req<ProjectMember>(`/projects/${projectId}/members/${memberId}/role`, { method: 'PUT', body: JSON.stringify({ role }) }),
    remove: (projectId: string, memberId: string) =>
      req<void>(`/projects/${projectId}/members/${memberId}`, { method: 'DELETE' }),
  },
  invitations: {
    getByProject: (projectId: string) => req<any[]>(`/projects/${projectId}/invitations`),
    cancel: (projectId: string, inviteId: string) =>
      req<void>(`/projects/${projectId}/invitations/${inviteId}`, { method: 'DELETE' }),
  },
  invites: {
    getPending: () => req<any[]>('/invites/pending'),
    accept: (inviteId: string) => req<any>(`/invites/${inviteId}/accept-from-dashboard`, { method: 'POST' }),
    reject: (inviteId: string) => req<void>(`/invites/${inviteId}/reject`, { method: 'DELETE' }),
  },
};
