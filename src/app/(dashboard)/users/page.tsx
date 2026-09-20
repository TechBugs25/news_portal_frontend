'use client';

import React, { useEffect, useState } from 'react';
import {
  UserPlus,
  ShieldCheck,
  Trash2,
  RefreshCw,
  Search,
  Edit2,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/lib/toast-context';
import { User, UserRole, CreateUserPayload, UpdateUserPayload } from '@/types/user';
import { ROLE_CONFIG } from '@/lib/constants';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { formatDate } from '@/lib/utils';

export default function UsersManagementPage() {
  const { user: currentUser, hasRole, refreshUser } = useAuth();
  const toast = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Create Staff Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.REPORTER);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Edit Staff & Role Modal State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState<UserRole>(UserRole.REPORTER);
  const [editIsActive, setEditIsActive] = useState<boolean>(true);
  const [editFormError, setEditFormError] = useState<string | null>(null);

  // Delete modal
  const [deleteModalUser, setDeleteModalUser] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function loadUsers(showLoading = false) {
    if (showLoading) setIsLoading(true);
    try {
      const res = await apiClient<User[] | { data: User[] }>('/users?limit=50');
      const list = Array.isArray(res) ? res : res.data || [];
      setUsers(list);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    Promise.resolve().then(() => {
      loadUsers();
    });
  }, []);

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setIsProcessing(true);

    try {
      const payload: CreateUserPayload = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password: password || undefined,
        role,
      };

      await apiClient('/users', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setIsCreateModalOpen(false);
      setFirstName('');
      setLastName('');
      setEmail('');
      setPassword('');
      setRole(UserRole.REPORTER);
      await loadUsers();
      toast.show('Staff account created successfully!', 'success');
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setIsProcessing(false);
    }
  }

  function openEditModal(u: User) {
    setEditingUser(u);
    setEditFirstName(u.firstName);
    setEditLastName(u.lastName);
    setEditEmail(u.email);
    setEditPassword('');
    setEditRole(u.role);
    setEditIsActive(u.isActive);
    setEditFormError(null);
  }

  async function handleUpdateUser(e: React.FormEvent) {
    e.preventDefault();
    if (!editingUser) return;

    setEditFormError(null);
    setIsProcessing(true);

    try {
      const payload: UpdateUserPayload = {
        firstName: editFirstName.trim(),
        lastName: editLastName.trim(),
        email: editEmail.trim(),
        role: editRole,
        isActive: editIsActive,
      };

      if (editPassword.trim()) {
        payload.password = editPassword.trim();
      }

      const updated = await apiClient<User>(`/users/${editingUser.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });

      // Update local state
      setUsers((prev) =>
        prev.map((u) => (u.id === editingUser.id ? { ...u, ...updated } : u)),
      );

      // If updating currently logged in user, refresh global auth context
      if (editingUser.id === currentUser?.id) {
        await refreshUser();
      }

      toast.show(`Staff member "${updated.firstName} ${updated.lastName}" updated!`, 'success');
      setEditingUser(null);
    } catch (err: unknown) {
      setEditFormError(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleDeleteUser() {
    if (!deleteModalUser) return;
    setIsDeleting(true);
    try {
      await apiClient(`/users/${deleteModalUser.id}`, { method: 'DELETE' });
      toast.show(`User "${deleteModalUser.email}" removed.`, 'info');
      setUsers((prev) => prev.filter((u) => u.id !== deleteModalUser.id));
      setDeleteModalUser(null);
    } catch (err: unknown) {
      toast.show(err instanceof Error ? err.message : 'Failed to delete user', 'error');
    } finally {
      setIsDeleting(false);
    }
  }

  const isAdmin = hasRole(UserRole.ADMIN);

  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto p-8 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-center space-y-3 shadow-xs dark:shadow-none">
        <ShieldCheck className="w-10 h-10 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Access Restricted</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Only users with the Administrator role can access and configure staff credentials and newsroom permissions.
        </p>
      </div>
    );
  }

  const filteredUsers = users.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.email.toLowerCase().includes(q) ||
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
            Staff & Access Management
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Manage journalists, editors, edit roles, and control newsroom administrative privileges.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="outline"
            onClick={() => loadUsers(true)}
            isLoading={isLoading}
            className="gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </Button>

          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsCreateModalOpen(true)}
            className="gap-1.5"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Provision Staff Account</span>
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-4 bg-white dark:bg-zinc-900/40 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs dark:shadow-none">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, email, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-500 rounded-lg border border-zinc-300 dark:border-zinc-800 focus:outline-none focus:border-amber-500/80"
          />
        </div>

        <span className="text-xs text-zinc-500 font-mono">
          {filteredUsers.length} staff members
        </span>
      </div>

      {/* Users Table */}
      <div className="rounded-xl bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xs dark:shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-700 dark:text-zinc-300">
            <thead className="bg-zinc-50 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-zinc-800 text-[11px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-semibold">
              <tr>
                <th className="py-3.5 px-4 text-left align-middle">Staff Member</th>
                <th className="py-3.5 px-4 text-left align-middle">Email</th>
                <th className="py-3.5 px-4 text-center align-middle">Role</th>
                <th className="py-3.5 px-4 text-center align-middle">Status</th>
                <th className="py-3.5 px-4 text-center align-middle">Provisioned Date</th>
                <th className="py-3.5 px-4 text-center align-middle">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-500 align-middle">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
                      <span>Loading staff directory...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-500 align-middle">
                    No users found matching query.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const roleCfg = ROLE_CONFIG[u.role] || {
                    label: u.role,
                    color: 'text-zinc-600 dark:text-zinc-400',
                    bg: 'bg-zinc-100 dark:bg-zinc-800',
                  };
                  const isCurrent = u.id === currentUser?.id;

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors"
                    >
                      <td className="py-3.5 px-4 align-middle">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center font-bold text-xs text-zinc-900 dark:text-white shrink-0">
                            {u.firstName ? u.firstName[0].toUpperCase() : 'U'}
                          </div>
                          <div>
                            <span className="font-semibold text-zinc-900 dark:text-white block">
                              {u.firstName} {u.lastName}
                            </span>
                            {isCurrent && (
                              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono">
                                (You)
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-zinc-600 dark:text-zinc-300 align-middle">
                        {u.email}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-center align-middle">
                        <span
                          className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${roleCfg.color} ${roleCfg.bg} ${roleCfg.border || 'border-zinc-200 dark:border-zinc-700'}`}
                        >
                          {roleCfg.label}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-center align-middle">
                        <span
                          className={`inline-flex items-center justify-center gap-1.5 text-xs font-medium ${
                            u.isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400 dark:text-zinc-500'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              u.isActive ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-zinc-400 dark:bg-zinc-600'
                            }`}
                          />
                          {u.isActive ? 'Active' : 'Suspended'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-center text-zinc-500 dark:text-zinc-400 align-middle">
                        {formatDate(u.createdAt, 'MMM dd, yyyy')}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-center align-middle">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(u)}
                            className="p-1.5 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer flex items-center gap-1 text-xs"
                            title="Edit staff details & role"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span className="hidden md:inline">Edit</span>
                          </button>

                          {!isCurrent && (
                            <button
                              type="button"
                              onClick={() => setDeleteModalUser(u)}
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                              title="Delete staff account"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Provision Staff Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Provision Newsroom Staff Account"
        maxWidth="md"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/80 rounded-lg text-xs text-red-800 dark:text-red-300">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
            <Input
              label="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>

          <Input
            label="Staff Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="Initial Password"
            type="password"
            placeholder="Min 6 chars..."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Select
            label="Editorial Role"
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
          >
            <option value={UserRole.REPORTER}>
              Reporter (Draft stories, upload media)
            </option>
            <option value={UserRole.CHIEF_EDITOR}>
              Chief Editor (Review, publish, taxonomy)
            </option>
            <option value={UserRole.ADMIN}>
              Administrator (Full newsroom & user management)
            </option>
            <option value={UserRole.READER}>
              Reader (Public read-only account)
            </option>
          </Select>

          <div className="flex justify-end gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isProcessing}
            >
              Provision Account
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Staff & Role Modal */}
      <Modal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        title={`Edit Staff Member: ${editingUser?.firstName} ${editingUser?.lastName}`}
        description="Update staff profile details, reassign newsroom editorial role, or modify account status."
        maxWidth="md"
      >
        <form onSubmit={handleUpdateUser} className="space-y-4">
          {editFormError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/80 rounded-lg text-xs text-red-800 dark:text-red-300">
              {editFormError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First Name"
              value={editFirstName}
              onChange={(e) => setEditFirstName(e.target.value)}
              required
            />
            <Input
              label="Last Name"
              value={editLastName}
              onChange={(e) => setEditLastName(e.target.value)}
              required
            />
          </div>

          <Input
            label="Staff Email"
            type="email"
            value={editEmail}
            onChange={(e) => setEditEmail(e.target.value)}
            required
          />

          {/* Role selector */}
          <Select
            label="Editorial Role"
            value={editRole}
            onChange={(e) => setEditRole(e.target.value as UserRole)}
          >
            <option value={UserRole.REPORTER}>
              Reporter (Draft stories, upload media)
            </option>
            <option value={UserRole.CHIEF_EDITOR}>
              Chief Editor (Review, publish, taxonomy)
            </option>
            <option value={UserRole.ADMIN}>
              Administrator (Full newsroom & user management)
            </option>
            <option value={UserRole.READER}>
              Reader (Public read-only account)
            </option>
          </Select>

          {/* Account Status */}
          <Select
            label="Account Status"
            value={editIsActive ? 'active' : 'suspended'}
            onChange={(e) => setEditIsActive(e.target.value === 'active')}
          >
            <option value="active">Active (Access Allowed)</option>
            <option value="suspended">Suspended (Access Revoked)</option>
          </Select>

          {/* Optional Password Reset */}
          <Input
            label="Reset Password (Optional)"
            type="password"
            placeholder="Leave empty to keep existing password"
            value={editPassword}
            onChange={(e) => setEditPassword(e.target.value)}
            hint="Enter new password only if you want to reset it."
          />

          <div className="flex justify-end gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditingUser(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isProcessing}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete User Modal */}
      <Modal
        isOpen={!!deleteModalUser}
        onClose={() => setDeleteModalUser(null)}
        title="Revoke Staff Access"
        description="Are you sure you want to delete this staff account? Their access will be revoked immediately."
        maxWidth="md"
      >
        <div className="space-y-4">
          <p className="text-xs text-zinc-800 dark:text-zinc-300 font-semibold p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
            {deleteModalUser?.firstName} {deleteModalUser?.lastName} (
            {deleteModalUser?.email})
          </p>

          <div className="flex justify-end gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteModalUser(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={isDeleting}
              onClick={handleDeleteUser}
            >
              Confirm Revocation
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
