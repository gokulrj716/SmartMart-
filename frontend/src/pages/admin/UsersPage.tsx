import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  Key,
  Edit3,
  Trash2,
  Search,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Mail,
  Phone,
  RefreshCw,
  UserCheck,
  Eye,
  EyeOff,
  Store,
  Boxes,
  Briefcase,
  ShieldAlert
} from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { api } from '../../api/client';
import { User, UserRole } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

interface UserSummary {
  total: number;
  cashiers: number;
  managers: number;
  inventory: number;
  admins: number;
  customers: number;
}

export const UsersPage: React.FC = () => {
  const { user: currentAdmin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [summary, setSummary] = useState<UserSummary>({
    total: 0,
    cashiers: 0,
    managers: 0,
    inventory: 0,
    admins: 0,
    customers: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // Notifications / Feedback
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Add User Form State
  const [addForm, setAddForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'CASHIER' as UserRole,
    password: '',
    confirmPassword: ''
  });
  const [showAddPassword, setShowAddPassword] = useState(false);
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);

  // Edit User Form State
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'CASHIER' as UserRole,
    status: 'ACTIVE'
  });
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Password Reset State
  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      let url = '/users?';
      if (roleFilter && roleFilter !== 'ALL') url += `role=${roleFilter}&`;
      if (searchTerm) url += `search=${encodeURIComponent(searchTerm)}&`;

      const res = await api.get<any>(url);
      if (res.success && res.data) {
        setUsers(res.data);
        if (res.summary) {
          setSummary(res.summary);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch users:', err);
      setFeedback({ type: 'error', message: err.response?.data?.message || 'Failed to fetch user directory.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  // Open Add Modal
  const openAddModal = () => {
    setAddForm({
      name: '',
      email: '',
      phone: '',
      role: 'CASHIER',
      password: '',
      confirmPassword: ''
    });
    setShowAddPassword(false);
    setIsAddModalOpen(true);
  };

  // Submit Add User
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name || !addForm.email || !addForm.password) {
      setFeedback({ type: 'error', message: 'Name, email, and password are required.' });
      return;
    }
    if (addForm.password.length < 6) {
      setFeedback({ type: 'error', message: 'Password must be at least 6 characters.' });
      return;
    }
    if (addForm.password !== addForm.confirmPassword) {
      setFeedback({ type: 'error', message: 'Passwords do not match.' });
      return;
    }

    setIsSubmittingAdd(true);
    try {
      const res = await api.post<any>('/users', {
        name: addForm.name,
        email: addForm.email,
        phone: addForm.phone,
        role: addForm.role,
        password: addForm.password
      });

      if (res.success) {
        setFeedback({ type: 'success', message: res.message || 'Staff member added successfully.' });
        setIsAddModalOpen(false);
        fetchUsers();
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.response?.data?.message || 'Failed to register user.' });
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  // Open Edit User Modal
  const openEditModal = (u: User) => {
    setSelectedUser(u);
    setEditForm({
      name: u.name,
      email: u.email,
      phone: u.phone || '',
      role: u.role,
      status: u.status || 'ACTIVE'
    });
    setIsEditModalOpen(true);
  };

  // Submit Edit User
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setIsSubmittingEdit(true);
    try {
      const res = await api.put<any>(`/users/${selectedUser.id}`, editForm);
      if (res.success) {
        setFeedback({ type: 'success', message: res.message || 'User role and profile updated.' });
        setIsEditModalOpen(false);
        fetchUsers();
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.response?.data?.message || 'Failed to update user.' });
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Open Password Modal
  const openPasswordModal = (u: User) => {
    setSelectedUser(u);
    setPasswordForm({ newPassword: '', confirmPassword: '' });
    setShowResetPassword(false);
    setIsPasswordModalOpen(true);
  };

  // Submit Password Reset
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    if (passwordForm.newPassword.length < 6) {
      setFeedback({ type: 'error', message: 'Password must be at least 6 characters.' });
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setFeedback({ type: 'error', message: 'Passwords do not match.' });
      return;
    }

    setIsSubmittingPassword(true);
    try {
      const res = await api.put<any>(`/users/${selectedUser.id}/password`, {
        newPassword: passwordForm.newPassword
      });
      if (res.success) {
        setFeedback({ type: 'success', message: res.message || `Password for ${selectedUser.name} updated.` });
        setIsPasswordModalOpen(false);
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.response?.data?.message || 'Failed to reset password.' });
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  // Deactivate User
  const handleDeactivate = async (u: User) => {
    if (u.id === currentAdmin?.id) {
      setFeedback({ type: 'error', message: 'You cannot deactivate your own logged-in administrator account.' });
      return;
    }

    if (!confirm(`Are you sure you want to deactivate staff member "${u.name}" (${u.role})?`)) {
      return;
    }

    try {
      const res = await api.delete<any>(`/users/${u.id}`);
      if (res.success) {
        setFeedback({ type: 'success', message: res.message || 'User deactivated successfully.' });
        fetchUsers();
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.response?.data?.message || 'Failed to deactivate user.' });
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
            <ShieldAlert className="w-3 h-3" /> Admin
          </span>
        );
      case 'MANAGER':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <Briefcase className="w-3 h-3" /> Store Manager
          </span>
        );
      case 'CASHIER':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <Store className="w-3 h-3" /> Cashier
          </span>
        );
      case 'INVENTORY_STAFF':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Boxes className="w-3 h-3" /> Inventory Staff
          </span>
        );
      case 'CUSTOMER':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
            <Users className="w-3 h-3" /> Customer
          </span>
        );
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Page Title & Add Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Staff & Role Allocation</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800">
                RBAC Multi-User
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Add multiple persons to any operational role (Cashiers, Inventory Staff, Managers, Admins) and set secure login passwords.
            </p>
          </div>

          <Button
            variant="primary"
            onClick={openAddModal}
            leftIcon={<UserPlus className="w-4 h-4" />}
          >
            Add New Staff / User
          </Button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs font-medium transition-all ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="text-slate-400 hover:text-slate-600 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Accounts</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">{summary.total}</span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-emerald-200/80 bg-emerald-50/20 shadow-xs">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">Cashiers</span>
            <span className="text-2xl font-black text-emerald-900 mt-1 block">{summary.cashiers}</span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-blue-200/80 bg-blue-50/20 shadow-xs">
            <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">Managers</span>
            <span className="text-2xl font-black text-blue-900 mt-1 block">{summary.managers}</span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-amber-200/80 bg-amber-50/20 shadow-xs">
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">Inventory</span>
            <span className="text-2xl font-black text-amber-900 mt-1 block">{summary.inventory}</span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-purple-200/80 bg-purple-50/20 shadow-xs">
            <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider block">Admins</span>
            <span className="text-2xl font-black text-purple-900 mt-1 block">{summary.admins}</span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Customers</span>
            <span className="text-2xl font-black text-slate-700 mt-1 block">{summary.customers}</span>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by full name, email address, or mobile number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
            />
          </form>

          <div className="flex gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Roles ({summary.total})</option>
              <option value="CASHIER">Cashiers ({summary.cashiers})</option>
              <option value="MANAGER">Store Managers ({summary.managers})</option>
              <option value="INVENTORY_STAFF">Inventory Staff ({summary.inventory})</option>
              <option value="ADMIN">Administrators ({summary.admins})</option>
              <option value="CUSTOMER">Customers ({summary.customers})</option>
            </select>

            <Button
              variant="outline"
              size="sm"
              onClick={fetchUsers}
              isLoading={isLoading}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Refresh
            </Button>
          </div>
        </div>

        {/* Users Data Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-mono uppercase text-[11px]">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">User & Contact</th>
                  <th className="py-3.5 px-4 font-semibold">Allocated Role</th>
                  <th className="py-3.5 px-4 font-semibold">Phone Number</th>
                  <th className="py-3.5 px-4 font-semibold">Account Status</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-slate-400">
                      {isLoading ? 'Loading staff directory...' : 'No users found matching current filters.'}
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const isCurrentUser = u.id === currentAdmin?.id;
                    const isActive = u.status !== 'INACTIVE';

                    return (
                      <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs">
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900">{u.name}</span>
                                {isCurrentUser && (
                                  <span className="px-1.5 py-0.5 text-[10px] bg-purple-100 text-purple-700 rounded font-bold">
                                    You
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                                <Mail className="w-3 h-3 text-slate-400" />
                                {u.email}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          {getRoleBadge(u.role)}
                        </td>

                        <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                          {u.phone ? (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {u.phone}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">—</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                              isActive
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-500 border border-slate-200'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                            {isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Reallocate Role & Edit Button */}
                            <button
                              type="button"
                              onClick={() => openEditModal(u)}
                              title="Reallocate Role & Edit"
                              className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            {/* Set / Reset Password Button */}
                            <button
                              type="button"
                              onClick={() => openPasswordModal(u)}
                              title="Set or Reset Password"
                              className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Key className="w-4 h-4" />
                            </button>

                            {/* Deactivate Button */}
                            {!isCurrentUser && (
                              <button
                                type="button"
                                onClick={() => handleDeactivate(u)}
                                title="Deactivate Account"
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
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

        {/* 1. ADD USER MODAL */}
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Add New Staff Member"
          maxWidth="lg"
        >
          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-xs text-emerald-900">
              <p className="font-bold flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" /> Multi-Person Role Allocation
              </p>
              <p className="text-emerald-800 mt-0.5">
                You can register multiple people under each role (e.g., several Cashiers for different checkout counters).
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Ramesh Patel"
                value={addForm.name}
                onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Address * (Login ID)
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. ramesh.cashier@smartmart.com"
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mobile Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="e.g. +91 98765 43210"
                  value={addForm.phone}
                  onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Allocate Role *
              </label>
              <select
                value={addForm.role}
                onChange={(e) => setAddForm({ ...addForm, role: e.target.value as UserRole })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500"
              >
                <option value="CASHIER">CASHIER — Real-time POS checkout, barcode scanning, weighing scale, receipt printing</option>
                <option value="INVENTORY_STAFF">INVENTORY STAFF — Stock intake, purchase orders, batch tracking, supplier management</option>
                <option value="MANAGER">STORE MANAGER — Operational oversight, sales analytics, returns & refunds approval</option>
                <option value="ADMIN">ADMINISTRATOR — Full system governance, RBAC security, hardware config, payment QR</option>
                <option value="CUSTOMER">CUSTOMER — Self-service customer app, digital shopping cart & loyalty rewards</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Initial Password * (min 6 chars)
                </label>
                <div className="relative">
                  <input
                    type={showAddPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Set secure password"
                    value={addForm.password}
                    onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-8 py-2 text-xs font-mono focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAddPassword(!showAddPassword)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showAddPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Confirm Password *
                </label>
                <input
                  type={showAddPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  placeholder="Repeat password"
                  value={addForm.confirmPassword}
                  onChange={(e) => setAddForm({ ...addForm, confirmPassword: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-3 border-t border-slate-100">
              <Button variant="outline" className="flex-1" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                className="flex-1"
                isLoading={isSubmittingAdd}
                leftIcon={<UserPlus className="w-4 h-4" />}
              >
                Create Staff Account
              </Button>
            </div>
          </form>
        </Modal>

        {/* 2. REALLOCATE ROLE & EDIT MODAL */}
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title={`Edit & Reallocate Role: ${selectedUser?.name}`}
          maxWidth="md"
        >
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mobile Phone Number
              </label>
              <input
                type="tel"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Allocated Role
              </label>
              <select
                value={editForm.role}
                onChange={(e) => setEditForm({ ...editForm, role: e.target.value as UserRole })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500"
              >
                <option value="CASHIER">CASHIER (Point of Sale)</option>
                <option value="INVENTORY_STAFF">INVENTORY STAFF (Warehouse & Batches)</option>
                <option value="MANAGER">STORE MANAGER (Operations & Reports)</option>
                <option value="ADMIN">ADMINISTRATOR (Full Platform Admin)</option>
                <option value="CUSTOMER">CUSTOMER (Shopper)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Account Status
              </label>
              <select
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500"
              >
                <option value="ACTIVE">ACTIVE (Authorized to log in)</option>
                <option value="INACTIVE">INACTIVE (Login disabled)</option>
              </select>
            </div>

            <div className="flex gap-3 pt-3 border-t border-slate-100">
              <Button variant="outline" className="flex-1" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                className="flex-1"
                isLoading={isSubmittingEdit}
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                Save Role & Details
              </Button>
            </div>
          </form>
        </Modal>

        {/* 3. SET / RESET PASSWORD MODAL */}
        <Modal
          isOpen={isPasswordModalOpen}
          onClose={() => setIsPasswordModalOpen(false)}
          title={`Set Password: ${selectedUser?.name}`}
          maxWidth="md"
        >
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-900">
              <p className="font-bold flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-blue-600 shrink-0" /> Administrator Password Override
              </p>
              <p className="text-blue-800 mt-0.5">
                Enter a new password for <span className="font-mono font-bold">{selectedUser?.email}</span>. The user will be able to log in immediately with these new credentials.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                New Password * (min 6 chars)
              </label>
              <div className="relative">
                <input
                  type={showResetPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  placeholder="Enter new secure password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-8 py-2 text-xs font-mono focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowResetPassword(!showResetPassword)}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showResetPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Confirm New Password *
              </label>
              <input
                type={showResetPassword ? 'text' : 'password'}
                required
                minLength={6}
                placeholder="Repeat new password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex gap-3 pt-3 border-t border-slate-100">
              <Button variant="outline" className="flex-1" onClick={() => setIsPasswordModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                className="flex-1"
                isLoading={isSubmittingPassword}
                leftIcon={<Key className="w-4 h-4" />}
              >
                Update Password
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </AdminLayout>
  );
};
