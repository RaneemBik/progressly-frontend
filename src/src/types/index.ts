/**
 * types/index.ts — Shared TypeScript Interfaces
 *
 * Single source of truth for all data shapes used across the frontend.
 * Mirrors the backend's MongoDB document structure (after toJSON transforms).
 *
 * Key types:
 *  User            — authenticated user profile
 *  Project         — project with computed taskCount, memberCount, deletedAt
 *  Task            — kanban task with status, priority, dependency info
 *  ProjectMember   — membership record with role
 *  ProjectInvitation — invite record with status and metadata
 *  DependencyGraph — { nodes, edges } for the graph visualisation
 *  Role            — 'owner' | 'admin' | 'member'
 *  TaskStatus      — 'todo' | 'in_progress' | 'done'
 *  TaskPriority    — 'low' | 'medium' | 'high'
 */
export interface User { id: string; name: string; email: string; avatar?: string; createdAt: string; }

export interface Project {
  id: string; name: string; description: string; ownerId: string; createdAt: string;
  taskCount: number; memberCount: number; dependencyMode: boolean; deletedAt?: string | null;
}

export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string; projectId: string; title: string; description: string;
  status: TaskStatus; assigneeId?: string; assigneeName?: string;
  priority: TaskPriority; dependsOn?: string[]; isBlocked?: boolean; createdAt: string;
}

export type Role = 'owner' | 'admin' | 'member';

export interface ProjectMember {
  id: string; projectId: string; userId: string; userName: string; userEmail: string; role: Role; avatar?: string;
}

export interface DependencyGraphNode {
  id: string; label: string; status: TaskStatus; priority: TaskPriority;
  isBlocked: boolean; assigneeId?: string; dependsOn?: string[];
}
export interface DependencyGraphEdge { from: string; to: string; label: string; }
export interface DependencyGraph { nodes: DependencyGraphNode[]; edges: DependencyGraphEdge[]; }

export type InviteStatus = 'pending' | 'accepted' | 'cancelled';
export interface ProjectInvitation {
  id: string; email: string; role: Role; status: InviteStatus;
  invitedBy: { id: string; name: string; email: string };
  acceptedBy?: { id: string; name: string; email: string } | null;
  createdAt: string; acceptedAt?: string | null; expiresAt: string;
}
