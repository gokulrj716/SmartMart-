import React, { useState, useEffect } from 'react';
import { ReceiptText, Search, Eye, Filter, Calendar, Download, RefreshCw } from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { ThermalReceiptModal } from '../../components/hardware/ThermalReceiptModal';
import { api } from '../../api/client';
import { Sale } from '../../types';

export const SalesPage: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [selectedSale, setSelectedSale] = useState<any | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSales();
  }, [paymentFilter]);

  const fetchSales = async (search = searchTerm) => {
    setIsLoading(true);
    try {
      let url = '/sales?limit=50';
      if (paymentFilter) url += `&paymentMethod=${paymentFilter}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;

      const res = await api.get<any>(url);
      if (res.success && res.data) {
        setSales(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewInvoice = async (id: string) => {
    try {
      const res = await api.get<any>(`/sales/${id}`);
      if (res.success && res.data) {
        setSelectedSale(res.data);
        setIsReceiptOpen(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Sales Transactions Ledger</h1>
          <p className="text-xs text-slate-500 mt-1">Audit complete financial transactions, cashier audit trails, and itemized bills</p>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by invoice number or customer..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                fetchSales(e.target.value);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700"
          >
            <option value="">All Payment Modes</option>
            <option value="CASH">Cash</option>
            <option value="UPI">UPI</option>
            <option value="CARD">Card</option>
          </select>
        </div>

        {/* Sales Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-mono uppercase text-[11px]">
                <tr>
                  <th className="p-4">INVOICE #</th>
                  <th className="p-4">TIMESTAMP</th>
                  <th className="p-4">CUSTOMER</th>
                  <th className="p-4">CASHIER</th>
                  <th className="p-4 text-center">PAYMENT</th>
                  <th className="p-4 text-right">DISCOUNT</th>
                  <th className="p-4 text-right">TAX</th>
                  <th className="p-4 text-right">TOTAL (₹)</th>
                  <th className="p-4 text-center">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sales.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-mono font-bold text-slate-900">
                      {s.invoice_number}
                    </td>
                    <td className="p-4 text-slate-500">
                      {new Date(s.created_at).toLocaleDateString()} {new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-4 font-medium text-slate-800">
                      {s.customer_name || 'Guest Customer'}
                    </td>
                    <td className="p-4 text-slate-600">
                      {s.cashier_name || 'Counter 01'}
                    </td>
                    <td className="p-4 text-center">
                      <span className="bg-slate-100 font-mono text-[10px] font-bold px-2 py-0.5 rounded text-slate-700">
                        {s.payment_method}
                      </span>
                    </td>
                    <td className="p-4 text-right font-mono text-slate-500">
                      {s.discount_amount > 0 ? `-₹${s.discount_amount.toFixed(2)}` : '—'}
                    </td>
                    <td className="p-4 text-right font-mono text-slate-500">
                      ₹{s.tax_amount.toFixed(2)}
                    </td>
                    <td className="p-4 text-right font-mono font-bold text-slate-900">
                      ₹{s.total_amount.toFixed(2)}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleViewInvoice(s.id)}
                        className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="View Detailed Invoice"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <ThermalReceiptModal
          isOpen={isReceiptOpen}
          onClose={() => setIsReceiptOpen(false)}
          invoiceData={selectedSale}
        />
      </div>
    </AdminLayout>
  );
};
