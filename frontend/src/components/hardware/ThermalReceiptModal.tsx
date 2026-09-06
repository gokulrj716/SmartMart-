import React from 'react';
import { Printer, Check, Copy, Download, RefreshCw } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

export interface ThermalReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiptText?: string;
  invoiceData?: any;
}

export const ThermalReceiptModal: React.FC<ThermalReceiptModalProps> = ({
  isOpen,
  onClose,
  receiptText,
  invoiceData
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Thermal Receipt Preview (80mm ESC/POS)" maxWidth="md">
      <div className="space-y-4">
        {/* Authentic Thermal Receipt Paper */}
        <div className="receipt-paper p-6 rounded-xl border border-slate-300 font-mono text-xs text-slate-900 shadow-md max-h-[480px] overflow-y-auto select-text">
          {receiptText ? (
            <pre className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed">{receiptText}</pre>
          ) : (
            <div className="text-center space-y-2">
              <h2 className="text-sm font-bold tracking-wider">SMARTMART SUPERMARKET</h2>
              <p className="text-[10px] text-slate-600">100 Metro Hypermarket Blvd, Central Hub</p>
              <p className="text-[10px] text-slate-600">GSTIN: 29AAAAA0000A1Z5 | Phone: +91 800-SMARTMART</p>
              <div className="border-t border-dashed border-slate-400 my-2" />
              <div className="flex justify-between text-[11px]">
                <span>Inv: {invoiceData?.invoiceNumber || 'INV-20260904'}</span>
                <span>{new Date().toLocaleDateString()}</span>
              </div>
              <div className="border-t border-dashed border-slate-400 my-2" />
              <div className="text-left space-y-1">
                {(invoiceData?.items || []).map((it: any, idx: number) => (
                  <div key={idx} className="flex justify-between">
                    <span>{it.name} x {it.quantity}</span>
                    <span>₹{it.total?.toFixed(2) || it.itemTotal?.toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-dashed border-slate-400 my-2" />
              <div className="flex justify-between font-bold text-sm">
                <span>GRAND TOTAL</span>
                <span>₹{(invoiceData?.totalAmount || invoiceData?.grandTotal || 0).toFixed(2)}</span>
              </div>
              <div className="border-t border-dashed border-slate-400 my-2" />
              <p className="text-[10px] text-slate-500 pt-2">Thank you for shopping with us!</p>
              <p className="text-[10px] text-slate-500">Items eligible for return within 7 days.</p>
              <div className="pt-3 flex justify-center">
                {/* Barcode representation */}
                <div className="h-10 w-48 bg-slate-900 flex items-center justify-center text-white text-[10px] font-mono tracking-widest">
                  ||| | |||| | ||| |||| |
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex gap-3 pt-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Close
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            onClick={handlePrint}
            leftIcon={<Printer className="w-4 h-4" />}
          >
            Print Receipt (ESC/POS)
          </Button>
        </div>
      </div>
    </Modal>
  );
};
