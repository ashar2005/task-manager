import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Calendar,
  CheckCircle2,
  Circle,
  Loader2,
  X,
  Sparkles,
  ListTodo,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: TaskManager,
  head: () => ({
    meta: [
      { title: "Atelier — Task Manager" },
      { name: "description", content: "A calm, editorial task manager for focused work." },
    ],
  }),
});

type Status = "pending" | "in-progress" | "completed";
type Task = {
  _id: string;
  title: string;
  description: string;
  status: Status;
  dueDate: string;
  createdAt: string | number;
};

const STATUS = {
  pending: { label: "Pending", dot: "bg-[oklch(0.78_0.13_75)]", chip: "bg-[oklch(0.95_0.05_75)] text-[oklch(0.38_0.1_60)]" },
  "in-progress": { label: "In Progress", dot: "bg-[oklch(0.65_0.14_240)]", chip: "bg-[oklch(0.94_0.04_240)] text-[oklch(0.38_0.12_245)]" },
  completed: { label: "Completed", dot: "bg-[oklch(0.62_0.14_155)]", chip: "bg-[oklch(0.93_0.05_155)] text-[oklch(0.35_0.1_155)]" },
} as const;

const FILTERS: ("all" | Status)[] = ["all", "pending", "in-progress", "completed"];
const API_URL = "http://localhost:5000/api/tasks";

function TaskManager() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [toast, setToast] = useState<{ msg: string; tone: "ok" | "err" } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [form, setForm] = useState({ title: "", description: "", status: "pending" as Status, dueDate: "" });

  const showToast = (msg: string, tone: "ok" | "err" = "ok") => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, tone });
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error("Could not retrieve tasks.");
      const data = await response.json();
      // Backend returns { success: true, data: [...] }
      setTasks(Array.isArray(data) ? data : Array.isArray(data.data) ? data.data : []);
    } catch (error) {
      console.error("Backend connection missing:", error);
      showToast("Cannot read data from MongoDB", "err");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowModal(false);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "n") {
        e.preventDefault();
        openCreate();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const openCreate = () => {
    setEditTask(null);
    setForm({ title: "", description: "", status: "pending", dueDate: "" });
    setShowModal(true);
  };

  const openEdit = (t: Task) => {
    setEditTask(t);
    const formattedDate = t.dueDate ? new Date(t.dueDate).toISOString().split("T")[0] : "";
    setForm({ title: t.title, description: t.description, status: t.status, dueDate: formattedDate });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    try {
      if (editTask) {
        const response = await fetch(`${API_URL}/${editTask._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!response.ok) throw new Error();
        const result = await response.json();
        // Backend returns { success: true, data: task }
        const updatedTask = result.data || result;
        setTasks((prev) => prev.map((t) => (t._id === editTask._id ? updatedTask : t)));
        showToast("Task updated successfully");
      } else {
        const response = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!response.ok) throw new Error();
        const result = await response.json();
        // Backend returns { success: true, data: task }
        const newTask = result.data || result;
        setTasks((prev) => [newTask, ...prev]);
        showToast("Task created successfully");
      }
      setShowModal(false);
    } catch (error) {
      showToast("Could not save task", "err");
    }
  };

  const toggleStatus = async (task: Task) => {
    const nextStatus: Status = task.status === "completed" ? "pending" : "completed";
    try {
      const response = await fetch(`${API_URL}/${task._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...task, status: nextStatus }),
      });
      if (!response.ok) throw new Error();
      const result = await response.json();
      const updated = result.data || result;
      setTasks((prev) => prev.map((t) => (t._id === task._id ? updated : t)));
    } catch (error) {
      showToast("Failed to update status", "err");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error();
      setTasks((prev) => prev.filter((t) => t._id !== id));
      showToast("Task deleted");
    } catch (error) {
      showToast("Failed to delete task", "err");
    }
  };

  const counts = useMemo(
    () => ({
      all: tasks.length,
      pending: tasks.filter((t) => t.status === "pending").length,
      "in-progress": tasks.filter((t) => t.status === "in-progress").length,
      completed: tasks.filter((t) => t.status === "completed").length,
    }),
    [tasks],
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return tasks
      .filter((t) => filter === "all" || t.status === filter)
      .filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q),
      );
  }, [tasks, filter, search]);

  const completionPct = tasks.length ? Math.round((counts.completed / tasks.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-[oklch(0.97_0.012_85)] text-[oklch(0.18_0.02_60)] font-[DM_Sans,sans-serif]">
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display&display=swap"
      />

      <div
        aria-hidden
        className="pointer-events-none fixed -top-40 -right-40 h-[480px] w-[480px] rounded-full opacity-50 blur-3xl"
        style={{ background: "radial-gradient(closest-side, oklch(0.85 0.13 65), transparent 70%)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed -bottom-52 -left-32 h-[420px] w-[420px] rounded-full opacity-40 blur-3xl"
        style={{ background: "radial-gradient(closest-side, oklch(0.82 0.12 200), transparent 70%)" }}
      />

      <div className="relative mx-auto max-w-5xl px-6 py-10 md:px-10 md:py-16">
        <div className="mb-10 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm tracking-widest text-[oklch(0.45_0.04_60)] uppercase">
            <span className="inline-block h-2 w-2 rounded-full bg-[oklch(0.55_0.18_30)]" />
            Atelier · Tasks
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-[oklch(0.88_0.02_85)] bg-white/60 px-3 py-1.5 text-xs text-[oklch(0.45_0.04_60)] backdrop-blur md:flex">
            <Sparkles className="h-3.5 w-3.5" />
            Press ⌘N to add a task
          </div>
        </div>

        <header className="mb-10 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-[DM_Serif_Display,serif] text-5xl leading-[1.05] tracking-tight md:text-7xl">
              Today, <span className="italic text-[oklch(0.55_0.18_30)]">gently</span>
              <br /> done.
            </h1>
            <p className="mt-4 max-w-md text-[oklch(0.42_0.03_60)]">
              {tasks.length} tasks in flight · {completionPct}% complete. A small, deliberate list beats a loud one.
            </p>
          </div>

          <button
            onClick={openCreate}
            className="group inline-flex items-center gap-2 self-start rounded-full bg-[oklch(0.22_0.04_60)] px-5 py-3 text-sm font-medium text-[oklch(0.97_0.012_85)] shadow-[0_10px_30px_-10px_oklch(0.22_0.04_60/0.5)] transition-all hover:translate-y-[-1px] hover:bg-[oklch(0.28_0.06_30)] active:translate-y-0"
          >
            <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
            New task
          </button>
        </header>

        <div className="mb-10 overflow-hidden rounded-2xl border border-[oklch(0.9_0.02_85)] bg-white/70 p-5 backdrop-blur">
          <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-widest text-[oklch(0.45_0.04_60)]">
            <span>Progress</span>
            <span className="font-[DM_Serif_Display,serif] text-2xl normal-case tracking-normal text-[oklch(0.18_0.02_60)]">
              {completionPct}%
            </span>
          </div>
          <div className="relative h-2 overflow-hidden rounded-full bg-[oklch(0.94_0.015_85)]">
            <div
              className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${completionPct}%`,
                background: "linear-gradient(90deg, oklch(0.55 0.18 30), oklch(0.7 0.16 60))",
              }}
            />
          </div>
        </div>

        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[oklch(0.55_0.04_60)]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title or note…"
              className="w-full rounded-full border border-[oklch(0.9_0.02_85)] bg-white/80 py-3 pl-11 pr-4 text-sm outline-none transition-all placeholder:text-[oklch(0.6_0.03_60)] focus:border-[oklch(0.55_0.18_30)] focus:bg-white focus:shadow-[0_0_0_4px_oklch(0.55_0.18_30/0.1)]"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => {
              const active = filter === f;
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`group inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium uppercase tracking-wider transition-all ${
                    active
                      ? "border-[oklch(0.22_0.04_60)] bg-[oklch(0.22_0.04_60)] text-[oklch(0.97_0.012_85)]"
                      : "border-[oklch(0.9_0.02_85)] bg-white/60 text-[oklch(0.4_0.03_60)] hover:border-[oklch(0.78_0.04_60)] hover:bg-white"
                  }`}
                >
                  {f === "all" ? "All" : STATUS[f as Status].label}
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                      active ? "bg-white/15 text-white" : "bg-[oklch(0.94_0.015_85)] text-[oklch(0.4_0.03_60)]"
                    }`}
                  >
                    {counts[f]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-[oklch(0.55_0.04_60)]">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="mt-2 text-sm">Loading tasks…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[oklch(0.85_0.02_85)] bg-white/50 px-6 py-20 text-center">
            <ListTodo className="mx-auto mb-4 h-8 w-8 text-[oklch(0.6_0.04_60)]" />
            <p className="font-[DM_Serif_Display,serif] text-2xl">Nothing here yet.</p>
            <p className="mt-1 text-sm text-[oklch(0.5_0.03_60)]">
              Add your first task — or change the filter.
            </p>
          </div>
        ) : (
          <ul className="grid gap-3">
            {filtered.map((task, i) => {
              const cfg = STATUS[task.status];
              const done = task.status === "completed";
              return (
                <li
                  key={task._id}
                  className="group relative overflow-hidden rounded-2xl border border-[oklch(0.92_0.015_85)] bg-white/85 p-5 backdrop-blur transition-all hover:-translate-y-0.5 hover:border-[oklch(0.85_0.04_60)] hover:shadow-[0_18px_40px_-22px_oklch(0.22_0.04_60/0.35)]"
                  style={{ animation: `slideUp 0.4s ease ${i * 40}ms backwards` }}
                >
                  <span aria-hidden className={`absolute inset-y-0 left-0 w-1 ${cfg.dot} opacity-80`} />
                  <div className="flex items-start gap-4 pl-2">
                    <button
                      onClick={() => toggleStatus(task)}
                      className="mt-1 shrink-0 text-[oklch(0.55_0.04_60)] transition-colors hover:text-[oklch(0.55_0.18_30)]"
                      aria-label="Toggle complete"
                    >
                      {done ? (
                        <CheckCircle2 className="h-5 w-5 text-[oklch(0.62_0.14_155)]" />
                      ) : (
                        <Circle className="h-5 w-5" />
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className={`font-[DM_Serif_Display,serif] text-xl leading-snug ${done ? "text-[oklch(0.55_0.03_60)] line-through" : ""}`}>
                          {task.title}
                        </h3>
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${cfg.chip}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </span>
                      </div>
                      {task.description && (
                        <p className="mt-1 text-sm text-[oklch(0.45_0.03_60)]">{task.description}</p>
                      )}
                      {task.dueDate && (
                        <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-[oklch(0.5_0.04_60)]">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(task.dueDate).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={() => openEdit(task)}
                        className="rounded-full p-2 text-[oklch(0.4_0.03_60)] transition-colors hover:bg-[oklch(0.95_0.015_85)] hover:text-[oklch(0.22_0.04_60)]"
                        aria-label="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(task._id)}
                        className="rounded-full p-2 text-[oklch(0.4_0.03_60)] transition-colors hover:bg-[oklch(0.95_0.04_25)] hover:text-[oklch(0.5_0.2_25)]"
                        aria-label="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <footer className="mt-16 border-t border-[oklch(0.9_0.02_85)] pt-6 text-center text-xs uppercase tracking-widest text-[oklch(0.55_0.04_60)]">
          Made slowly · Atelier
        </footer>
      </div>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-[oklch(0.18_0.02_60/0.5)] p-4 backdrop-blur-sm md:items-center"
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
          style={{ animation: "fadeIn 0.18s ease" }}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-3xl border border-[oklch(0.92_0.015_85)] bg-[oklch(0.98_0.008_85)] shadow-2xl"
            style={{ animation: "slideUp 0.24s ease" }}
          >
            <div className="flex items-center justify-between border-b border-[oklch(0.92_0.015_85)] px-6 py-4">
              <h2 className="font-[DM_Serif_Display,serif] text-2xl">
                {editTask ? "Edit task" : "New task"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-full p-1.5 text-[oklch(0.45_0.03_60)] transition-colors hover:bg-[oklch(0.94_0.015_85)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-6">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[oklch(0.45_0.03_60)]">
                  Title
                </label>
                <input
                  autoFocus
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="What needs doing?"
                  className="w-full rounded-xl border border-[oklch(0.9_0.02_85)] bg-white px-4 py-3 text-sm outline-none transition-all focus:border-[oklch(0.55_0.18_30)] focus:shadow-[0_0_0_4px_oklch(0.55_0.18_30/0.1)]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[oklch(0.45_0.03_60)]">
                  Notes
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="A few words of context…"
                  className="w-full resize-none rounded-xl border border-[oklch(0.9_0.02_85)] bg-white px-4 py-3 text-sm outline-none transition-all focus:border-[oklch(0.55_0.18_30)] focus:shadow-[0_0_0_4px_oklch(0.55_0.18_30/0.1)]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[oklch(0.45_0.03_60)]">
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as Status })}
                    className="w-full rounded-xl border border-[oklch(0.9_0.02_85)] bg-white px-4 py-3 text-sm outline-none transition-all focus:border-[oklch(0.55_0.18_30)]"
                  >
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[oklch(0.45_0.03_60)]">
                    Due
                  </label>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                    className="w-full rounded-xl border border-[oklch(0.9_0.02_85)] bg-white px-4 py-3 text-sm outline-none transition-all focus:border-[oklch(0.55_0.18_30)]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-full px-5 py-2.5 text-sm font-medium text-[oklch(0.4_0.03_60)] transition-colors hover:bg-[oklch(0.94_0.015_85)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-full bg-[oklch(0.22_0.04_60)] px-6 py-2.5 text-sm font-medium text-[oklch(0.97_0.012_85)] shadow-[0_10px_30px_-10px_oklch(0.22_0.04_60/0.6)] transition-all hover:translate-y-[-1px] hover:bg-[oklch(0.28_0.06_30)]"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {editTask ? "Save changes" : "Create task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2" style={{ animation: "slideUp 0.25s ease" }}>
          <div className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm text-white shadow-2xl ${toast.tone === "ok" ? "bg-[oklch(0.35_0.1_155)]" : "bg-[oklch(0.42_0.16_25)]"}`}>
            {toast.tone === "ok" ? <CheckCircle2 className="h-4 w-4" /> : <Loader2 className="h-4 w-4" />}
            {toast.msg}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(12px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
      `}</style>
    </div>
  );
}