import React, { useState, useEffect } from 'react';
import { TrendingUp, ArrowUpRight, Flame, Hourglass, AlertCircle, BarChart3 } from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { api } from '../../api/client';

export const ProductAnalyticsPage: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.get<any>('/analytics/products')
      .then(res => {
        if (res.success) setProducts(res.data);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const bestSellers = products.filter(p => p.velocityType === 'BEST_SELLER');
  const slowMovers = products.filter(p => p.velocityType === 'SLOW_MOVING');

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Product Sales & Margin Velocity Analytics</h1>
          <p className="text-xs text-slate-500 mt-1">
            Turnover ratios, profit margins, fast-movers vs dead-stock, and merchandising performance
          </p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-500" /> Fast Moving / Best Sellers
            </span>
            <div className="text-2xl font-black font-mono text-slate-900">{bestSellers.length} SKUs</div>
            <span className="text-[11px] text-emerald-600 font-semibold">&gt; 25 units monthly velocity</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Hourglass className="w-3.5 h-3.5 text-blue-500" /> Slow Moving Stock
            </span>
            <div className="text-2xl font-black font-mono text-slate-900">{slowMovers.length} SKUs</div>
            <span className="text-[11px] text-amber-600 font-semibold">Consider promotion / markdown</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> Avg Supermarket Margin
            </span>
            <div className="text-2xl font-black font-mono text-emerald-600">22.8%</div>
            <span className="text-[11px] text-slate-500">Net markup across fresh & packaged</span>
          </div>
        </div>

        {/* Product Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-mono uppercase text-[11px]">
                <tr>
                  <th className="p-4">PRODUCT / SKU</th>
                  <th className="p-4">DEPARTMENT</th>
                  <th className="p-4 text-right">UNITS SOLD</th>
                  <th className="p-4 text-right">REVENUE (₹)</th>
                  <th className="p-4 text-right">PROFIT (₹)</th>
                  <th className="p-4 text-center">MARGIN %</th>
                  <th className="p-4 text-center">VELOCITY</th>
                  <th className="p-4 text-right">TURNOVER</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/80">
                    <td className="p-4">
                      <span className="font-bold text-slate-900 block">{p.name}</span>
                      <span className="text-[10px] font-mono text-slate-400">{p.sku}</span>
                    </td>
                    <td className="p-4 text-slate-600">{p.category}</td>
                    <td className="p-4 text-right font-mono font-bold text-slate-900">{p.unitsSold} {p.unit}</td>
                    <td className="p-4 text-right font-mono font-bold text-slate-900">₹{p.revenue.toLocaleString()}</td>
                    <td className="p-4 text-right font-mono font-bold text-emerald-600">₹{p.profit.toLocaleString()}</td>
                    <td className="p-4 text-center font-mono font-bold text-slate-800">{p.marginPercent}%</td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        p.velocityType === 'BEST_SELLER' ? 'bg-amber-100 text-amber-800' :
                        p.velocityType === 'SLOW_MOVING' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {p.velocityType}
                      </span>
                    </td>
                    <td className="p-4 text-right font-mono text-slate-600">{p.stockTurnoverRatio}x</td>
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
