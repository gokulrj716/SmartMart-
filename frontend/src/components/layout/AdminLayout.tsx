import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Store,
  Package,
  Boxes,
  Truck,
  Building2,
  ReceiptText,
  RotateCcw,
  Users,
  Wallet,
  TrendingUp,
  LineChart,
  BarChart3,
  BrainCircuit,
  Wrench,
  ShieldCheck,
  Settings,
  Bell,
  Search,
  LogOut,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { UserRole } from '../../types';

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout, switchRole } = useAuth();
  const { notifications, clearNotification } = useSocket();
  const location = useLocation();
  const navigate = useNavigate();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  const userRole = user?.role || 'ADMIN';

  const navGroups = [
    {
      title: 'CORE PLATFORM',
      allowedRoles: ['ADMIN', 'MANAGER'],
      items: [
        { label: 'Executive Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
        { label: 'Cashier POS Terminal', path: '/pos', icon: <Store className="w-4 h-4" /> }
      ]
    },
    {
      title: 'INVENTORY & SUPPLY',
      allowedRoles: ['ADMIN', 'MANAGER', 'INVENTORY_STAFF'],
      items: [
        { label: 'Product Catalog', path: '/admin/products', icon: <Package className="w-4 h-4" /> },
        { label: 'Inventory & Batches', path: '/admin/inventory', icon: <Boxes className="w-4 h-4" /> },
        { label: 'Purchase Orders', path: '/admin/purchases', icon: <Truck className="w-4 h-4" /> },
        { label: 'Supplier Directory', path: '/admin/suppliers', icon: <Building2 className="w-4 h-4" /> }
      ]
    },
    {
      title: 'SALES & CUSTOMERS',
      allowedRoles: ['ADMIN', 'MANAGER'],
      items: [
        { label: 'Sales Transactions', path: '/admin/sales', icon: <ReceiptText className="w-4 h-4" /> },
        { label: 'Returns & Refunds', path: '/admin/returns', icon: <RotateCcw className="w-4 h-4" /> },
        { label: 'Customer Loyalty', path: '/admin/customers', icon: <Users className="w-4 h-4" /> },
        { label: 'Cashier Sessions', path: '/admin/sessions', icon: <Wallet className="w-4 h-4" /> }
      ]
    },
    {
      title: 'BUSINESS ANALYTICS',
      allowedRoles: ['ADMIN', 'MANAGER', 'INVENTORY_STAFF'],
      items: [
        ...(userRole === 'ADMIN' || userRole === 'MANAGER'
          ? [
              { label: 'Product Analytics', path: '/admin/analytics/products', icon: <TrendingUp className="w-4 h-4" /> },
              { label: 'Business P&L', path: '/admin/analytics/business', icon: <BarChart3 className="w-4 h-4" /> },
              { label: 'Customer RFM Matrix', path: '/admin/analytics/customers', icon: <LineChart className="w-4 h-4" /> }
            ]
          : []),
        { label: 'Inventory Turnover', path: '/admin/analytics/inventory', icon: <Boxes className="w-4 h-4" /> }
      ]
    },
    {
      title: 'AI & INTELLIGENCE',
      allowedRoles: ['ADMIN'],
      items: [
        { label: 'AI Insights Suite', path: '/admin/ai', icon: <BrainCircuit className="w-4 h-4 text-emerald-500" /> }
      ]
    },
    {
      title: 'SYSTEM & SECURITY',
      allowedRoles: ['ADMIN'],
      items: [
        { label: 'Staff & Role Management', path: '/admin/users', icon: <Users className="w-4 h-4 text-emerald-400" /> },
        { label: 'Hardware Diagnostics', path: '/admin/hardware', icon: <Wrench className="w-4 h-4" /> },
        { label: 'Security Audit Logs', path: '/admin/audit-logs', icon: <ShieldCheck className="w-4 h-4" /> },
        { label: 'System Settings', path: '/admin/settings', icon: <Settings className="w-4 h-4" /> }
      ]
    }
  ].filter(group => group.allowedRoles.includes(userRole));

  return (
    <div className="min-h-screen flex bg-slate-100/70 text-slate-800">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-slate-950 text-slate-300 border-r border-slate-800 shrink-0">
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800/80">
          <Link to="/admin/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center text-slate-950 font-black">
              SM
            </div>
            <span className="font-extrabold text-white text-base tracking-tight">
              SMART<span className="text-emerald-400">MART</span>
            </span>
          </Link>
        </div>

        {/* Live Store Status Pill */}
        <div className="px-5 py-3 border-b border-slate-800/60 bg-slate-900/40">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Live Store Active
            </span>
            <span className="text-[10px] text-slate-500 font-mono">POS 1-6 Online</span>
          </div>
        </div>

        {/* Navigation Links Scrollable */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-6">
          {navGroups.map((group, idx) => (
            <div key={idx} className="space-y-1">
              <span className="text-[10px] font-extrabold tracking-wider text-slate-500 uppercase px-3 block mb-1.5">
                {group.title}
              </span>
              {group.items.map(item => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User Footer Profile */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-emerald-400 shrink-0">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-white truncate">{user?.name || 'Administrator'}</p>
              <p className="text-[10px] text-emerald-400 font-medium capitalize">{user?.role || 'ADMIN'}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Link to="/" title="Exit to Customer App" className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
              <Store className="w-4 h-4" />
            </Link>
            <Link to="/login" title="Login / Switch Persona" className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors">
              <LogOut className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:block">
              <h2 className="text-base font-bold text-slate-900 capitalize">
                {location.pathname.split('/').filter(Boolean).pop()?.replace(/-/g, ' ') || 'Dashboard'}
              </h2>
              <span className="text-[11px] text-slate-400">SMARTMART Real-Time Supermarket Management</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Authenticated Staff Role Indicator */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-800 font-semibold px-3 py-1.5 rounded-xl text-xs border border-slate-200">
                <span>Role: <strong className="text-emerald-700 uppercase font-mono">{user?.role || 'STAFF'}</strong></span>
              </span>
              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="inline-flex items-center gap-1 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 font-semibold px-3 py-1.5 rounded-xl text-xs border border-slate-200 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>

            {/* Notifications Button */}
            <div className="relative">
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors relative"
              >
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white animate-pulse" />
                )}
              </button>

              {/* Notification Drawer */}
              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <span className="font-bold text-xs text-slate-900">Real-Time Alerts</span>
                    <span className="text-[10px] text-slate-500">{notifications.length} unread</span>
                  </div>
                  <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-6">No new alerts</p>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className="py-2.5 flex items-start justify-between gap-2">
                          <div>
                            <p className="text-xs font-semibold text-slate-800">{n.title}</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">{n.message}</p>
                            <span className="text-[9px] text-slate-400 font-mono mt-1 block">{n.timestamp}</span>
                          </div>
                          <button
                            onClick={() => clearNotification(n.id)}
                            className="text-slate-400 hover:text-slate-600 text-[10px] p-1"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Quick POS Terminal Button (Manager & Admin only) */}
            {(userRole === 'ADMIN' || userRole === 'MANAGER') && (
              <Link
                to="/pos"
                className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition-all shadow-sm shadow-emerald-600/20"
              >
                <Store className="w-4 h-4" />
                <span>Open POS</span>
              </Link>
            )}
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};
