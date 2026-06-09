import React, { useEffect, useState } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";

interface OverviewData {
  total: number;
  completed: number;
  pending: number;
  inProgress: number;
}

interface TrendData {
  name: string; // e.g., "Week 1", "Jan"
  completed: number;
  overdue: number;
}

export default function AnalyticsDashboard() {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem("token");
        const base_url = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

        const [overviewRes, trendsRes] = await Promise.all([
          fetch(`${base_url}/api/analytics/overview`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${base_url}/api/analytics/trends`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        const overviewData = await overviewRes.json();
        const trendsData = await trendsRes.json();

        setOverview(overviewData);
        setTrends(trendsData);
      } catch (err) {
        console.error("Error loading analytics data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) return <div className="p-8 text-center dark:text-white">Loading Dashboard Metrics...</div>;

  // Formatting data for the Pie Chart status breakdown
  const pieData = [
    { name: "Pending", value: overview?.pending || 0 },
    { name: "In Progress", value: overview?.inProgress || 0 },
    { name: "Completed", value: overview?.completed || 0 },
  ];

  const COLORS = ["#f59e0b", "#3b82f6", "#10b981"];

  return (
    <div className="p-6 space-y-8 bg-gray-50 dark:bg-gray-950 min-h-screen transition-colors duration-200">
      <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h2>

      {/* Summary Scorecards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-5 bg-white dark:bg-gray-900 rounded-xl shadow border border-gray-100 dark:border-gray-800">
          <p className="text-sm font-medium text-gray-500">Total Tasks</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{overview?.total}</p>
        </div>
        <div className="p-5 bg-white dark:bg-gray-900 rounded-xl shadow border border-gray-100 dark:border-gray-800">
          <p className="text-sm font-medium text-amber-500">Pending</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{overview?.pending}</p>
        </div>
        <div className="p-5 bg-white dark:bg-gray-900 rounded-xl shadow border border-gray-100 dark:border-gray-800">
          <p className="text-sm font-medium text-blue-500">In Progress</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{overview?.inProgress}</p>
        </div>
        <div className="p-5 bg-white dark:bg-gray-900 rounded-xl shadow border border-gray-100 dark:border-gray-800">
          <p className="text-sm font-medium text-emerald-500">Completed</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{overview?.completed}</p>
        </div>
      </div>

      {/* Charts Visualization Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Status Breakdown Pie Chart */}
        <div className="p-6 bg-white dark:bg-gray-900 rounded-xl shadow border border-gray-100 dark:border-gray-800 flex flex-col items-center">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 self-start">Status Breakdown</h3>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly/Monthly Performance Trends Bar Chart */}
        <div className="p-6 bg-white dark:bg-gray-900 rounded-xl shadow border border-gray-100 dark:border-gray-800">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Performance Trends</h3>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trends}>
                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="completed" fill="#10b981" radius={[4, 4, 0, 0]} name="Completed" />
                <Bar dataKey="overdue" fill="#ef4444" radius={[4, 4, 0, 0]} name="Overdue" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}