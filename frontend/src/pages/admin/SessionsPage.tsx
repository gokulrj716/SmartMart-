import React, { useState, useEffect } from 'react';
import { Wallet, Check, AlertCircle, Clock } from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { api } from '../../api/client';

export const SessionsPage: React.FC = () => {
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    // We can fetch audit logs or recent sessions
    api.get<any>('/audit-logs?action=CASHIER_SESSION_CLOSE')
      .then(res => {
        if (res.success) setSessions(res.data);
      })
      .catch(() => {});
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Cashier Register Shift Sessions</h1>
          <p className="text-xs text-slate-500 mt-1">Audit register drawer shifts, opening floats, expected cash, and cash variances</p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-mono uppercase text-[11px]">
                <tr>
                  <th className="p-4">TIMESTAMP</th>
                  <th className="p-4">CASHIER</th>
                  <th className="p-4">REGISTER ID</th>
                  <th className="p-4">SHIFT AUDIT RECORD</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sessions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-400">
                      All cashier registers currently active and operating.
                    </td>
                  </tr>
                ) : (
                  sessions.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/80">
                      <td className="p-4 font-mono text-slate-500">{new Date(s.created_at).toLocaleString()}</td>
                      <td className="p-4 font-bold text-slate-900">{s.user_name}</td>
                      <td className="p-4 font-mono text-slate-600">{s.device_info || 'POS-01'}</td>
                      <td className="p-4 font-mono text-slate-700">{s.new_values}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
