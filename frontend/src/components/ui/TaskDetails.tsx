import React, { useState } from "react";
import { Share2, Check, AlertCircle } from "lucide-react";

interface Task {
  _id: string;
  title: string;
  description: string;
  status: string;
}

export default function TaskDetails({ task }: { task: Task }) {
  const [email, setEmail] = useState("");
  const [statusMsg, setStatusMsg] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setStatusMsg({ type: "", text: "" });

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}/api/tasks/${task._id}/share`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatusMsg({ type: "success", text: "Task shared successfully!" });
        setEmail("");
      } else {
        setStatusMsg({ type: "error", text: data.message || "Failed to share task." });
      }
    } catch (err) {
      setStatusMsg({ type: "error", text: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-900 rounded-xl shadow-md border border-gray-200 dark:border-gray-800 max-w-xl transition-colors duration-200">
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{task.title}</h3>
      <p className="text-gray-600 dark:text-gray-400 mb-4">{task.description}</p>
      
      <div className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 mb-6">
        Status: {task.status}
      </div>

      <hr className="border-gray-200 dark:border-gray-800 mb-6" />

      {/* Share Task Section */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <Share2 className="w-4 h-4" /> Share Task with a Team Member
        </h4>
        
        <form onSubmit={handleShare} className="flex gap-2">
          <input
            type="email"
            placeholder="enter-colleague-email@domain.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 px-3 py-2 border rounded-lg text-sm bg-gray-50 dark:bg-gray-800 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium text-sm rounded-lg transition-colors flex items-center gap-1"
          >
            {loading ? "Sharing..." : "Share"}
          </button>
        </form>

        {statusMsg.text && (
          <div className={`flex items-center gap-2 text-xs font-medium p-2.5 rounded-lg ${
            statusMsg.type === "success" ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400"
          }`}>
            {statusMsg.type === "success" ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {statusMsg.text}
          </div>
        )}
      </div>
    </div>
  );
}