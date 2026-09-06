import React, { useState, useEffect } from 'react';
import {
  Boxes,
  AlertTriangle,
  Clock,
  Plus,
  ArrowUpDown,
  CheckCircle2,
  Calendar,
  Layers,
  Filter
} from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { api } from '../../api/client';

export const InventoryPage: React.FC = () => {
  const [inventory, setInventory] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({ totalProducts: 0, totalValuation: 0, lowStockCount: 0, outOfStockCount: 0 });
  const [expiryBatches, setExpiryBatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // Adjustment Modal
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [adjustQty, setAdjustQty] = useState<number>(0);
  const [adjustType, setAdjustType] = useState<string>('ADJUSTMENT');
  const [adjustReason, setAdjustReason] = useState<string>('Cycle Count Correction');

  useEffect(() => {
    fetchInventory();
    fetchExpiryData();
  }, [lowStockOnly]);

  const fetchInventory = async () => {
    setIsLoading(true);
    try {
      const res = await api.get<any>(`/inventory?lowStockOnly=${lowStockOnly}`);
      if (res.success) {
        setInventory(res.data);
        if (res.summary) setSummary(res.summary);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchExpiryData = async () => {
    try {
      const res = await api.get<any>('/ai/expiry-wastage');
      if (res.success && res.batches) {
        setExpiryBatches(res.batches);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenAdjust = (p: any) => {
    setSelectedProduct(p);
    setAdjustQty(0);
    setIsAdjustModalOpen(true);
  };

  const handleSaveAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || adjustQty === 0) return;

    try {
      const res = await api.post<any>('/inventory/adjust', {
        productId: selectedProduct.id,
        type: adjustType,
        quantityChange: adjustQty,
        reason: adjustReason
      });

      if (res.success) {
        setIsAdjustModalOpen(false);
        fetchInventory();
      }
    } catch (err: any) {
      alert('Adjustment failed: ' + err.message);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
              Real-Time Inventory & FEFO Batches
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Synchronized stock levels, First-Expired-First-Out batch tracking, and shrinkage control
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setLowStockOnly(!lowStockOnly)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                lowStockOnly
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{lowStockOnly ? 'Showing Low Stock' : 'Filter Low Stock'}</span>
            </button>
          </div>
        </div>

        {/* Inventory KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
            <span className="text-xs text-slate-400">Total Supermarket SKUs</span>
            <div className="text-2xl font-black font-mono text-slate-900">{summary.totalProducts}</div>
            <span className="text-[11px] text-slate-500">Active catalog items</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
            <span className="text-xs text-slate-400">Total Inventory Valuation</span>
            <div className="text-2xl font-black font-mono text-emerald-600">
              ₹{summary.totalValuation.toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-500">Cost valuation on shelf</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
            <span className="text-xs text-slate-400">Low Stock Reorder Alerts</span>
            <div className="text-2xl font-black font-mono text-amber-600">
              {summary.lowStockCount} Items
            </div>
            <span className="text-[11px] text-amber-600 font-semibold">Below min threshold</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
            <span className="text-xs text-slate-400">Out of Stock Depletions</span>
            <div className="text-2xl font-black font-mono text-rose-600">
              {summary.outOfStockCount} Items
            </div>
            <span className="text-[11px] text-rose-600 font-semibold">Immediate PO required</span>
          </div>
        </div>

        {/* Master Stock Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Boxes className="w-4 h-4 text-emerald-600" /> On-Shelf Stock Levels
            </h3>
            <span className="text-xs font-mono text-slate-400">Auto-synced via Socket.IO</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-mono uppercase text-[11px]">
                <tr>
                  <th className="p-4">PRODUCT / SKU</th>
                  <th className="p-4">DEPARTMENT</th>
                  <th className="p-4 text-right">CURRENT STOCK</th>
                  <th className="p-4 text-right">ALERT THRESHOLD</th>
                  <th className="p-4 text-right">VALUATION (₹)</th>
                  <th className="p-4 text-center">STATUS</th>
                  <th className="p-4 text-center">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inventory.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4">
                      <span className="font-bold text-slate-900 block">{p.name}</span>
                      <span className="text-[10px] font-mono text-slate-400">{p.sku}</span>
                    </td>
                    <td className="p-4 text-slate-600 font-medium">{p.category_name}</td>
                    <td className="p-4 text-right font-mono font-bold text-slate-900">
                      {p.stock} {p.unit}
                    </td>
                    <td className="p-4 text-right font-mono text-slate-500">
                      {p.min_stock_alert} {p.unit}
                    </td>
                    <td className="p-4 text-right font-mono font-bold text-slate-900">
                      ₹{Math.round(p.inventory_value || 0).toLocaleString()}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        p.stock_status === 'OUT_OF_STOCK'
                          ? 'bg-rose-100 text-rose-800'
                          : (p.stock_status === 'LOW_STOCK'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800')
                      }`}>
                        {p.stock_status}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleOpenAdjust(p)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-lg text-xs transition-colors"
                      >
                        Adjust
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FEFO Batch Tracking Section */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden space-y-4 p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-600" /> FEFO (First Expired, First Out) Batch Timeline
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Automated expiration countdown ensures earliest expiring batches are prioritized in POS sales
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-mono uppercase text-[11px]">
                <tr>
                  <th className="p-3">BATCH #</th>
                  <th className="p-3">PRODUCT</th>
                  <th className="p-3 text-right">REMAINING QTY</th>
                  <th className="p-3">EXPIRY DATE</th>
                  <th className="p-3 text-center">DAYS LEFT</th>
                  <th className="p-3 text-center">FEFO STATUS</th>
                  <th className="p-3">RECOMMENDED ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expiryBatches.map((b) => (
                  <tr key={b.batchId} className="hover:bg-slate-50/80">
                    <td className="p-3 font-mono font-bold text-slate-800">{b.batchNumber}</td>
                    <td className="p-3 font-semibold text-slate-900">{b.productName}</td>
                    <td className="p-3 text-right font-mono font-bold">{b.remainingQty} {b.unit}</td>
                    <td className="p-3 font-mono text-slate-600">{b.expiryDate}</td>
                    <td className="p-3 text-center font-mono font-bold">
                      <span className={b.daysUntilExpiry <= 7 ? 'text-rose-600' : 'text-slate-700'}>
                        {b.daysUntilExpiry < 0 ? `${Math.abs(b.daysUntilExpiry)}d ago` : `${b.daysUntilExpiry}d`}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        b.status === 'EXPIRED'
                          ? 'bg-slate-900 text-white'
                          : (b.status === 'CRITICAL_7_DAYS'
                            ? 'bg-rose-500 text-white animate-pulse'
                            : (b.status === 'WARNING_30_DAYS'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'))
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600 text-[11px]">{b.actionRecommendation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stock Adjustment Modal */}
        <Modal
          isOpen={isAdjustModalOpen}
          onClose={() => setIsAdjustModalOpen(false)}
          title="Manual Stock Adjustment"
          maxWidth="sm"
        >
          {selectedProduct && (
            <form onSubmit={handleSaveAdjustment} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="font-bold text-slate-900">{selectedProduct.name}</p>
                <p className="text-[11px] text-slate-500">Current on-shelf: <strong>{selectedProduct.stock} {selectedProduct.unit}</strong></p>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Adjustment Type</label>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-medium"
                >
                  <option value="ADJUSTMENT">Correction (Cycle count audit)</option>
                  <option value="DAMAGE">Damaged / Spoilage Write-Off</option>
                  <option value="EXPIRED">Expired Stock Removal</option>
                  <option value="RESTOCK">Direct Shelf Restock</option>
                </select>
              </div>

              <Input
                label="Quantity Change (+ or -)"
                type="number"
                step="0.001"
                required
                value={adjustQty}
                onChange={(e) => setAdjustQty(parseFloat(e.target.value) || 0)}
                placeholder="e.g. +10 or -2"
              />

              <Input
                label="Audit Reason"
                required
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
              />

              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" type="button" onClick={() => setIsAdjustModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" className="flex-1" type="submit" disabled={adjustQty === 0}>
                  Confirm Adjustment
                </Button>
              </div>
            </form>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
};
