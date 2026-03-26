// pages/admin/AdminUsers.jsx - Admin user management table
import { useState, useEffect, useCallback } from 'react';
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

    const load = useCallback(() => {
        setLoading(true);
        api.get('/users', { params: { page, limit: 20, search, role: roleF } })
            .then((r) => { setUsers(r.data.users || []); setTotal(r.data.total || 0); })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [page, search, roleF]);

    useEffect(() => {
        load();
    }, [load]);

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
        const currentStoredUser = JSON.parse(localStorage.getItem('idle_user'));
        if (currentStoredUser && currentStoredUser.id === id) {
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
                        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-indigo-400">Admin Users</p>
                        <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900">Manage platform accounts</h1>
                        <p className="mt-1 text-sm text-slate-500">Review, search, approve, and update user access.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-right">
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Total Users</p>
                            <p className="mt-1 text-xl font-black text-slate-900">{total}</p>
                        </div>
                    </div>
                </div>
            </div>

            <Card className="anim-fade-up border-slate-200/70 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="relative w-full lg:max-w-sm">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            value={search}
                            onChange={(e) => { setPage(1); setSearch(e.target.value); }}
                            placeholder="Search by name or email"
                            className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <select
                            value={roleF}
                            onChange={(e) => { setPage(1); setRoleF(e.target.value); }}
                            className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                        >
                            <option value="">All roles</option>
                            <option value="student">Student</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                </div>
            </Card>

            <Card className="overflow-hidden border-slate-200/70 shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100 text-sm">
                        <thead className="bg-slate-50/70">
                            <tr>
                                <th className="px-5 py-3 text-left text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">User</th>
                                <th className="px-5 py-3 text-left text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Role</th>
                                <th className="px-5 py-3 text-left text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Status</th>
                                <th className="px-5 py-3 text-right text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {loading ? (
                                Array.from({ length: 8 }).map((_, idx) => <SkeletonRow key={idx} cols={4} />)
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-5 py-12 text-center text-sm text-slate-500">
                                        No users found for the current filters.
                                    </td>
                                </tr>
                            ) : users.map((user) => (
                                <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                                    <td className="px-5 py-4">
                                        <div>
                                            <p className="font-semibold text-slate-900">{user.full_name || 'Unnamed user'}</p>
                                            <p className="text-xs text-slate-500">{user.email}</p>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <Badge variant={user.role === 'admin' ? 'danger' : 'primary'} size="sm">{user.role}</Badge>
                                    </td>
                                    <td className="px-5 py-4">
                                        <Badge variant={user.is_approved ? 'success' : 'warning'} size="sm">
                                            {user.is_approved ? 'Approved' : 'Pending'}
                                        </Badge>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            {!user.is_approved && (
                                                <Button type="button" size="sm" variant="secondary" disabled={acting} onClick={() => approve(user.id)}>
                                                    <CheckCircle size={14} className="mr-1" /> Approve
                                                </Button>
                                            )}
                                            <Button type="button" size="sm" variant="outline" disabled={acting} onClick={() => openEdit(user)}>
                                                <Edit2 size={14} className="mr-1" /> Edit
                                            </Button>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="ghost"
                                                disabled={acting || currentUser?.id === user.id}
                                                onClick={() => changeRole(user.id, user.role === 'admin' ? 'student' : 'admin')}
                                            >
                                                <UserCheck size={14} className="mr-1" /> {user.role === 'admin' ? 'Make Student' : 'Make Admin'}
                                            </Button>
                                            <Button type="button" size="sm" variant="danger" disabled={acting} onClick={() => remove(user.id)}>
                                                <Trash2 size={14} className="mr-1" /> Delete
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 text-sm text-slate-500">
                    <span>Page {page}</span>
                    <div className="flex items-center gap-2">
                        <Button type="button" size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage((prev) => prev - 1)}>
                            Previous
                        </Button>
                        <Button type="button" size="sm" variant="secondary" disabled={users.length < 20} onClick={() => setPage((prev) => prev + 1)}>
                            Next
                        </Button>
                    </div>
                </div>
            </Card>

            {editUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-6 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-indigo-400">Edit User</p>
                                <h2 className="mt-2 text-xl font-black tracking-tight text-slate-900">Update account details</h2>
                            </div>
                            <button type="button" onClick={() => closeEdit()} className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
                                <X size={16} />
                            </button>
                        </div>

                        <div className="mt-6 space-y-4">
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">Full name</label>
                                <input
                                    value={editForm.full_name}
                                    onChange={(e) => setEditForm((prev) => ({ ...prev, full_name: e.target.value }))}
                                    className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">New password</label>
                                <input
                                    type="password"
                                    value={editForm.password}
                                    onChange={(e) => setEditForm((prev) => ({ ...prev, password: e.target.value }))}
                                    placeholder="Leave blank to keep current password"
                                    className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                                />
                            </div>
                        </div>

                        <div className="mt-6 flex items-center justify-end gap-3">
                            <Button type="button" variant="secondary" onClick={() => closeEdit()} disabled={savingEdit}>Cancel</Button>
                            <Button type="button" onClick={saveEdit} disabled={savingEdit}>
                                {savingEdit ? 'Saving...' : 'Save changes'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
