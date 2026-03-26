import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ClipboardList, Plus, Trash2, CheckCircle2,
  Clock, Calendar, Edit2, Loader2, ListTodo, Search
} from 'lucide-react';
import api from '../services/api';
import { SkeletonStat } from '../components/ui/Skeleton';
import notify from '../utils/notify';
import confirmAction from '../utils/confirm';

const tabs = [
  { key: 'all', label: 'All Tasks' },
  { key: 'pending', label: 'Pending' },
  { key: 'completed', label: 'Completed' },
  { key: 'overdue', label: 'Overdue' },
];

export default function ManageTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const [editingTask, setEditingTask] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    due_date: '',
    status: 'pending',
  });

  const todayStr = new Date().toISOString().split('T')[0];

  const fetchTasks = async () => {
    try {
      const r = await api.get('/tasks');
      const priorityMap = { high: 3, medium: 2, low: 1 };
      const sorted = (r.data || []).sort((a, b) => {
        if (a.status !== b.status) return a.status === 'completed' ? 1 : -1;
        return priorityMap[b.priority] - priorityMap[a.priority];
      });
      setTasks(sorted);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title) return;
    setSaving(true);
    try {
      if (editingTask) {
        await api.put(`/tasks/${editingTask.task_id}`, formData);
        setEditingTask(null);
        notify.success('Task updated');
      } else {
        await api.post('/tasks', formData);
        notify.success('Task created');
      }
      setFormData({ title: '', description: '', priority: 'medium', due_date: '', status: 'pending' });
      fetchTasks();
    } catch (e) {
      console.error(e);
      notify.error('Task action failed', e.response?.data?.error || 'Something went wrong while saving the task.');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (task) => {
    setFormData({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      due_date: task.due_date ? task.due_date.split('T')[0] : '',
      status: task.status,
    });
    setEditingTask(task);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingTask(null);
    setFormData({ title: '', description: '', priority: 'medium', due_date: '', status: 'pending' });
  };

  const toggleComplete = async (id, currentStatus) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    try {
      setTasks(tasks.map((t) => (t.task_id === id ? { ...t, status: newStatus } : t)));
      await api.patch(`/tasks/${id}/complete`, { status: newStatus });
      notify.success(newStatus === 'completed' ? 'Task completed' : 'Task marked as pending');
    } catch (e) {
      console.error(e);
      fetchTasks();
      notify.error('Unable to update task status');
    }
  };

  const deleteTask = async (id) => {
    const confirmed = await confirmAction({
      title: 'Delete Task?',
      text: 'This task will be permanently removed.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      confirmButtonColor: '#dc2626',
    });
    if (!confirmed) return;
    try {
      setTasks(tasks.filter((t) => t.task_id !== id));
      await api.delete(`/tasks/${id}`);
      notify.success('Task deleted');
    } catch (e) {
      console.error(e);
      fetchTasks();
      notify.error('Failed to delete task');
    }
  };


  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const pendingCount = tasks.length - completedCount;

  const isOverdue = useCallback((task) => {
    if (!task.due_date || task.status === 'completed') return false;
    return new Date(task.due_date) < new Date();
  }, []);
  const filteredTasks = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return tasks.filter((task) => {
      const matchesSearch = !keyword
        || task.title?.toLowerCase().includes(keyword)
        || (task.description || '').toLowerCase().includes(keyword);

      if (!matchesSearch) return false;
      if (activeTab === 'pending') return task.status === 'pending';
      if (activeTab === 'completed') return task.status === 'completed';
      if (activeTab === 'overdue') return isOverdue(task);
      return true;
    });
  }, [tasks, search, activeTab, isOverdue]);

  return (
    <div className="max-w-[1200px] mx-auto w-full space-y-2 min-h-screen" >
      
      {/* Unified Dashboard Header Card */}
      <div className="bg-white rounded-xl p-8 shadow-[0_8px_40px_rgba(0,0,0,0.02)] border border-slate-200 anim-fade-up">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          {/* Title and Subtitle */}
          <div className="space-y-2">
            <h1 className="text-xl font-bold">
              Manage <span className="text-[#2563EB] font-bold">Tasks</span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">Your task overview and work progress.</p>
          </div>

          {/* Stats Boxes (Right Aligned - Reference Style) */}
          <div className="flex items-center gap-4 flex-wrap">
            {loading ? (
              <>
                <SkeletonStat />
                <SkeletonStat />
                <SkeletonStat />
              </>
            ) : (
              <>
                <div className="px-6 py-4 rounded-[18px] bg-[#F5F7FF] border border-[#E0E7FF] min-w-[150px] transition-all hover:shadow-sm">
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Total Tasks</p>
                  <p className="text-xl font-bold text-indigo-700 mt-1 leading-none">{tasks.length}</p>
                </div>
                <div className="px-6 py-4 rounded-[18px] bg-[#F0FDF4] border border-[#DCFCE7] min-w-[150px] transition-all hover:shadow-sm">
                  <p className="text-[10px] font-black text-green-400 uppercase tracking-widest">Completed</p>
                  <p className="text-xl font-bold text-green-700 mt-1 leading-none">{completedCount}</p>
                </div>
                <div className="px-6 py-4 rounded-[18px] bg-[#FFF7ED] border border-[#FFEDD5] min-w-[150px] transition-all hover:shadow-sm">
                  <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Pending</p>
                  <p className="text-xl font-bold text-orange-700 mt-1 leading-none">{pendingCount}</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content: Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_2.5fr] gap-3 items-start pb-12">
        {/* Left Column - Add Task Form (Sticky) */}
        <div className="lg:sticky lg:top-6">
          <div className="bg-white rounded-[16px] p-6 shadow-[0_8px_20px_rgba(0,0,0,0.04)] border border-[#F1F5F9]">
            <h3 className="text-[18px] font-semibold text-[#0F172A] mb-6 flex items-center gap-2">
              {editingTask ? <Edit2 size={18} /> : <Plus size={18} />}
              {editingTask ? 'Edit Task' : 'Add Task'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-[#64748B]">Task Title</label>
                <input
                  type="text"
                  required
                  placeholder="What needs to be done?"
                  className="w-full h-[44px] px-4 rounded-[10px] border border-[#E2E8F0] bg-white text-[14px] text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-[#64748B]">Description</label>
                <textarea
                  placeholder="Add more details..."
                  className="w-full min-h-[90px] p-4 rounded-[10px] border border-[#E2E8F0] bg-white text-[14px] text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all resize-none"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-[#64748B]">Priority</label>
                  <select
                    className="w-full h-[44px] px-3 rounded-[10px] border border-[#E2E8F0] bg-white text-[14px] text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                    style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0\' stroke-width=\'1.5\' stroke=\'%2364748B\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' d=\'m19.5 8.25-7.5 7.5-7.5-7.5\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '16px' }}
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-[#64748B]">Due Date</label>
                  <input
                    type="date"
                    min={todayStr}
                    className="w-full h-[44px] px-3 rounded-[10px] border border-[#E2E8F0] bg-white text-[14px] text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                {editingTask && (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="flex-1 h-[44px] rounded-[10px] border border-[#E2E8F0] text-[14px] font-medium text-[#64748B] hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 h-[44px] rounded-[10px] bg-[#6366F1] text-white text-[14px] font-medium hover:bg-[#5850EC] shadow-sm shadow-indigo-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {saving ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <>
                      {editingTask ? <CheckCircle2 size={18} /> : <Plus size={18} />}
                      {editingTask ? 'Save Changes' : 'Create Task'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column - Task List and Search */}
        <div className="space-y-3">
          {/* Search and Filters Bar Panel */}
          <div className="bg-white rounded-[16px] p-5 shadow-[0_8px_20px_rgba(0,0,0,0.04)] border border-[#F1F5F9] space-y-2">
             <div className="relative w-full">
               <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
               <input
                 type="text"
                 placeholder="Search by task title or description..."
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
                 className="w-full h-[48px] pl-12 pr-6 rounded-[12px] bg-slate-50/50 border border-slate-100 text-[15px] focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 focus:bg-white transition-all outline-none"
               />
             </div>

             <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
               {tabs.map((tab) => {
                 const active = activeTab === tab.key;
                 return (
                   <button
                     key={tab.key}
                     type="button"
                     onClick={() => setActiveTab(tab.key)}
                     className={`px-5 py-2 rounded-[10px] text-[13px] font-semibold transition-all whitespace-nowrap border ${
                       active
                         ? 'bg-[#6366F1] text-white border-[#6366F1] shadow-md shadow-indigo-100'
                         : 'bg-white text-[#64748B] border-slate-100 hover:bg-slate-50'
                     }`}
                   >
                     {tab.label}
                   </button>
                 );
               })}
             </div>
          </div>

          {/* Tasks Container */}
          <div className="min-h-[400px]">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-[100px] rounded-[16px] bg-white border border-[#F1F5F9] animate-pulse" />
                ))}
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="bg-white rounded-[16px] py-20 px-6 text-center border border-dashed border-slate-200">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ClipboardList size={28} className="text-slate-300" />
                </div>
                <h3 className="text-[16px] font-semibold text-[#0F172A] mb-1">No tasks yet</h3>
                <p className="text-[14px] text-[#64748B] mb-6 max-w-[240px] mx-auto">Create your first task to start organizing your work.</p>
                <button
                  onClick={() => {
                    const addFormInput = document.querySelector('input[placeholder="What needs to be done?"]');
                    if (addFormInput) addFormInput.focus();
                  }}
                  className="h-10 px-6 rounded-[8px] bg-[#6366F1] text-white text-[14px] font-medium hover:bg-[#5850EC] transition-all inline-flex items-center gap-2"
                >
                  <Plus size={18} /> Create Task
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTasks.map((task) => {
                  const completed = task.status === 'completed';
                  const overdue = isOverdue(task);
                  
                  const getPriorityStyle = (p) => {
                    switch(p) {
                      case 'high': return 'bg-red-50 text-red-600 border-red-100';
                      case 'medium': return 'bg-amber-50 text-amber-600 border-amber-100';
                      default: return 'bg-slate-50 text-slate-600 border-slate-100';
                    }
                  };

                  return (
                    <div
                      key={task.task_id}
                      className={`group bg-white rounded-[14px] p-[18px] border border-[#F1F5F9] shadow-sm hover:shadow-md transition-all relative overflow-hidden ${
                        overdue ? 'border-l-[4px] border-l-[#EF4444]' : ''
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        {/* Checkbox Icon */}
                        <button
                          onClick={() => toggleComplete(task.task_id, task.status)}
                          className={`mt-1 flex-shrink-0 transition-all ${
                            completed ? 'text-emerald-500' : 'text-slate-300 hover:text-indigo-400'
                          }`}
                        >
                          {completed ? (
                            <div className="w-[22px] h-[22px] rounded-full bg-emerald-500 flex items-center justify-center border-2 border-emerald-500">
                               <CheckCircle2 size={14} className="text-white" />
                            </div>
                          ) : (
                            <div className="w-[22px] h-[22px] rounded-full border-2 border-slate-200" />
                          )}
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className={`text-[15px] font-semibold tracking-tight ${
                                  completed ? 'line-through text-slate-400' : 'text-[#0F172A]'
                                }`}>
                                  {task.title}
                                </h4>
                                {completed && (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-wider">
                                    Completed
                                  </span>
                                )}
                              </div>
                              {task.description && (
                                <p className={`text-[13px] line-clamp-2 ${
                                  completed ? 'text-slate-300' : 'text-[#64748B]'
                                }`}>
                                  {task.description}
                                </p>
                              )}
                            </div>

                            <div className="flex flex-col items-end gap-2 shrink-0">
                               <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase border tracking-wider ${getPriorityStyle(task.priority)}`}>
                                {task.priority}
                              </span>
                            </div>
                          </div>

                          {/* Metadata */}
                          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
                            <div className={`flex items-center gap-1.5 text-[12px] font-medium ${overdue ? 'text-red-500' : 'text-[#64748B]'}`}>
                              <Calendar size={14} />
                              <span>{task.due_date ? `Due ${new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : 'No date'}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[12px] font-medium text-slate-400">
                              <Clock size={14} />
                              <span>Created {new Date(task.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                            </div>
                          </div>
                        </div>

                        {/* Hover Actions */}
                        <div className="md:opacity-0 group-hover:opacity-100 flex items-center gap-1.5 transition-all">
                          <button
                            onClick={() => openEdit(task)}
                            className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => deleteTask(task.task_id)}
                            className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


