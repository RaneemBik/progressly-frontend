/**
 * ProjectInvitations.tsx — Project Invitations Tab (Paginated)
 *
 * Fetches and displays all invitations sent for a project.
 * Only visible to owner and admin (filtered in ProjectPage tab list).
 *
 * Each invitation shows:
 *  - Invitee email, status badge, role badge
 *  - Invited by (name), sent date, expiry date
 *  - Cancel button (hover, pending invites only)
 *
 * Pagination: 6 items per page, animated page number buttons
 *  (same Pagination component pattern as Dashboard).
 */
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../services/api';
import { ProjectInvitation } from '../../types';
import { Mail, Trash2, Check, Clock, X, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { useToast } from '../ui/Toast';

const PAGE_SIZE = 6;

function Pagination({ page, total, onChange }: { page: number; total: number; onChange: (p: number) => void }) {
  const pages = Math.ceil(total / PAGE_SIZE);
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <button onClick={() => onChange(page - 1)} disabled={page === 1}
        className="p-1.5 rounded-lg text-brand-muted hover:text-white hover:bg-brand-surface disabled:opacity-30 transition-all">
        <ChevronLeft className="w-4 h-4" />
      </button>
      {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
        <motion.button key={p} onClick={() => onChange(p)}
          whileTap={{ scale: 0.9 }}
          className={`w-8 h-8 rounded-lg text-sm font-semibold transition-all duration-200 relative overflow-hidden
            ${p === page ? 'text-white' : 'text-brand-muted hover:text-white hover:bg-brand-surface'}`}>
          {p === page && (
            <motion.div layoutId="invPageActive"
              className="absolute inset-0 bg-brand-accent rounded-lg"
              transition={{ type: 'spring', bounce: 0.3, duration: 0.4 }} />
          )}
          {p === page && (
            <motion.div className="absolute inset-0 rounded-lg bg-brand-highlight/20"
              animate={{ opacity: [0.4, 0, 0.4] }} transition={{ duration: 2, repeat: Infinity }} />
          )}
          <span className="relative z-10">{p}</span>
        </motion.button>
      ))}
      <button onClick={() => onChange(page + 1)} disabled={page === pages}
        className="p-1.5 rounded-lg text-brand-muted hover:text-white hover:bg-brand-surface disabled:opacity-30 transition-all">
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

const ProjectInvitations: React.FC<{ userRole?: string }> = ({ userRole = 'member' }) => {
  const { id: projectId } = useParams<{ id: string }>();
  const [invitations, setInvitations] = useState<ProjectInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const toast = useToast();
  const [page, setPage]       = useState(1);
  const isAdminOrOwner = userRole === 'admin' || userRole === 'owner';

  useEffect(() => { 
    if (isAdminOrOwner) {
      fetchInvitations();
    } else {
      setLoading(false);
    }
  }, [projectId, isAdminOrOwner]);

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      if (!projectId) throw new Error('Project ID is required');
      const response = await api.invitations.getByProject(projectId);
      setInvitations(response || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load invitations');
    } finally { setLoading(false); }
  };

  const handleCancel = async (inviteId: string) => {
    if (!projectId) return;
    try {
      await api.invitations.cancel(projectId, inviteId);
      setInvitations(prev => prev.filter(i => i.id !== inviteId));
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel invitation');
    }
  };

  const statusConfig: Record<string, { cls: string; icon: React.ReactNode; label: string }> = {
    accepted:  { cls: 'bg-[#3EBD8A]/15 text-[#3EBD8A] border border-[#3EBD8A]/40',   icon: <Check className="w-3.5 h-3.5" />,  label: 'Accepted' },
    pending:   { cls: 'bg-brand-warning/15 text-brand-warning border border-brand-warning/40', icon: <Clock className="w-3.5 h-3.5" />, label: 'Pending' },
    cancelled: { cls: 'bg-brand-danger/15 text-brand-danger border border-brand-danger/40',   icon: <X className="w-3.5 h-3.5" />,     label: 'Cancelled' },
  };

  const paginated = invitations.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (loading) return (
    <div className="flex items-center justify-center py-16 text-brand-muted">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-brand-accent border-t-transparent animate-spin" />
        <p className="text-sm">Loading invitations…</p>
      </div>
    </div>
  );

  if (!isAdminOrOwner) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="glass-panel rounded-xl p-6 text-center max-w-sm">
          <p className="text-brand-muted text-sm">Only admins and owners can manage invitations.</p>
        </div>
      </div>
    );
  }

  if (error) return (
    <div className="flex items-center justify-center py-16">
      <div className="glass-panel rounded-xl p-6 text-center max-w-sm">
        <p className="text-brand-danger text-sm">{error}</p>
      </div>
    </div>
  );

  if (invitations.length === 0) return (
    <div className="flex flex-col items-center justify-center py-16 text-brand-muted space-y-3">
      <Users className="w-10 h-10 opacity-30" />
      <p className="text-sm">No invitations sent yet.</p>
      <p className="text-xs text-brand-muted/60">Invite team members using the Team panel.</p>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Mail className="w-4 h-4 text-brand-accent" />
          Invitations
        </h3>
        <span className="text-xs text-brand-muted">{invitations.length} total</span>
      </div>

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {paginated.map((inv, idx) => {
            const sc = statusConfig[inv.status] || statusConfig.pending;
            return (
              <motion.div key={inv.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25, delay: idx * 0.05 }}
                className="glass-panel rounded-xl p-4 border border-brand-border/50 flex items-center gap-4 group">

                <div className="w-9 h-9 rounded-full bg-brand-surface border border-brand-border flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4 h-4 text-brand-muted" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-white truncate">{inv.email}</p>
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${sc.cls}`}>
                      {sc.icon}{sc.label}
                    </span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-brand-surface border border-brand-border text-brand-muted capitalize">
                      {inv.role}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-brand-muted/70 flex-wrap">
                    <span>Invited by {inv.invitedBy?.name || 'Unknown'}</span>
                    <span>·</span>
                    <span>{new Date(inv.createdAt).toLocaleDateString()}</span>
                    {inv.status === 'pending' && inv.expiresAt && (
                      <>
                        <span>·</span>
                        <span>Expires {new Date(inv.expiresAt).toLocaleDateString()}</span>
                      </>
                    )}
                  </div>
                </div>

                {inv.status === 'pending' && (
                  <button onClick={() => handleCancel(inv.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-brand-muted hover:text-brand-danger hover:bg-brand-danger/10 transition-all flex-shrink-0"
                    title="Cancel invitation">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <Pagination page={page} total={invitations.length} onChange={setPage} />
    </div>
  );
};

export default ProjectInvitations;
