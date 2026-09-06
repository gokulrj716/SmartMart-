import React, { useState, useEffect } from 'react';
import { Scale, RotateCcw, Check, Sparkles } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Product } from '../../types';
import { useCart } from '../../contexts/CartContext';
import { api } from '../../api/client';

export interface WeighingScaleWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

export const WeighingScaleWidget: React.FC<WeighingScaleWidgetProps> = ({ isOpen, onClose, product }) => {
  const { addItem } = useCart();
  const [weight, setWeight] = useState<number>(1.25);
  const [tare, setTare] = useState<number>(0);
  const [isStable, setIsStable] = useState<boolean>(true);

  useEffect(() => {
    if (isOpen) {
      // Fetch current scale reading from backend hardware service
      api.get<any>('/hardware/scale/reading')
        .then(res => {
          if (res.success && res.data) {
            setWeight(res.data.netWeight || 1.25);
          }
        })
        .catch(() => setWeight(1.25));
    }
  }, [isOpen]);

  if (!product) return null;

  const netWeight = Math.max(0, Number((weight - tare).toFixed(3)));
  const unitPrice = product.price;
  const totalPrice = Number((netWeight * unitPrice).toFixed(2));

  const handleTare = async () => {
    setTare(weight);
    try {
      await api.post('/hardware/scale/tare');
    } catch (e) {
      // Ignore
    }
  };

  const handleZero = async () => {
    setTare(0);
    setWeight(0);
    try {
      await api.post('/hardware/scale/zero');
    } catch (e) {
      // Ignore
    }
  };

  const handleSetPresetWeight = (w: number) => {
    setWeight(w);
    setTare(0);
    setIsStable(true);
    api.post('/hardware/scale/mock-weight', { weight: w }).catch(() => {});
  };

  const handleConfirmAdd = () => {
    addItem(product, netWeight, unitPrice);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Electronic Weighing Scale" maxWidth="md">
      <div className="space-y-5">
        {/* Selected Product Banner */}
        <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl">
          <img
            src={product.image_url || 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=200'}
            alt={product.name}
            className="w-14 h-14 rounded-xl object-cover"
          />
          <div>
            <h4 className="font-bold text-slate-900">{product.name}</h4>
            <p className="text-xs text-slate-600">Rate: <span className="font-semibold text-emerald-700">₹{product.price.toFixed(2)}</span> / {product.unit}</p>
            {product.plu_code && <span className="text-[11px] bg-emerald-200/60 text-emerald-800 px-1.5 py-0.5 rounded font-mono font-bold">PLU: {product.plu_code}</span>}
          </div>
        </div>

        {/* Digital Scale LED Display */}
        <div className="bg-slate-950 p-6 rounded-3xl border-4 border-slate-800 text-center shadow-inner relative overflow-hidden">
          <div className="absolute top-3 left-4 flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${isStable ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">
              {isStable ? 'STABLE' : 'MOTION'}
            </span>
          </div>
          <div className="absolute top-3 right-4 text-[10px] font-mono text-slate-400 font-bold">
            TARE: {tare.toFixed(3)} kg
          </div>

          <div className="my-2">
            <div className="text-6xl font-extrabold font-mono tracking-tight text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]">
              {netWeight.toFixed(3)}
            </div>
            <div className="text-sm font-mono tracking-widest text-emerald-600 font-bold uppercase mt-1">
              KILOGRAMS (NET)
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-around text-xs font-mono text-slate-300">
            <div>
              <span className="text-slate-500">Unit Price:</span> ₹{unitPrice.toFixed(2)}/{product.unit}
            </div>
            <div>
              <span className="text-slate-500">Calculated:</span> <span className="text-emerald-400 font-bold text-base">₹{totalPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Weight Adjuster & Scale Controls */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
            <span>Simulate Scale Weight (kg):</span>
            <span className="font-mono text-emerald-700">{weight.toFixed(3)} kg</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="10.0"
            step="0.05"
            value={weight}
            onChange={(e) => setWeight(parseFloat(e.target.value))}
            className="w-full accent-emerald-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
          />

          {/* Quick Presets */}
          <div className="flex gap-2">
            {[0.25, 0.5, 1.0, 1.5, 2.0, 3.0].map(val => (
              <button
                key={val}
                onClick={() => handleSetPresetWeight(val)}
                className={`flex-1 py-1 text-xs font-mono rounded-lg border transition-all ${
                  weight === val
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {val}kg
              </button>
            ))}
          </div>
        </div>

        {/* Scale Hardware Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Button variant="outline" size="sm" onClick={handleTare} leftIcon={<RotateCcw className="w-3.5 h-3.5" />}>
            Tare Scale (Zero Net)
          </Button>
          <Button variant="outline" size="sm" onClick={handleZero} leftIcon={<Scale className="w-3.5 h-3.5" />}>
            Zero Reference
          </Button>
        </div>

        {/* Modal Actions */}
        <div className="flex gap-3 pt-3 border-t border-slate-100">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            onClick={handleConfirmAdd}
            disabled={netWeight <= 0}
            leftIcon={<Check className="w-4 h-4" />}
          >
            Add {netWeight.toFixed(3)} {product.unit} (₹{totalPrice.toFixed(2)})
          </Button>
        </div>
      </div>
    </Modal>
  );
};
