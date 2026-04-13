/**
 * Sidebar.tsx — Collapsible Left Navigation Sidebar
 *
 * Shows:
 *  - Dashboard link
 *  - List of the user's active projects (from global store)
 *
 * Controlled component: parent passes visible={boolean} and onToggle().
 * Uses Framer Motion AnimatePresence to slide in/out smoothly (x: -264px).
 * When hidden, the main content area expands to full width.
 *
 * Used on both Dashboard and ProjectPage.
 */
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard } from 'lucide-react';
import { useStore } from '../../store/useStore';

interface SidebarProps { visible?: boolean; onToggle?: () => void; }

export function Sidebar({ visible = true }: SidebarProps) {
  const { state } = useStore();

  return (
    <AnimatePresence initial={false}>
      {visible && (
        <motion.div
          key="sidebar"
          initial={{ x: -264, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -264, opacity: 0 }}
          transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
          className="w-64 bg-brand-surface border-r border-brand-border h-[calc(100vh-4rem)] fixed left-0 top-16 overflow-y-auto z-40"
        >
          <div className="p-4">
            <div className="space-y-1 mb-8">
              <NavLink to="/dashboard" end
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2 rounded-md transition-colors text-sm font-medium
                   ${isActive ? 'bg-brand-accent/10 text-brand-highlight border border-brand-accent/20' : 'text-brand-muted hover:text-brand-text hover:bg-brand-dark/50'}`}>
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </NavLink>
            </div>

            <div className="mb-3 flex items-center justify-between px-3">
              <h3 className="text-xs font-semibold text-brand-muted uppercase tracking-wider">Your Projects</h3>
            </div>

            <div className="space-y-1">
              {state.projects.map(project => (
                <NavLink key={project.id} to={`/projects/${project.id}`}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3 py-2 rounded-md transition-colors text-sm
                     ${isActive ? 'bg-brand-accent/10 text-brand-highlight border border-brand-accent/20' : 'text-brand-muted hover:text-brand-text hover:bg-brand-dark/50'}`}>
                  <div className="w-2 h-2 rounded-full bg-brand-secondary flex-shrink-0" />
                  <span className="truncate">{project.name}</span>
                </NavLink>
              ))}
              {state.projects.length === 0 && (
                <div className="px-3 py-2 text-sm text-brand-muted/50 italic">No projects yet</div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
