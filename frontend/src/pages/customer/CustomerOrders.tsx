import React, { useState, useEffect } from 'react';
import { ReceiptText, Eye, CheckCircle2, Clock, Calendar, Download } from 'lucide-react';
import { CustomerLayout } from '../../components/layout/CustomerLayout';
import { ThermalReceiptModal } from '../../components/hardware/ThermalReceiptModal';
import { api } from '../../api/client';
import { Sale } from '../../types';

export const CustomerOrders: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const res = await api.get<any>('/sales?limit=20');
      if (res.success && res.data) {
        setSales(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewReceipt = async (saleId: string) => {
    try {
      const res = await api.get<any>(`/sales/${saleId}`);
      if (res.success && res.data) {
        setSelectedInvoice(res.data);
        setIsReceiptOpen(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <CustomerLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Your Supermarket Orders</h1>
          <p className="text-xs text-slate-500 mt-1">View invoices, track receipts, and reorder favourite items</p>
        </div>

        {isLoading ? (
          <div className="text-center py-16">
            <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-500">Loading order history...</p>
          </div>
        ) : sales.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
            <ReceiptText className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-bold text-base text-slate-800">No Past Orders Found</h3>
            <p className="text-xs text-slate-500">Your supermarket purchases will show up here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sales.map((s) => (
              <div
                key={s.id}
                className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-slate-900">{s.invoice_number}</span>
                    <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {s.payment_status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(s.created_at).toLocaleDateString()} at {new Date(s.created_at).toLocaleTimeString()}
                    </span>
                    <span>Payment: <strong className="text-slate-600">{s.payment_method}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-0 pt-3 sm:pt-0 border-slate-100">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block uppercase">Total Amount</span>
                    <span className="text-lg font-black font-mono text-slate-900">
                      ₹{s.total_amount.toFixed(2)}
                    </span>
                  </div>

                  <button
                    onClick={() => handleViewReceipt(s.id)}
                    className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-3.5 py-2 rounded-xl transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View Bill</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ThermalReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        invoiceData={selectedInvoice}
      />
    </CustomerLayout>
  );
};
