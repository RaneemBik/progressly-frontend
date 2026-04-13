/**
 * TaskCard.tsx — Individual Task Card in the Kanban Board
 *
 * Draggable card (HTML5 drag API). Features:
 *  - Priority dot (red = high, amber = medium, blue = low)
 *  - Blocked banner: shown when isBlocked is true AND dependencyMode is on
 *  - Parent task status mini-pills: shows each parent task's current status
 *    as a small coloured indicator so the user knows what's blocking them
 *  - Dependency count badge (link icon + count)
 *  - Assignee avatar (initials) or dashed circle if unassigned
 *  - Edit / Delete buttons (appear on hover)
 *
 * Blocked tasks show a red 🔒 visual indicator but remain draggable —
 * the column handles the drop rejection.
 */
import React from 'react';
import { motion } from 'framer-motion';
import { Edit2, Trash2, AlignLeft, Link2, Lock, CheckCircle2 } from 'lucide-react';
import { Task } from '../../types';

interface Props {
  task: Task;
  allTasks: Task[];
  dependencyMode: boolean;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

export function TaskCard({ task, allTasks, dependencyMode, onEdit, onDelete }: Props) {
  const isBlocked = task.isBlocked && dependencyMode;

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('taskId', task.id);
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => { (e.target as HTMLElement).style.opacity = '0.45'; }, 0);
  };
  const handleDragEnd = (e: React.DragEvent) => { (e.target as HTMLElement).style.opacity = '1'; };

  const priorityDot   = { low: 'bg-sky-400', medium: 'bg-brand-warning', high: 'bg-brand-danger' }[task.priority];
  const priorityLabel = { low: 'Low',         medium: 'Med',              high: 'High' }[task.priority];

  // Show parent task statuses as mini indicators
  const parents = task.dependsOn?.length
    ? allTasks.filter(t => task.dependsOn!.includes(t.id))
    : [];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92 }}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={() => onEdit(task)}
      className={`glass-panel p-3.5 rounded-xl group transition-all duration-200 relative cursor-grab active:cursor-grabbing
        ${isBlocked
          ? 'border-brand-danger/40 bg-brand-danger/5 hover:border-brand-danger/60'
          : 'hover:border-brand-accent/50 hover:shadow-md hover:shadow-brand-accent/10'
        }`}
    >
      {/* Blocked banner */}
      {isBlocked && (
        <div className="flex items-center gap-1.5 mb-2 px-2 py-1 rounded-lg bg-brand-danger/15 border border-brand-danger/30">
          <Lock className="w-3 h-3 text-brand-danger flex-shrink-0" />
          <span className="text-xs text-brand-danger font-medium">Blocked — prerequisites pending</span>
        </div>
      )}

      {/* Header row */}
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${priorityDot}`} />
          <span className="text-xs font-semibold text-brand-muted uppercase tracking-wider">{priorityLabel}</span>
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
          <button onClick={e => { e.stopPropagation(); onEdit(task); }}
            className="p-1 rounded text-brand-muted hover:text-brand-highlight hover:bg-brand-surface">
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={e => { e.stopPropagation(); onDelete(task.id); }}
            className="p-1 rounded text-brand-muted hover:text-brand-danger hover:bg-brand-danger/10">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Title */}
      <h4 className={`text-sm font-medium leading-snug mb-3 ${isBlocked ? 'text-white/55' : 'text-white'}`}>
        {task.title}
      </h4>

      {/* Parent task mini-status */}
      {parents.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {parents.map(p => (
            <div key={p.id} className="flex items-center gap-1 text-xs text-brand-muted bg-brand-surface/60 border border-brand-border/50 rounded-full px-2 py-0.5">
              {p.status === 'done'
                ? <CheckCircle2 className="w-3 h-3 text-[#3EBD8A]" />
                : p.status === 'in_progress'
                  ? <span className="w-2 h-2 rounded-full bg-brand-warning inline-block" />
                  : <span className="w-2 h-2 rounded-full bg-brand-muted inline-block" />
              }
              <span className="truncate max-w-[80px]">{p.title}</span>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-brand-border/40">
        <div className="flex items-center space-x-2 text-brand-muted">
          {task.description && <AlignLeft className="w-3.5 h-3.5" />}
          {(task.dependsOn?.length || 0) > 0 && (
            <span className="flex items-center gap-0.5 text-xs text-brand-muted/70">
              <Link2 className="w-3 h-3" />{task.dependsOn!.length}
            </span>
          )}
        </div>
        {task.assigneeName ? (
          <div className="w-6 h-6 rounded-full bg-brand-accent/25 border border-brand-accent/50 flex items-center justify-center text-xs font-bold text-brand-highlight flex-shrink-0"
            title={`Assigned to ${task.assigneeName}`}>
            {task.assigneeName.charAt(0).toUpperCase()}
          </div>
        ) : (
          <div className="w-6 h-6 rounded-full border border-dashed border-brand-border flex items-center justify-center flex-shrink-0" title="Unassigned">
            <span className="text-[10px] text-brand-muted">?</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
