/**
 * MemberList.tsx — Team Members Slide-In Panel
 *
 * Displays all project members with:
 *  - Avatar (initial letter in coloured circle)
 *  - Name and email
 *  - Role badge: owner (gold), admin (teal), member (grey)
 *
 * "Invite Member" button at the bottom opens InviteMemberModal.
 * Rendered inside ProjectPage's AnimatePresence slide-in panel.
 */
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { Users, UserPlus, Shield, ShieldAlert, User, Trash2, Loader2 } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useToast } from '../ui/Toast';
import { api } from '../../services/api';
import { Button } from '../ui/Button';
import { InviteMemberModal } from './InviteMemberModal';

interface Props { userRole: string; }

export function MemberList({ userRole }: Props) {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [changingRoleId, setChangingRoleId] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [menuCoords, setMenuCoords] = useState<{ left: number; top: number } | null>(null);
  if (!state.currentProject) return null;
  const isAdminOrOwner = userRole === 'admin' || userRole === 'owner';
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <ShieldAlert className="w-4 h-4 text-brand-warning" />;
      case 'admin':
        return <Shield className="w-4 h-4 text-brand-highlight" />;
      default:
        return <User className="w-4 h-4 text-brand-muted" />;
    }
  };
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-brand-warning/10 text-brand-warning border-brand-warning/20';
      case 'admin':
        return 'bg-brand-highlight/10 text-brand-highlight border-brand-highlight/20';
      default:
        return 'bg-brand-surface text-brand-muted border-brand-border';
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!state.currentProject) return;
    setRemovingMemberId(memberId);
    try {
      await api.members.remove(state.currentProject.id, memberId);
      dispatch({ type: 'SET_CURRENT_PROJECT', payload: { project: state.currentProject, tasks: state.tasks, members: state.members.filter(m => m.id !== memberId) } });
      toast.success(`${memberName} removed from project`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove member');
    } finally {
      setRemovingMemberId(null);
    }
  };

  const handleChangeRole = async (memberId: string, newRole: string) => {
    if (!state.currentProject) return;
    setChangingRoleId(memberId);
    try {
      const updated = await api.members.updateRole(state.currentProject.id, memberId, newRole as any);
      const newMembers = state.members.map(m => m.id === memberId ? { ...m, role: updated.role } : m);
      dispatch({ type: 'SET_CURRENT_PROJECT', payload: { project: state.currentProject, tasks: state.tasks, members: newMembers } });
    } catch (err: any) {
      toast.error(err.message || 'Failed to update role');
    } finally {
      setChangingRoleId(null);
    }
  };

  return (
    <div className="glass-panel rounded-xl border border-brand-border h-full flex flex-col">
      <div className="p-4 border-b border-brand-border flex items-center justify-between">
        <h3 className="font-semibold text-white flex items-center">
          <Users className="w-5 h-5 mr-2 text-brand-accent" />
          Team Members
        </h3>
        <span className="bg-brand-surface text-xs px-2 py-1 rounded-full text-brand-muted border border-brand-border">
          {state.members.length}
        </span>
      </div>

      <div className="p-4 flex-grow overflow-y-auto space-y-3">
        {state.members.map((member, index) =>
        <motion.div
          key={member.id}
          initial={{
            opacity: 0,
            x: 20
          }}
          animate={{
            opacity: 1,
            x: 0
          }}
          transition={{
            delay: index * 0.05
          }}
          className="relative flex items-center justify-between p-3 rounded-lg hover:bg-brand-surface/50 transition-colors border border-transparent hover:border-brand-border">
          
            <div className="flex items-center space-x-3 flex-1">
              <div className="w-10 h-10 rounded-full bg-brand-dark border border-brand-border flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-medium text-brand-highlight">
                  {member.userName.charAt(0).toUpperCase()}
                </span>
              </div>
              <button
                onClick={(e) => {
                  const btn = e.currentTarget as HTMLElement;
                  const r = btn.getBoundingClientRect();
                  let left = r.left;
                  let top = r.bottom + 8;
                  
                  // Check if popup would go off-screen to the right, adjust to align right
                  if (left + 300 > window.innerWidth) {
                    left = Math.max(16, window.innerWidth - 300 - 16);
                  }
                  
                  // Check if popup would go off-screen at the bottom, position above instead
                  if (top + 300 > window.innerHeight) {
                    top = r.top - 300 - 8;
                  }
                  
                  setMenuCoords({ left, top });
                  setMenuOpenId(menuOpenId === member.id ? null : member.id);
                }}
                className="text-left flex-1 p-2 rounded hover:bg-brand-surface/50 transition-colors">
                <p className="text-sm font-medium text-white break-words">{member.userEmail}</p>
                <p className="text-xs text-brand-muted break-words">{member.userName}</p>
              </button>

                {menuOpenId === member.id && menuCoords && createPortal(
                  <div className="p-4 bg-brand-dark border border-brand-border rounded-lg text-sm shadow-2xl z-50"
                    style={{ position: 'fixed', left: menuCoords.left, top: menuCoords.top, width: 320 }}>
                    <div className="mb-3 p-2 bg-brand-surface/50 rounded">
                      <p className="text-sm font-semibold text-white break-words">{member.userEmail}</p>
                      <p className="text-xs text-brand-muted mt-1">{member.userName}</p>
                    </div>
                    <div className="mb-3">
                      <p className="text-xs text-brand-muted mb-1">Role</p>
                      {isAdminOrOwner ? (
                        <select
                          value={member.role}
                          onChange={e => { handleChangeRole(member.id, e.target.value); setTimeout(() => setMenuOpenId(null), 300); }}
                          className="w-full h-9 rounded-md border border-brand-border bg-brand-surface px-2 text-brand-text text-sm font-medium">
                          <option value="member">member</option>
                          <option value="admin">admin</option>
                        </select>
                      ) : (
                        <div className="text-sm text-white capitalize font-medium">{member.role}</div>
                      )}
                    </div>
                    {isAdminOrOwner && member.role !== 'owner' && (
                      <div className="pt-3 border-t border-brand-border">
                        <button onClick={() => { handleRemoveMember(member.id, member.userName); setMenuOpenId(null); }}
                          className="w-full py-2 px-3 rounded text-sm font-medium text-white bg-brand-danger/20 border border-brand-danger/40 hover:bg-brand-danger/30 transition-colors">
                          🗑️ Remove from Project
                        </button>
                      </div>
                    )}
                  </div>, document.body)
                }
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 flex-shrink-0">
                  <div className={`flex items-center px-2 py-1 rounded text-xs border ${getRoleBadgeColor(member.role)}`}>
                  {getRoleIcon(member.role)}
                  <span className="ml-1 capitalize hidden sm:inline-block">
                    {member.role}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {isAdminOrOwner && (
        <div className="p-4 border-t border-brand-border">
          <Button
            fullWidth
            variant="outline"
            icon={<UserPlus className="w-4 h-4" />}
            onClick={() => setIsInviteModalOpen(true)}>
            
            Invite Member
          </Button>
        </div>
      )}

      {isAdminOrOwner && (
        <InviteMemberModal
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
          projectId={state.currentProject.id} />
      )}
      
    </div>);

}