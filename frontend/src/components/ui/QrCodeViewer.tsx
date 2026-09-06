import React, { useState } from 'react';
import { QrCode, ShieldCheck, RefreshCw } from 'lucide-react';

interface QrCodeViewerProps {
  value: string; // The text/payload to encode (e.g. upi://pay?pa=...)
  customImageUrl?: string | null;
  size?: number;
  label?: string;
  sublabel?: string;
}

export const QrCodeViewer: React.FC<QrCodeViewerProps> = ({
  value,
  customImageUrl,
  size = 200,
  label,
  sublabel
}) => {
  const [imageError, setImageError] = useState(false);

  // High-reliability QR generator service
  const qrUrl = customImageUrl && !imageError
    ? customImageUrl
    : `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=10&data=${encodeURIComponent(value)}`;

  return (
    <div className="flex flex-col items-center justify-center p-3 bg-white rounded-2xl border border-slate-200 shadow-sm">
      <div
        className="relative bg-white p-2 rounded-xl border border-slate-100 flex items-center justify-center overflow-hidden"
        style={{ width: size, height: size }}
      >
        <img
          src={qrUrl}
          alt="Payment QR Code"
          onError={() => setImageError(true)}
          className="w-full h-full object-contain rounded-lg transition-transform hover:scale-105"
        />

        {/* Center UPI / Brand Logo Overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-8 h-8 rounded-full bg-white border-2 border-emerald-500 shadow-md flex items-center justify-center">
            <span className="text-[10px] font-black font-mono text-emerald-700">SM</span>
          </div>
        </div>
      </div>

      {label && <p className="text-xs font-bold text-slate-800 mt-2.5 text-center">{label}</p>}
      {sublabel && <p className="text-[11px] text-slate-500 text-center font-mono mt-0.5">{sublabel}</p>}
    </div>
  );
};
