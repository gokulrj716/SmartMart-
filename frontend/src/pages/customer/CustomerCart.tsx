import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Tag,
  ArrowRight,
  ShieldCheck,
  ShoppingBag
} from 'lucide-react';
import { CustomerLayout } from '../../components/layout/CustomerLayout';
import { useCart } from '../../contexts/CartContext';
import { Button } from '../../components/ui/Button';

export const CustomerCart: React.FC = () => {
  const {
    items,
    updateQuantity,
    removeItem,
    clearCart,
    subtotal,
    taxTotal,
    discountTotal,
    couponCode,
    applyCoupon,
    removeCoupon,
    grandTotal,
    itemCount
  } = useCart();

  const navigate = useNavigate();
  const [promoInput, setPromoInput] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError(null);
    const code = promoInput.trim().toUpperCase();

    if (code === 'WELCOME50') {
      if (subtotal >= 300) {
        applyCoupon('WELCOME50', 50);
        setPromoInput('');
      } else {
        setCouponError('Minimum order of ₹300 required for WELCOME50');
      }
    } else if (code === 'SUPERMART10') {
      if (subtotal >= 1000) {
        applyCoupon('SUPERMART10', Math.round(subtotal * 0.10));
        setPromoInput('');
      } else {
        setCouponError('Minimum order of ₹1,000 required for SUPERMART10');
      }
    } else {
      setCouponError('Invalid coupon code. Try WELCOME50 or SUPERMART10');
    }
  };

  if (items.length === 0) {
    return (
      <CustomerLayout>
        <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
          <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <ShoppingCart className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-slate-900">Your Shopping Cart is Empty</h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You haven't added any items to your supermarket basket yet. Explore fresh fruits, vegetables, and daily grocery staples!
          </p>
          <div className="pt-2">
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-6 py-3 rounded-2xl shadow-md transition-all"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Explore Supermarket</span>
            </Link>
          </div>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Shopping Cart</h1>
            <p className="text-xs text-slate-500 mt-1">{itemCount} items in your supermarket cart</p>
          </div>
          <button
            onClick={clearCart}
            className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-4 h-4" /> Clear Cart
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Cart Table Items */}
          <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm divide-y divide-slate-100">
            {items.map((item) => (
              <div key={item.product.id} className="py-4 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                <div className="flex items-center gap-4">
                  <img
                    src={item.product.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200'}
                    alt={item.product.name}
                    className="w-16 h-16 object-cover rounded-2xl bg-slate-50"
                  />
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{item.product.name}</h4>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      ₹{item.unitPrice.toFixed(2)} / {item.product.unit} • GST {item.product.gst_rate}%
                    </p>
                  </div>
                </div>

                {/* Quantity or Weight */}
                <div className="flex items-center gap-4">
                  {item.isWeighted ? (
                    <span className="font-mono font-bold text-xs bg-emerald-50 text-emerald-800 px-3 py-1 rounded-xl border border-emerald-200">
                      {item.quantity.toFixed(3)} {item.product.unit}
                    </span>
                  ) : (
                    <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 p-0.5">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="w-7 h-7 flex items-center justify-center hover:bg-white rounded-lg text-slate-700 transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center font-bold text-xs text-slate-900 font-mono">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="w-7 h-7 flex items-center justify-center hover:bg-white rounded-lg text-slate-700 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <div className="text-right w-24">
                    <span className="font-bold font-mono text-sm text-slate-900 block">
                      ₹{item.total.toFixed(2)}
                    </span>
                  </div>

                  <button
                    onClick={() => removeItem(item.product.id)}
                    className="text-slate-400 hover:text-rose-500 p-1.5 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Right Summary Card & Promo Voucher */}
          <div className="lg:col-span-4 space-y-6">
            {/* Promo Code Card */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-3">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
                <Tag className="w-4 h-4 text-emerald-600" /> Apply Coupon Voucher
              </span>

              {couponCode ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold font-mono text-emerald-900">{couponCode}</span>
                    <p className="text-[11px] text-emerald-700">₹{discountTotal.toFixed(2)} discount applied</p>
                  </div>
                  <button onClick={removeCoupon} className="text-xs text-rose-600 hover:underline font-semibold">
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. WELCOME50"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold uppercase focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="submit"
                      className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                  {couponError && <p className="text-xs text-rose-500 font-medium">{couponError}</p>}
                </form>
              )}
            </div>

            {/* Bill Calculation */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="font-bold text-base text-slate-900">Order Summary</h3>

              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-mono font-bold text-slate-800">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>CGST + SGST (Estimated):</span>
                  <span className="font-mono font-bold text-slate-800">₹{taxTotal.toFixed(2)}</span>
                </div>
                {discountTotal > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Coupon Savings:</span>
                    <span className="font-mono">-₹{discountTotal.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Store Delivery / Pickup:</span>
                  <span className="font-bold text-emerald-600 uppercase">FREE</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-baseline justify-between">
                <span className="text-sm font-bold text-slate-900">Grand Total:</span>
                <span className="text-2xl font-black font-mono text-slate-900">
                  ₹{grandTotal.toFixed(2)}
                </span>
              </div>

              <Button
                variant="primary"
                className="w-full py-3.5 text-sm"
                onClick={() => navigate('/checkout')}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Proceed to Checkout
              </Button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 pt-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Encrypted 256-bit safe and secure checkout</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
};
