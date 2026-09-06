import React, { useState } from 'react';
import { User, Phone, Mail, MapPin, Award, Shield, LogOut, Check } from 'lucide-react';
import { CustomerLayout } from '../../components/layout/CustomerLayout';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';

export const CustomerProfile: React.FC = () => {
  const { user, switchRole, logout } = useAuth();
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <CustomerLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Your Account Profile</h1>
          <p className="text-xs text-slate-500 mt-1">Manage personal details, addresses, and account security</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* User Info Card */}
          <div className="md:col-span-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm text-center space-y-4">
            <div className="w-20 h-20 rounded-2xl bg-emerald-100 text-emerald-700 font-extrabold text-2xl flex items-center justify-center mx-auto shadow-inner">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">{user?.name || 'Customer'}</h3>
              <p className="text-xs text-slate-400">{user?.email || 'customer@gmail.com'}</p>
              <span className="inline-block bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full mt-2">
                Active Role: {user?.role || 'CUSTOMER'}
              </span>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-2 text-xs text-left text-slate-600">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                <span>Loyalty Club: <strong>Gold Member</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>Default: <strong>Bengaluru, KA</strong></span>
              </div>
            </div>
          </div>

          {/* Edit Details */}
          <div className="md:col-span-8 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
            <h3 className="font-bold text-base text-slate-900">Personal Information</h3>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Full Name</label>
                  <input
                    type="text"
                    defaultValue={user?.name || 'Swetha K'}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Mobile Phone</label>
                  <input
                    type="tel"
                    defaultValue={user?.phone || '9812345678'}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Email Address</label>
                <input
                  type="email"
                  defaultValue={user?.email || 'customer@gmail.com'}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Delivery Address</label>
                <textarea
                  rows={2}
                  defaultValue="Flat 402, Green Meadows Residency, Outer Ring Road, Bengaluru, 560102"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium"
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <Button variant="primary" type="submit">
                  Save Changes
                </Button>
                {saved && (
                  <span className="text-emerald-600 font-semibold flex items-center gap-1">
                    <Check className="w-4 h-4" /> Profile updated
                  </span>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
};
