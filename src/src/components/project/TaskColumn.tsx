/**
 * TaskColumn.tsx — Single Kanban Column (To Do / In Progress / Done)
 *
 * Handles HTML5 drag-and-drop:
 *  dragover  → highlights drop zone
 *  dragleave → removes highlight
 *  drop      → validates move client-side, calls onDrop if allowed
 *
 * canMoveToStatus(task, newStatus, allTasks, depMode):
 *   Client-side mirror of the backend dependency enforcement logic.
 *   Prevents the drop and flashes a red "Prerequisites not met" message
 *   before even making an API call. The backend enforces the same rules
 *   as a safety net.
 *
 * Column header shows a coloured status dot and the task count badge.
 * Empty column shows a dashed "Drop here" placeholder.
 */
import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Task, TaskStatus } from '../../types';
import { TaskCard } from './TaskCard';
import { Plus, Lock } from 'lucide-react';

interface TaskColumnProps {
  title: string;
  status: TaskStatus;
  tasks: Task[];
  allTasks: Task[];
  onDrop: (taskId: string, newStatus: TaskStatus) => void;
  onAddTask: () => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  dependencyMode: boolean;
}

// Returns whether a task is allowed to enter a given column
function canMoveToStatus(task: Task, newStatus: TaskStatus, allTasks: Task[], depMode: boolean): boolean {
  if (!depMode || !task.dependsOn || task.dependsOn.length === 0) return true;
  if (newStatus === 'todo') return true; // can always move back to todo

  const parents = allTasks.filter(t => task.dependsOn!.includes(t.id));

  if (newStatus === 'in_progress') {
    // All parents must be at least in_progress
    return parents.every(p => p.status === 'in_progress' || p.status === 'done');
  }
  if (newStatus === 'done') {
    // All parents must be done
    return parents.every(p => p.status === 'done');
  }
  return true;
}

export function TaskColumn({ title, status, tasks, allTasks, onDrop, onAddTask, onEditTask, onDeleteTask, dependencyMode }: TaskColumnProps) {
  const [isDragOver, setIsDragOver]   = useState(false);
  const [isBlocking, setIsBlocking]   = useState(false); // column is refusing the drop

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    const taskId = e.dataTransfer.types.includes('text/plain')
      ? e.dataTransfer.getData('taskId')
      : null;

    // We can't read data during dragover in all browsers, so allow it
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
    setIsBlocking(false);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    setIsBlocking(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    setIsBlocking(false);
    const taskId = e.dataTransfer.getData('taskId');
    if (!taskId) return;

    const task = allTasks.find(t => t.id === taskId);
    if (!task) return;

    // Client-side pre-check so we get instant feedback
    if (!canMoveToStatus(task, status, allTasks, dependencyMode)) {
      setIsBlocking(true);
      setTimeout(() => setIsBlocking(false), 1200);
      return;
    }

    onDrop(taskId, status);
  };

  const statusConfig = {
    todo:        { dot: 'bg-brand-muted',    ring: 'border-brand-muted/30',    glow: '' },
    in_progress: { dot: 'bg-brand-warning',  ring: 'border-brand-warning/30',  glow: 'shadow-brand-warning/10' },
    done:        { dot: 'bg-[#3EBD8A]',      ring: 'border-[#3EBD8A]/30',      glow: 'shadow-[#3EBD8A]/10' },
  }[status];

  return (
    <div className="flex flex-col h-full min-w-[300px] max-w-[340px] w-full flex-shrink-0">
      {/* Column header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center space-x-2">
          <div className={`w-2.5 h-2.5 rounded-full ${statusConfig.dot}`} />
          <h3 className="font-semibold text-white text-sm">{title}</h3>
          <span className="bg-brand-surface text-xs px-2 py-0.5 rounded-full text-brand-muted border border-brand-border">
            {tasks.length}
          </span>
        </div>
        <button onClick={onAddTask}
          className="p-1 rounded hover:bg-brand-surface text-brand-muted hover:text-white transition-colors"
          title="Add task">
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Drop zone */}
      <div
        className={`flex-grow rounded-xl p-2 overflow-y-auto space-y-2.5 transition-all duration-200 border-2
          ${isBlocking
            ? 'bg-brand-danger/8 border-brand-danger/50 shadow-inner'
            : isDragOver
              ? `bg-brand-surface/70 border-brand-accent/50 border-dashed shadow-lg ${statusConfig.glow}`
              : `bg-brand-surface/25 border-transparent ${statusConfig.ring}`}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}>

        {isBlocking && (
          <div className="flex items-center justify-center py-3 text-brand-danger text-xs font-medium gap-1.5 animate-pulse">
            <Lock className="w-3.5 h-3.5" />
            Prerequisites not met
          </div>
        )}

        <AnimatePresence>
          {tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              allTasks={allTasks}
              dependencyMode={dependencyMode}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
            />
          ))}
        </AnimatePresence>

        {tasks.length === 0 && !isDragOver && !isBlocking && (
          <div className="h-20 border-2 border-dashed border-brand-border/40 rounded-lg flex items-center justify-center text-xs text-brand-muted/40">
            Drop here
          </div>
        )}
      </div>
    </div>
  );
}
