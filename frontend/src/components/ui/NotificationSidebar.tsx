import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { Bell, X } from "lucide-react";

interface Notification {
  id: string;
  message: string;
  createdAt: string;
}

// Replace with your live backend deployment URL once deployed
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export default function NotificationSidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // 1. Fetch past notifications from GET /notifications
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/notifications`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    })
      .then((res) => res.json())
      .then((data) => setNotifications(data))
      .catch((err) => console.error("Error fetching notifications:", err));
  }, []);

  // 2. Listen for real-time notifications via WebSockets
  useEffect(() => {
    const socket = io(BACKEND_URL, {
      auth: { token: localStorage.getItem("token") }
    });

    socket.on("notification", (newNotification: Notification) => {
      setNotifications((prev) => [newNotification, ...prev]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-white dark:bg-gray-900 shadow-2xl p-4 z-50 border-l border-gray-200 dark:border-gray-800 transition-colors duration-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
          <Bell className="w-5 h-5 text-blue-500" /> Notifications
        </h2>
        <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-3 overflow-y-auto h-[calc(100%-4rem)]">
        {notifications.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-sm text-center mt-10">No notifications yet.</p>
        ) : (
          notifications.map((notif) => (
            <div key={notif.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 text-sm">
              <p className="text-gray-800 dark:text-gray-200">{notif.message}</p>
              <span className="text-xs text-gray-400 block mt-1">
                {new Date(notif.createdAt).toLocaleTimeString()}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}