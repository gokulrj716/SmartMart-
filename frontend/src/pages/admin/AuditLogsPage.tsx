import React, { useState, useEffect } from 'react';
import { ShieldCheck, Search, Filter, Calendar } from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { api } from '../../api/client';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [actionFilter, setActionFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      let url = '/audit-logs?limit=50';
      if (actionFilter) url += `&action=${actionFilter}`;
      const res = await api.get<any>(url);
      if (res.success && res.data) {
        setLogs(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Security & Financial Audit Trail</h1>
          <p className="text-xs text-slate-500 mt-1">
            Immutable log of logins, price overrides, drawer openings, inventory adjustments, and sensitive staff operations
          </p>
        </div>

        {/* Filter */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700"
          >
            <option value="">All Security Events</option>
            <option value="SALE_CHECKOUT">Sale Checkout</option>
            <option value="STOCK_ADJUSTMENT">Stock Adjustment</option>
            <option value="PROCESS_RETURN">Customer Refund</option>
            <option value="CASHIER_SESSION_OPEN">Register Open</option>
            <option value="CASHIER_SESSION_CLOSE">Register Close</option>
            <option value="USER_LOGIN">User Login</option>
          </select>

          <span className="text-xs font-mono text-slate-400">Total Entries: {logs.length}</span>
        </div>

        {/* Audit Log Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-mono uppercase text-[11px]">
                <tr>
                  <th className="p-4">TIMESTAMP</th>
                  <th className="p-4">USER / ROLE</th>
                  <th className="p-4">ACTION</th>
                  <th className="p-4">ENTITY</th>
                  <th className="p-4">DETAILS / AUDIT SNAPSHOT</th>
                  <th className="p-4 text-right">IP / DEVICE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 font-mono text-[11px]">
                    <td className="p-4 text-slate-500 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="p-4 font-bold text-slate-900">
                      {log.user_name || 'System'} ({log.user_role || 'ADMIN'})
                    </td>
                    <td className="p-4">
                      <span className="bg-slate-100 text-slate-800 font-bold px-2 py-0.5 rounded">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600">{log.entity}</td>
                    <td className="p-4 text-slate-600 truncate max-w-xs font-sans text-xs">
                      {log.new_values || log.old_values || 'N/A'}
                    </td>
                    <td className="p-4 text-right text-slate-400">
                      {log.ip_address || '127.0.0.1'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
