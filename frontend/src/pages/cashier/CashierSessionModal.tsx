import React, { useState, useEffect } from 'react';
import { Wallet, Check, AlertCircle, TrendingUp, TrendingDown, Clock, ShieldCheck } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { api } from '../../api/client';

export interface CashierSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CashierSessionModal: React.FC<CashierSessionModalProps> = ({ isOpen, onClose }) => {
  const [session, setSession] = useState<any | null>(null);
  const [openingCash, setOpeningCash] = useState<number>(1000);
  const [actualCountedCash, setActualCountedCash] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [closeReport, setCloseReport] = useState<any | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchCurrentSession();
    }
  }, [isOpen]);

  const fetchCurrentSession = async () => {
    try {
      const res = await api.get<any>('/sessions/current');
      if (res.success) {
        setSession(res.session);
        if (res.session) {
          setActualCountedCash(res.session.expectedCashInDrawer || 0);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenSession = async () => {
    setIsLoading(true);
    try {
      const res = await api.post<any>('/sessions/open', { openingCash, notes });
      if (res.success) {
        await fetchCurrentSession();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to open cashier session');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseSession = async () => {
    if (!session) return;
    setIsLoading(true);
    try {
      const res = await api.post<any>('/sessions/close', {
        sessionId: session.id,
        actualCashCounted: actualCountedCash,
        notes
      });
      if (res.success) {
        setCloseReport(res.report);
        setSession(null);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to close session');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cash Register & Shift Management" maxWidth="md">
      <div className="space-y-4">
        {closeReport ? (
          /* Shift Closing Audit Report */
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center">
              <Check className="w-8 h-8 text-emerald-600 mx-auto mb-1" />
              <h4 className="font-bold text-slate-900">Shift Register Closed & Audited</h4>
              <p className="text-xs text-slate-500 mt-0.5">Session ID: {closeReport.sessionId}</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Opening Float:</span>
                <span className="font-bold text-slate-800">₹{closeReport.openingCash.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Shift Cash Sales:</span>
                <span className="font-bold text-slate-800">₹{closeReport.cashSales.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Petty Cash / Payouts:</span>
                <span className="font-bold text-slate-800">-₹{closeReport.expenses.toFixed(2)}</span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between font-bold">
                <span>Expected Drawer Cash:</span>
                <span>₹{closeReport.expectedCash.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900">
                <span>Actual Counted Cash:</span>
                <span>₹{closeReport.actualCash.toFixed(2)}</span>
              </div>
              <div className={`flex justify-between font-extrabold text-sm pt-1 border-t border-dashed border-slate-300 ${
                closeReport.difference === 0 ? 'text-emerald-600' : (closeReport.difference > 0 ? 'text-blue-600' : 'text-rose-600')
              }`}>
                <span>Discrepancy / Variance:</span>
                <span>{closeReport.difference >= 0 ? '+' : ''}₹{closeReport.difference.toFixed(2)}</span>
              </div>
            </div>

            <Button variant="primary" className="w-full" onClick={onClose}>
              Done
            </Button>
          </div>
        ) : session ? (
          /* Active Open Session Details */
          <div className="space-y-4">
            <div className="p-3.5 bg-emerald-950 text-white rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase">SHIFT REGISTER ACTIVE</span>
                <p className="font-bold text-sm text-slate-100">{session.cashier_name}</p>
              </div>
              <span className="text-xs bg-emerald-500/20 text-emerald-300 font-mono px-2 py-1 rounded">
                Terminal: {session.device_id}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[11px]">Opening Cash Float</span>
                <span className="font-bold font-mono text-slate-800 text-sm">₹{session.opening_cash.toFixed(2)}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[11px]">Cash Sales</span>
                <span className="font-bold font-mono text-emerald-700 text-sm">+₹{session.cashSales?.toFixed(2) || '0.00'}</span>
              </div>
            </div>

            {/* Expected Drawer Total */}
            <div className="p-3.5 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">Expected Cash in Drawer:</span>
              <span className="font-extrabold font-mono text-base text-slate-900">
                ₹{session.expectedCashInDrawer?.toFixed(2) || '0.00'}
              </span>
            </div>

            {/* Close Shift Reconciliation Input */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-700 block">
                Closing Cash Counted in Drawer (₹):
              </label>
              <input
                type="number"
                step="1"
                value={actualCountedCash}
                onChange={(e) => setActualCountedCash(parseFloat(e.target.value) || 0)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-base font-mono font-bold focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                onClick={handleCloseSession}
                isLoading={isLoading}
              >
                Close Register & Audit
              </Button>
            </div>
          </div>
        ) : (
          /* Open Shift Register Form */
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center">
              <Wallet className="w-8 h-8 text-slate-400 mx-auto mb-1" />
              <h4 className="font-bold text-slate-900">Open Register Shift</h4>
              <p className="text-xs text-slate-500 mt-0.5">Enter opening cash float before starting sales.</p>
            </div>

            <Input
              label="Opening Cash Float (₹)"
              type="number"
              value={openingCash}
              onChange={(e) => setOpeningCash(parseFloat(e.target.value) || 0)}
            />

            <Input
              label="Shift Notes (Optional)"
              placeholder="e.g. Morning opening shift"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />

            <Button
              variant="primary"
              className="w-full"
              onClick={handleOpenSession}
              isLoading={isLoading}
            >
              Open Register Shift
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};
