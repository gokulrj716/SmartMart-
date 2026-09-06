import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Store,
  Wifi,
  WifiOff,
  Scale,
  Printer,
  ScanBarcode,
  Tv2,
  Wallet,
  RotateCcw,
  SlidersHorizontal,
  LogOut,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useOffline } from '../../contexts/OfflineContext';

export interface PosLayoutProps {
  children: React.ReactNode;
  onOpenSessionModal?: () => void;
  onOpenReturnModal?: () => void;
}

export const PosLayout: React.FC<PosLayoutProps> = ({
  children,
  onOpenSessionModal,
  onOpenReturnModal
}) => {
  const { user } = useAuth();
  const { isOnline, queuedCount, syncNow, isSyncing } = useOffline();
  const navigate = useNavigate();

  return (
    <div className="h-screen flex flex-col bg-slate-900 text-slate-100 overflow-hidden font-sans select-none">
      {/* High-Speed Cashier Header */}
      <header className="h-14 bg-slate-950 border-b border-slate-800 px-4 flex items-center justify-between shrink-0">
        {/* Left: Terminal & Cashier Info */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center text-slate-950 font-black text-sm">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold text-white text-sm tracking-tight">
                SMARTMART <span className="text-emerald-400">POS</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono block leading-tight">
                Terminal: <strong>POS-01</strong>
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2 pl-4 border-l border-slate-800 text-xs text-slate-400">
            <span>Cashier: <strong className="text-slate-200">{user?.name || 'Rahul Verma'}</strong></span>
          </div>
        </div>

        {/* Center: Live Hardware Status Indicators */}
        <div className="hidden lg:flex items-center gap-3 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800 text-[11px] font-mono">
          <span className="flex items-center gap-1 text-emerald-400">
            <ScanBarcode className="w-3.5 h-3.5" /> Scanner
          </span>
          <span className="text-slate-700">•</span>
          <span className="flex items-center gap-1 text-emerald-400">
            <Scale className="w-3.5 h-3.5" /> Scale (COM3)
          </span>
          <span className="text-slate-700">•</span>
          <span className="flex items-center gap-1 text-emerald-400">
            <Printer className="w-3.5 h-3.5" /> 80mm ESC/POS
          </span>
        </div>

        {/* Right: Network Status, Dual Display & Shift Actions */}
        <div className="flex items-center gap-2.5">
          {/* Online / Offline Sync Indicator */}
          {isOnline ? (
            <div className="flex items-center gap-1.5 bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 px-2.5 py-1 rounded-xl text-xs font-mono font-semibold">
              <Wifi className="w-3.5 h-3.5" />
              <span>ONLINE</span>
            </div>
          ) : (
            <button
              onClick={() => syncNow()}
              disabled={isSyncing}
              className="flex items-center gap-1.5 bg-amber-950/80 text-amber-400 border border-amber-800/80 px-2.5 py-1 rounded-xl text-xs font-mono font-semibold animate-pulse"
            >
              <WifiOff className="w-3.5 h-3.5" />
              <span>OFFLINE ({queuedCount} Queued)</span>
            </button>
          )}

          {/* Customer Facing Display Launcher */}
          <button
            onClick={() => window.open('/customer-display', 'CustomerDisplay', 'width=1024,height=768')}
            title="Open Customer-Facing Dual Screen Display"
            className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1.5 rounded-xl text-xs font-medium border border-slate-700 transition-colors"
          >
            <Tv2 className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Customer Display</span>
          </button>

          {/* Cash Register Shift Open/Close */}
          <button
            onClick={onOpenSessionModal}
            className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1.5 rounded-xl text-xs font-medium border border-slate-700 transition-colors"
          >
            <Wallet className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Register Shift</span>
          </button>

          {/* Returns & Refunds */}
          <button
            onClick={onOpenReturnModal}
            className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1.5 rounded-xl text-xs font-medium border border-slate-700 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">Refunds</span>
          </button>

          {/* Exit to Admin */}
          <Link
            to="/admin/dashboard"
            title="Admin Dashboard"
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </Link>

          {/* Switch User / Login */}
          <Link
            to="/login"
            title="Switch User / Login Portal"
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-rose-300 rounded-xl border border-slate-700 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* Main Viewport */}
      <main className="flex-1 min-h-0 bg-slate-900">{children}</main>

      {/* Keyboard Shortcuts Bottom Helper Bar */}
      <footer className="h-7 bg-slate-950 border-t border-slate-800 px-4 flex items-center justify-between text-[11px] text-slate-400 font-mono shrink-0">
        <div className="flex items-center gap-4">
          <span><kbd className="bg-slate-800 px-1 py-0.5 rounded text-white">[F2]</kbd> Search</span>
          <span><kbd className="bg-slate-800 px-1 py-0.5 rounded text-white">[F4]</kbd> Customer</span>
          <span><kbd className="bg-slate-800 px-1 py-0.5 rounded text-white">[F8]</kbd> Checkout</span>
          <span><kbd className="bg-slate-800 px-1 py-0.5 rounded text-white">[ESC]</kbd> Clear</span>
        </div>
        <div className="text-slate-500">
          SmartMart POS Core Engine v2.4 (Idempotent & Transaction-Safe)
        </div>
      </footer>
    </div>
  );
};
