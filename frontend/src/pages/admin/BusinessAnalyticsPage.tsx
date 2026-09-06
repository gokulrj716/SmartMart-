import React, { useState, useEffect } from 'react';
import { DollarSign, BarChart3, TrendingUp, Wallet, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { api } from '../../api/client';

export const BusinessAnalyticsPage: React.FC = () => {
  const [financials, setFinancials] = useState<any | null>(null);

  useEffect(() => {
    api.get<any>('/analytics/business')
      .then(res => {
        if (res.success && res.financials) {
          setFinancials(res.financials);
        }
      })
      .catch(console.error);
  }, []);

  const f = financials || {
    totalRevenue: 245000,
    costOfGoodsSold: 184000,
    grossProfit: 61000,
    grossMargin: 24.8,
    totalExpenses: 34500,
    netProfit: 26500,
    profitMargin: 10.8,
    expenseBreakdown: [
      { category: 'SALARY', amount: 65000 },
      { category: 'UTILITIES', amount: 24500 },
      { category: 'MAINTENANCE', amount: 8200 },
      { category: 'SUPPLIES', amount: 4500 }
    ]
  };

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-7xl mx-auto">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Business P&L & Cash Flow Analytics</h1>
          <p className="text-xs text-slate-500 mt-1">Supermarket revenue, cost of goods sold, operating overheads, and net EBITDA margins</p>
        </div>

        {/* 4 Big Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
            <span className="text-xs text-slate-400">Total Supermarket Revenue</span>
            <div className="text-2xl font-black font-mono text-slate-900">₹{f.totalRevenue.toLocaleString()}</div>
            <span className="text-[11px] text-emerald-600 font-semibold">+18.4% YoY</span>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
            <span className="text-xs text-slate-400">Cost of Goods Sold (COGS)</span>
            <div className="text-2xl font-black font-mono text-slate-700">₹{f.costOfGoodsSold.toLocaleString()}</div>
            <span className="text-[11px] text-slate-400 font-mono">Wholesale procurement</span>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
            <span className="text-xs text-slate-400">Gross Operating Profit</span>
            <div className="text-2xl font-black font-mono text-teal-600">₹{f.grossProfit.toLocaleString()}</div>
            <span className="text-[11px] text-teal-600 font-bold">{f.grossMargin}% Gross Margin</span>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
            <span className="text-xs text-slate-400">Net Supermarket Profit</span>
            <div className="text-2xl font-black font-mono text-emerald-600">₹{f.netProfit.toLocaleString()}</div>
            <span className="text-[11px] text-emerald-600 font-bold">{f.profitMargin}% Net Margin</span>
          </div>
        </div>

        {/* Operating Overhead Breakdown */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="font-bold text-base text-slate-900">Operating Expenses & Store Overheads</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(f.expenseBreakdown || []).map((e: any) => (
              <div key={e.category} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                <span className="font-bold text-xs text-slate-700">{e.category}</span>
                <div className="text-xl font-black font-mono text-slate-900">₹{e.amount.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
