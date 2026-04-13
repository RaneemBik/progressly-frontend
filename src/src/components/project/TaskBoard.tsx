/**
 * TaskBoard.tsx — Kanban Board Container
 *
 * Manages board-level state and event handlers:
 *
 * handleDrop(taskId, newStatus)
 *   Optimistically updates the store, calls the API, and reverts + shows
 *   a toast error if the backend rejects it (e.g. dependency violation).
 *
 * handleDeleteTask(taskId)
 *   Opens ConfirmDialog, then calls api.tasks.delete() and refreshes tasks.
 *
 * After every status change or delete, refreshTasks() re-fetches all tasks
 * so isBlocked flags stay accurate across all columns.
 *
 * Passes dependencyMode and allTasks down to each TaskColumn for
 * client-side drop pre-validation.
 */
import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { api } from '../../services/api';
import { TaskColumn } from './TaskColumn';
import { TaskForm } from './TaskForm';
import { Task, TaskStatus } from '../../types';
import { useToast, ConfirmDialog } from '../ui/Toast';

export function TaskBoard() {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const [isFormOpen, setIsFormOpen]     = useState(false);
  const [taskToEdit, setTaskToEdit]     = useState<Task | null>(null);
  const [dropError, setDropError]       = useState<string | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  if (!state.currentProject) return null;
  const projectId = state.currentProject.id;

  const refreshTasks = async () => {
    const tasks = await api.tasks.getByProject(projectId);
    dispatch({ type: 'SET_CURRENT_PROJECT', payload: { project: state.currentProject!, tasks, members: state.members } });
  };

  const handleDrop = async (taskId: string, newStatus: TaskStatus) => {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task || task.status === newStatus) return;

    dispatch({ type: 'UPDATE_TASK', payload: { ...task, status: newStatus } });
    setDropError(null);

    try {
      await api.tasks.update(taskId, { status: newStatus, projectId });
      await refreshTasks();
    } catch (err: any) {
      dispatch({ type: 'UPDATE_TASK', payload: task }); // revert
      const msg = err.message || 'Cannot move this task right now.';
      setDropError(msg);
      toast.error(msg);
      setTimeout(() => setDropError(null), 4000);
    }
  };

  const handleEditTask  = (task: Task) => { setTaskToEdit(task); setIsFormOpen(true); };
  const handleAddTask   = ()           => { setTaskToEdit(null); setIsFormOpen(true); };

  const handleDeleteTask = (taskId: string) => {
    const task = state.tasks.find(t => t.id === taskId);
    if (task) setTaskToDelete(task);
  };

  const confirmDeleteTask = async () => {
    if (!taskToDelete) return;
    const id = taskToDelete.id;
    setTaskToDelete(null);
    dispatch({ type: 'DELETE_TASK', payload: id });
    try {
      await api.tasks.delete(id, projectId);
      toast.success('Task deleted');
      await refreshTasks();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete task');
      await refreshTasks();
    }
  };

  const columns: { title: string; status: TaskStatus }[] = [
    { title: 'To Do',       status: 'todo'        },
    { title: 'In Progress', status: 'in_progress'  },
    { title: 'Done',        status: 'done'         },
  ];

  return (
    <div className="h-full flex flex-col">
      {dropError && (
        <div className="mb-3 flex-shrink-0 px-4 py-3 rounded-xl bg-brand-danger/10 border border-brand-danger/40 text-brand-danger text-sm flex items-center gap-2">
          <span>🔒</span><span>{dropError}</span>
        </div>
      )}

      <div className="flex-grow overflow-x-auto pb-4">
        <div className="flex gap-5 h-full min-h-[500px]">
          {columns.map(col => (
            <TaskColumn
              key={col.status}
              title={col.title}
              status={col.status}
              tasks={state.tasks.filter(t => t.status === col.status)}
              allTasks={state.tasks}
              onDrop={handleDrop}
              onAddTask={handleAddTask}
              onEditTask={handleEditTask}
              onDeleteTask={handleDeleteTask}
              dependencyMode={state.currentProject?.dependencyMode ?? false}
            />
          ))}
        </div>
      </div>

      <TaskForm
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setTaskToEdit(null); }}
        projectId={projectId}
        taskToEdit={taskToEdit}
      />

      <ConfirmDialog
        isOpen={!!taskToDelete}
        title="Delete Task"
        message={`Delete "${taskToDelete?.title}"? This cannot be undone.`}
        confirmLabel="Delete Task"
        danger
        onConfirm={confirmDeleteTask}
        onCancel={() => setTaskToDelete(null)}
      />
    </div>
  );
}
