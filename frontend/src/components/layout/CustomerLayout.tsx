import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ShoppingBag,
  ShoppingCart,
  Search,
  Award,
  User,
  Menu,
  X,
  Store,
  ChevronDown,
  Sparkles,
  Phone,
  Clock,
  LogOut,
  SlidersHorizontal
} from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';

export const CustomerLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { itemCount, grandTotal } = useCart();
  const { user, switchRole, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'All Products', path: '/shop' },
    { label: 'Categories', path: '/categories' },
    { label: 'Offers & Deals', path: '/shop?deals=true' },
    { label: 'My Orders', path: '/orders' },
    { label: 'Loyalty Rewards', path: '/loyalty' }
  ];

  const roles: UserRole[] = ['CUSTOMER', 'CASHIER', 'MANAGER', 'ADMIN', 'INVENTORY_STAFF'];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Top Supermarket Announcement Bar */}
      <div className="bg-emerald-800 text-emerald-100 text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-emerald-300" /> Open Today: 7:00 AM – 11:00 PM
            </span>
            <span className="hidden md:flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-emerald-300" /> Customer Support: 1800-SMARTMART
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Staff Quick Links (Visible ONLY to Staff Roles) */}
            {(user?.role === 'CASHIER' || user?.role === 'MANAGER' || user?.role === 'ADMIN') && (
              <Link to="/pos" className="hidden sm:inline-flex items-center gap-1 hover:text-white transition-colors">
                <Store className="w-3 h-3" /> Cashier POS
              </Link>
            )}
            {(user?.role === 'INVENTORY_STAFF' || user?.role === 'MANAGER' || user?.role === 'ADMIN') && (
              <Link to="/admin/dashboard" className="hidden sm:inline-flex items-center gap-1 hover:text-white transition-colors">
                <SlidersHorizontal className="w-3 h-3" /> Staff Portal
              </Link>
            )}

            {/* User Account / Sign In State */}
            {user ? (
              <div className="flex items-center gap-2">
                <span className="text-[11px] bg-emerald-900/80 text-emerald-200 px-2.5 py-0.5 rounded-full border border-emerald-700/60 font-medium">
                  {user.name} <span className="font-mono text-[10px] text-emerald-400">({user.role})</span>
                </span>
                <button
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                  className="inline-flex items-center gap-1 bg-emerald-950/80 hover:bg-rose-950 text-emerald-200 hover:text-rose-300 font-semibold px-2.5 py-0.5 rounded-full text-[11px] border border-emerald-700/60 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-3 h-3" /> Sign Out
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-1 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 font-semibold px-2.5 py-0.5 rounded-full text-[11px] border border-emerald-700/60 transition-colors"
              >
                <User className="w-3 h-3 text-emerald-300" /> Sign In / Demo
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main E-Commerce Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18 py-3 gap-4">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 shrink-0">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/30">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xl font-extrabold tracking-tight text-slate-900">
                  SMART<span className="text-emerald-600">MART</span>
                </span>
                <span className="hidden sm:block text-[9px] font-bold uppercase tracking-widest text-slate-400">
                  Supermarket & Fresh
                </span>
              </div>
            </Link>

            {/* Search Bar */}
            <form onSubmit={handleSearchSubmit} className="flex-1 max-w-2xl relative">
              <div className="relative flex items-center">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search 1,000+ items (e.g. Milk, Tomatoes, Basmati Rice, Parle-G)..."
                  className="w-full bg-slate-100 hover:bg-slate-100/80 focus:bg-white border border-transparent focus:border-emerald-500 rounded-2xl pl-10 pr-20 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20 placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors shadow-sm"
                >
                  Search
                </button>
              </div>
            </form>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
              {/* Customer Loyalty Points */}
              <Link
                to="/loyalty"
                className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200/80 rounded-2xl text-amber-900 hover:bg-amber-100 transition-colors"
              >
                <Award className="w-4 h-4 text-amber-600" />
                <div className="text-left">
                  <p className="text-[10px] font-bold uppercase text-amber-700 leading-none">Loyalty</p>
                  <p className="text-xs font-extrabold font-mono text-amber-900">450 Pts</p>
                </div>
              </Link>

              {/* Cart Button */}
              <Link
                to="/cart"
                className="flex items-center gap-2.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-2xl shadow-sm shadow-emerald-600/20 transition-all active:scale-95"
              >
                <div className="relative">
                  <ShoppingCart className="w-5 h-5" />
                  {itemCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
                      {itemCount}
                    </span>
                  )}
                </div>
                <div className="hidden sm:block text-left leading-tight">
                  <span className="text-[10px] text-emerald-200 block font-medium">Cart Total</span>
                  <span className="text-xs font-bold font-mono">₹{grandTotal.toFixed(2)}</span>
                </div>
              </Link>

              {/* Profile / Login Link */}
              <Link
                to="/login"
                className="flex items-center gap-1.5 px-3 py-2 text-slate-700 hover:text-emerald-700 hover:bg-slate-100 rounded-2xl transition-colors text-xs font-semibold"
                title="Account Login & Demo Personas"
              >
                <User className="w-4 h-4 text-emerald-600" />
                <span className="hidden sm:inline">Sign In</span>
              </Link>
            </div>
          </div>

          {/* Sub Navigation */}
          <nav className="hidden md:flex items-center gap-6 py-2 border-t border-slate-100 text-xs font-semibold text-slate-600">
            {navLinks.map(link => (
              <Link
                key={link.path}
                to={link.path}
                className={`hover:text-emerald-600 transition-colors py-1 ${
                  location.pathname === link.path ? 'text-emerald-600 border-b-2 border-emerald-600' : ''
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Page Body */}
      <main className="flex-1 pb-16">{children}</main>

      {/* Customer Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-10 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 text-white text-base font-bold mb-3">
              <ShoppingBag className="w-5 h-5 text-emerald-500" />
              <span>SMARTMART</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed mb-4">
              Real-time omnichannel supermarket with automated checkout, smart weighing, and fresh farm deliveries.
            </p>
            <p className="text-[11px] text-slate-500">© 2026 SmartMart Technologies Inc. All rights reserved.</p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3">Departments</h4>
            <ul className="space-y-1.5">
              <li><Link to="/shop?category=cat-veg" className="hover:text-emerald-400">Fresh Farm Vegetables</Link></li>
              <li><Link to="/shop?category=cat-frt" className="hover:text-emerald-400">Seasonal Fruits</Link></li>
              <li><Link to="/shop?category=cat-dry" className="hover:text-emerald-400">Dairy, Butter & Eggs</Link></li>
              <li><Link to="/shop?category=cat-gro" className="hover:text-emerald-400">Staples, Rice & Flours</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3">Quick Navigation</h4>
            <ul className="space-y-1.5">
              <li><Link to="/pos" className="hover:text-emerald-400">Cashier POS Interface</Link></li>
              <li><Link to="/customer-display" className="hover:text-emerald-400">Customer Facing Dual Display</Link></li>
              <li><Link to="/admin/dashboard" className="hover:text-emerald-400">Admin Intelligence Portal</Link></li>
              <li><Link to="/loyalty" className="hover:text-emerald-400">Customer Loyalty Rewards</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3">Store Location</h4>
            <p className="text-slate-400 leading-relaxed mb-2">
              100 Metro Hypermarket Boulevard, Central Hub, Bengaluru, KA 560102
            </p>
            <p className="text-slate-400">Toll Free: 1800-SMARTMART</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
