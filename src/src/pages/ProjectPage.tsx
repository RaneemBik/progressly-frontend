/**
 * ProjectPage.tsx — Project Detail Page
 *
 * Protected route. Loads project, tasks, and members on mount.
 *
 * Three tabs:
 *  Tasks tab          — Kanban board (TaskBoard component)
 *  Dependency Graph   — SVG graph visualisation; dep-mode info banner;
 *                       owner can toggle dependency mode on/off
 *  Invitations tab    — (owner/admin only) paginated invite list
 *
 * Team panel — slides in from the right, shows members + invite button.
 * Settings modal — owner-only, currently contains dependency mode toggle.
 * Sidebar toggle — same collapsible sidebar as Dashboard.
 *
 * After any task change, the dependency graph auto-refreshes so isBlocked
 * states stay in sync with the visual.
 */
import { useEffect, useState } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Users, Loader2, X, GitBranch, Mail, Settings, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useStore } from '../store/useStore';
import { api } from '../services/api';
import { Sidebar } from '../components/layout/Sidebar';
import { TaskBoard } from '../components/project/TaskBoard';
import { MemberList } from '../components/project/MemberList';
import DependencyGraph from '../components/project/DependencyGraph';
import ProjectInvitations from '../components/project/ProjectInvitations';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import { Modal } from '../components/ui/Modal';
import { DependencyGraph as DependencyGraphType } from '../types';

type TabType = 'tasks' | 'dependencies' | 'invitations';

export function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const { state, dispatch } = useStore();
  const [isLoading, setIsLoading]   = useState(true);
  const [error, setError]           = useState('');
  const [showMembers, setShowMembers] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab]   = useState<TabType>('tasks');
  const [depGraph, setDepGraph]     = useState<DependencyGraphType | null>(null);
  const [depGraphLoading, setDepGraphLoading] = useState(false);
  const [userRole, setUserRole]     = useState<string>('member');
  const [showSettings, setShowSettings] = useState(false);
  const [togglingDep, setTogglingDep]   = useState(false);
  const toast = useToast();

  useEffect(() => { if (id && state.isAuthenticated) loadProjectData(id); }, [id, state.isAuthenticated]);
  useEffect(() => { if (activeTab === 'dependencies' && id) loadDepGraph(id); }, [activeTab, id]);
  useEffect(() => { if (activeTab === 'dependencies' && id) loadDepGraph(id); }, [state.tasks]);

  const loadProjectData = async (projectId: string) => {
    setIsLoading(true); setError('');
    try {
      const [project, tasks, members] = await Promise.all([
        api.projects.getById(projectId),
        api.tasks.getByProject(projectId),
        api.members.getByProject(projectId),
      ]);
      const me = members.find(m => m.userId === state.user?.id);
      if (me) setUserRole(me.role);
      dispatch({ type: 'SET_CURRENT_PROJECT', payload: { project, tasks, members } });
    } catch (err: any) {
      setError(err.message || 'Project not found or access denied.');
    } finally { setIsLoading(false); }
  };

  const loadDepGraph = async (projectId: string) => {
    setDepGraphLoading(true);
    try { setDepGraph(await api.tasks.getGraph(projectId)); }
    catch {}
    finally { setDepGraphLoading(false); }
  };

  const handleToggleDepMode = async () => {
    if (!state.currentProject || !id) return;
    setTogglingDep(true);
    try {
      const updated = await api.projects.update(id, { dependencyMode: !state.currentProject.dependencyMode });
      dispatch({ type: 'SET_CURRENT_PROJECT', payload: { project: updated, tasks: state.tasks, members: state.members } });
    } catch (err: any) { toast.error(err.message || 'Failed to update settings'); }
    finally { setTogglingDep(false); }
  };

  if (!state.isAuthenticated) return <Navigate to="/login" replace />;

  if (isLoading) return (
    <div className="min-h-screen bg-brand-dark pt-16 flex">
      <Sidebar visible={sidebarOpen} />
      <div className={`flex-1 flex items-center justify-center transition-all ${sidebarOpen ? 'md:ml-64' : ''}`}>
        <div className="flex flex-col items-center text-brand-muted space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-accent" />
          <p className="text-sm">Loading project…</p>
        </div>
      </div>
    </div>
  );

  if (error || !state.currentProject) return (
    <div className="min-h-screen bg-brand-dark pt-16 flex">
      <Sidebar visible={sidebarOpen} />
      <main className={`flex-1 p-8 flex flex-col items-center justify-center transition-all ${sidebarOpen ? 'md:ml-64' : ''}`}>
        <div className="glass-panel p-8 rounded-xl text-center max-w-md w-full">
          <h2 className="text-xl font-bold text-white mb-2">Oops!</h2>
          <p className="text-brand-muted mb-6">{error || 'Project not found'}</p>
          <Link to="/dashboard"><Button icon={<ArrowLeft className="w-4 h-4" />}>Back to Dashboard</Button></Link>
        </div>
      </main>
    </div>
  );

  const depMode = state.currentProject.dependencyMode;
  const isOwner = userRole === 'owner';

  return (
    <div className="min-h-screen bg-brand-dark pt-16 flex flex-col overflow-hidden">
      <Sidebar visible={sidebarOpen} />

      {/* Sidebar toggle */}
      <button onClick={() => setSidebarOpen(v => !v)}
        className={`fixed top-[72px] z-50 flex items-center justify-center w-7 h-7 rounded-r-lg bg-brand-surface border border-l-0 border-brand-border text-brand-muted hover:text-white hover:bg-brand-accent/20 transition-all duration-300
          ${sidebarOpen ? 'left-64' : 'left-0'}`}>
        {sidebarOpen ? <PanelLeftClose className="w-3.5 h-3.5" /> : <PanelLeftOpen className="w-3.5 h-3.5" />}
      </button>

      <main className={`flex-grow flex flex-col h-[calc(100vh-4rem)] overflow-hidden transition-all duration-300 ${sidebarOpen ? 'md:ml-64' : ''}`}>
        {/* Top bar */}
        <div className="border-b border-brand-border bg-brand-surface/60 backdrop-blur-md px-3 sm:px-6 py-3 flex-shrink-0 z-10">
          <div className="flex justify-between items-center gap-3 flex-wrap">
            <div className="flex items-center space-x-2 min-w-0 flex-1">
              <Link to="/dashboard" className="text-brand-muted hover:text-white transition-colors flex-shrink-0">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg sm:text-xl font-bold text-white font-display truncate">{state.currentProject.name}</h1>
                  <span className="bg-brand-accent/20 text-brand-highlight text-xs px-2 py-0.5 rounded-full border border-brand-accent/30 flex-shrink-0">Active</span>
                  {depMode && (
                    <span className="flex items-center gap-1 bg-violet-500/15 text-violet-400 text-xs px-2 py-0.5 rounded-full border border-violet-500/30 flex-shrink-0">
                      <GitBranch className="w-3 h-3" /><span className="hidden sm:inline">Dependencies On</span>
                    </span>
                  )}
                </div>
                {state.currentProject.description && (
                  <p className="text-xs text-brand-muted truncate mt-0.5 max-w-xs sm:max-w-lg">{state.currentProject.description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {isOwner && <Button variant="ghost" size="sm" className="px-2" onClick={() => setShowSettings(true)}><Settings className="w-4 h-4" /></Button>}
              <Button variant={showMembers ? 'primary' : 'secondary'} size="sm" icon={<Users className="w-4 h-4" />} onClick={() => setShowMembers(!showMembers)}>
                <span className="hidden sm:inline">Team</span>
                <span className="ml-1 bg-brand-dark/40 px-1.5 py-0.5 rounded text-xs">{state.members.length}</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-brand-border bg-brand-surface/30 px-3 sm:px-6 flex-shrink-0 overflow-x-auto">
          <div className="flex space-x-4 sm:space-x-6 min-w-max">
            {([
              { id: 'tasks',        label: 'Tasks' },
              { id: 'dependencies', label: 'Graph',       icon: <GitBranch className="w-3.5 h-3.5" /> },
              { id: 'invitations',  label: 'Invitations', icon: <Mail className="w-3.5 h-3.5" />, adminOnly: true },
            ] as const).map(tab => {
              if ((tab as any).adminOnly && userRole === 'member') return null;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`py-3 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap flex items-center gap-1.5
                    ${activeTab === tab.id ? 'border-brand-accent text-white' : 'border-transparent text-brand-muted hover:text-white'}`}>
                  {(tab as any).icon}{tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-grow flex overflow-hidden relative">
          <div className={`flex-grow p-3 sm:p-5 overflow-auto transition-all duration-300 ${showMembers ? 'mr-64 sm:mr-72' : ''}`}>
            {activeTab === 'tasks' && <TaskBoard />}

            {activeTab === 'dependencies' && (
              <div className="h-full flex flex-col space-y-3" style={{ minHeight: 480 }}>
                <div className={`flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm flex-shrink-0
                  ${depMode ? 'bg-violet-500/10 border-violet-500/30 text-violet-300' : 'bg-brand-surface/50 border-brand-border text-brand-muted'}`}>
                  <div className="flex items-center gap-2">
                    <GitBranch className="w-4 h-4 flex-shrink-0" />
                    <span className="text-xs sm:text-sm">{depMode ? 'Dependency mode ON — tasks must be completed in order.' : 'Dependency mode OFF — tasks can be updated freely.'}</span>
                  </div>
                  {isOwner && (
                    <button onClick={handleToggleDepMode} disabled={togglingDep}
                      className="ml-3 text-xs font-medium px-2.5 py-1 rounded-lg border transition-colors hover:bg-white/10 flex-shrink-0"
                      style={{ borderColor: depMode ? '#7c3aed55' : '#1C3D35' }}>
                      {togglingDep ? '…' : depMode ? 'Turn Off' : 'Turn On'}
                    </button>
                  )}
                </div>
                <div className="flex-1" style={{ minHeight: 420 }}>
                  {depGraphLoading
                    ? <div className="h-full flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-accent" /></div>
                    : <DependencyGraph nodes={depGraph?.nodes || []} edges={depGraph?.edges || []} />
                  }
                </div>
              </div>
            )}

            {activeTab === 'invitations' && <ProjectInvitations userRole={userRole} />}
          </div>

          <AnimatePresence>
            {showMembers && (
              <motion.div initial={{ x: 288, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 288, opacity: 0 }}
                transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
                className="absolute right-0 top-0 bottom-0 w-64 sm:w-72 bg-brand-dark border-l border-brand-border z-20 shadow-[-8px_0_24px_rgba(0,0,0,0.4)]">
                <button onClick={() => setShowMembers(false)}
                  className="absolute top-3 right-3 p-1 rounded text-brand-muted hover:text-white hover:bg-brand-surface">
                  <X className="w-4 h-4" />
                </button>
                <MemberList userRole={userRole} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Settings modal */}
      <Modal isOpen={showSettings} onClose={() => setShowSettings(false)} title="Project Settings">
        <div className="space-y-5">
          <div className={`rounded-xl p-4 border cursor-pointer transition-all ${depMode ? 'bg-violet-500/10 border-violet-500/40' : 'bg-brand-surface/50 border-brand-border hover:border-brand-accent/30'}`}
            onClick={handleToggleDepMode}>
            <div className="flex items-start space-x-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${depMode ? 'bg-violet-500/20' : 'bg-brand-surface'}`}>
                <GitBranch className={`w-5 h-5 ${depMode ? 'text-violet-400' : 'text-brand-muted'}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-white">Task Dependency Mode</p>
                  <div className={`w-11 h-6 rounded-full flex items-center px-0.5 transition-colors ${depMode ? 'bg-violet-600' : 'bg-brand-border'}`}>
                    <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${depMode ? 'translate-x-5' : 'translate-x-0'}`} />
                  </div>
                </div>
                <p className="text-xs text-brand-muted mt-1">
                  {depMode ? 'ON — Task B cannot start until Task A is done.' : 'OFF — Tasks are independent, update in any order.'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex justify-end pt-2 border-t border-brand-border">
            <Button variant="ghost" onClick={() => setShowSettings(false)}>Close</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
