import React, { useState, useEffect } from 'react';
import { RotateCcw, Check, Calendar } from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { api } from '../../api/client';

export const ReturnsPage: React.FC = () => {
  const [returns, setReturns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.get<any>('/returns')
      .then(res => {
        if (res.success) setReturns(res.data);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Returns & Refunds Ledger</h1>
          <p className="text-xs text-slate-500 mt-1">Audit customer product returns, condition assessments, and inventory restocking</p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-mono uppercase text-[11px]">
                <tr>
                  <th className="p-4">RETURN #</th>
                  <th className="p-4">ORIGINAL INVOICE</th>
                  <th className="p-4">CUSTOMER</th>
                  <th className="p-4">CASHIER</th>
                  <th className="p-4">REASON</th>
                  <th className="p-4 text-right">REFUND AMOUNT</th>
                  <th className="p-4 text-center">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {returns.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No customer returns recorded. All purchases currently active.
                    </td>
                  </tr>
                ) : (
                  returns.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 font-mono font-bold text-slate-900">{r.return_number}</td>
                      <td className="p-4 font-mono text-emerald-700">{r.original_invoice}</td>
                      <td className="p-4 font-medium text-slate-800">{r.customer_name || 'Walk-in'}</td>
                      <td className="p-4 text-slate-600">{r.cashier_name}</td>
                      <td className="p-4 text-slate-600">{r.reason}</td>
                      <td className="p-4 text-right font-mono font-bold text-rose-600">
                        ₹{Number(r.total_refund_amount).toFixed(2)}
                      </td>
                      <td className="p-4 text-center">
                        <span className="bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded text-[10px]">
                          {r.status}
                        </span>
                      </td>
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
