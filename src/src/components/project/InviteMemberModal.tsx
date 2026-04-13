/**
 * InviteMemberModal.tsx — Invite Team Member by Email
 *
 * Modal form with:
 *  - Email input (validated)
 *  - Role selector: Admin or Member
 *
 * Calls api.members.invite(projectId, email, role).
 * On success: dispatches ADD_MEMBER to store, closes modal.
 * On error: shows inline error message (e.g. "user not found",
 *   "already a member", "invitation already pending").
 */
import React, { useState } from 'react';
import { Mail, Shield } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Role } from '../../types';
import { api } from '../../services/api';

interface Props { isOpen: boolean; onClose: () => void; projectId: string; }

export function InviteMemberModal({ isOpen, onClose, projectId }: Props) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('member');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsLoading(true);
    setError('');
    try {
      await api.members.invite(projectId, email.trim(), role);
      onClose();
      setEmail(''); setRole('member');
    } catch (err: any) {
      setError(err.message || 'Failed to invite member');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={() => { onClose(); setError(''); }} title="Invite Team Member">
      <form onSubmit={handleInvite} className="space-y-5">
        {error && <div className="p-3 rounded-md bg-brand-danger/10 border border-brand-danger/20 text-brand-danger text-sm">{error}</div>}
        <Input label="Email Address" type="email" required value={email} onChange={e => setEmail(e.target.value)}
          icon={<Mail className="w-5 h-5" />} placeholder="colleague@example.com" autoFocus />
        <div>
          <label className="block text-sm font-medium text-brand-muted mb-1.5">Role</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-brand-muted">
              <Shield className="w-5 h-5" />
            </div>
            <select value={role} onChange={e => setRole(e.target.value as Role)}
              className="flex h-10 w-full rounded-md border border-brand-border bg-brand-surface/50 pl-10 pr-3 py-2 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent appearance-none">
              <option value="member">Member – can view & update assigned tasks</option>
              <option value="admin">Admin – can manage tasks & invite members</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end space-x-3 pt-4 mt-6 border-t border-brand-border">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" isLoading={isLoading}>Send Invite</Button>
        </div>
      </form>
    </Modal>
  );
}
