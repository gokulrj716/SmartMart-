import React, { useState } from 'react';
import { ScanBarcode, Camera, Search, Sparkles, Check, AlertCircle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { api } from '../../api/client';
import { useCart } from '../../contexts/CartContext';
import { Product } from '../../types';

export interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductScanned?: (product: Product) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({ isOpen, onClose, onProductScanned }) => {
  const { addItem } = useCart();
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastScanned, setLastScanned] = useState<Product | null>(null);

  const sampleBarcodes = [
    { label: 'Milk 1L (Amul)', code: '8901262010014' },
    { label: 'Whole Wheat Bread', code: '8901063011119' },
    { label: 'Salted Butter 500g', code: '8901262010021' },
    { label: 'Basmati Rice 5kg', code: '8901725181234' },
    { label: 'Coca-Cola 750ml', code: '8901764012345' },
    { label: 'Tomato PLU Code', code: '4087' }
  ];

  const handleLookup = async (codeToSearch: string) => {
    const code = codeToSearch.trim();
    if (!code) return;

    setIsScanning(true);
    setError(null);

    try {
      const res = await api.get<any>(`/products/barcode/${encodeURIComponent(code)}`);
      if (res.success && res.data) {
        const prod = res.data;
        setLastScanned(prod);
        if (onProductScanned) {
          onProductScanned(prod);
        } else {
          addItem(prod, 1);
        }
        setBarcodeInput('');
      } else {
        setError(`Product not found for code '${code}'`);
      }
    } catch (err: any) {
      setError(err.message || `No matching product for barcode ${code}`);
    } finally {
      setIsScanning(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLookup(barcodeInput);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Hardware Barcode Scanner" maxWidth="md">
      <div className="space-y-4">
        {/* Animated Laser Barcode Scanner Simulator */}
        <div className="relative bg-slate-950 rounded-2xl p-6 border-2 border-slate-800 flex flex-col items-center justify-center overflow-hidden h-40">
          {/* Animated red laser beam */}
          <div className="absolute inset-x-0 h-0.5 bg-rose-500 shadow-[0_0_12px_#f43f5e] animate-bounce top-1/2" />

          <ScanBarcode className="w-16 h-16 text-slate-700 mb-2" />
          <p className="text-xs font-mono text-emerald-400 tracking-wider uppercase font-semibold">
            Honeywell Xenon 1900 — Active & Ready
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Point scanner or type barcode/PLU below</p>
        </div>

        {/* Input Bar */}
        <div className="flex gap-2">
          <Input
            placeholder="Scan or enter Barcode / SKU / PLU..."
            value={barcodeInput}
            onChange={(e) => setBarcodeInput(e.target.value)}
            onKeyDown={handleKeyPress}
            leftIcon={<ScanBarcode className="w-4 h-4" />}
            autoFocus
          />
          <Button
            variant="primary"
            onClick={() => handleLookup(barcodeInput)}
            isLoading={isScanning}
            leftIcon={<Search className="w-4 h-4" />}
          >
            Lookup
          </Button>
        </div>

        {/* Quick Demo Barcode Buttons */}
        <div>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
            Quick Barcode Emulation (Click to simulate scan):
          </span>
          <div className="grid grid-cols-2 gap-2">
            {sampleBarcodes.map(item => (
              <button
                key={item.code}
                onClick={() => {
                  setBarcodeInput(item.code);
                  handleLookup(item.code);
                }}
                className="flex items-center justify-between p-2 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-xl text-left transition-all text-xs"
              >
                <span className="font-medium text-slate-800">{item.label}</span>
                <span className="font-mono text-slate-400 text-[10px]">{item.code}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Success or Error feedback */}
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {lastScanned && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <div>
                <p className="font-bold text-emerald-950">Scanned: {lastScanned.name}</p>
                <p className="text-emerald-700">₹{lastScanned.price.toFixed(2)} / {lastScanned.unit}</p>
              </div>
            </div>
            <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">ADDED</span>
          </div>
        )}

        <div className="pt-2 flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
};
