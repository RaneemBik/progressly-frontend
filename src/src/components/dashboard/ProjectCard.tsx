/**
 * ProjectCard.tsx — Project Summary Card (Dashboard Grid)
 *
 * Displays: coloured accent bar, project name, description excerpt,
 *   task count, member count, dependency mode indicator, creation date.
 *
 * Coloured accent: cycles through 5 colour themes based on the last
 *   character of the project ID (deterministic, consistent across renders).
 *
 * Trash action (owner only, appears on hover):
 *  - Opens ConfirmDialog asking "Move to trash?"
 *  - On confirm: calls api.projects.trash(), removes from store, shows toast
 *
 * Entire card is wrapped in a Link to /projects/:id.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FolderKanban, CheckSquare, Users, ChevronRight, Trash2, GitBranch } from 'lucide-react';
import { Project } from '../../types';
import { api } from '../../services/api';
import { useStore } from '../../store/useStore';
import { useToast, ConfirmDialog } from '../ui/Toast';

interface Props { project: Project; index: number; }

const ACCENTS = [
  { bar: 'bg-brand-accent',    icon: 'text-brand-highlight', ring: 'bg-brand-accent/15' },
  { bar: 'bg-brand-secondary', icon: 'text-brand-secondary', ring: 'bg-brand-secondary/15' },
  { bar: 'bg-sky-500',         icon: 'text-sky-400',         ring: 'bg-sky-500/15' },
  { bar: 'bg-violet-500',      icon: 'text-violet-400',      ring: 'bg-violet-500/15' },
  { bar: 'bg-amber-500',       icon: 'text-amber-400',       ring: 'bg-amber-500/15' },
];

export function ProjectCard({ project, index }: Props) {
  const { state, dispatch } = useStore();
  const toast   = useToast();
  const [trashing, setTrashing]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const ac = ACCENTS[project.id.charCodeAt(project.id.length - 1) % ACCENTS.length];
  const isOwner = state.user && project.ownerId === state.user.id;

  const handleTrash = async () => {
    setTrashing(true);
    try {
      await api.projects.trash(project.id);
      dispatch({ type: 'SET_PROJECTS', payload: state.projects.filter(p => p.id !== project.id) });
      toast.success(`"${project.name}" moved to trash`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to move to trash');
      setTrashing(false);
    }
  };

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.07 }}>
        <Link to={`/projects/${project.id}`} className="block h-full">
          <div className="glass-panel h-full p-5 rounded-xl hover:border-brand-accent/60 transition-all duration-300 group flex flex-col relative overflow-hidden">
            <div className={`absolute top-0 left-0 right-0 h-0.5 ${ac.bar}`} />

            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center space-x-3 min-w-0">
                <div className={`w-9 h-9 rounded-lg ${ac.ring} flex items-center justify-center flex-shrink-0`}>
                  <FolderKanban className={`w-4 h-4 ${ac.icon}`} />
                </div>
                <h3 className="text-sm font-semibold text-white group-hover:text-brand-highlight transition-colors line-clamp-1 font-display">
                  {project.name}
                </h3>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {isOwner && (
                  <button
                    onClick={e => { e.preventDefault(); e.stopPropagation(); setShowConfirm(true); }}
                    disabled={trashing}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-brand-muted hover:text-brand-danger hover:bg-brand-danger/10 transition-all"
                    title="Move to trash">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
                <div className="w-7 h-7 rounded-full bg-brand-surface flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRight className="w-3.5 h-3.5 text-brand-muted" />
                </div>
              </div>
            </div>

            <p className="text-sm text-brand-muted mb-4 flex-grow line-clamp-2 leading-relaxed">
              {project.description || 'No description provided.'}
            </p>

            <div className="flex items-center justify-between pt-3 border-t border-brand-border/50">
              <div className="flex items-center gap-3 text-xs text-brand-muted">
                <span className="flex items-center gap-1"><CheckSquare className="w-3.5 h-3.5" />{project.taskCount}</span>
                <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{project.memberCount}</span>
                {project.dependencyMode && (
                  <span className="flex items-center gap-1 text-violet-400" title="Dependency mode on">
                    <GitBranch className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>
              <span className="text-xs text-brand-muted/50">{new Date(project.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </Link>
      </motion.div>

      <ConfirmDialog
        isOpen={showConfirm}
        title="Move to Trash"
        message={`Move "${project.name}" to trash? You can restore it later.`}
        confirmLabel="Move to Trash"
        danger={false}
        onConfirm={() => { setShowConfirm(false); handleTrash(); }}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
}
