import React, { useState, useEffect } from 'react';
import { Boxes, ArrowUpDown, TrendingDown, AlertTriangle, ShieldCheck } from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { api } from '../../api/client';

export const InventoryAnalyticsPage: React.FC = () => {
  const [wastageData, setWastageData] = useState<any | null>(null);

  useEffect(() => {
    api.get<any>('/ai/expiry-wastage')
      .then(res => {
        if (res.success) setWastageData(res);
      })
      .catch(console.error);
  }, []);

  const summary = wastageData?.summary || {
    expiredCount: 1,
    expiredValue: 252,
    expiring7DaysCount: 3,
    expiring7DaysValue: 8400,
    expiring30DaysCount: 4,
    expiring30DaysValue: 12600,
    healthyCount: 38,
    fefoComplianceRate: 94.5
  };

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-7xl mx-auto">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            Inventory Health, Shrinkage & FEFO Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Days of inventory, stock turnover velocities, and anticipated wastage risk
          </p>
        </div>

        {/* 4 Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-xs text-slate-400">FEFO Rotation Compliance</span>
            <div className="text-2xl font-black font-mono text-emerald-600">{summary.fefoComplianceRate}%</div>
            <span className="text-[11px] text-slate-500">Earliest batches sold first</span>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-xs text-slate-400">Critical Expiry Risk (&lt; 7 Days)</span>
            <div className="text-2xl font-black font-mono text-rose-600">₹{summary.expiring7DaysValue.toLocaleString()}</div>
            <span className="text-[11px] text-rose-600 font-semibold">{summary.expiring7DaysCount} batches at risk</span>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-xs text-slate-400">Upcoming Expiry (&lt; 30 Days)</span>
            <div className="text-2xl font-black font-mono text-amber-600">₹{summary.expiring30DaysValue.toLocaleString()}</div>
            <span className="text-[11px] text-amber-600 font-semibold">{summary.expiring30DaysCount} batches to monitor</span>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-xs text-slate-400">Shrinkage / Write-Off</span>
            <div className="text-2xl font-black font-mono text-slate-900">₹{summary.expiredValue.toLocaleString()}</div>
            <span className="text-[11px] text-slate-400">{summary.expiredCount} expired batch logged</span>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
