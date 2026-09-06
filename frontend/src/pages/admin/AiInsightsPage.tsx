import React, { useState, useEffect } from 'react';
import {
  BrainCircuit,
  TrendingUp,
  Sparkles,
  ShoppingBag,
  ShieldAlert,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Layers,
  ArrowRight
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { api } from '../../api/client';
import { DemandForecast, MarketBasketRule, AnomalyReport } from '../../types';

export const AiInsightsPage: React.FC = () => {
  const [demandForecasts, setDemandForecasts] = useState<DemandForecast[]>([]);
  const [salesForecast, setSalesForecast] = useState<any | null>(null);
  const [mbaRules, setMbaRules] = useState<MarketBasketRule[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyReport[]>([]);
  const [activeTab, setActiveTab] = useState<'DEMAND' | 'SALES' | 'MBA' | 'ANOMALIES'>('DEMAND');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAllAiData();
  }, []);

  const fetchAllAiData = async () => {
    setIsLoading(true);
    try {
      const [demandRes, salesRes, mbaRes, anomRes] = await Promise.all([
        api.get<any>('/ai/demand-forecast'),
        api.get<any>('/ai/sales-forecast'),
        api.get<any>('/ai/market-basket'),
        api.get<any>('/ai/anomalies')
      ]);

      if (demandRes.success) setDemandForecasts(demandRes.data);
      if (salesRes.success) setSalesForecast(salesRes.data);
      if (mbaRes.success) setMbaRules(mbaRes.data);
      if (anomRes.success) setAnomalies(anomRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
                Supermarket AI & Machine Learning Suite
              </h1>
              <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Core ML Models Active
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Automated demand forecasting, Apriori market basket association, and real-time fraud anomaly scanning
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 p-1 bg-white border border-slate-200/80 rounded-2xl w-fit text-xs font-bold">
          {[
            { id: 'DEMAND', label: '1. Demand Forecasting', icon: <TrendingUp className="w-4 h-4" /> },
            { id: 'SALES', label: '2. Sales Forecasting Curve', icon: <BrainCircuit className="w-4 h-4" /> },
            { id: 'MBA', label: '3. Market Basket Analysis', icon: <ShoppingBag className="w-4 h-4" /> },
            { id: 'ANOMALIES', label: '4. Anomaly & Fraud Detection', icon: <ShieldAlert className="w-4 h-4" /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                activeTab === tab.id
                  ? 'bg-slate-950 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ========================================================= */}
        {/* 1. DEMAND FORECASTING TAB */}
        {/* ========================================================= */}
        {activeTab === 'DEMAND' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 text-white p-6 rounded-3xl border border-emerald-800/40 shadow-xl flex items-center justify-between">
              <div className="space-y-1 max-w-xl">
                <span className="text-[11px] font-mono text-emerald-400 font-bold uppercase">TIME-SERIES INVENTORY PREDICTIONS</span>
                <h3 className="text-xl font-black">Automated Purchase Reorder Recommendations</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Predicts unit demand for the next 7 and 30 days based on historical sales velocity and seasonal growth factor. Automatically calculates required PO quantities.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-mono uppercase text-[11px]">
                    <tr>
                      <th className="p-4">PRODUCT / SKU</th>
                      <th className="p-4 text-right">CURRENT STOCK</th>
                      <th className="p-4 text-right">DAILY VELOCITY</th>
                      <th className="p-4 text-right">PREDICTED 7D DEMAND</th>
                      <th className="p-4 text-right">PREDICTED 30D DEMAND</th>
                      <th className="p-4 text-right">RECOMMENDED PO QTY</th>
                      <th className="p-4 text-center">CONFIDENCE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {demandForecasts.map((f) => (
                      <tr key={f.productId} className="hover:bg-slate-50/80">
                        <td className="p-4">
                          <span className="font-bold text-slate-900 block">{f.productName}</span>
                          <span className="text-[10px] font-mono text-slate-400">{f.sku} • {f.category}</span>
                        </td>
                        <td className="p-4 text-right font-mono font-bold text-slate-900">{f.currentStock}</td>
                        <td className="p-4 text-right font-mono text-slate-600">{f.historicalDailyAvg}/day</td>
                        <td className="p-4 text-right font-mono font-bold text-emerald-700">
                          {f.status === 'INSUFFICIENT_DATA' ? '—' : `${f.predictedDemandNext7Days} units`}
                        </td>
                        <td className="p-4 text-right font-mono text-slate-700">
                          {f.status === 'INSUFFICIENT_DATA' ? '—' : `${f.predictedDemandNext30Days} units`}
                        </td>
                        <td className="p-4 text-right font-mono">
                          {f.status === 'INSUFFICIENT_DATA' ? (
                            <span className="text-slate-400 italic text-[11px]">Insufficient history</span>
                          ) : (
                            <span className="font-extrabold text-xs bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded">
                              +{f.recommendedPurchaseQty} units
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          {f.status === 'INSUFFICIENT_DATA' ? (
                            <span className="text-[10px] text-slate-400">N/A</span>
                          ) : (
                            <span className="font-mono text-xs font-bold text-emerald-600">{f.confidenceScore}%</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 2. SALES FORECASTING TAB */}
        {/* ========================================================= */}
        {activeTab === 'SALES' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-slate-900">Actual vs. Projected Daily Sales Revenue</h3>
                  <p className="text-xs text-slate-400">Past actual performance + next 7 days weighted moving average projection</p>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl">
                  Forecasted 30D Revenue: ₹{salesForecast?.summary?.totalPredicted30Days?.toLocaleString() || '1,450,000'}
                </span>
              </div>

              <div className="h-80 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={salesForecast?.points || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={(v) => `₹${v / 1000}k`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                      formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, '']}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="actualRevenue" name="Actual Daily Revenue" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="predictedRevenue" name="Projected Sales Trend" stroke="#6366f1" strokeWidth={2.5} strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 3. MARKET BASKET ANALYSIS (MBA) TAB */}
        {/* ========================================================= */}
        {activeTab === 'MBA' && (
          <div className="space-y-6">
            <div className="p-6 bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-3xl border border-indigo-900 shadow-xl flex items-center justify-between">
              <div className="space-y-1 max-w-xl">
                <span className="text-[11px] font-mono text-indigo-400 font-bold uppercase">APRIORI ASSOCIATION RULE MINING</span>
                <h3 className="text-xl font-black">Co-Purchased Grocery Item Pairings</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Discovers which items shoppers purchase together. Uses Support, Confidence, and Lift (&gt; 1 indicates strong positive association) to power shelf merchandising and combo deals.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-mono uppercase text-[11px]">
                    <tr>
                      <th className="p-4">ANTECEDENT (PRODUCT A)</th>
                      <th className="p-4">CONSEQUENT (PRODUCT B)</th>
                      <th className="p-4 text-center">SUPPORT</th>
                      <th className="p-4 text-center">CONFIDENCE</th>
                      <th className="p-4 text-center">LIFT SCORE</th>
                      <th className="p-4 text-center">MERCHANDISING STRATEGY</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {mbaRules.map((rule, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80">
                        <td className="p-4">
                          <span className="font-bold text-slate-900 block">{rule.antecedentName}</span>
                          <span className="text-[10px] font-mono text-slate-400">{rule.antecedentSku}</span>
                        </td>
                        <td className="p-4">
                          <span className="font-bold text-indigo-700 block">{rule.consequentName}</span>
                          <span className="text-[10px] font-mono text-slate-400">{rule.consequentSku}</span>
                        </td>
                        <td className="p-4 text-center font-mono font-semibold text-slate-600">
                          {(rule.support * 100).toFixed(1)}%
                        </td>
                        <td className="p-4 text-center font-mono font-bold text-slate-800">
                          {(rule.confidence * 100).toFixed(1)}%
                        </td>
                        <td className="p-4 text-center font-mono font-extrabold text-sm text-emerald-600">
                          {rule.lift}x
                        </td>
                        <td className="p-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            rule.recommendationType === 'COMBO_DEAL'
                              ? 'bg-purple-100 text-purple-800'
                              : (rule.recommendationType === 'SHELF_ADJACENCY'
                                ? 'bg-indigo-100 text-indigo-800'
                                : 'bg-emerald-100 text-emerald-800')
                          }`}>
                            {rule.recommendationType}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 4. ANOMALY & FRAUD DETECTION TAB */}
        {/* ========================================================= */}
        {activeTab === 'ANOMALIES' && (
          <div className="space-y-6">
            <div className="p-6 bg-slate-900 text-white rounded-3xl border border-slate-800 shadow-xl space-y-1">
              <span className="text-[11px] font-mono text-rose-400 font-bold uppercase">SECURITY AUDIT ENGINE</span>
              <h3 className="text-xl font-black">Automated Anomaly & Outlier Alerts</h3>
              <p className="text-xs text-slate-400">
                Statistical scanning of cashier refund rates, high manual discount overrides, and register drawer variances.
              </p>
            </div>

            <div className="space-y-3">
              {anomalies.map((a) => (
                <div
                  key={a.id}
                  className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-start gap-4"
                >
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                    a.severity === 'HIGH' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
                  }`}>
                    <AlertTriangle className="w-5 h-5" />
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-slate-900">{a.title}</h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                        a.severity === 'HIGH' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {a.severity} SEVERITY
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{a.description}</p>
                    <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1 font-mono">
                      <span>Detected: {new Date(a.detectedAt).toLocaleString()}</span>
                      {a.cashierName && <span>Cashier: <strong>{a.cashierName}</strong></span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
