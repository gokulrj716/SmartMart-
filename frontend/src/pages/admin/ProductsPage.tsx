import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  Barcode,
  Edit,
  Trash2,
  Printer,
  Scale,
  Sparkles,
  Check,
  Filter
} from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { api } from '../../api/client';
import { Product, Category } from '../../types';

export const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
  const [activeBarcodeProduct, setActiveBarcodeProduct] = useState<Product | null>(null);
  const [generatedBarcode, setGeneratedBarcode] = useState<string>('');

  // Form State
  const [formData, setFormData] = useState<any>({
    name: '',
    sku: '',
    barcode: '',
    category_id: '',
    unit: 'piece',
    price: 0,
    cost_price: 0,
    mrp: 0,
    gst_rate: 5,
    stock: 10,
    min_stock_alert: 5,
    is_weighted: false,
    plu_code: ''
  });

  useEffect(() => {
    api.get<any>('/categories')
      .then(res => {
        if (res.success) setCategories(res.data);
      })
      .catch(() => {});
    fetchProducts();
  }, [selectedCategory]);

  const fetchProducts = async (query = searchTerm) => {
    setIsLoading(true);
    try {
      let url = '/products?limit=100';
      if (selectedCategory) url += `&category=${selectedCategory}`;
      if (query) url += `&search=${encodeURIComponent(query)}`;

      const res = await api.get<any>(url);
      if (res.success && res.data) {
        setProducts(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post<any>('/products', formData);
      if (res.success) {
        setIsAddModalOpen(false);
        fetchProducts();
      }
    } catch (err: any) {
      alert('Error creating product: ' + err.message);
    }
  };

  const handleOpenBarcodeGenerator = async (p: Product) => {
    setActiveBarcodeProduct(p);
    try {
      const res = await api.post<any>('/products/generate-barcode', { productId: p.id, sku: p.sku });
      if (res.success) {
        setGeneratedBarcode(res.barcode);
        setIsBarcodeModalOpen(true);
      }
    } catch (err: any) {
      alert('Failed to generate internal barcode');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Product Management</h1>
            <p className="text-xs text-slate-500 mt-1">
              Maintain product catalog, pricing, SKU codes, GST brackets, and internal barcode generation
            </p>
          </div>

          <Button
            variant="primary"
            onClick={() => setIsAddModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add New Product
          </Button>
        </div>

        {/* Search and Filters Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by product name, SKU, or barcode..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                fetchProducts(e.target.value);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Departments</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-mono uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-4">PRODUCT / SKU</th>
                  <th className="p-4">DEPARTMENT</th>
                  <th className="p-4">BARCODE / PLU</th>
                  <th className="p-4 text-right">PRICE (₹)</th>
                  <th className="p-4 text-right">COST (₹)</th>
                  <th className="p-4 text-right">STOCK</th>
                  <th className="p-4 text-center">GST %</th>
                  <th className="p-4 text-center">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=100'}
                          alt={p.name}
                          className="w-9 h-9 rounded-xl object-cover bg-slate-100"
                        />
                        <div>
                          <span className="font-bold text-slate-900 block">{p.name}</span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {p.sku} {p.is_weighted ? '• Weighted' : ''}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 text-slate-600 font-medium">
                      {p.category_name || 'General'}
                    </td>

                    <td className="p-4 font-mono text-slate-600">
                      {p.barcode || (
                        <span className="text-slate-400 italic">No Barcode</span>
                      )}
                      {p.plu_code && <span className="block text-[10px] text-emerald-600 font-bold">PLU: {p.plu_code}</span>}
                    </td>

                    <td className="p-4 text-right font-mono font-bold text-slate-900">
                      ₹{p.price.toFixed(2)}
                    </td>

                    <td className="p-4 text-right font-mono text-slate-500">
                      ₹{p.cost_price.toFixed(2)}
                    </td>

                    <td className="p-4 text-right font-mono">
                      <span className={`font-bold px-2 py-0.5 rounded-lg ${
                        p.stock <= p.min_stock_alert
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        {p.stock} {p.unit}
                      </span>
                    </td>

                    <td className="p-4 text-center font-mono text-slate-600">
                      {p.gst_rate}%
                    </td>

                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenBarcodeGenerator(p)}
                          title="Generate Printable Barcode Sticker"
                          className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        >
                          <Barcode className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Printable Barcode Label Modal */}
        <Modal
          isOpen={isBarcodeModalOpen}
          onClose={() => setIsBarcodeModalOpen(false)}
          title="Printable Barcode Label"
          maxWidth="sm"
        >
          {activeBarcodeProduct && (
            <div className="space-y-4 text-center">
              {/* Authentic Printable Supermarket Barcode Label */}
              <div className="p-6 bg-white border-2 border-dashed border-slate-400 rounded-2xl shadow-inner font-mono space-y-2">
                <h4 className="font-extrabold text-sm text-slate-900 uppercase">
                  SMARTMART SUPERMARKET
                </h4>
                <p className="text-xs font-bold text-slate-700">{activeBarcodeProduct.name}</p>
                <p className="text-[11px] text-slate-500">SKU: {activeBarcodeProduct.sku}</p>

                {/* Barcode Lines Representation */}
                <div className="py-2">
                  <div className="h-12 w-full bg-slate-950 flex items-center justify-center text-white tracking-widest font-mono text-xs">
                    ||| | ||| |||| | || | |||
                  </div>
                  <span className="text-xs font-bold font-mono tracking-widest text-slate-900 block mt-1">
                    {generatedBarcode || activeBarcodeProduct.barcode || '2009240012'}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-xs">
                  <span>PRICE (INCL. GST):</span>
                  <span className="text-sm">₹{activeBarcodeProduct.price.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setIsBarcodeModalOpen(false)}>
                  Close
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={() => window.print()}
                  leftIcon={<Printer className="w-4 h-4" />}
                >
                  Print Sticker
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Add Product Modal */}
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Add New Supermarket Product"
          maxWidth="lg"
        >
          <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Product Name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Fresh Brown Bread"
              />
              <Input
                label="Internal SKU"
                required
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="e.g. SM-BAK-BRD"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Department / Category</label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium"
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Selling Unit</label>
                <select
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium"
                >
                  <option value="piece">piece</option>
                  <option value="kg">kg</option>
                  <option value="g">g</option>
                  <option value="litre">litre</option>
                  <option value="ml">ml</option>
                  <option value="pack">pack</option>
                  <option value="box">box</option>
                  <option value="dozen">dozen</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Input
                label="Selling Price (₹)"
                type="number"
                step="0.01"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
              />
              <Input
                label="Cost Price (₹)"
                type="number"
                step="0.01"
                value={formData.cost_price}
                onChange={(e) => setFormData({ ...formData, cost_price: parseFloat(e.target.value) || 0 })}
              />
              <Input
                label="MRP (₹)"
                type="number"
                step="0.01"
                value={formData.mrp}
                onChange={(e) => setFormData({ ...formData, mrp: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Input
                label="Initial Stock"
                type="number"
                step="0.001"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: parseFloat(e.target.value) || 0 })}
              />
              <Input
                label="Min Stock Alert"
                type="number"
                value={formData.min_stock_alert}
                onChange={(e) => setFormData({ ...formData, min_stock_alert: parseFloat(e.target.value) || 0 })}
              />
              <div>
                <label className="font-bold text-slate-700 block mb-1">GST Tax Rate</label>
                <select
                  value={formData.gst_rate}
                  onChange={(e) => setFormData({ ...formData, gst_rate: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium"
                >
                  <option value="0">0% (Fresh / Exempt)</option>
                  <option value="5">5% (Staples)</option>
                  <option value="12">12% (Packaged Food)</option>
                  <option value="18">18% (Standard Goods)</option>
                  <option value="28">28% (Luxury / Sodas)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="weighted-check"
                checked={formData.is_weighted}
                onChange={(e) => setFormData({ ...formData, is_weighted: e.target.checked })}
                className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
              />
              <label htmlFor="weighted-check" className="font-semibold text-slate-800">
                Is this a weight-based product sold on electronic weighing scales?
              </label>
            </div>

            <div className="flex gap-3 pt-3 border-t border-slate-100">
              <Button variant="outline" className="flex-1" type="button" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" className="flex-1" type="submit">
                Save Product
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </AdminLayout>
  );
};
