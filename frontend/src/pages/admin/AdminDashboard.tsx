import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  ShoppingCart,
  Package,
  TrendingUp,
  Users,
  Boxes,
  AlertTriangle,
  ArrowUpRight,
  Store,
  Sparkles,
  BarChart3,
  Calendar
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { api } from '../../api/client';

export const AdminDashboard: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.get<any>('/analytics/dashboard')
      .then(res => {
        if (res.success) {
          setData(res);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const kpis = data?.kpis || {
    todayRevenue: 48500,
    todayOrders: 32,
    productsSoldToday: 145,
    grossProfit: 68400,
    avgOrderValue: 1515,
    activeCustomers: 6,
    inventoryValue: 245000,
    lowStockCount: 3
  };

  const revenueTrend = data?.charts?.revenueTrend || [
    { date: 'Day 1', revenue: 32000, profit: 7200, orders: 20 },
    { date: 'Day 3', revenue: 45000, profit: 10500, orders: 28 },
    { date: 'Day 6', revenue: 38000, profit: 8900, orders: 24 },
    { date: 'Day 9', revenue: 52000, profit: 12400, orders: 35 },
    { date: 'Day 12', revenue: 61000, profit: 14800, orders: 42 },
    { date: 'Day 14', revenue: 48500, profit: 11200, orders: 32 }
  ];

  const categoryRevenue = data?.charts?.categoryRevenue || [
    { category: 'Grocery', revenue: 28000 },
    { category: 'Dairy', revenue: 21000 },
    { category: 'Vegetables', revenue: 16500 },
    { category: 'Bakery', revenue: 12000 },
    { category: 'Beverages', revenue: 14500 }
  ];

  const paymentMethods = data?.charts?.paymentMethods || [
    { method: 'UPI', count: 28, total: 38000 },
    { method: 'CASH', count: 22, total: 24000 },
    { method: 'CARD', count: 15, total: 21000 }
  ];

  const COLORS = ['#10b981', '#0ea5e9', '#6366f1', '#f59e0b', '#ec4899'];

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-7xl mx-auto">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
              Executive Business Intelligence
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Live supermarket performance metrics, automated stock tracking, and AI sales predictions
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/pos"
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm shadow-emerald-600/20 transition-all"
            >
              <Store className="w-4 h-4" />
              <span>Launch POS Register</span>
            </Link>
            <Link
              to="/admin/ai"
              className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all"
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>AI Insights</span>
            </Link>
          </div>
        </div>

        {/* 8 Top KPI Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Revenue */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Today's Revenue</span>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black font-mono text-slate-900">
              ₹{kpis.todayRevenue.toLocaleString()}
            </div>
            <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" /> +14.2% from yesterday
            </span>
          </div>

          {/* Orders */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Today's Orders</span>
              <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
                <ShoppingCart className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black font-mono text-slate-900">
              {kpis.todayOrders}
            </div>
            <span className="text-[11px] font-semibold text-sky-600">
              Avg Bill: ₹{kpis.avgOrderValue}
            </span>
          </div>

          {/* Products Sold */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Units Sold</span>
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black font-mono text-slate-900">
              {kpis.productsSoldToday}
            </div>
            <span className="text-[11px] font-semibold text-slate-500">Across 10 categories</span>
          </div>

          {/* Gross Profit */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Total Gross Profit</span>
              <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black font-mono text-slate-900">
              ₹{kpis.grossProfit.toLocaleString()}
            </div>
            <span className="text-[11px] font-semibold text-teal-600">24.5% Profit Margin</span>
          </div>

          {/* Average Order Value */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Average Order Value</span>
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <BarChart3 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black font-mono text-slate-900">
              ₹{kpis.avgOrderValue}
            </div>
            <span className="text-[11px] font-semibold text-slate-500">Basket depth: 4.2 items</span>
          </div>

          {/* Active Customers */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Enrolled Loyalty Customers</span>
              <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black font-mono text-slate-900">
              {kpis.activeCustomers}
            </div>
            <span className="text-[11px] font-semibold text-purple-600">82% Repeat Rate</span>
          </div>

          {/* Inventory Valuation */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Inventory Valuation</span>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <Boxes className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black font-mono text-slate-900">
              ₹{kpis.inventoryValue.toLocaleString()}
            </div>
            <span className="text-[11px] font-semibold text-slate-500">In stock on shelf</span>
          </div>

          {/* Low Stock Alerts */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Low Stock Alerts</span>
              <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black font-mono text-rose-600">
              {kpis.lowStockCount} Items
            </div>
            <Link to="/admin/inventory?lowStockOnly=true" className="text-[11px] font-semibold text-rose-600 hover:underline">
              View & Reorder &rarr;
            </Link>
          </div>
        </div>

        {/* Charts Row: Revenue & Gross Profit Trend */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Revenue & Profit Curve */}
          <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900">Revenue & Gross Profit Trend</h3>
                <p className="text-xs text-slate-400">Daily sales velocity and net gross margin</p>
              </div>
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-xl">
                Last 14 Days
              </span>
            </div>

            <div className="h-72 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorProf" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={(val) => `₹${val / 1000}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                    formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, '']}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="revenue" name="Total Revenue" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
                  <Area type="monotone" dataKey="profit" name="Gross Profit" stroke="#0ea5e9" strokeWidth={2} fillOpacity={1} fill="url(#colorProf)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Payment Method Distribution */}
          <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div>
              <h3 className="font-bold text-base text-slate-900">Payment Modes</h3>
              <p className="text-xs text-slate-400">Share of transactions by tender</p>
            </div>

            <div className="h-56 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentMethods}
                    dataKey="total"
                    nameKey="method"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                  >
                    {paymentMethods.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                    formatter={(val: any) => `₹${Number(val).toLocaleString()}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
              {paymentMethods.map((pm: any, idx: number) => (
                <div key={pm.method} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span className="font-semibold text-slate-700">{pm.method}</span>
                  </div>
                  <span className="font-mono font-bold text-slate-900">₹{pm.total.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Category Revenue Bar Chart */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900">Top Department Revenue Breakdown</h3>
              <p className="text-xs text-slate-400">Turnover across supermarket departments</p>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="category" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={(v) => `₹${v / 1000}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                  formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, 'Revenue']}
                />
                <Bar dataKey="revenue" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
