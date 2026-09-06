import React, { useState, useEffect } from 'react';
import { CreditCard, QrCode, Banknote, ShieldCheck, CheckCircle2, ArrowRight, Loader2, RefreshCw } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { QrCodeViewer } from '../ui/QrCodeViewer';
import { api } from '../../api/client';

export interface PaymentTerminalModalProps {
  isOpen: boolean;
  onClose: () => void;
  grandTotal: number;
  invoiceNumber?: string;
  onPaymentSuccess: (method: 'CASH' | 'UPI' | 'CARD', amountTendered?: number) => void;
}

interface PaymentQrSettings {
  vpa: string;
  merchantName: string;
  mode: 'DYNAMIC_UPI' | 'CUSTOM_IMAGE';
  qrImageUrl: string | null;
  currency: string;
}

export const PaymentTerminalModal: React.FC<PaymentTerminalModalProps> = ({
  isOpen,
  onClose,
  grandTotal,
  invoiceNumber = `INV-${Date.now().toString().slice(-6)}`,
  onPaymentSuccess
}) => {
  const [method, setMethod] = useState<'CASH' | 'UPI' | 'CARD'>('CASH');
  const [tendered, setTendered] = useState<number>(grandTotal);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardStage, setCardStage] = useState<'READY' | 'PIN_ENTERED' | 'AUTHORIZED'>('READY');
  const [qrSettings, setQrSettings] = useState<PaymentQrSettings>({
    vpa: 'smartmart@icici',
    merchantName: 'SmartMart Supermarket',
    mode: 'DYNAMIC_UPI',
    qrImageUrl: null,
    currency: 'INR'
  });
  const [isLoadingQr, setIsLoadingQr] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsLoadingQr(true);
      api.get<{ success: boolean; data: PaymentQrSettings }>('/settings/payment-qr')
        .then(res => {
          if (res && res.data) {
            setQrSettings(res.data);
          }
        })
        .catch(err => {
          console.warn('Failed to load payment QR settings, using defaults', err);
        })
        .finally(() => {
          setIsLoadingQr(false);
        });
    }
  }, [isOpen]);

  const changeDue = Math.max(0, Number((tendered - grandTotal).toFixed(2)));

  const handleAddDenomination = (val: number) => {
    setTendered(prev => prev + val);
  };

  const handleProcessPayment = () => {
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      onPaymentSuccess(method, tendered);
    }, 1200);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Payment Processing Terminal" maxWidth="lg">
      <div className="space-y-5">
        {/* Total Banner */}
        <div className="bg-slate-900 text-white p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs text-slate-400 font-medium">TOTAL AMOUNT DUE</span>
            <div className="text-3xl font-extrabold font-mono text-emerald-400">
              ₹{grandTotal.toFixed(2)}
            </div>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-slate-400 block">INVOICE NUMBER</span>
            <span className="font-mono text-xs font-semibold bg-slate-800 px-2 py-1 rounded text-slate-200">
              {invoiceNumber}
            </span>
          </div>
        </div>

        {/* Payment Method Selector Tabs */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setMethod('CASH')}
            className={`p-3.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
              method === 'CASH'
                ? 'border-emerald-600 bg-emerald-50/70 text-emerald-900 ring-2 ring-emerald-500/20 shadow-sm'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Banknote className="w-5 h-5 text-emerald-600" />
            <span className="text-xs font-bold">Cash</span>
          </button>

          <button
            onClick={() => setMethod('UPI')}
            className={`p-3.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
              method === 'UPI'
                ? 'border-emerald-600 bg-emerald-50/70 text-emerald-900 ring-2 ring-emerald-500/20 shadow-sm'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <QrCode className="w-5 h-5 text-sky-600" />
            <span className="text-xs font-bold">UPI Dynamic QR</span>
          </button>

          <button
            onClick={() => setMethod('CARD')}
            className={`p-3.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
              method === 'CARD'
                ? 'border-emerald-600 bg-emerald-50/70 text-emerald-900 ring-2 ring-emerald-500/20 shadow-sm'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <CreditCard className="w-5 h-5 text-indigo-600" />
            <span className="text-xs font-bold">Card (EMV/NFC)</span>
          </button>
        </div>

        {/* 1. Cash Calculation Interface */}
        {method === 'CASH' && (
          <div className="space-y-4 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1">
                Cash Tendered by Customer (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-lg font-bold text-slate-400">₹</span>
                <input
                  type="number"
                  step="1"
                  value={tendered}
                  onChange={(e) => setTendered(parseFloat(e.target.value) || 0)}
                  className="w-full pl-8 pr-4 py-2 text-xl font-bold font-mono bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            {/* Fast Denominations */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTendered(grandTotal)}
                className="px-2.5 py-1 text-xs font-semibold bg-white border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-700"
              >
                Exact (₹{grandTotal.toFixed(0)})
              </button>
              {[100, 200, 500, 2000].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleAddDenomination(val)}
                  className="px-2.5 py-1 text-xs font-semibold bg-white border border-slate-200 rounded-lg hover:bg-emerald-50 hover:border-emerald-300 text-slate-700"
                >
                  +{val}
                </button>
              ))}
            </div>

            {/* Change Due Display */}
            <div className="p-3.5 bg-emerald-100/60 border border-emerald-300/80 rounded-xl flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-950">Change to Return:</span>
              <span className="text-2xl font-extrabold font-mono text-emerald-900">
                ₹{changeDue.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* 2. Dynamic UPI QR Interface */}
        {method === 'UPI' && (
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200/80 text-center space-y-4">
            {isLoadingQr ? (
              <div className="w-48 h-48 mx-auto flex flex-col items-center justify-center gap-2 bg-white rounded-2xl border border-slate-200">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                <span className="text-xs text-slate-500 font-medium">Loading QR code...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <QrCodeViewer
                  value={`upi://pay?pa=${encodeURIComponent(qrSettings.vpa)}&pn=${encodeURIComponent(qrSettings.merchantName)}&am=${grandTotal.toFixed(2)}&cu=${qrSettings.currency || 'INR'}&tn=${encodeURIComponent('SmartMart ' + invoiceNumber)}`}
                  customImageUrl={qrSettings.mode === 'CUSTOM_IMAGE' ? qrSettings.qrImageUrl : null}
                  size={190}
                  label={qrSettings.merchantName}
                  sublabel={`UPI ID: ${qrSettings.vpa}`}
                />
              </div>
            )}
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-sky-50 border border-sky-200 text-sky-800 rounded-full text-xs font-semibold mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
                <span>Locked Amount: ₹{grandTotal.toFixed(2)}</span>
              </div>
              <p className="text-xs font-bold text-slate-800">Scan using any UPI App (GPay, PhonePe, Paytm, BHIM)</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Payment automatically binds to Invoice <span className="font-mono font-semibold">{invoiceNumber}</span></p>
            </div>
          </div>
        )}

        {/* 3. Card EMV Terminal Handshake Interface */}
        {method === 'CARD' && (
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200/80 text-center space-y-3">
            <div className="w-16 h-16 bg-indigo-100 text-indigo-700 rounded-2xl mx-auto flex items-center justify-center">
              <CreditCard className="w-8 h-8" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">EMV Terminal Ready</h4>
              <p className="text-xs text-slate-500 mt-1">Insert chip card or tap for contactless payment</p>
            </div>
            <div className="flex justify-center gap-3 pt-2 text-[11px] font-mono text-slate-400">
              <span>VISA</span> • <span>MASTERCARD</span> • <span>RUPAY</span> • <span>AMEX</span>
            </div>
          </div>
        )}

        {/* Security badge */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>PCI-DSS compliant terminal. Zero card numbers stored on server.</span>
        </div>

        {/* Modal Buttons */}
        <div className="flex gap-3 pt-2 border-t border-slate-100">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            onClick={handleProcessPayment}
            isLoading={isProcessing}
            disabled={method === 'CASH' && tendered < grandTotal}
            leftIcon={<CheckCircle2 className="w-4 h-4" />}
          >
            Complete Sale (₹{grandTotal.toFixed(2)})
          </Button>
        </div>
      </div>
    </Modal>
  );
};
