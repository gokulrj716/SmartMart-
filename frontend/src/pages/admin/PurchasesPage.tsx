import React, { useState, useEffect } from 'react';
import { Truck, Plus, CheckCircle2, Calendar } from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { api } from '../../api/client';

export const PurchasesPage: React.FC = () => {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [supplierId, setSupplierId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState(10);
  const [unitCost, setUnitCost] = useState(50);
  const [expiryDate, setExpiryDate] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [pRes, sRes, prodRes] = await Promise.all([
        api.get<any>('/purchases'),
        api.get<any>('/suppliers'),
        api.get<any>('/products?limit=100')
      ]);
      if (pRes.success) setPurchases(pRes.data);
      if (sRes.success) setSuppliers(sRes.data);
      if (prodRes.success) setProducts(prodRes.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleReceivePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post<any>('/purchases/receive', {
        supplierId,
        invoiceNumber,
        items: [
          {
            productId,
            quantity,
            unitCost,
            expiryDate: expiryDate || undefined
          }
        ]
      });

      if (res.success) {
        setIsModalOpen(false);
        fetchData();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to receive purchase');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Purchase Orders & Inward Batches</h1>
            <p className="text-xs text-slate-500 mt-1">Receive wholesale merchandise, establish cost price baselines, and create FEFO tracking batches</p>
          </div>

          <Button
            variant="primary"
            onClick={() => setIsModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Inward New Stock Order
          </Button>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-mono uppercase text-[11px]">
                <tr>
                  <th className="p-4">PO NUMBER</th>
                  <th className="p-4">SUPPLIER</th>
                  <th className="p-4">INWARD DATE</th>
                  <th className="p-4">INVOICE REF</th>
                  <th className="p-4 text-right">TOTAL (₹)</th>
                  <th className="p-4 text-center">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {purchases.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/80">
                    <td className="p-4 font-mono font-bold text-slate-900">{p.purchase_number}</td>
                    <td className="p-4 font-semibold text-slate-800">{p.supplier_name}</td>
                    <td className="p-4 text-slate-500">{new Date(p.created_at).toLocaleDateString()}</td>
                    <td className="p-4 font-mono text-slate-500">{p.invoice_number || 'N/A'}</td>
                    <td className="p-4 text-right font-mono font-bold text-slate-900">
                      ₹{Number(p.total_amount).toLocaleString()}
                    </td>
                    <td className="p-4 text-center">
                      <span className="bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded text-[10px]">
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Inward Purchase Order & FEFO Batch Creation"
          maxWidth="md"
        >
          <form onSubmit={handleReceivePurchase} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Wholesale Supplier</label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
              >
                <option value="">Select Supplier</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <Input
              label="Supplier Invoice Reference"
              placeholder="e.g. METRO-INV-9921"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
            />

            <div>
              <label className="font-bold text-slate-700 block mb-1">Product to Restock</label>
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5"
              >
                <option value="">Select Product</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.unit})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Received Quantity"
                type="number"
                step="0.001"
                required
                value={quantity}
                onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
              />
              <Input
                label="Wholesale Unit Cost (₹)"
                type="number"
                step="0.01"
                required
                value={unitCost}
                onChange={(e) => setUnitCost(parseFloat(e.target.value) || 0)}
              />
            </div>

            <Input
              label="Batch Expiration Date (FEFO Target)"
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
            />

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" type="button" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" className="flex-1" type="submit">
                Receive & Allocate Batch
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </AdminLayout>
  );
};
