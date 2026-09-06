import React, { useState } from 'react';
import { RotateCcw, Search, Check, AlertCircle } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { api } from '../../api/client';

export interface PosReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PosReturnModal: React.FC<PosReturnModalProps> = ({ isOpen, onClose }) => {
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [sale, setSale] = useState<any | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [reason, setReason] = useState('Customer changed mind');
  const [condition, setCondition] = useState<'RESELLABLE' | 'DAMAGED'>('RESELLABLE');
  const [selectedItems, setSelectedItems] = useState<{ [productId: string]: number }>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSearchInvoice = async () => {
    if (!invoiceNumber.trim()) return;
    setIsSearching(true);
    setSale(null);
    setSuccessMessage(null);
    try {
      const res = await api.get<any>(`/sales/${encodeURIComponent(invoiceNumber.trim())}`);
      if (res.success && res.data) {
        setSale(res.data);
        // Default return quantity 1 for all
        const defaults: any = {};
        res.data.items?.forEach((it: any) => {
          defaults[it.product_id] = it.quantity;
        });
        setSelectedItems(defaults);
      }
    } catch (err: any) {
      alert(err.message || 'Invoice not found');
    } finally {
      setIsSearching(false);
    }
  };

  const handleProcessRefund = async () => {
    if (!sale) return;
    setIsProcessing(true);
    try {
      const itemsToReturn = Object.entries(selectedItems).map(([productId, quantity]) => ({
        productId,
        quantity
      })).filter(i => i.quantity > 0);

      if (itemsToReturn.length === 0) {
        alert('Please select at least one item to return.');
        setIsProcessing(false);
        return;
      }

      const res = await api.post<any>('/returns', {
        originalInvoiceNumber: sale.invoice_number,
        items: itemsToReturn,
        reason,
        conditionStatus: condition
      });

      if (res.success) {
        setSuccessMessage(res.message);
        setSale(null);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to process return');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Process Return & Refund" maxWidth="lg">
      <div className="space-y-4">
        {successMessage ? (
          <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
            <Check className="w-10 h-10 text-emerald-600 mx-auto" />
            <h4 className="font-bold text-slate-900 text-base">Return Processed Successfully</h4>
            <p className="text-xs text-emerald-800">{successMessage}</p>
            <Button variant="primary" onClick={onClose}>
              Done
            </Button>
          </div>
        ) : (
          <>
            {/* Invoice Search Bar */}
            <div className="flex gap-2">
              <Input
                placeholder="Enter original Invoice Number (e.g. INV-20260001)..."
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
              />
              <Button
                variant="primary"
                onClick={handleSearchInvoice}
                isLoading={isSearching}
              >
                Search
              </Button>
            </div>

            {sale && (
              <div className="space-y-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-800">Invoice: {sale.invoice_number}</p>
                    <p className="text-slate-500">Date: {new Date(sale.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-800">Total: ₹{sale.total_amount.toFixed(2)}</p>
                    <p className="text-slate-500">{sale.payment_method}</p>
                  </div>
                </div>

                {/* Items in Invoice */}
                <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-48 overflow-y-auto">
                  {(sale.items || []).map((it: any) => (
                    <div key={it.id} className="p-2.5 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-slate-800">{it.product_name}</p>
                        <p className="text-[11px] text-slate-500">₹{it.unit_price} each</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-500">Return Qty:</span>
                        <input
                          type="number"
                          min="0"
                          max={it.quantity}
                          value={selectedItems[it.product_id] || 0}
                          onChange={(e) => setSelectedItems({ ...selectedItems, [it.product_id]: parseFloat(e.target.value) || 0 })}
                          className="w-16 border border-slate-300 rounded p-1 text-center font-bold"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Condition & Reason */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Item Condition</label>
                    <select
                      value={condition}
                      onChange={(e: any) => setCondition(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl p-2 bg-white"
                    >
                      <option value="RESELLABLE">Resellable (Restock to Shelf)</option>
                      <option value="DAMAGED">Damaged / Expired (Discard)</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Return Reason</label>
                    <input
                      type="text"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl p-2 bg-white"
                      placeholder="e.g. Expired, wrong item"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button variant="outline" className="flex-1" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button
                    variant="danger"
                    className="flex-1"
                    onClick={handleProcessRefund}
                    isLoading={isProcessing}
                    leftIcon={<RotateCcw className="w-4 h-4" />}
                  >
                    Confirm Refund & Restock
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};
