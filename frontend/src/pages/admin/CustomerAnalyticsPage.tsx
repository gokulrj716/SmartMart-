import React, { useState, useEffect } from 'react';
import { Users, ShieldAlert, Award, HeartHandshake, ArrowUpRight, Zap } from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { api } from '../../api/client';

export const CustomerAnalyticsPage: React.FC = () => {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [summary, setSummary] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.get<any>('/ai/customer-segments')
      .then(res => {
        if (res.success) {
          setProfiles(res.profiles || []);
          setSummary(res.summary || []);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-7xl mx-auto">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            Customer RFM Analytics, Lifetime Value & Churn Risk
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Recency-Frequency-Monetary (RFM) clustering, anticipated lifetime value (CLV), and proactive churn intervention
          </p>
        </div>

        {/* 6 RFM Segment Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {summary.map((s) => (
            <div key={s.segment} className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm text-slate-900">{s.segment}</span>
                <span className="font-mono text-xs font-bold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full">
                  {s.count} Customers
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">{s.description}</p>
              <div className="pt-2 border-t border-slate-100 flex justify-between text-xs font-mono">
                <span className="text-slate-400">Total Revenue:</span>
                <span className="font-bold text-slate-900">₹{s.totalRevenue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Avg Est. CLV:</span>
                <span className="font-bold text-emerald-700">₹{s.avgCLV.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Customer Profiles Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-900">Individual Customer Profiles & Risk Scores</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-mono uppercase text-[11px]">
                <tr>
                  <th className="p-4">CUSTOMER</th>
                  <th className="p-4">SEGMENT</th>
                  <th className="p-4 text-center">RFM SCORE</th>
                  <th className="p-4 text-right">RECENCY</th>
                  <th className="p-4 text-right">FREQUENCY</th>
                  <th className="p-4 text-right">MONETARY (₹)</th>
                  <th className="p-4 text-right">EST. CLV (₹)</th>
                  <th className="p-4 text-center">CHURN RISK</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {profiles.map((p) => (
                  <tr key={p.customerId} className="hover:bg-slate-50/80">
                    <td className="p-4">
                      <span className="font-bold text-slate-900 block">{p.customerName}</span>
                      <span className="text-[10px] font-mono text-slate-400">{p.phone}</span>
                    </td>
                    <td className="p-4 font-semibold text-slate-800">{p.segment}</td>
                    <td className="p-4 text-center font-mono font-bold text-slate-600">{p.rfmScore}</td>
                    <td className="p-4 text-right font-mono text-slate-600">{p.recencyDays}d ago</td>
                    <td className="p-4 text-right font-mono text-slate-600">{p.frequency} orders</td>
                    <td className="p-4 text-right font-mono font-bold text-slate-900">₹{p.totalSpent.toLocaleString()}</td>
                    <td className="p-4 text-right font-mono font-bold text-emerald-700">₹{p.clvEstimate.toLocaleString()}</td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        p.churnRiskLevel === 'HIGH' ? 'bg-rose-100 text-rose-800' :
                        p.churnRiskLevel === 'MEDIUM' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {p.churnRiskLevel} ({p.churnRiskScore}%)
                      </span>
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
