/**
 * PendingInvitations.tsx — Dashboard Invite Notification Panel
 *
 * Fetches pending project invitations addressed to the current user's email
 * via GET /api/invites/pending.
 *
 * Allows the user to:
 *  - Accept an invitation → adds them as a project member
 *  - Reject an invitation → marks it as cancelled
 *
 * Shown on the dashboard when there are pending invites.
 */
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, CheckCircle2, X, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import { useStore } from '../../store/useStore';
import { useToast } from '../ui/Toast';

interface PendingInvitation {
  id: string;
  projectId: string;
  projectName: string;
  projectDescription: string;
  role: string;
  invitedBy: { id: string; name: string };
  expiresAt: string;
  createdAt: string;
}

export function PendingInvitations() {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);

  useEffect(() => {
    loadPendingInvitations();
  }, []);

  const loadPendingInvitations = async () => {
    setLoading(true);
    try {
      const data = await api.invites.getPending();
      setInvitations(data);
    } catch (err: any) {
      console.error('Failed to load pending invitations:', err);
      // Don't show error toast, just silently continue
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (invite: PendingInvitation) => {
    setAccepting(invite.id);
    try {
      const result = await api.invites.accept(invite.id);
      // Reload projects after accepting
      const projects = await api.projects.getAll();
      dispatch({ type: 'SET_PROJECTS', payload: projects });
      setInvitations(prev => prev.filter(i => i.id !== invite.id));
      toast.success(`Joined "${invite.projectName}" as ${invite.role}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to accept invitation');
    } finally {
      setAccepting(null);
    }
  };

  const handleReject = async (inviteId: string, projectName: string) => {
    setRejecting(inviteId);
    try {
      await api.invites.reject(inviteId);
      setInvitations(prev => prev.filter(i => i.id !== inviteId));
      toast.success(`Declined invitation to "${projectName}"`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject invitation');
    } finally {
      setRejecting(null);
    }
  };

  if (loading) {
    return (
      <div className="glass-panel rounded-2xl p-6 border border-brand-border/50">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-brand-accent" />
        </div>
      </div>
    );
  }

  if (invitations.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8">
      <div className="glass-panel rounded-2xl border border-amber-500/30 bg-amber-500/5 overflow-hidden">
        <div className="px-6 py-4 border-b border-amber-500/20 flex items-center gap-3">
          <Mail className="w-5 h-5 text-amber-500" />
          <div>
            <h3 className="font-semibold text-white">
              {invitations.length} Invitation{invitations.length !== 1 ? 's' : ''}
            </h3>
            <p className="text-xs text-brand-muted">You've been invited to join projects</p>
          </div>
        </div>

        <div className="divide-y divide-brand-border/30">
          <AnimatePresence mode="popLayout">
            {invitations.map((invite, idx) => {
              const expiresIn = new Date(invite.expiresAt).getTime() - Date.now();
              const daysLeft = Math.ceil(expiresIn / (1000 * 60 * 60 * 24));
              const isExpiringSoon = daysLeft <= 2;

              return (
                <motion.div
                  key={invite.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: idx * 0.05 }}
                  className="p-4 sm:p-5 hover:bg-white/2 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-white truncate">
                          {invite.projectName}
                        </h4>
                        <span className={`px-2 py-1 rounded text-xs font-medium capitalize flex-shrink-0
                          ${invite.role === 'admin' ? 'bg-brand-highlight/20 text-brand-highlight' : 'bg-brand-accent/20 text-brand-accent'}`}>
                          {invite.role}
                        </span>
                      </div>
                      {invite.projectDescription && (
                        <p className="text-xs text-brand-muted mb-2 line-clamp-1">
                          {invite.projectDescription}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-brand-muted flex-wrap">
                        <span>Invited by <span className="text-white font-medium">{invite.invitedBy.name}</span></span>
                        <span className="w-1 h-1 bg-brand-border rounded-full" />
                        {isExpiringSoon ? (
                          <span className="flex items-center gap-1 text-amber-500">
                            <AlertCircle className="w-3 h-3" />
                            Expires in {daysLeft} day{daysLeft !== 1 ? 's' : ''}
                          </span>
                        ) : (
                          <span>Expires in {daysLeft} days</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleAccept(invite)}
                        disabled={accepting === invite.id || rejecting === invite.id}
                        className="px-3 py-1.5 rounded-lg bg-brand-accent hover:bg-brand-accent/80 text-white text-xs font-medium transition-colors disabled:opacity-50 flex items-center gap-1.5">
                        {accepting === invite.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3 h-3" />
                        )}
                        <span className="hidden sm:inline">Accept</span>
                      </button>
                      <button
                        onClick={() => handleReject(invite.id, invite.projectName)}
                        disabled={accepting === invite.id || rejecting === invite.id}
                        className="px-3 py-1.5 rounded-lg bg-brand-surface hover:bg-brand-border text-brand-muted hover:text-white text-xs font-medium transition-colors disabled:opacity-50 flex items-center gap-1.5">
                        {rejecting === invite.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <X className="w-3 h-3" />
                        )}
                        <span className="hidden sm:inline">Decline</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
