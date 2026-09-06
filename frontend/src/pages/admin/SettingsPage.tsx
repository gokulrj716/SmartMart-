import React, { useState, useEffect } from 'react';
import { Settings, Store, Sparkles, Check, Shield, QrCode, Upload, Image as ImageIcon } from 'lucide-react';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { QrCodeViewer } from '../../components/ui/QrCodeViewer';
import { api } from '../../api/client';

export const SettingsPage: React.FC = () => {
  const [storeName, setStoreName] = useState('SMARTMART SUPERMARKET');
  const [gstin, setGstin] = useState('29AAAAA0000A1Z5');
  const [address, setAddress] = useState('100 Metro Hypermarket Boulevard, Central Hub, Bengaluru');
  const [aiThreshold, setAiThreshold] = useState(85);

  // Payment QR Configuration State
  const [upiId, setUpiId] = useState('smartmart.supermarket@icici');
  const [merchantName, setMerchantName] = useState('SMARTMART Supermarket Ltd');
  const [qrMode, setQrMode] = useState<'DYNAMIC_UPI' | 'CUSTOM_IMAGE'>('DYNAMIC_UPI');
  const [customQrImage, setCustomQrImage] = useState<string>('');
  const [qrNotes, setQrNotes] = useState('Scan with any UPI app (Google Pay, PhonePe, Paytm, BHIM)');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get<any>('/settings/payment-qr');
        if (res.success && res.config) {
          setUpiId(res.config.upiId || 'smartmart.supermarket@icici');
          setMerchantName(res.config.merchantName || 'SMARTMART Supermarket Ltd');
          setQrMode(res.config.mode || 'DYNAMIC_UPI');
          setCustomQrImage(res.config.customQrImage || '');
          setQrNotes(res.config.notes || 'Scan with any UPI app');
        }
      } catch (err) {
        console.error('Failed to load payment QR settings:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setCustomQrImage(reader.result);
        setQrMode('CUSTOM_IMAGE');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await Promise.all([
        api.post('/hardware/camera/threshold', { threshold: aiThreshold / 100 }),
        api.post('/settings/payment-qr', {
          upiId,
          merchantName,
          mode: qrMode,
          customQrImage: customQrImage || null,
          notes: qrNotes
        })
      ]);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">System & Supermarket Settings</h1>
          <p className="text-xs text-slate-500 mt-1">Configure store profile, GST credentials, and AI inference confidence thresholds</p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Store Profile Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Store className="w-4 h-4 text-emerald-600" /> Supermarket Profile
            </h3>

            <div className="space-y-3 text-xs">
              <Input
                label="Store Legal Name"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
              />
              <Input
                label="GSTIN Identification Number"
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
              />
              <div>
                <label className="font-bold text-slate-700 block mb-1">Store Address (Appears on Receipts)</label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Payment QR & UPI Gateway Configuration Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <QrCode className="w-4 h-4 text-sky-600" /> Payment QR & UPI Gateway
              </h3>
              <span className="text-[10px] font-mono font-bold bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 rounded-full">
                POS & Customer Display Active
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* Form Controls */}
              <div className="md:col-span-7 space-y-4 text-xs">
                {/* QR Generation Mode Selector */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">QR Code Display Mode</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setQrMode('DYNAMIC_UPI')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        qrMode === 'DYNAMIC_UPI'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold ring-2 ring-emerald-500/20'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span className="block text-xs">Dynamic UPI QR</span>
                      <span className="text-[10px] font-normal text-slate-500 block mt-0.5">Encodes bill total automatically</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setQrMode('CUSTOM_IMAGE')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        qrMode === 'CUSTOM_IMAGE'
                          ? 'border-sky-600 bg-sky-50 text-sky-900 font-bold ring-2 ring-sky-500/20'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span className="block text-xs">Upload Custom QR</span>
                      <span className="text-[10px] font-normal text-slate-500 block mt-0.5">Static store / bank QR image</span>
                    </button>
                  </div>
                </div>

                <Input
                  label="Merchant UPI VPA / ID"
                  placeholder="e.g. smartmart@icici or store@upi"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                />

                <Input
                  label="Payee Business Name"
                  placeholder="e.g. SMARTMART Supermarket Pvt Ltd"
                  value={merchantName}
                  onChange={(e) => setMerchantName(e.target.value)}
                />

                {/* Custom Image Upload if selected */}
                {qrMode === 'CUSTOM_IMAGE' && (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <label className="font-bold text-slate-700 block text-xs">Upload Store QR Code Image</label>
                    <div className="flex items-center gap-3">
                      <label className="cursor-pointer inline-flex items-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold px-3 py-2 rounded-xl text-xs transition-colors shadow-xs">
                        <Upload className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Choose Image File</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                      <span className="text-[11px] text-slate-400">PNG, JPG or WebP</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block mb-1">Or Paste QR Image URL:</span>
                      <input
                        type="url"
                        placeholder="https://example.com/store-qr.png"
                        value={customQrImage}
                        onChange={(e) => setCustomQrImage(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-mono"
                      />
                    </div>
                  </div>
                )}

                <Input
                  label="Customer Payment Notes / Instructions"
                  value={qrNotes}
                  onChange={(e) => setQrNotes(e.target.value)}
                />
              </div>

              {/* Live Preview Box */}
              <div className="md:col-span-5 flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Live POS Preview (Sample ₹1,250.00)
                </span>
                <QrCodeViewer
                  value={`upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(merchantName)}&am=1250.00&cu=INR&tn=SampleBill-101`}
                  customImageUrl={qrMode === 'CUSTOM_IMAGE' ? customQrImage : null}
                  size={170}
                  label={merchantName}
                  sublabel={upiId}
                />
                <p className="text-[10px] text-slate-400 mt-2">
                  {qrMode === 'DYNAMIC_UPI'
                    ? '✨ Auto-generates scannable QR with exact invoice total at checkout'
                    : '🖼️ Displays your store\'s static QR image with total amount overlay'}
                </p>
              </div>
            </div>
          </div>

          {/* AI Configuration */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" /> Computer Vision & AI Safety Rules
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-bold text-slate-700">Camera Produce Recognition Threshold: {aiThreshold}%</label>
                  <span className="text-slate-400 font-mono">Enforces Cashier Confirmation</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="99"
                  value={aiThreshold}
                  onChange={(e) => setAiThreshold(parseInt(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Predictions with confidence below {aiThreshold}% will require explicit cashier visual confirmation before item addition.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button variant="primary" type="submit">
              Save Configuration
            </Button>
            {isSaved && (
              <span className="text-emerald-600 font-bold text-xs flex items-center gap-1">
                <Check className="w-4 h-4" /> Settings updated successfully
              </span>
            )}
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};
