/**
 * Dashboard.tsx — Main Dashboard Page
 *
 * Protected route (redirects to /login if not authenticated).
 *
 * Features:
 *  StatsCards     — summary counts (projects, tasks, members)
 *  Project grid   — paginated (6 per page) with animated page numbers
 *  New Project    — modal with name, description, dependency mode toggle
 *  Trash          — modal showing soft-deleted projects with full task/member
 *                   details; supports Restore and Permanent Delete actions
 *  Sidebar toggle — ◀/▶ button collapses/expands the left sidebar
 *
 * All destructive actions use ConfirmDialog (no window.confirm).
 * Errors use toast notifications (no window.alert).
 */
import React, { useEffect, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, FolderKanban, GitBranch, Trash2, RotateCcw,
  ChevronLeft, ChevronRight, PanelLeftClose, PanelLeftOpen,
  CheckSquare, Users, ExternalLink, Calendar,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { api } from '../services/api';
import { Project, Task, ProjectMember } from '../types';
import { Sidebar } from '../components/layout/Sidebar';
import { StatsCards } from '../components/dashboard/StatsCards';
import { ProjectCard } from '../components/dashboard/ProjectCard';
import { PendingInvitations } from '../components/dashboard/PendingInvitations';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { ConfirmDialog, useToast } from '../components/ui/Toast';

const PAGE_SIZE = 6;

// ── Pagination ─────────────────────────────────────────────────────────────
function Pagination({ page, total, onChange }: { page: number; total: number; onChange: (p: number) => void }) {
  const pages = Math.ceil(total / PAGE_SIZE);
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button onClick={() => onChange(page - 1)} disabled={page === 1}
        className="p-2 rounded-lg text-brand-muted hover:text-white hover:bg-brand-surface disabled:opacity-30 transition-all">
        <ChevronLeft className="w-4 h-4" />
      </button>
      {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
        <motion.button key={p} onClick={() => onChange(p)}
          whileTap={{ scale: 0.9 }}
          className={`w-9 h-9 rounded-lg text-sm font-semibold transition-all duration-200 relative overflow-hidden
            ${p === page ? 'text-white' : 'text-brand-muted hover:text-white hover:bg-brand-surface'}`}>
          {p === page && (
            <motion.div layoutId="pageActive" className="absolute inset-0 bg-brand-accent rounded-lg"
              initial={false} transition={{ type: 'spring', bounce: 0.3, duration: 0.4 }} />
          )}
          {p === page && (
            <motion.div className="absolute inset-0 rounded-lg bg-brand-highlight/20"
              animate={{ opacity: [0.4, 0, 0.4] }} transition={{ duration: 2, repeat: Infinity }} />
          )}
          <span className="relative z-10">{p}</span>
        </motion.button>
      ))}
      <button onClick={() => onChange(page + 1)} disabled={page === pages}
        className="p-2 rounded-lg text-brand-muted hover:text-white hover:bg-brand-surface disabled:opacity-30 transition-all">
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

// ── Trash Modal — shows deleted projects with full details ─────────────────
function TrashModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { dispatch, state } = useStore();
  const toast = useToast();
  const [trashed, setTrashed]           = useState<Project[]>([]);
  const [loading, setLoading]           = useState(false);
  const [restoring, setRestoring]       = useState<string | null>(null);
  const [deleting, setDeleting]         = useState<string | null>(null);
  const [selected, setSelected]         = useState<string | null>(null);
  const [projectDetails, setProjectDetails] = useState<{
    tasks: Task[]; members: ProjectMember[];
  } | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Project | null>(null);

  useEffect(() => {
    if (!isOpen) { setSelected(null); setProjectDetails(null); return; }
    setLoading(true);
    api.projects.getTrash()
      .then(setTrashed)
      .catch(err => toast.error(err.message || 'Failed to load trash'))
      .finally(() => setLoading(false));
  }, [isOpen]);

  const loadDetails = async (projectId: string) => {
    setDetailsLoading(true);
    try {
      const [tasks, members] = await Promise.all([
        api.tasks.getByProject(projectId),
        api.members.getByProject(projectId),
      ]);
      setProjectDetails({ tasks, members });
    } catch (err: any) {
      toast.error(err.message || 'Failed to load project details');
    } finally {
      setDetailsLoading(false);
    }
  };

  const selectProject = (p: Project) => {
    if (selected === p.id) { setSelected(null); setProjectDetails(null); return; }
    setSelected(p.id);
    setProjectDetails(null);
    loadDetails(p.id);
  };

  const handleRestore = async (id: string, name: string) => {
    setRestoring(id);
    try {
      const restored = await api.projects.restore(id);
      console.log('[RESTORE] API response:', restored);
      
      // Validate required fields
      const requiredFields = ['id', 'name', 'description', 'ownerId', 'createdAt', 'taskCount', 'memberCount', 'dependencyMode'];
      const missingFields = requiredFields.filter(f => !(f in (restored || {})));
      
      if (!restored || missingFields.length > 0) {
        console.error('[RESTORE] Restored project missing fields:', missingFields, restored);
        toast.error('Project restored but has incomplete data. Refreshing...');
        // Force reload to sync state
        setTimeout(() => window.location.reload(), 1000);
        return;
      }

      try {
        console.log('[RESTORE] Dispatching ADD_PROJECT with validated payload');
        dispatch({ type: 'ADD_PROJECT', payload: restored });
      } catch (e) {
        console.error('[RESTORE] Dispatch error:', e, restored);
        toast.error('Failed to update dashboard. Refreshing...');
        setTimeout(() => window.location.reload(), 1000);
        throw e;
      }

      setTrashed(prev => prev.filter(p => p.id !== id));
      if (selected === id) { setSelected(null); setProjectDetails(null); }
      console.log('[RESTORE] Success:', id, name);
      toast.success(`"${name}" restored to your dashboard`);
    } catch (err: any) {
      console.error('[RESTORE] Error:', err);
      toast.error(err.message || 'Failed to restore project');
    } finally { 
      setRestoring(null); 
    }
  };

  const handleHardDelete = async (project: Project) => {
    setDeleting(project.id);
    try {
      await api.projects.hardDelete(project.id);
      setTrashed(prev => prev.filter(p => p.id !== project.id));
      if (selected === project.id) { setSelected(null); setProjectDetails(null); }
      toast.success(`"${project.name}" permanently deleted`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete project');
    } finally { setDeleting(null); setConfirmDelete(null); }
  };

  const statusDot = (s: string) =>
    s === 'done' ? 'bg-[#3EBD8A]' : s === 'in_progress' ? 'bg-brand-warning' : 'bg-brand-muted';

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Trash" maxWidth="xl">
        <div className="flex gap-4" style={{ minHeight: 320 }}>

          {/* Left: list of trashed projects */}
          <div className="w-64 flex-shrink-0 flex flex-col gap-2">
            {loading ? (
              <div className="flex items-center justify-center py-10 text-brand-muted">
                <div className="w-5 h-5 rounded-full border-2 border-brand-accent border-t-transparent animate-spin" />
              </div>
            ) : trashed.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-brand-muted space-y-2">
                <Trash2 className="w-8 h-8 opacity-25" />
                <p className="text-sm">Trash is empty</p>
              </div>
            ) : trashed.map(p => (
              <motion.button key={p.id} onClick={() => selectProject(p)}
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                className={`w-full text-left p-3 rounded-xl border transition-all duration-200
                  ${selected === p.id
                    ? 'bg-brand-accent/15 border-brand-accent/50'
                    : 'glass-panel border-brand-border/50 hover:border-brand-accent/30'}`}>
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-brand-danger/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <FolderKanban className="w-4 h-4 text-brand-danger/60" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white truncate">{p.name}</p>
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-brand-muted">
                      <Calendar className="w-3 h-3" />
                      <span>{p.deletedAt ? new Date(p.deletedAt).toLocaleDateString() : ''}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-brand-muted">
                      <span className="flex items-center gap-1"><CheckSquare className="w-3 h-3" />{p.taskCount}</span>
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{p.memberCount}</span>
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>

          {/* Right: project details */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              {!selected ? (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="h-full flex flex-col items-center justify-center text-brand-muted py-10">
                  <FolderKanban className="w-10 h-10 opacity-20 mb-3" />
                  <p className="text-sm">Select a project to view its details</p>
                </motion.div>
              ) : detailsLoading ? (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="h-full flex items-center justify-center">
                  <div className="w-6 h-6 rounded-full border-2 border-brand-accent border-t-transparent animate-spin" />
                </motion.div>
              ) : projectDetails && (() => {
                const proj = trashed.find(p => p.id === selected)!;
                const todoTasks = projectDetails.tasks.filter(t => t.status === 'todo');
                const inprogTasks = projectDetails.tasks.filter(t => t.status === 'in_progress');
                const doneTasks = projectDetails.tasks.filter(t => t.status === 'done');
                return (
                  <motion.div key="detail" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                    className="h-full flex flex-col">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4 gap-3">
                      <div>
                        <h3 className="text-base font-bold text-white">{proj.name}</h3>
                        {proj.description && <p className="text-xs text-brand-muted mt-0.5">{proj.description}</p>}
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Button size="sm" variant="secondary"
                          icon={<RotateCcw className="w-3.5 h-3.5" />}
                          isLoading={restoring === proj.id}
                          onClick={() => handleRestore(proj.id, proj.name)}>
                          Restore
                        </Button>
                        <Button size="sm" variant="danger"
                          icon={<Trash2 className="w-3.5 h-3.5" />}
                          isLoading={deleting === proj.id}
                          onClick={() => setConfirmDelete(proj)}>
                          Delete Forever
                        </Button>
                      </div>
                    </div>

                    {/* Members */}
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-brand-muted uppercase tracking-wider mb-2">
                        Team Members ({projectDetails.members.length})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {projectDetails.members.map(m => (
                          <div key={m.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full glass-panel border border-brand-border/50 text-xs">
                            <div className="w-5 h-5 rounded-full bg-brand-accent/20 border border-brand-accent/40 flex items-center justify-center text-brand-highlight font-bold" style={{ fontSize: 9 }}>
                              {m.userName.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-brand-text">{m.userName}</span>
                            <span className={`capitalize font-medium ${m.role === 'owner' ? 'text-brand-warning' : m.role === 'admin' ? 'text-brand-highlight' : 'text-brand-muted'}`}>
                              · {m.role}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Tasks by status */}
                    <div className="flex-1 overflow-y-auto space-y-3">
                      {([
                        { label: 'To Do',       tasks: todoTasks,   dot: 'bg-brand-muted' },
                        { label: 'In Progress', tasks: inprogTasks, dot: 'bg-brand-warning' },
                        { label: 'Done',        tasks: doneTasks,   dot: 'bg-[#3EBD8A]' },
                      ] as const).map(col => col.tasks.length === 0 ? null : (
                        <div key={col.label}>
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                            <p className="text-xs font-semibold text-brand-muted uppercase tracking-wider">
                              {col.label} ({col.tasks.length})
                            </p>
                          </div>
                          <div className="space-y-1.5">
                            {col.tasks.map(task => (
                              <div key={task.id} className="flex items-start gap-2.5 px-3 py-2 glass-panel rounded-lg border border-brand-border/40">
                                <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${col.dot}`} />
                                <div className="min-w-0">
                                  <p className="text-xs font-medium text-white truncate">{task.title}</p>
                                  {task.assigneeName && (
                                    <p className="text-xs text-brand-muted mt-0.5">→ {task.assigneeName}</p>
                                  )}
                                </div>
                                <span className={`ml-auto text-xs px-1.5 py-0.5 rounded flex-shrink-0
                                  ${task.priority === 'high' ? 'bg-brand-danger/15 text-brand-danger'
                                    : task.priority === 'medium' ? 'bg-brand-warning/15 text-brand-warning'
                                    : 'bg-sky-500/15 text-sky-400'}`}>
                                  {task.priority}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                      {projectDetails.tasks.length === 0 && (
                        <p className="text-sm text-brand-muted/50 italic text-center py-4">No tasks in this project</p>
                      )}
                    </div>
                  </motion.div>
                );
              })()}
            </AnimatePresence>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!confirmDelete}
        title="Permanently Delete Project"
        message={`Delete "${confirmDelete?.name}" forever? All tasks and members will be erased. This cannot be undone.`}
        confirmLabel="Delete Forever"
        danger
        onConfirm={() => confirmDelete && handleHardDelete(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
      />
    </>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────
export function Dashboard() {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isTrashOpen, setIsTrashOpen]     = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [dependencyMode, setDependencyMode] = useState(false);
  const [isCreating, setIsCreating]       = useState(false);
  const [createError, setCreateError]     = useState('');
  const [page, setPage]                   = useState(1);
  const [sidebarOpen, setSidebarOpen]     = useState(true);

  useEffect(() => { if (state.isAuthenticated) loadProjects(); }, [state.isAuthenticated]);

  const loadProjects = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try { dispatch({ type: 'SET_PROJECTS', payload: await api.projects.getAll() }); }
    catch (err: any) { toast.error(err.message || 'Failed to load projects'); }
    finally { dispatch({ type: 'SET_LOADING', payload: false }); }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    setIsCreating(true); setCreateError('');
    try {
      const project = await api.projects.create({
        name: newProjectName.trim(),
        description: newProjectDesc.trim(),
        dependencyMode,
      });
      dispatch({ type: 'ADD_PROJECT', payload: project });
      setIsCreateModalOpen(false);
      setNewProjectName(''); setNewProjectDesc(''); setDependencyMode(false);
      toast.success(`Project "${project.name}" created`);
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create project');
    } finally { setIsCreating(false); }
  };

  if (!state.isAuthenticated) return <Navigate to="/login" replace />;

  const allProjects = state.projects;
  const paginated   = allProjects.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="min-h-screen bg-brand-dark pt-16 flex">
      <Sidebar visible={sidebarOpen} />

      {/* Sidebar toggle */}
      <button onClick={() => setSidebarOpen(v => !v)}
        className={`fixed top-[72px] z-50 flex items-center justify-center w-7 h-7 rounded-r-lg bg-brand-surface border border-l-0 border-brand-border text-brand-muted hover:text-white hover:bg-brand-accent/20 transition-all duration-300
          ${sidebarOpen ? 'left-64' : 'left-0'}`}>
        {sidebarOpen ? <PanelLeftClose className="w-3.5 h-3.5" /> : <PanelLeftOpen className="w-3.5 h-3.5" />}
      </button>

      <main className={`flex-1 p-4 sm:p-6 lg:p-8 min-h-[calc(100vh-4rem)] transition-all duration-300 ${sidebarOpen ? 'md:ml-64' : 'ml-0'}`}>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white font-display">
                Welcome back, {state.user?.name?.split(' ')[0]}!
              </h1>
              <p className="text-brand-muted mt-1">Here's what's happening with your projects today.</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" icon={<Trash2 className="w-4 h-4" />} onClick={() => setIsTrashOpen(true)}>
                Trash
              </Button>
              <Button onClick={() => setIsCreateModalOpen(true)} icon={<Plus className="w-4 h-4" />}>
                New Project
              </Button>
            </div>
          </div>

          <StatsCards />

          <PendingInvitations />

          <div className="mt-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white flex items-center">
                <FolderKanban className="w-5 h-5 mr-2 text-brand-accent" />Your Projects
              </h2>
              {allProjects.length > 0 && (
                <span className="text-sm text-brand-muted">
                  {allProjects.length} project{allProjects.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {allProjects.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AnimatePresence mode="popLayout">
                    {paginated.map((project, i) => (
                      <ProjectCard key={project.id} project={project} index={i} />
                    ))}
                  </AnimatePresence>
                </div>
                <Pagination page={page} total={allProjects.length}
                  onChange={p => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
              </>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="glass-panel rounded-2xl p-12 text-center flex flex-col items-center border-dashed border-2 border-brand-border">
                <div className="w-16 h-16 bg-brand-surface rounded-full flex items-center justify-center mb-4">
                  <FolderKanban className="w-8 h-8 text-brand-muted" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">No projects yet</h3>
                <p className="text-brand-muted mb-6 max-w-md">
                  Create your first project to start organizing tasks and collaborating with your team.
                </p>
                <Button onClick={() => setIsCreateModalOpen(true)} icon={<Plus className="w-4 h-4" />}>
                  Create First Project
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </main>

      {/* Create project modal */}
      <Modal isOpen={isCreateModalOpen}
        onClose={() => { setIsCreateModalOpen(false); setCreateError(''); }}
        title="Create New Project">
        <form onSubmit={handleCreateProject} className="space-y-5">
          {createError && (
            <div className="p-3 rounded-md bg-brand-danger/10 border border-brand-danger/20 text-brand-danger text-sm">
              {createError}
            </div>
          )}
          <Input label="Project Name" required value={newProjectName}
            onChange={e => setNewProjectName(e.target.value)}
            placeholder="e.g., Website Redesign" autoFocus />
          <div>
            <label className="block text-sm font-medium text-brand-muted mb-1.5">Description (Optional)</label>
            <textarea
              className="flex w-full rounded-md border border-brand-border bg-brand-surface/50 px-3 py-2 text-sm text-brand-text placeholder:text-brand-muted/50 focus:outline-none focus:ring-2 focus:ring-brand-accent resize-none h-20"
              value={newProjectDesc} onChange={e => setNewProjectDesc(e.target.value)}
              placeholder="What is this project about?" />
          </div>
          {/* Dependency toggle */}
          <div className={`rounded-xl p-4 border cursor-pointer transition-all
            ${dependencyMode ? 'bg-brand-accent/15 border-brand-accent/50' : 'bg-brand-surface/50 border-brand-border hover:border-brand-accent/30'}`}
            onClick={() => setDependencyMode(!dependencyMode)}>
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${dependencyMode ? 'bg-brand-accent/30' : 'bg-brand-surface'}`}>
                <GitBranch className={`w-5 h-5 ${dependencyMode ? 'text-brand-highlight' : 'text-brand-muted'}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-white">Task Dependencies</p>
                  <div className={`w-11 h-6 rounded-full flex items-center px-0.5 transition-colors ${dependencyMode ? 'bg-brand-accent' : 'bg-brand-border'}`}>
                    <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${dependencyMode ? 'translate-x-5' : 'translate-x-0'}`} />
                  </div>
                </div>
                <p className="text-xs text-brand-muted mt-1">
                  {dependencyMode ? 'Tasks form a chain — each must be completed before the next.' : 'Tasks are independent — update in any order.'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-brand-border">
            <Button type="button" variant="ghost" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={isCreating}>Create Project</Button>
          </div>
        </form>
      </Modal>

      <TrashModal isOpen={isTrashOpen} onClose={() => setIsTrashOpen(false)} />
    </div>
  );
}
