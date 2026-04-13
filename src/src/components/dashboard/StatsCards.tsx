/**
 * StatsCards.tsx — Dashboard Summary Statistics
 *
 * Displays 4 metric cards in a responsive grid:
 *  - Total Projects (from store.projects.length)
 *  - Total Tasks (sum of project.taskCount across all projects)
 *  - Total Members (sum of project.memberCount)
 *  - Active Projects (same as total — all listed projects are active)
 *
 * Data comes from the global store — no additional API calls needed.
 * Cards animate in with staggered delays using Framer Motion.
 */
// React import not needed with automatic JSX runtime
import { motion } from 'framer-motion';
import { FolderKanban, CheckSquare, Clock, CheckCircle2 } from 'lucide-react';
import { useStore } from '../../store/useStore';

export function StatsCards() {
  const { state } = useStore();
  const totalProjects = state.projects.length;
  const totalTasks    = state.projects.reduce((a, p) => a + (p.taskCount || 0), 0);

  const stats = [
    { label: 'Total Projects', value: totalProjects, icon: FolderKanban, color: 'text-brand-highlight', bg: 'bg-brand-highlight/10', border: 'border-brand-highlight/20' },
    { label: 'Total Tasks',    value: totalTasks,    icon: CheckSquare,   color: 'text-sky-400',         bg: 'bg-sky-400/10',         border: 'border-sky-400/20' },
    { label: 'Team Members',   value: state.projects.reduce((a, p) => a + (p.memberCount || 0), 0), icon: CheckCircle2, color: 'text-brand-secondary', bg: 'bg-brand-secondary/10', border: 'border-brand-secondary/20' },
    { label: 'Active Projects',value: totalProjects, icon: Clock, color: 'text-brand-warning', bg: 'bg-brand-warning/10', border: 'border-brand-warning/20' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((s, i) => (
        <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.08 }}
          className={`glass-panel p-5 rounded-xl flex items-center space-x-4 border ${s.border}`}>
          <div className={`w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 ${s.bg}`}>
            <s.icon className={`w-5 h-5 ${s.color}`} />
          </div>
          <div>
            <p className="text-xs font-medium text-brand-muted uppercase tracking-wider">{s.label}</p>
            <p className="text-2xl font-bold text-white font-display">{s.value}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
