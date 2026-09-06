import React, { useState, useEffect } from 'react';
import { Users, Search, Award, Phone, Mail } from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { api } from '../../api/client';
import { Customer } from '../../types';

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, [tierFilter]);

  const fetchCustomers = async (search = searchTerm) => {
    try {
      let url = '/customers?';
      if (tierFilter) url += `&tier=${tierFilter}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;

      const res = await api.get<any>(url);
      if (res.success && res.data) {
        setCustomers(res.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Customer Loyalty Directory</h1>
          <p className="text-xs text-slate-500 mt-1">Supermarket loyalty memberships, points balances, and customer lifetime spending</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by customer name, phone, or code..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                fetchCustomers(e.target.value);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700"
          >
            <option value="">All Loyalty Tiers</option>
            <option value="Bronze">Bronze</option>
            <option value="Silver">Silver</option>
            <option value="Gold">Gold</option>
            <option value="Platinum">Platinum</option>
          </select>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-mono uppercase text-[11px]">
                <tr>
                  <th className="p-4">CODE</th>
                  <th className="p-4">CUSTOMER NAME</th>
                  <th className="p-4">MOBILE PHONE</th>
                  <th className="p-4">LOYALTY TIER</th>
                  <th className="p-4 text-right">POINTS BALANCE</th>
                  <th className="p-4 text-right">LIFETIME SPEND (₹)</th>
                  <th className="p-4 text-center">ORDERS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80">
                    <td className="p-4 font-mono font-bold text-slate-700">{c.customer_code}</td>
                    <td className="p-4 font-bold text-slate-900">{c.name}</td>
                    <td className="p-4 font-mono text-slate-600">{c.phone}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        c.loyalty_tier === 'Platinum' ? 'bg-purple-100 text-purple-800' :
                        c.loyalty_tier === 'Gold' ? 'bg-amber-100 text-amber-800' :
                        c.loyalty_tier === 'Silver' ? 'bg-slate-200 text-slate-800' : 'bg-orange-100 text-orange-800'
                      }`}>
                        {c.loyalty_tier} VIP
                      </span>
                    </td>
                    <td className="p-4 text-right font-mono font-bold text-amber-600">
                      {c.loyalty_points} Pts
                    </td>
                    <td className="p-4 text-right font-mono font-bold text-slate-900">
                      ₹{Number(c.total_spent).toLocaleString()}
                    </td>
                    <td className="p-4 text-center font-mono font-semibold text-slate-600">
                      {c.order_count || 0}
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
