// pages/admin/AdminCategories.jsx — Category CRUD with emoji support
import { useState, useEffect } from 'react';
import { Pencil, Trash2, Tag } from 'lucide-react';
import api from '../../services/api';
import Card, { CardHeader, CardTitle } from '../../components/ui/Card';
import Input, { Textarea } from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { AdminListSkeleton } from '../../components/ui/LoadingState';
import notify from '../../utils/notify';
import confirmAction from '../../utils/confirm';

export default function AdminCategories() {
    const [categories, setCategories] = useState([]);
    const [form, setForm] = useState({ name: '', description: '' });
    const [editId, setEditId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const load = () => {
        api.get('/categories').then(r => setCategories(r.data)).finally(() => setLoading(false));
    };
    useEffect(load, []);

    const save = async e => {
        e.preventDefault();
        if (!form.name) return;
        setSaving(true);
        try {
            editId ? await api.put(`/categories/${editId}`, form) : await api.post('/categories', form);
            setForm({ name: '', description: '' });
            setEditId(null);
            load();
            notify.success(editId ? 'Category updated' : 'Category created');
        } catch (err) { notify.error('Category action failed', err.response?.data?.error || 'Error'); }
        finally { setSaving(false); }
    };

    const del = async (id) => {
        const cat = categories.find(c => c.id === id);
        const courseCount = cat?.course_count || 0;
        const confirmed = await confirmAction({
            title: 'Delete Category?',
            text: courseCount > 0
                ? `This category has ${courseCount} course${courseCount > 1 ? 's' : ''} assigned. Reassign or delete those courses before deleting this category.`
                : 'This category will be permanently deleted. This action cannot be undone.',
            confirmText: 'Delete',
            cancelText: 'Cancel',
            confirmButtonColor: '#dc2626',
        });
        if (!confirmed) return;
        try {
            await api.delete(`/categories/${id}`);
            load();
            notify.success('Category deleted');
        } catch (e) {
            notify.error('Failed to delete category', e.response?.data?.error || 'Failed to delete category');
        }
    };

    const startEdit = c => { setEditId(c.id); setForm({ name: c.name, description: c.description || '' }); };
    const cancelEdit = () => { setEditId(null); setForm({ name: '', description: '' }); };

    return (
        <div className="space-y-5">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 anim-fade-up">
                <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
                    <div>
                        <h1 className="text-xl font-bold">
                            <span className="text-slate-900">Manage</span>{' '}
                            <span className="text-blue-600">Categories</span>
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">Organize and maintain course categories</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Form */}
                <Card>
                    <CardHeader><CardTitle>{editId ? 'Edit Category' : 'New Category'}</CardTitle></CardHeader>
                    <form onSubmit={save} className="space-y-3">
                        <Input
                            label="Name *"
                            value={form.name}
                            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                            placeholder="Web Development"
                            required
                        />
                        <Textarea
                            label="Description"
                            value={form.description}
                            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                            placeholder="Brief description…"
                        />
                        <div className="flex gap-2 pt-1">
                            {editId && <Button type="button" variant="ghost" size="sm" onClick={cancelEdit} className="flex-1">Cancel</Button>}
                            <Button type="submit" loading={saving} size="sm" className="flex-1">
                                {editId ? 'Update' :  'Create'}
                            </Button>
                        </div>
                    </form>
                </Card>

                {/* List */}
                <div className="lg:col-span-2 space-y-3">
                    {loading ? (
                        <AdminListSkeleton />
                    ) : categories.map(c => (
                        <Card key={c.id} padding={false} className="flex items-center gap-4 p-4">
                            <div className="w-11 h-11 rounded-xl bg-indigo-50  flex items-center justify-center text-indigo-500 flex-shrink-0">
                                <Tag size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-[var(--text-primary)] text-sm">{c.name}</p>
                                {c.description && <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">{c.description}</p>}
                            </div>
                            <Badge variant="default" size="sm">{c.course_count || 0} courses</Badge>
                            <div className="flex gap-1.5">
                                <button onClick={() => startEdit(c)}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-indigo-500 hover:bg-indigo-50  transition-colors">
                                    <Pencil size={13} />
                                </button>
                                <button onClick={() => del(c.id)}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50  transition-colors">
                                    <Trash2 size={13} />
                                </button>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}

