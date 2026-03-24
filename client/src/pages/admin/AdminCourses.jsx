// pages/admin/AdminCourses.jsx — Admin course management: list, create, edit, delete
import { useState, useEffect, useMemo } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff, BookOpen, Search, Upload, X, PlusCircle, Video, FileText, Layout, BrainCircuit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input, { Textarea, Select } from '../../components/ui/Input';
import { SkeletonRow } from '../../components/ui/Skeleton';
import notify from '../../utils/notify';
import confirmAction from '../../utils/confirm';

const emptyForm = () => ({
    title: '', description: '', category_id: '', level: 'beginner',
    duration_hours: 0, thumbnail_url: '', price: 0, is_published: true
});

export default function AdminCourses() {
    const [courses, setCourses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState(emptyForm());
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [modules, setModules] = useState([{ title: '', description: '', lessons: [{ title: '', lesson_type: 'video', content_url: '', duration_min: 10 }] }]);
    const [query, setQuery] = useState('');
    const [statusF, setStatusF] = useState('');
    const [categoryF, setCategoryF] = useState('');
    const [publishingId, setPublishingId] = useState(null);
    const navigate = useNavigate();

    const load = () => {
        setLoading(true);
        api.get('/courses/admin/all')
            .then(r => setCourses(r.data || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load();
        api.get('/categories').then(r => setCategories(r.data || [])).catch(() => { });
    }, []);

    const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const openCreate = () => {
        setEditId(null); setForm(emptyForm());
        setModules([{ title: '', description: '', lessons: [{ title: '', lesson_type: 'video', content_url: '', duration_min: 10 }] }]);
        setShowForm(true);
    };

    const openEdit = async (c) => {
        setEditId(c.id);
        const { title, description, category_id, level, duration_hours, thumbnail_url, price, is_published } = c;
        setForm({ title, description: description || '', category_id: category_id || '', level: level || 'beginner', duration_hours: duration_hours || 0, thumbnail_url: thumbnail_url || '', price: price || 0, is_published });
        
        try {
            const { data } = await api.get(`/courses/${c.id}`);
            if (data.modules && data.modules.length > 0) {
                setModules(data.modules.map(m => ({
                    id: m.id,
                    title: m.title,
                    description: m.description,
                    lessons: (m.lessons || []).map(l => ({
                        id: l.id,
                        title: l.title,
                        lesson_type: l.lesson_type,
                        content_url: l.content_url,
                        duration_min: l.duration_min
                    }))
                })));
            } else {
                setModules([{ title: '', description: '', lessons: [{ title: '', lesson_type: 'video', content_url: '', duration_min: 10 }] }]);
            }
        } catch (err) {
            console.error('Failed to load course details', err);
            setModules([{ title: '', description: '', lessons: [{ title: '', lesson_type: 'video', content_url: '', duration_min: 10 }] }]);
        }
        setShowForm(true);
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const { data } = await api.post('/upload/image', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setF('thumbnail_url', data.url);
        } catch (err) {
            console.error('Upload error:', err.response?.data || err.message || err);
            notify.error('Image upload failed', err.response?.data?.error || 'Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const save = async () => {
        if (!form.title) {
            notify.warning('Title is required');
            return;
        }
        setSaving(true);
        try {
            let courseId = editId;
            if (editId) {
                await api.put(`/courses/${editId}`, form);
            } else {
                const { data } = await api.post('/courses', form);
                courseId = data.id;
            }

            // Sync Modules & Lessons
            for (let i = 0; i < modules.length; i++) {
                const m = modules[i];
                let modId = m.id;

                if (m.id) {
                    await api.put(`/modules/${m.id}`, { title: m.title, description: m.description, sort_order: i });
                } else if (m.title) {
                    const { data: newMod } = await api.post('/modules', { course_id: courseId, title: m.title, description: m.description, sort_order: i });
                    modId = newMod.id;
                }

                if (modId) {
                    for (let j = 0; j < (m.lessons || []).length; j++) {
                        const l = m.lessons[j];
                        if (l.id) {
                            await api.put(`/lessons/${l.id}`, { ...l, sort_order: j });
                        } else if (l.title) {
                            await api.post('/lessons', { module_id: modId, ...l, sort_order: j });
                        }
                    }
                }
            }

            setShowForm(false); load();
            notify.success(editId ? 'Course updated successfully' : 'Course created successfully');
        } catch (err) { 
            console.error('Save failed', err);
            notify.error('Save failed', err.response?.data?.error || 'Save failed. Check console for details.'); 
        } finally { setSaving(false); }
    };

    const remove = async (id) => {
        const confirmed = await confirmAction({
            title: 'Delete Course?',
            text: 'All modules, lessons, and quizzes in this course will also be removed.',
            confirmText: 'Delete',
            cancelText: 'Cancel',
            confirmButtonColor: '#dc2626',
        });
        if (!confirmed) return;
        try {
            await api.delete(`/courses/${id}`);
            load();
            notify.success('Course deleted successfully');
        }
        catch (err) { notify.error('Delete failed', err.response?.data?.error || 'Delete failed'); }
    };

    const togglePublish = async (course) => {
        const nextPublished = !course.is_published;
        const confirmed = await confirmAction({
            title: nextPublished ? 'Publish Course?' : 'Depublish Course?',
            text: nextPublished
                ? 'This course will become visible to students in the catalog.'
                : 'This course will be hidden from students in the catalog.',
            confirmText: nextPublished ? 'Publish' : 'Depublish',
            cancelText: 'Cancel',
            confirmButtonColor: nextPublished ? '#2563eb' : '#f59e0b',
        });
        if (!confirmed) return;

        setPublishingId(course.id);
        try {
            await api.put(`/courses/${course.id}`, { is_published: nextPublished });
            setCourses(cs => cs.map(c => c.id === course.id ? { ...c, is_published: nextPublished } : c));
            notify.success(nextPublished ? 'Course published successfully' : 'Course moved to draft');
        } catch (err) {
            notify.error('Update failed', err.response?.data?.error || 'Could not update publish status');
        } finally {
            setPublishingId(null);
        }
    };

    const addModule = () => setModules([...modules, { title: '', description: '', lessons: [{ title: '', lesson_type: 'video', content_url: '', duration_min: 10 }] }]);
    const removeModule = async (mi) => {
        const mod = modules[mi];
        if (mod.id) {
            const confirmed = await confirmAction({
                title: 'Delete Module?',
                text: 'All lessons inside this module will also be removed.',
                confirmText: 'Delete',
                cancelText: 'Cancel',
                confirmButtonColor: '#dc2626',
            });
            if (!confirmed) return;
        }
        if (mod.id) await api.delete(`/modules/${mod.id}`);
        setModules(ms => ms.filter((_, j) => j !== mi));
    };
    const setMod = (i, k, v) => setModules(ms => ms.map((m, j) => j === i ? { ...m, [k]: v } : m));

    const addLesson = (mi) => setModules(ms => ms.map((m, i) => i === mi ? { ...m, lessons: [...(m.lessons || []), { title: '', lesson_type: 'video', content_url: '', duration_min: 10 }] } : m));
    const removeLesson = async (mi, li) => {
        const lesson = modules[mi].lessons[li];
        if (lesson.id) {
            const confirmed = await confirmAction({
                title: 'Delete Lesson?',
                text: 'This lesson will be permanently removed.',
                confirmText: 'Delete',
                cancelText: 'Cancel',
                confirmButtonColor: '#dc2626',
            });
            if (!confirmed) return;
        }
        if (lesson.id) await api.delete(`/lessons/${lesson.id}`);
        setModules(ms => ms.map((m, i) => i === mi ? { ...m, lessons: m.lessons.filter((_, j) => j !== li) } : m));
    };
    const setLesson = (mi, li, k, v) => setModules(ms => ms.map((m, i) => i === mi ? { ...m, lessons: m.lessons.map((l, j) => j === li ? { ...l, [k]: v } : l) } : m));

    const filteredCourses = useMemo(() => {
        const q = query.trim().toLowerCase();
        return courses.filter(c => {
            const matchesQuery = !q || c.title?.toLowerCase().includes(q) || c.category_name?.toLowerCase().includes(q);
            const matchesStatus = !statusF || (statusF === 'published' ? c.is_published : !c.is_published);
            const matchesCategory = !categoryF || String(c.category_id) === String(categoryF);
            return matchesQuery && matchesStatus && matchesCategory;
        });
    }, [courses, query, statusF, categoryF]);

    return (
        <div className="space-y-5">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 anim-fade-up">
                <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
                    <div>
                        <h1 className="text-xl font-bold">
                            <span className="text-slate-900">Manage</span>{' '}
                            <span className="text-blue-600">Courses</span>
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">{courses.length} courses available for administration</p>
                    </div>
                    <Button onClick={openCreate} className="w-full sm:w-auto">
                        <Plus size={15} /> New Course
                    </Button>
                </div>
            </div>

            {/* Create / Edit Form */}
            {showForm && (
                <Card className="border-2 border-indigo-200">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-base font-bold text-[var(--text-primary)]">{editId ? 'Edit Course' : 'Create New Course'}</h2>
                        <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>✕ Cancel</Button>
                    </div>
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <Input label="Course Title *" value={form.title} onChange={e => setF('title', e.target.value)} placeholder="e.g. React Mastery" required />
                            <Textarea label="Description" value={form.description} onChange={e => setF('description', e.target.value)} placeholder="What will students learn?" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Select label="Category" value={form.category_id} onChange={e => setF('category_id', e.target.value)}>
                                    <option value="">Select category</option>
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </Select>
                                <Input label="Duration (hours)" type="number" min={0} value={form.duration_hours} onChange={e => setF('duration_hours', e.target.value)} />
                            </div>
                            
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-[var(--text-primary)]">Course Thumbnail</p>
                                <div className="flex flex-col sm:flex-row items-center gap-4">
                                    {form.thumbnail_url && (
                                        <img src={form.thumbnail_url} alt="Preview" className="w-full sm:w-32 h-20 rounded-lg object-cover border border-[var(--border)] shadow-sm" />
                                    )}
                                    <label className={`flex flex-col items-center justify-center w-full h-20 border-2 border-dashed rounded-xl cursor-pointer transition-all ${uploading ? 'bg-slate-50 border-slate-300' : 'hover:bg-indigo-50 border-indigo-200'}`}>
                                        <div className="flex items-center gap-2">
                                            {uploading ? <div className="spinner w-4 h-4 text-indigo-500" /> : <Upload size={16} className="text-indigo-500" />}
                                            <span className="text-sm text-indigo-600 font-medium">{uploading ? 'Uploading...' : 'Click to upload image'}</span>
                                        </div>
                                        <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={uploading} />
                                    </label>
                                </div>
                            </div>
                            
                            <label className="flex items-center gap-3 cursor-pointer w-fit">
                                <div onClick={() => setF('is_published', !form.is_published)}
                                    className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${form.is_published ? 'bg-indigo-600' : 'bg-[var(--surface-3)]'}`}>
                                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${form.is_published ? 'left-5' : 'left-0.5'}`} />
                                </div>
                                <span className="text-sm font-medium text-[var(--text-primary)]">Published</span>
                            </label>
                        </div>

                        {/* Modules & Lessons Editor */}
                        <div className="space-y-6 bg-slate-50/30 p-4 sm:p-6 rounded-2xl border border-[var(--border)]">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                                <p className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                                    <Layout size={18} className="text-indigo-500" /> Modules & Videos
                                </p>
                                <Button variant="outline" size="sm" onClick={addModule} className="bg-white">
                                    <PlusCircle size={14} /> Add Module
                                </Button>
                            </div>

                            <div className="space-y-4">
                                {modules.map((m, mi) => (
                                    <div key={mi} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
                                        <div className="p-4 sm:p-5 space-y-4 relative">
                                            <button onClick={() => removeModule(mi)} className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors">
                                                <X size={18} />
                                            </button>
                                            
                                            <div className="space-y-3 pr-8">
                                                <Input 
                                                    label={`Module ${mi + 1} Title`} 
                                                    value={m.title} 
                                                    onChange={e => setMod(mi, 'title', e.target.value)} 
                                                    placeholder="e.g. Getting Started" 
                                                />
                                                <Textarea 
                                                    label="Module Description" 
                                                    value={m.description} 
                                                    onChange={e => setMod(mi, 'description', e.target.value)} 
                                                    placeholder="Briefly explain this module..."
                                                    className="min-h-[80px]"
                                                />
                                            </div>

                                            <div className="pl-4 sm:pl-6 border-l-2 border-indigo-100 space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-500">Lessons / Videos</span>
                                                    <button onClick={() => addLesson(mi)} className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 bg-indigo-50 px-2 py-1 rounded-md transition-colors">
                                                        <Plus size={12} /> Add Lesson
                                                    </button>
                                                </div>
                                                
                                                <div className="space-y-3">
                                                    {(m.lessons || []).map((l, li) => (
                                                        <div key={li} className="group bg-slate-50/50 p-4 rounded-xl border border-slate-100 hover:border-indigo-100 transition-all space-y-3 relative">
                                                            <button onClick={() => removeLesson(mi, li)} className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all">
                                                                <X size={14} />
                                                            </button>
                                                            
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-indigo-600 flex-shrink-0">
                                                                    {l.lesson_type === 'video' || l.lesson_type === 'youtube' ? <Video size={14} /> : <FileText size={14} />}
                                                                </div>
                                                                <input 
                                                                    className="flex-1 bg-transparent font-medium text-sm text-[var(--text-primary)] focus:outline-none border-b border-transparent focus:border-indigo-200 transition-all"
                                                                    value={l.title} 
                                                                    onChange={e => setLesson(mi, li, 'title', e.target.value)} 
                                                                    placeholder="Lesson title" 
                                                                />
                                                            </div>

                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-0 sm:pl-11">
                                                                <Select value={l.lesson_type} onChange={e => setLesson(mi, li, 'lesson_type', e.target.value)} className="h-9 text-xs py-0 bg-white">
                                                                    <option value="video">Video URL</option>
                                                                    <option value="youtube">YouTube</option>
                                                                    <option value="pdf">PDF</option>
                                                                    <option value="text">Text</option>
                                                                </Select>
                                                                <div className="flex items-center bg-white border border-[var(--border)] rounded-lg px-2 h-9">
                                                                    <input 
                                                                        type="number" 
                                                                        className="w-full bg-transparent text-xs focus:outline-none"
                                                                        value={l.duration_min} 
                                                                        onChange={e => setLesson(mi, li, 'duration_min', e.target.value)} 
                                                                        placeholder="Duration" 
                                                                    />
                                                                    <span className="text-[10px] text-slate-400 font-bold uppercase ml-1">Min</span>
                                                                </div>
                                                            </div>
                                                            <div className="pl-0 sm:pl-11">
                                                                <input 
                                                                    className="w-full bg-white border border-[var(--border)] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-300 transition-all shadow-sm"
                                                                    value={l.content_url} 
                                                                    onChange={e => setLesson(mi, li, 'content_url', e.target.value)} 
                                                                    placeholder={l.lesson_type === 'youtube' ? 'YouTube URL' : 'Video/Content URL'} 
                                                                />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {modules.length === 0 && (
                                    <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-2xl">
                                        <p className="text-sm text-slate-400">No modules yet. Add one to start building your course.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <Button loading={saving} onClick={save} className="w-full h-12 text-base shadow-lg shadow-indigo-100">
                            {editId ? 'Update Course' : form.is_published ? 'Create and Publish Course' : 'Create Draft Course'}
                        </Button>
                    </div>
                </Card>
            )}

            {/* Filters */}
            <Card className="p-4 rounded-[14px] shadow-sm border-slate-200/60">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                        <input
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="Search courses..."
                            className="w-full h-10 pl-9 pr-3 text-sm rounded-lg border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                        />
                    </div>
                    <select
                        value={categoryF}
                        onChange={e => setCategoryF(e.target.value)}
                        className="h-10 px-3 text-sm rounded-lg border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-primary)] focus:outline-none focus:border-indigo-500 transition-all"
                    >
                        <option value="">All Categories</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <select
                        value={statusF}
                        onChange={e => setStatusF(e.target.value)}
                        className="h-10 px-3 text-sm rounded-lg border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-primary)] focus:outline-none focus:border-indigo-500 transition-all"
                    >
                        <option value="">All Status</option>
                        <option value="published">Published</option>
                        <option value="draft">Draft</option>
                    </select>
                </div>
            </Card>

            {/* Courses table */}
            <Card padding={false} className="overflow-hidden rounded-[14px] shadow-sm border-slate-200/60">
                <table className="data-table">
                    <thead>
                        <tr>
                            {['Course', 'Students', 'Status', 'Actions'].map(h => <th key={h}>{h}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {loading
                            ? [1, 2, 3, 4, 5].map(i => (
                                <tr key={i}><td colSpan={4}><SkeletonRow /></td></tr>
                            ))
                            : filteredCourses.map(c => (
                                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                                    <td>
                                        <div className="flex items-center gap-3">
                                            {c.thumbnail_url
                                                ? <img src={c.thumbnail_url} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" onError={e => { e.target.style.display = 'none'; }} />
                                                : <div className="w-10 h-10 rounded-lg gradient-brand flex items-center justify-center flex-shrink-0"><BookOpen size={14} className="text-white" /></div>
                                            }
                                            <div>
                                                <p className="font-semibold text-[var(--text-primary)] text-sm">{c.title}</p>
                                                <p className="text-xs text-[var(--text-muted)]">{c.category_name || 'No category'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td><span className="text-sm text-[var(--text-primary)]">{c.enrollment_count || 0}</span></td>
                                    <td>
                                        {c.is_published
                                            ? <Badge variant="success" size="sm"><Eye size={11} /> Published</Badge>
                                            : <Badge variant="warning" size="sm"><EyeOff size={11} /> Draft</Badge>
                                        }
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => openEdit(c)}
                                                className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                                                title="Edit Course"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button onClick={() => navigate(`/admin/quizzes?courseId=${c.id}`)}
                                                className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                                                title="Edit Quizzes"
                                            >
                                                <BrainCircuit size={14} />
                                            </button>
                                            <button
                                                onClick={() => togglePublish(c)}
                                                disabled={publishingId === c.id}
                                                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
                                                    c.is_published
                                                        ? 'text-[var(--text-muted)] hover:text-amber-600 hover:bg-amber-50'
                                                        : 'text-[var(--text-muted)] hover:text-emerald-600 hover:bg-emerald-50'
                                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                                                title={c.is_published ? 'Depublish Course' : 'Publish Course'}
                                            >
                                                {publishingId === c.id
                                                    ? <div className="spinner w-4 h-4" />
                                                    : c.is_published
                                                        ? <EyeOff size={14} />
                                                        : <Eye size={14} />
                                                }
                                            </button>
                                            <button onClick={() => remove(c.id)}
                                                className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 transition-colors"
                                                title="Delete Course"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        }
                    </tbody>
                </table>
                {filteredCourses.length === 0 && !loading && (
                    <div className="text-center py-12 text-sm text-[var(--text-secondary)]">
                        <BookOpen size={32} className="mx-auto mb-3 text-[var(--text-muted)]" />
                        No courses found. Create your first one!
                    </div>
                )}
            </Card>
        </div>
    );
}
