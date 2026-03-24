// pages/admin/AdminUsers.jsx - Admin user management table
import { useState, useEffect } from 'react';
import { Search, Trash2, CheckCircle, UserCheck, Edit2, X } from 'lucide-react';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { SkeletonRow } from '../../components/ui/Skeleton';
import { useAuth } from '../../contexts/AuthContext';
import notify from '../../utils/notify';
import confirmAction from '../../utils/confirm';

export default function AdminUsers() {
    const { user: currentUser, updateUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [roleF, setRoleF] = useState('');
    const [loading, setLoading] = useState(true);
    const [acting, setActing] = useState(null);
    const [editUser, setEditUser] = useState(null);
    const [editForm, setEditForm] = useState({ full_name: '', password: '' });
    const [savingEdit, setSavingEdit] = useState(false);

    const load = () => {
        setLoading(true);
        api.get('/users', { params: { page, limit: 20, search, role: roleF } })
            .then((r) => { setUsers(r.data.users || []); setTotal(r.data.total || 0); })
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load();
    }, [page, search, roleF]);

    const act = async (fn) => {
        setActing(true);
        try {
            await fn();
            load();
            notify.success('Action completed successfully');
        } catch (e) {
            notify.error('Action failed', e.response?.data?.error || 'Error');
        } finally {
            setActing(false);
        }
    };

    const approve = (id) => act(() => api.patch(`/users/${id}/approve`));
    const changeRole = async (id, role) => {
        const confirmed = await confirmAction({
            title: 'Change User Role?',
            text: `This account will be updated to the ${role} role.`,
            confirmText: 'Update Role',
            cancelText: 'Cancel',
        });
        if (confirmed) act(() => api.patch(`/users/${id}/role`, { role }));
    };
    const openEdit = (user) => {
        setEditUser(user);
        setEditForm({ full_name: user.full_name || '', password: '' });
    };
    const closeEdit = (force = false) => {
        if (savingEdit && !force) return;
        setEditUser(null);
        setEditForm({ full_name: '', password: '' });
    };
    const saveEdit = async () => {
        const trimmedName = editForm.full_name.trim();
        if (!trimmedName) {
            notify.warning('Name is required');
            return;
        }
        if (editForm.password && editForm.password.length < 8) {
            notify.warning('Password must be at least 8 characters long.');
            return;
        }

        setSavingEdit(true);
        try {
            await api.put(`/users/${editUser.id}`, {
                full_name: trimmedName,
                password: editForm.password || undefined,
            });

            if (currentUser?.id === editUser.id) {
                updateUser({ full_name: trimmedName });
            }

            closeEdit(true);
            load();
            notify.success('User updated successfully');
        } catch (e) {
            notify.error('Update failed', e.response?.data?.error || 'Error');
        } finally {
            setSavingEdit(false);
        }
    };
    const remove = async (id) => {
        const currentUser = JSON.parse(localStorage.getItem('idle_user'));
        if (currentUser && currentUser.id === id) {
            notify.warning('You cannot delete your own account.');
            return;
        }
        const confirmed = await confirmAction({
            title: 'Delete User?',
            text: 'This user account will be permanently deleted.',
            confirmText: 'Delete',
            cancelText: 'Cancel',
            confirmButtonColor: '#dc2626',
        });
        if (confirmed) act(() => api.delete(`/users/${id}`));
    };

    return (
        <div className="space-y-5">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 anim-fade-up">
                <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
                    <div>
                        <h1 className="text-xl font-bold">
                            <span className="text-slate-900">Manage</span>{' '}
                            <span className="text-blue-600">Users</span>
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">{total} total users across the platform</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                        <div className="relative w-full sm:w-72">
                            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                placeholder="Search name or email..."
                                className="w-full h-10 pl-11 pr-3.5 text-sm rounded-lg border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                style={{ height: '42px' }}
                            />
                        </div>
                        <select
                            value={roleF}
                            onChange={(e) => { setRoleF(e.target.value); setPage(1); }}
                            className="h-10 px-3.5 text-sm rounded-lg border border-slate-200 bg-white text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                            style={{ height: '42px' }}
                        >
                            <option value="">All Roles</option>
                            <option value="student">Student</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                </div>
            </div>

            <Card padding={false} className="overflow-hidden rounded-[14px] shadow-sm border-slate-200/60">
                <table className="data-table">
                    <thead>
                        <tr>
                            {['S.No', 'User', 'Role', 'Status', 'Joined', 'Actions'].map((h) => <th key={h}>{h}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {loading
                            ? [1, 2, 3, 4, 5].map((i) => (
                                <tr key={i}><td colSpan={6}><SkeletonRow /></td></tr>
                            ))
                            : users.map((u, index) => (
                                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                                    <td>
                                        <span className="text-sm font-semibold text-slate-500">{(page - 1) * 20 + index + 1}</span>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl gradient-brand flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                                {u.full_name?.[0]?.toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-[var(--text-primary)] text-sm">{u.full_name}</p>
                                                <p className="text-xs text-[var(--text-muted)]">{u.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <select
                                            value={u.role}
                                            disabled={!!acting}
                                            onChange={(e) => changeRole(u.id, e.target.value)}
                                            className="text-xs font-semibold capitalize px-2 py-1 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-primary)] cursor-pointer focus:outline-none"
                                        >
                                            <option value="student">student</option>
                                            <option value="admin">admin</option>
                                        </select>
                                    </td>
                                    <td>
                                        {u.is_approved
                                            ? <Badge variant="success"><CheckCircle size={11} /> Active</Badge>
                                            : (
                                                <button
                                                    disabled={!!acting}
                                                    onClick={() => approve(u.id)}
                                                    className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <UserCheck size={11} /> Approve
                                                </button>
                                            )}
                                    </td>
                                    <td>
                                        <span className="text-xs text-[var(--text-muted)]">
                                            {new Date(u.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            <button
                                                disabled={!!acting}
                                                onClick={() => openEdit(u)}
                                                title="Edit user"
                                                className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button
                                                disabled={!!acting}
                                                onClick={() => remove(u.id)}
                                                title="Delete user"
                                                className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>
                {users.length === 0 && !loading && (
                    <div className="text-center py-12 text-sm text-[var(--text-secondary)]">No users found</div>
                )}
            </Card>

            {!!editUser && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
                    onClick={(e) => e.target === e.currentTarget && closeEdit()}
                >
                    <div className="w-full max-w-xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.16)]">
                        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">Edit User</h2>
                                <p className="mt-1 text-sm text-slate-500">{editUser.email}</p>
                            </div>
                            <button
                                onClick={() => closeEdit()}
                                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-4 px-6 py-6">
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">Full Name</label>
                                <input
                                    value={editForm.full_name}
                                    onChange={(e) => setEditForm((prev) => ({ ...prev, full_name: e.target.value }))}
                                    placeholder="Enter full name"
                                    className="w-full h-11 px-4 text-sm rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">New Password</label>
                                <input
                                    type="password"
                                    value={editForm.password}
                                    onChange={(e) => setEditForm((prev) => ({ ...prev, password: e.target.value }))}
                                    placeholder="Leave blank to keep current password"
                                    className="w-full h-11 px-4 text-sm rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                />
                                <p className="mt-2 text-xs text-slate-500">Use at least 8 characters only if you want to reset the password.</p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
                            <Button
                                variant="ghost"
                                onClick={() => closeEdit()}
                                disabled={savingEdit}
                                className="h-10 px-5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={saveEdit}
                                loading={savingEdit}
                                className="h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 border-blue-600 hover:border-blue-500"
                            >
                                Save Changes
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
