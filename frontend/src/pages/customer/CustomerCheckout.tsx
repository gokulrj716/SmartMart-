import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  Truck,
  Store,
  CreditCard,
  QrCode,
  Banknote,
  ShieldCheck,
  ArrowRight,
  ShoppingBag
} from 'lucide-react';
import { CustomerLayout } from '../../components/layout/CustomerLayout';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../api/client';
import { Button } from '../../components/ui/Button';

export const CustomerCheckout: React.FC = () => {
  const { items, clearCart, subtotal, taxTotal, discountTotal, grandTotal } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [fulfillmentType, setFulfillmentType] = useState<'DELIVERY' | 'PICKUP'>('DELIVERY');
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CARD' | 'CASH'>('UPI');
  const [address, setAddress] = useState('Flat 402, Green Meadows Residency, Outer Ring Road, Bengaluru, 560102');
  const [phone, setPhone] = useState('9812345678');
  const [name, setName] = useState(user?.name || 'Swetha K');
  const [isPlacing, setIsPlacing] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState<any | null>(null);

  const handlePlaceOrder = async () => {
    setIsPlacing(true);
    try {
      const payload = {
        customerId: user?.id || null,
        paymentMethod,
        items: items.map(i => ({
          productId: i.product.id,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          discountAmount: i.discountAmount
        })),
        discountAmount: discountTotal,
        notes: `${fulfillmentType} - ${address}`,
        idempotencyKey: `CUST-${Date.now()}-${Math.floor(Math.random() * 10000)}`
      };

      const res = await api.post<any>('/pos/checkout', payload);
      if (res.success && res.data) {
        setOrderConfirmed(res.data);
        clearCart();

        // Fire celebration confetti!
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    } catch (err: any) {
      alert(err.message || 'Failed to place order.');
    } finally {
      setIsPlacing(false);
    }
  };

  if (orderConfirmed) {
    return (
      <CustomerLayout>
        <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-lg animate-bounce">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <h2 className="text-3xl font-black text-slate-900">Order Confirmed!</h2>
            <p className="text-xs text-slate-500 mt-1">Invoice #{orderConfirmed.invoiceNumber}</p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm text-left space-y-3 text-xs">
            <div className="flex justify-between pb-3 border-b border-slate-100">
              <span className="font-bold text-slate-800">Fulfillment Mode:</span>
              <span className="font-mono text-emerald-700 font-semibold">{fulfillmentType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Amount Paid:</span>
              <span className="font-mono font-bold text-slate-900 text-sm">₹{orderConfirmed.totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Payment Mode:</span>
              <span className="font-bold text-slate-800">{orderConfirmed.paymentMethod}</span>
            </div>
            <div className="flex justify-between text-amber-700 font-bold">
              <span>Loyalty Points Earned:</span>
              <span className="font-mono">+{orderConfirmed.loyaltyEarned} Points</span>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <Link
              to="/orders"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-6 py-3 rounded-2xl shadow-md transition-all"
            >
              View My Orders
            </Link>
            <Link
              to="/"
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-6 py-3 rounded-2xl transition-all"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Express Checkout</h1>
          <p className="text-xs text-slate-500 mt-1">Complete your order with flexible delivery and payment options</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          <div className="md:col-span-7 space-y-6">
            {/* Fulfillment Type */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
                1. Fulfillment Option
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFulfillmentType('DELIVERY')}
                  className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                    fulfillmentType === 'DELIVERY'
                      ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Truck className="w-5 h-5 text-emerald-600 mb-2" />
                  <div>
                    <h5 className="font-bold text-xs text-slate-900">Home Express Delivery</h5>
                    <p className="text-[11px] text-slate-500 mt-0.5">Delivered within 30-45 mins</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFulfillmentType('PICKUP')}
                  className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                    fulfillmentType === 'PICKUP'
                      ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Store className="w-5 h-5 text-sky-600 mb-2" />
                  <div>
                    <h5 className="font-bold text-xs text-slate-900">Store Express Pickup</h5>
                    <p className="text-[11px] text-slate-500 mt-0.5">Ready for counter pickup in 15 mins</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Address & Contact */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
                2. Contact & Address
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Mobile Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {fulfillmentType === 'DELIVERY' && (
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Delivery Address</label>
                    <textarea
                      rows={2}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
                3. Payment Method
              </h3>

              <div className="space-y-2">
                {[
                  { id: 'UPI', label: 'Instant UPI (Google Pay, PhonePe, Paytm)', icon: <QrCode className="w-4 h-4 text-sky-600" /> },
                  { id: 'CARD', label: 'Credit or Debit Card', icon: <CreditCard className="w-4 h-4 text-indigo-600" /> },
                  { id: 'CASH', label: 'Cash on Delivery (COD)', icon: <Banknote className="w-4 h-4 text-emerald-600" /> }
                ].map((pm) => (
                  <label
                    key={pm.id}
                    onClick={() => setPaymentMethod(pm.id as any)}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                      paymentMethod === pm.id
                        ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20 font-bold text-emerald-950'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 text-xs">
                      {pm.icon}
                      <span>{pm.label}</span>
                    </div>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      paymentMethod === pm.id ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300'
                    }`}>
                      {paymentMethod === pm.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Right Summary */}
          <div className="md:col-span-5 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-slate-900">Review & Pay</h3>

            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Items Subtotal:</span>
                <span className="font-mono font-bold text-slate-800">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>CGST + SGST:</span>
                <span className="font-mono font-bold text-slate-800">₹{taxTotal.toFixed(2)}</span>
              </div>
              {discountTotal > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Discount Applied:</span>
                  <span className="font-mono">-₹{discountTotal.toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-baseline justify-between">
              <span className="text-sm font-bold text-slate-900">Total Payable:</span>
              <span className="text-2xl font-black font-mono text-slate-900">
                ₹{grandTotal.toFixed(2)}
              </span>
            </div>

            <Button
              variant="primary"
              className="w-full py-3.5 text-sm"
              onClick={handlePlaceOrder}
              isLoading={isPlacing}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Place Supermarket Order
            </Button>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
};
