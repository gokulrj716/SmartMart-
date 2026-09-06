import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, Store, SlidersHorizontal, LogOut, ShoppingBag } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';
import { Button } from '../../components/ui/Button';

interface AccessDeniedPageProps {
  requiredRoles?: UserRole[];
}

export const AccessDeniedPage: React.FC<AccessDeniedPageProps> = ({ requiredRoles = [] }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const getRoleHome = (role?: UserRole): string => {
    switch (role) {
      case 'CASHIER':
        return '/pos';
      case 'ADMIN':
      case 'MANAGER':
      case 'INVENTORY_STAFF':
        return '/admin/dashboard';
      case 'CUSTOMER':
      default:
        return '/';
    }
  };

  const getRoleHomeLabel = (role?: UserRole): string => {
    switch (role) {
      case 'CASHIER':
        return 'Return to Cashier POS';
      case 'ADMIN':
      case 'MANAGER':
      case 'INVENTORY_STAFF':
        return 'Return to Staff Portal';
      case 'CUSTOMER':
      default:
        return 'Return to Storefront';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-12 text-slate-100 select-none">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center shadow-2xl space-y-6">
        {/* Warning Icon Badge */}
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto shadow-lg shadow-rose-500/10">
          <ShieldAlert className="w-9 h-9" />
        </div>

        <div>
          <span className="text-[10px] font-mono tracking-widest uppercase bg-rose-950/60 text-rose-400 px-3 py-1 rounded-full border border-rose-800/60 inline-block mb-2">
            403 • Access Denied
          </span>
          <h1 className="text-2xl font-black text-white">Restricted Area</h1>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Your account does not possess the permissions required to access this service or dashboard.
          </p>
        </div>

        {/* Role Comparison Table */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 text-xs space-y-2 text-left">
          <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
            <span className="text-slate-400">Your Current Role:</span>
            <span className="font-bold text-emerald-400 uppercase tracking-wider font-mono">
              {user?.role || 'GUEST / UNAUTHENTICATED'}
            </span>
          </div>
          {requiredRoles.length > 0 && (
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">Authorized Roles:</span>
              <span className="font-mono text-slate-300 font-semibold text-right">
                {requiredRoles.join(' • ')}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-2">
          <Button
            variant="primary"
            className="w-full py-3 flex items-center justify-center gap-2"
            onClick={() => navigate(getRoleHome(user?.role))}
          >
            {user?.role === 'CASHIER' && <Store className="w-4 h-4" />}
            {(user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.role === 'INVENTORY_STAFF') && (
              <SlidersHorizontal className="w-4 h-4" />
            )}
            {(!user || user?.role === 'CUSTOMER') && <ShoppingBag className="w-4 h-4" />}
            <span>{getRoleHomeLabel(user?.role)}</span>
          </Button>

          <Link
            to="/login"
            onClick={() => logout()}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors border border-slate-700"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign In with Different Account</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
