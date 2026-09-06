import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  ScanBarcode,
  Camera,
  Scale,
  Plus,
  Minus,
  Trash2,
  User,
  CreditCard,
  Banknote,
  QrCode,
  RotateCcw,
  Sparkles,
  Percent,
  CheckCircle2,
  AlertCircle,
  Clock,
  Printer
} from 'lucide-react';
import { PosLayout } from '../../components/layout/PosLayout';
import { useCart } from '../../contexts/CartContext';
import { useSocket } from '../../contexts/SocketContext';
import { useOffline } from '../../contexts/OfflineContext';
import { api } from '../../api/client';
import { Product, Customer } from '../../types';
import { BarcodeScannerModal } from '../../components/hardware/BarcodeScannerModal';
import { CameraProductAiModal } from '../../components/hardware/CameraProductAiModal';
import { WeighingScaleWidget } from '../../components/hardware/WeighingScaleWidget';
import { PaymentTerminalModal } from '../../components/hardware/PaymentTerminalModal';
import { ThermalReceiptModal } from '../../components/hardware/ThermalReceiptModal';
import { CashierSessionModal } from './CashierSessionModal';
import { PosReturnModal } from './PosReturnModal';

export const CashierPOS: React.FC = () => {
  const {
    items,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    subtotal,
    taxTotal,
    discountTotal,
    grandTotal,
    itemCount
  } = useCart();

  const { emitCustomerDisplaySync } = useSocket();
  const { isOnline, queueSale } = useOffline();

  // Hardware Modals
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [isCameraAiOpen, setIsCameraAiOpen] = useState(false);
  const [isScaleOpen, setIsScaleOpen] = useState(false);
  const [scaleProduct, setScaleProduct] = useState<Product | null>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [receiptText, setReceiptText] = useState<string>('');

  // Cashier Shifts & Returns
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);

  // Search & Catalog
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  // Customer Lookup
  const [customerPhone, setCustomerPhone] = useState('');
  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null);
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);

  // Search input ref for keyboard shortcut F2
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fetch Categories & Products on mount
  useEffect(() => {
    api.get<any>('/categories')
      .then(res => {
        if (res.success) setCategories(res.data);
      })
      .catch(() => {});

    fetchProducts();
  }, [selectedCategory]);

  const fetchProducts = async (searchQuery = '') => {
    setIsLoadingProducts(true);
    try {
      let url = `/products?limit=24`;
      if (selectedCategory !== 'ALL') url += `&category=${selectedCategory}`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;

      const res = await api.get<any>(url);
      if (res.success && res.data) {
        setProducts(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  // Keyboard Shortcuts (F2: Search, F4: Customer, F8: Payment, ESC: Clear)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'F4') {
        e.preventDefault();
        const phoneInput = document.getElementById('customer-phone-input');
        phoneInput?.focus();
      } else if (e.key === 'F8') {
        e.preventDefault();
        if (items.length > 0) setIsPaymentOpen(true);
      } else if (e.key === 'Escape') {
        if (isPaymentOpen) setIsPaymentOpen(false);
        else if (isScannerModalOpen) setIsScannerModalOpen(false);
        else if (isCameraAiOpen) setIsCameraAiOpen(false);
        else if (isScaleOpen) setIsScaleOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items, isPaymentOpen, isScannerModalOpen, isCameraAiOpen, isScaleOpen]);

  // Real-time synchronization to secondary customer display monitor
  useEffect(() => {
    emitCustomerDisplaySync({
      terminalId: 'POS-01',
      items: items.map(i => ({
        name: i.product.name,
        quantity: i.quantity,
        unit: i.product.unit,
        unitPrice: i.unitPrice,
        total: i.total
      })),
      subtotal,
      discount: discountTotal,
      tax: taxTotal,
      grandTotal,
      paymentState: isPaymentOpen ? 'PAYMENT_PENDING' : (items.length > 0 ? 'SCANNING' : 'IDLE')
    });
  }, [items, grandTotal, isPaymentOpen]);

  const handleProductClick = (product: Product) => {
    if (product.is_weighted) {
      setScaleProduct(product);
      setIsScaleOpen(true);
    } else {
      addItem(product, 1);
    }
  };

  const handleCustomerLookup = async () => {
    if (!customerPhone.trim()) return;
    setIsSearchingCustomer(true);
    try {
      const res = await api.get<any>(`/customers/phone/${customerPhone.trim()}`);
      if (res.success && res.data) {
        setActiveCustomer(res.data);
      }
    } catch (e) {
      // Prompt customer auto-enrollment
      try {
        const createRes = await api.post<any>('/customers', {
          name: `Guest (${customerPhone.slice(-4)})`,
          phone: customerPhone.trim()
        });
        if (createRes.success) {
          setActiveCustomer(createRes.data);
        }
      } catch (err) {
        console.error(err);
      }
    } finally {
      setIsSearchingCustomer(false);
    }
  };

  const handlePaymentSuccess = async (method: 'CASH' | 'UPI' | 'CARD', tendered = grandTotal) => {
    setIsPaymentOpen(false);

    const salePayload = {
      customerId: activeCustomer?.id || null,
      paymentMethod: method,
      items: items.map(i => ({
        productId: i.product.id,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        discountAmount: i.discountAmount
      })),
      discountAmount: discountTotal,
      amountTendered: tendered,
      idempotencyKey: `TXN-${Date.now()}-${Math.floor(Math.random() * 10000)}`
    };

    if (isOnline) {
      try {
        const res = await api.post<any>('/pos/checkout', salePayload);
        if (res.success && res.data) {
          setReceiptData(res.data);
          setReceiptText(res.data.receipt || '');
          setIsReceiptOpen(true);
          clearCart();
          setActiveCustomer(null);
          setCustomerPhone('');
        }
      } catch (err: any) {
        alert('Checkout error: ' + err.message);
      }
    } else {
      // Offline fallback queue
      const queued = await queueSale({
        invoiceNumber: `OFF-${Date.now().toString().slice(-8)}`,
        customerId: activeCustomer?.id || undefined,
        items: items.map(i => ({
          productId: i.product.id,
          name: i.product.name,
          sku: i.product.sku,
          unit: i.product.unit,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          total: i.total
        })),
        subtotal,
        discountAmount: discountTotal,
        taxAmount: taxTotal,
        totalAmount: grandTotal,
        paymentMethod: method
      });

      alert(`Offline mode active. Sale recorded in offline queue (${queued.invoiceNumber}).`);
      clearCart();
    }
  };

  return (
    <PosLayout
      onOpenSessionModal={() => setIsSessionModalOpen(true)}
      onOpenReturnModal={() => setIsReturnModalOpen(true)}
    >
      <div className="h-full flex overflow-hidden">
        {/* ==================================================== */}
        {/* LEFT COLUMN: Product Catalog, Search & Hardware Tools */}
        {/* ==================================================== */}
        <div className="w-5/12 border-r border-slate-800 flex flex-col bg-slate-900/60 shrink-0">
          {/* Top Search & Hardware Action Bar */}
          <div className="p-3 border-b border-slate-800 space-y-2 bg-slate-950">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search products [F2] or enter barcode..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  fetchProducts(e.target.value);
                }}
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-emerald-500 font-medium placeholder:text-slate-500"
              />
            </div>

            {/* Hardware Trigger Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setIsScannerModalOpen(true)}
                className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
              >
                <ScanBarcode className="w-3.5 h-3.5 text-emerald-400" />
                <span>Barcode Scanner</span>
              </button>

              <button
                onClick={() => setIsCameraAiOpen(true)}
                className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
              >
                <Camera className="w-3.5 h-3.5 text-sky-400" />
                <span>AI Vision Scan</span>
              </button>
            </div>
          </div>

          {/* Department / Category Pills */}
          <div className="px-3 py-2 border-b border-slate-800 overflow-x-auto flex gap-1.5 bg-slate-950/40">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                selectedCategory === 'ALL'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              All Items
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Touch-Friendly Product Grid */}
          <div className="flex-1 overflow-y-auto p-3">
            <div className="grid grid-cols-3 gap-2.5">
              {products.map(product => (
                <button
                  key={product.id}
                  onClick={() => handleProductClick(product)}
                  className="bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 hover:border-emerald-500 rounded-xl p-2.5 text-left flex flex-col justify-between transition-all duration-150 active:scale-95 group relative"
                >
                  {product.is_weighted ? (
                    <span className="absolute top-1.5 right-1.5 bg-amber-500/90 text-slate-950 font-black text-[9px] px-1 py-0.2 rounded flex items-center gap-0.5">
                      <Scale className="w-2.5 h-2.5" /> WEIGHT
                    </span>
                  ) : null}

                  <div>
                    <span className="text-[10px] text-slate-400 font-mono block truncate">
                      {product.plu_code ? `PLU: ${product.plu_code}` : product.sku}
                    </span>
                    <h5 className="font-bold text-xs text-slate-100 line-clamp-2 mt-0.5 leading-snug group-hover:text-emerald-400">
                      {product.name}
                    </h5>
                  </div>

                  <div className="mt-2 flex items-baseline justify-between pt-1 border-t border-slate-700/60">
                    <span className="font-mono font-extrabold text-sm text-emerald-400">
                      ₹{product.price.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-400">/{product.unit}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ==================================================== */}
        {/* CENTER COLUMN: Active Shopping Cart & Line Items */}
        {/* ==================================================== */}
        <div className="flex-1 flex flex-col bg-slate-900 border-r border-slate-800">
          {/* Cart Header */}
          <div className="h-12 bg-slate-950 px-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-slate-300 uppercase tracking-wider">
                Cart Items ({itemCount})
              </span>
            </div>

            {items.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-semibold transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear All
              </button>
            )}
          </div>

          {/* Table Headers */}
          <div className="grid grid-cols-12 px-4 py-2 bg-slate-950/60 border-b border-slate-800 text-[11px] font-mono text-slate-400">
            <div className="col-span-5">PRODUCT NAME</div>
            <div className="col-span-2 text-right">UNIT PRICE</div>
            <div className="col-span-3 text-center">QUANTITY</div>
            <div className="col-span-2 text-right">TOTAL</div>
          </div>

          {/* Cart Items List Scrollable */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500">
                <ScanBarcode className="w-12 h-12 stroke-1 mb-2 text-slate-600" />
                <p className="text-xs font-semibold text-slate-400">POS Cart is Empty</p>
                <p className="text-[11px] text-slate-600 mt-1">Scan barcode, weigh produce, or select products</p>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.product.id}
                  className="grid grid-cols-12 px-4 py-3 items-center hover:bg-slate-800/40 text-xs transition-colors"
                >
                  {/* Name & Unit */}
                  <div className="col-span-5 pr-2">
                    <p className="font-bold text-slate-100 truncate">{item.product.name}</p>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {item.product.sku} • GST {item.product.gst_rate}%
                    </span>
                  </div>

                  {/* Unit Price */}
                  <div className="col-span-2 text-right font-mono text-slate-300">
                    ₹{item.unitPrice.toFixed(2)}
                  </div>

                  {/* Quantity Controls */}
                  <div className="col-span-3 flex items-center justify-center gap-1.5">
                    {item.product.is_weighted ? (
                      <span className="font-mono font-bold text-emerald-400 bg-slate-800 px-2 py-1 rounded text-xs border border-slate-700">
                        {item.quantity.toFixed(3)} {item.product.unit}
                      </span>
                    ) : (
                      <>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center font-mono font-bold text-white text-xs">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Row Total & Delete */}
                  <div className="col-span-2 text-right flex items-center justify-end gap-2 font-mono font-bold text-slate-100">
                    <span>₹{item.total.toFixed(2)}</span>
                    <button
                      onClick={() => removeItem(item.product.id)}
                      className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ==================================================== */}
        {/* RIGHT COLUMN: Customer Lookup, Totals & Immediate Payment */}
        {/* ==================================================== */}
        <div className="w-80 bg-slate-950 flex flex-col justify-between shrink-0 p-4">
          <div className="space-y-4">
            {/* Customer Loyalty Phone Lookup [F4] */}
            <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-emerald-400" /> Customer Loyalty [F4]
                </span>
                {activeCustomer && (
                  <span className="text-[10px] font-mono text-amber-400">
                    {activeCustomer.loyalty_points} Pts ({activeCustomer.loyalty_tier})
                  </span>
                )}
              </div>

              {activeCustomer ? (
                <div className="flex items-center justify-between text-xs bg-slate-800/80 p-2 rounded-xl">
                  <div>
                    <p className="font-bold text-slate-100">{activeCustomer.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{activeCustomer.phone}</p>
                  </div>
                  <button
                    onClick={() => setActiveCustomer(null)}
                    className="text-[10px] text-rose-400 hover:underline"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div className="flex gap-1.5">
                  <input
                    id="customer-phone-input"
                    type="tel"
                    placeholder="Enter phone number..."
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    onClick={handleCustomerLookup}
                    disabled={isSearchingCustomer}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-colors"
                  >
                    {isSearchingCustomer ? '...' : 'Add'}
                  </button>
                </div>
              )}
            </div>

            {/* Bill Summary Figures */}
            <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span className="font-mono text-slate-200">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Tax (CGST + SGST)</span>
                <span className="font-mono text-slate-200">₹{taxTotal.toFixed(2)}</span>
              </div>
              {discountTotal > 0 && (
                <div className="flex justify-between text-rose-400 font-semibold">
                  <span>Savings / Discount</span>
                  <span className="font-mono">-₹{discountTotal.toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* High-Contrast Grand Total */}
            <div className="bg-emerald-950/60 border-2 border-emerald-500/80 p-4 rounded-2xl text-center shadow-lg">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400 block mb-0.5">
                GRAND TOTAL DUE
              </span>
              <div className="text-4xl font-black font-mono tracking-tight text-white drop-shadow-[0_0_12px_rgba(16,185,129,0.3)]">
                ₹{grandTotal.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Quick Payment Action Buttons */}
          <div className="space-y-2 pt-4 border-t border-slate-800">
            <button
              onClick={() => {
                if (items.length > 0) setIsPaymentOpen(true);
              }}
              disabled={items.length === 0}
              className="w-full bg-emerald-600 hover:bg-emerald-500 active:scale-98 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold text-sm py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>COLLECT PAYMENT [F8]</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  if (items.length > 0) handlePaymentSuccess('CASH');
                }}
                disabled={items.length === 0}
                className="py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Banknote className="w-4 h-4 text-emerald-400" />
                <span>Quick Cash</span>
              </button>

              <button
                onClick={() => {
                  if (items.length > 0) handlePaymentSuccess('UPI');
                }}
                disabled={items.length === 0}
                className="py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <QrCode className="w-4 h-4 text-sky-400" />
                <span>Quick UPI</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hardware Modals */}
      <BarcodeScannerModal
        isOpen={isScannerModalOpen}
        onClose={() => setIsScannerModalOpen(false)}
      />

      <CameraProductAiModal
        isOpen={isCameraAiOpen}
        onClose={() => setIsCameraAiOpen(false)}
      />

      <WeighingScaleWidget
        isOpen={isScaleOpen}
        onClose={() => setIsScaleOpen(false)}
        product={scaleProduct}
      />

      <PaymentTerminalModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        grandTotal={grandTotal}
        onPaymentSuccess={handlePaymentSuccess}
      />

      <ThermalReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        receiptText={receiptText}
        invoiceData={receiptData}
      />

      {/* Shift Register & Return Modals */}
      <CashierSessionModal
        isOpen={isSessionModalOpen}
        onClose={() => setIsSessionModalOpen(false)}
      />

      <PosReturnModal
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
      />
    </PosLayout>
  );
};
