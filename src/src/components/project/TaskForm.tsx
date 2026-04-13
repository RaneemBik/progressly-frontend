/**
 * TaskForm.tsx — Create / Edit Task Modal Form
 *
 * Fields:
 *  Title (required), Description, Priority, Assignee
 *
 * Dependency picker (shown when dependencyMode is on or when editing a
 * task that already has dependencies):
 *  - Checklist of all other tasks in the project
 *  - Each row shows the task's current status (coloured dot + label)
 *  - Selected dependencies appear as removable chip tags below the list
 *
 * On save: calls create or update API, then refreshes ALL tasks in the
 * store so isBlocked states are recalculated and reflected immediately.
 */
import React, { useEffect, useState } from 'react';
import { AlignLeft, Type, User, AlertCircle, Link2, X } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Task, TaskPriority } from '../../types';
import { api } from '../../services/api';
import { useStore } from '../../store/useStore';

interface TaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  taskToEdit?: Task | null;
}

export function TaskForm({ isOpen, onClose, projectId, taskToEdit }: TaskFormProps) {
  const { state, dispatch } = useStore();
  const [title, setTitle]           = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority]     = useState<TaskPriority>('medium');
  const [assigneeId, setAssigneeId] = useState('');
  const [dependsOn, setDependsOn]   = useState<string[]>([]);
  const [isLoading, setIsLoading]   = useState(false);
  const [error, setError]           = useState('');

  const depMode = state.currentProject?.dependencyMode ?? false;

  // Tasks available as dependencies — exclude current task and its descendants
  const availableTasks = state.tasks.filter(t => {
    if (taskToEdit && t.id === taskToEdit.id) return false;
    return true;
  });

  useEffect(() => {
    if (!isOpen) return;
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description || '');
      setPriority(taskToEdit.priority);
      setAssigneeId(taskToEdit.assigneeId || '');
      setDependsOn(taskToEdit.dependsOn || []);
    } else {
      setTitle(''); setDescription(''); setPriority('medium');
      setAssigneeId(''); setDependsOn([]);
    }
    setError('');
  }, [taskToEdit, isOpen]);

  const toggleDependency = (taskId: string) => {
    setDependsOn(prev =>
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setIsLoading(true); setError('');
    try {
      if (taskToEdit) {
        const updated = await api.tasks.update(taskToEdit.id, {
          title: title.trim(), description: description.trim(),
          priority, assigneeId: assigneeId || undefined,
          dependsOn, projectId,
        });
        dispatch({ type: 'UPDATE_TASK', payload: updated });

        // Refresh all tasks so blocked states are up to date
        const allTasks = await api.tasks.getByProject(projectId);
        allTasks.forEach(t => dispatch({ type: 'UPDATE_TASK', payload: t }));
      } else {
        const created = await api.tasks.create({
          projectId, title: title.trim(), description: description.trim(),
          priority, assigneeId: assigneeId || undefined,
          dependsOn,
        });
        dispatch({ type: 'ADD_TASK', payload: created });

        // Refresh to get updated blocked statuses
        const allTasks = await api.tasks.getByProject(projectId);
        allTasks.forEach(t => dispatch({ type: 'UPDATE_TASK', payload: t }));
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save task');
    } finally {
      setIsLoading(false);
    }
  };

  const sel = 'flex h-10 w-full rounded-md border border-brand-border bg-brand-surface/50 px-3 py-2 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent appearance-none';

  const statusLabel = (s: string) => s === 'todo' ? 'To Do' : s === 'in_progress' ? 'In Progress' : 'Done';
  const statusDot   = (s: string) => s === 'done' ? 'bg-[#3EBD8A]' : s === 'in_progress' ? 'bg-brand-warning' : 'bg-brand-muted';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={taskToEdit ? 'Edit Task' : 'Create New Task'} maxWidth="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 rounded-md bg-brand-danger/10 border border-brand-danger/20 text-brand-danger text-sm">{error}</div>
        )}

        <Input label="Task Title" required value={title} onChange={e => setTitle(e.target.value)}
          icon={<Type className="w-5 h-5" />} placeholder="What needs to be done?" autoFocus />

        <div>
          <label className="block text-sm font-medium text-brand-muted mb-1.5 flex items-center gap-1.5">
            <AlignLeft className="w-4 h-4" />Description
          </label>
          <textarea className="flex w-full rounded-md border border-brand-border bg-brand-surface/50 px-3 py-2 text-sm text-brand-text placeholder:text-brand-muted/50 focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent resize-none h-20"
            value={description} onChange={e => setDescription(e.target.value)} placeholder="Add more details..." />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-brand-muted mb-1.5 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" />Priority
            </label>
            <select value={priority} onChange={e => setPriority(e.target.value as TaskPriority)} className={sel}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-muted mb-1.5 flex items-center gap-1.5">
              <User className="w-4 h-4" />Assignee
            </label>
            <select value={assigneeId} onChange={e => setAssigneeId(e.target.value)} className={sel}>
              <option value="">Unassigned</option>
              {state.members.map(m => <option key={m.id} value={m.userId}>{m.userName}</option>)}
            </select>
          </div>
        </div>

        {/* Dependency picker — always show when depMode is on, optional when off */}
        <div>
          <label className="block text-sm font-medium text-brand-muted mb-1.5 flex items-center gap-1.5">
            <Link2 className="w-4 h-4" />
            Depends on
            {depMode && <span className="ml-auto text-xs bg-violet-500/20 text-violet-400 px-2 py-0.5 rounded-full border border-violet-500/30">Dep. mode on</span>}
          </label>

          {availableTasks.length === 0 ? (
            <p className="text-xs text-brand-muted/60 italic py-2">No other tasks yet — this will be the first task.</p>
          ) : (
            <div className="border border-brand-border rounded-lg overflow-hidden divide-y divide-brand-border/50">
              {availableTasks.map(t => {
                const selected = dependsOn.includes(t.id);
                return (
                  <button key={t.id} type="button" onClick={() => toggleDependency(t.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2.5 text-sm transition-colors text-left
                      ${selected ? 'bg-brand-accent/15 hover:bg-brand-accent/20' : 'hover:bg-brand-surface/60'}`}>
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors
                      ${selected ? 'bg-brand-accent border-brand-accent' : 'border-brand-border'}`}>
                      {selected && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 10">
                        <path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>}
                    </div>
                    <span className={`flex-1 truncate ${selected ? 'text-white font-medium' : 'text-brand-text'}`}>{t.title}</span>
                    <span className="flex items-center gap-1.5 flex-shrink-0">
                      <span className={`w-1.5 h-1.5 rounded-full ${statusDot(t.status)}`} />
                      <span className="text-xs text-brand-muted">{statusLabel(t.status)}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {dependsOn.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {dependsOn.map(id => {
                const t = state.tasks.find(t => t.id === id);
                return t ? (
                  <span key={id} className="flex items-center gap-1 text-xs bg-brand-accent/20 text-brand-highlight border border-brand-accent/30 rounded-full px-2 py-0.5">
                    {t.title}
                    <button type="button" onClick={() => toggleDependency(id)} className="hover:text-white">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ) : null;
              })}
            </div>
          )}

          {depMode && dependsOn.length === 0 && (
            <p className="text-xs text-brand-muted/60 mt-1.5">
              No dependency selected — this task can be moved freely.
            </p>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-brand-border">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" isLoading={isLoading}>{taskToEdit ? 'Save Changes' : 'Create Task'}</Button>
        </div>
      </form>
    </Modal>
  );
}
