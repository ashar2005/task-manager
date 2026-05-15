import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API = 'http://localhost:5000/api/tasks';

const STATUS_CONFIG = {
  pending: { label: 'Pending', dot: '#e2a24a', bg: '#fdf3e3', text: '#7c4f0f' },
  'in-progress': { label: 'In Progress', dot: '#4a90d9', bg: '#e8f2fc', text: '#1a4a7c' },
  completed: { label: 'Completed', dot: '#43a87c', bg: '#e4f5ee', text: '#1a6642' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: cfg.bg, color: cfg.text,
      fontSize: 12, fontWeight: 600, letterSpacing: '0.04em',
      padding: '4px 10px', borderRadius: 20,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
}

function Modal({ open, onClose, children }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(10,12,20,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, backdropFilter: 'blur(2px)',
        animation: 'fadeIn 0.15s ease',
      }}
    >
      <div style={{
        background: '#fff', borderRadius: 16, width: '100%', maxWidth: 480,
        margin: '0 16px', boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
        animation: 'slideUp 0.2s ease',
      }}>
        {children}
      </div>
    </div>
  );
}

const FILTERS = ['all', 'pending', 'in-progress', 'completed'];

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [viewTask, setViewTask] = useState(null); // STEP 2: For Detail View
  const [editTask, setEditTask] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const [form, setForm] = useState({
    title: '', description: '', status: 'pending', dueDate: ''
  });

  useEffect(() => { fetchTasks(); }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await axios.get(API);
      setTasks(res.data.data || []);
    } catch {
      showToast('Failed to load tasks', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg, type = 'success') => {
    clearTimeout(toastTimer.current);
    setToast({ msg, type });
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  };

  const openCreate = () => {
    setEditTask(null);
    setForm({ title: '', description: '', status: 'pending', dueDate: '' });
    setShowModal(true);
  };

  const openEdit = (task, e) => {
    e.stopPropagation(); // Prevent opening Detail View
    setEditTask(task);
    setForm({
      title: task.title,
      description: task.description || '',
      status: task.status,
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation(); // Prevent opening Detail View
    if (!window.confirm("Delete this task?")) return;
    setDeleteId(id);
    try {
      await axios.delete(`${API}/${id}`);
      showToast('Task deleted');
      fetchTasks();
    } catch {
      showToast('Delete failed', 'error');
    } finally {
      setDeleteId(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editTask) {
        await axios.put(`${API}/${editTask._id}`, form);
        showToast('Task updated');
      } else {
        await axios.post(API, form);
        showToast('Task created');
      }
      setShowModal(false);
      fetchTasks();
    } catch {
      showToast('Error saving task', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Live Filtering Logic
  const filtered = tasks
    .filter(t => filter === 'all' || t.status === filter)
    .filter(t => 
      t.title.toLowerCase().includes(search.toLowerCase()) || 
      (t.description || '').toLowerCase().includes(search.toLowerCase())
    );

  const counts = {
    all: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    'in-progress': tasks.filter(t => t.status === 'in-progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
  };

  const completionPct = tasks.length ? Math.round((counts.completed / tasks.length) * 100) : 0;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Serif+Display&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f5f4f0; font-family: 'DM Sans', sans-serif; }
        .task-card { transition: all 0.2s; cursor: pointer; }
        .task-card:hover { transform: translateY(-3px); box-shadow: 0 12px 24px rgba(0,0,0,0.08) !important; }
        .btn-primary { background: #2351a0; color: #fff; padding: 12px 24px; border-radius: 12px; border: none; font-weight: 600; cursor: pointer; }
        input, textarea, select { width: 100%; padding: 12px; border: 1.5px solid #e0ddd7; border-radius: 10px; outline: none; background: #faf9f7; }
        input:focus { border-color: #2351a0; background: #fff; }
      `}</style>

      {/* Main Container */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 20px' }}>
        
        {/* Header & Progress */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 32 }}>Task Manager</h1>
              <p style={{ color: '#888', fontSize: 14 }}>{completionPct}% Complete</p>
            </div>
            <button className="btn-primary" onClick={openCreate}>+ New Task</button>
          </div>
          <div style={{ background: '#e8e5de', height: 6, borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ width: `${completionPct}%`, background: '#2351a0', height: '100%', transition: 'width 0.5s' }} />
          </div>
        </div>

        {/* Search & Filters */}
        <div style={{ marginBottom: 20 }}>
          <input 
            placeholder="Search tasks..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            style={{ marginBottom: 16 }}
          />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {FILTERS.map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding: '8px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
                background: filter === f ? '#1e3a5f' : '#eceae4',
                color: filter === f ? '#fff' : '#555', fontWeight: 600
              }}>
                {f.toUpperCase()} ({counts[f]})
              </button>
            ))}
          </div>
        </div>

        {/* Task List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(task => (
            <div 
              key={task._id} 
              className="task-card" 
              onClick={() => setViewTask(task)} // Opens Detail View
              style={{ background: '#fff', padding: 20, borderRadius: 16, border: '1px solid #ece9e2', display: 'flex', justifyContent: 'space-between' }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <h3 style={{ fontSize: 17 }}>{task.title}</h3>
                  <StatusBadge status={task.status} />
                </div>
                <p style={{ color: '#777', fontSize: 14, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '400px' }}>
                  {task.description || "No description provided."}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={(e) => openEdit(task, e)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 18 }}>✏️</button>
                <button onClick={(e) => handleDelete(task._id, e)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 18 }}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* TASK DETAIL MODAL */}
      <Modal open={!!viewTask} onClose={() => setViewTask(null)}>
        {viewTask && (
          <div style={{ padding: 32 }}>
            <StatusBadge status={viewTask.status} />
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, marginTop: 12, marginBottom: 8 }}>{viewTask.title}</h2>
            <p style={{ color: '#555', lineHeight: 1.6, marginBottom: 20 }}>{viewTask.description || "No description."}</p>
            <div style={{ fontSize: 14, color: '#999', borderTop: '1px solid #eee', paddingTop: 16 }}>
              <p>📅 Due Date: {viewTask.dueDate ? new Date(viewTask.dueDate).toLocaleDateString() : 'None set'}</p>
              <p>🆔 Task ID: {viewTask._id}</p>
            </div>
            <button className="btn-primary" style={{ width: '100%', marginTop: 24 }} onClick={() => setViewTask(null)}>Close</button>
          </div>
        )}
      </Modal>

      {/* CREATE/EDIT MODAL */}
      <Modal open={showModal} onClose={() => setShowModal(false)}>
        <form onSubmit={handleSubmit} style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h2 style={{ fontFamily: "'DM Serif Display', serif" }}>{editTask ? 'Edit Task' : 'New Task'}</h2>
          <input required placeholder="Task Title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
          <textarea placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
            <input type="date" value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})} />
          </div>
          <button type="submit" className="btn-primary">{saving ? 'Saving...' : 'Save Task'}</button>
        </form>
      </Modal>
    </>
  );
}