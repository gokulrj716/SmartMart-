import React, { useState, useEffect } from 'react';
import { ShoppingBag, CheckCircle, Clock, QrCode } from 'lucide-react';
import { io } from 'socket.io-client';

export const CustomerDisplay: React.FC = () => {
  const [displayData, setDisplayData] = useState<any>({
    terminalId: 'POS-01',
    items: [],
    subtotal: 0,
    discount: 0,
    tax: 0,
    grandTotal: 0,
    paymentState: 'IDLE'
  });

  useEffect(() => {
    // Listen to real-time cart broadcast on WebSocket
    const socket = io(window.location.origin, {
      transports: ['websocket', 'polling']
    });

    socket.on('customer-display:update', (payload: any) => {
      setDisplayData(payload);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-white font-sans select-none overflow-hidden">
      {/* Top Header Banner */}
      <header className="h-20 bg-slate-900 border-b border-slate-800 px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shadow-emerald-500/20">
            <ShoppingBag className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              SMART<span className="text-emerald-400">MART</span>
            </h1>
            <p className="text-xs text-slate-400">Welcome to SmartMart Supermarket • Counter 01</p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-sm bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700">
          <Clock className="w-4 h-4 text-emerald-400" />
          <span>{new Date().toLocaleTimeString()}</span>
        </div>
      </header>

      {/* Main Dual-Screen Content */}
      <div className="flex-1 flex overflow-hidden p-8 gap-8">
        {/* Left Side: Real-time Itemized Bill */}
        <div className="flex-1 bg-slate-900/90 rounded-3xl border border-slate-800 flex flex-col overflow-hidden shadow-2xl">
          <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900">
            <h3 className="font-bold text-lg text-slate-200">Your Basket</h3>
            <span className="text-xs font-mono bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full font-bold">
              {displayData.items?.length || 0} Items
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/80 p-4">
            {(!displayData.items || displayData.items.length === 0) ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500">
                <ShoppingBag className="w-16 h-16 stroke-1 text-slate-700 mb-3" />
                <h4 className="text-xl font-bold text-slate-400">Welcome!</h4>
                <p className="text-sm text-slate-600 mt-1">Cashier is scanning your items...</p>
              </div>
            ) : (
              displayData.items.map((item: any, idx: number) => (
                <div key={idx} className="py-3.5 flex items-center justify-between text-sm">
                  <div>
                    <p className="font-bold text-base text-slate-100">{item.name}</p>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      {item.quantity} {item.unit} x ₹{item.unitPrice.toFixed(2)}
                    </p>
                  </div>
                  <div className="font-mono font-extrabold text-lg text-emerald-400">
                    ₹{item.total.toFixed(2)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Totals, Dynamic UPI QR Code, and Payment State */}
        <div className="w-[420px] flex flex-col justify-between gap-6 shrink-0">
          {/* Bill Summary Card */}
          <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-6 space-y-4 shadow-xl">
            <div className="space-y-2 text-sm text-slate-300">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-mono font-bold text-white">₹{displayData.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>GST Tax:</span>
                <span className="font-mono font-bold text-white">₹{displayData.tax.toFixed(2)}</span>
              </div>
              {displayData.discount > 0 && (
                <div className="flex justify-between text-rose-400 font-bold">
                  <span>Savings Applied:</span>
                  <span className="font-mono">-₹{displayData.discount.toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Huge Grand Total Display */}
            <div className="pt-4 border-t border-slate-800 text-center">
              <span className="text-xs font-mono font-extrabold uppercase tracking-widest text-emerald-400 block mb-1">
                AMOUNT PAYABLE
              </span>
              <div className="text-6xl font-black font-mono tracking-tight text-white drop-shadow-[0_0_20px_rgba(52,211,153,0.4)]">
                ₹{displayData.grandTotal.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Payment Status / QR Card */}
          <div className="flex-1 bg-gradient-to-br from-emerald-950 to-slate-900 rounded-3xl border-2 border-emerald-500/50 p-6 flex flex-col items-center justify-center text-center shadow-2xl">
            {displayData.paymentState === 'PAID' ? (
              <div className="space-y-3">
                <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto animate-bounce" />
                <h3 className="text-2xl font-black text-white">Payment Received!</h3>
                <p className="text-xs text-emerald-300">Thank you for shopping at SmartMart!</p>
              </div>
            ) : displayData.grandTotal > 0 ? (
              <div className="space-y-3">
                <div className="w-36 h-36 bg-white p-2.5 rounded-2xl mx-auto shadow-md flex items-center justify-center">
                  <div className="w-full h-full bg-slate-900 rounded-lg flex items-center justify-center text-white text-[9px] font-mono p-1">
                    [PAY VIA UPI]<br />
                    smartmart@icici<br />
                    ₹{displayData.grandTotal.toFixed(2)}
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">Scan & Pay using any UPI App</h4>
                  <p className="text-xs text-emerald-300 font-mono mt-0.5">GPay • PhonePe • Paytm</p>
                </div>
              </div>
            ) : (
              <div className="text-slate-500 space-y-2">
                <QrCode className="w-12 h-12 mx-auto stroke-1" />
                <p className="text-xs font-semibold">Payment terminal standby</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
