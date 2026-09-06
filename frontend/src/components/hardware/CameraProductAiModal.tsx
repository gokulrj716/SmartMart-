import React, { useState, useEffect, useRef } from 'react';
import { Camera, Sparkles, Check, AlertTriangle, ShieldCheck, RefreshCw, Video, Image, CheckCircle2, RotateCcw } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { api } from '../../api/client';
import { useCart } from '../../contexts/CartContext';
import { Product } from '../../types';

export interface CameraProductAiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductConfirmed?: (product: Product, weight?: number) => void;
}

export const CameraProductAiModal: React.FC<CameraProductAiModalProps> = ({
  isOpen,
  onClose,
  onProductConfirmed
}) => {
  const { addItem } = useCart();
  const [cameraMode, setCameraMode] = useState<'LAPTOP_WEBCAM' | 'SIMULATION'>('LAPTOP_WEBCAM');
  const [isCapturing, setIsCapturing] = useState(false);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null);
  const [threshold, setThreshold] = useState<number>(0.85);
  const [capturedSnapshot, setCapturedSnapshot] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Stop media stream tracks
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  // Start media stream from laptop webcam
  const startCamera = async () => {
    stopCamera();
    setCameraError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Webcam API is not supported in this browser. Switched to Simulation Mode.');
      setCameraMode('SIMULATION');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: false
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(e => console.warn('Video auto-play interrupted', e));
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn('Webcam access error:', err);
      let msg = 'Could not access laptop webcam. Please grant camera permission or use Simulation mode.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Camera permission was denied. Please allow camera access in browser settings.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'No webcam detected on this device. Switched to Simulation Mode.';
        setCameraMode('SIMULATION');
      }
      setCameraError(msg);
      setIsCameraActive(false);
    }
  };

  // Handle modal open/close & mode changes
  useEffect(() => {
    if (isOpen && cameraMode === 'LAPTOP_WEBCAM') {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, cameraMode]);

  // Reset captured state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCandidates([]);
      setSelectedCandidate(null);
      setCapturedSnapshot(null);
      setCameraError(null);
    }
  }, [isOpen]);

  // Capture frame from webcam onto canvas
  const captureWebcamFrame = (): string | null => {
    if (!videoRef.current || !isCameraActive) return null;
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg', 0.85);
    } catch (e) {
      console.error('Frame capture error:', e);
      return null;
    }
  };

  const handleCaptureAndIdentify = async () => {
    setIsCapturing(true);
    setCandidates([]);
    setSelectedCandidate(null);

    let snapshotUrl: string | null = null;
    if (cameraMode === 'LAPTOP_WEBCAM') {
      snapshotUrl = captureWebcamFrame();
      if (snapshotUrl) {
        setCapturedSnapshot(snapshotUrl);
      }
    } else {
      setCapturedSnapshot('https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800');
    }

    try {
      const res = await api.post<any>('/hardware/camera/identify', {
        image: snapshotUrl
      });

      if (res.success && res.candidates) {
        setCandidates(res.candidates);
        setThreshold(res.confidenceThreshold || 0.85);
        if (res.candidates.length > 0) {
          setSelectedCandidate(res.candidates[0]);
        }
      }
    } catch (e) {
      console.error('AI identification request failed:', e);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleRetake = () => {
    setCapturedSnapshot(null);
    setCandidates([]);
    setSelectedCandidate(null);
  };

  const handleConfirmAndAdd = async () => {
    if (!selectedCandidate) return;

    try {
      // Lookup actual product entity by sku
      const res = await api.get<any>(`/products/barcode/${selectedCandidate.sku}`);
      if (res.success && res.data) {
        const product = res.data;
        if (onProductConfirmed) {
          onProductConfirmed(product, 1.25);
        } else {
          addItem(product, product.is_weighted ? 1.25 : 1);
        }
        stopCamera();
        onClose();
      }
    } catch (err: any) {
      console.error('Failed to add identified product:', err);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={() => { stopCamera(); onClose(); }} title="AI Vision Product Recognition" maxWidth="lg">
      <div className="space-y-4">
        {/* Mode Selector Tabs */}
        <div className="flex items-center justify-between pb-1">
          <div className="inline-flex p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => { setCapturedSnapshot(null); setCameraMode('LAPTOP_WEBCAM'); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                cameraMode === 'LAPTOP_WEBCAM'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Video className="w-3.5 h-3.5 text-emerald-600" />
              <span>Laptop Webcam</span>
            </button>
            <button
              type="button"
              onClick={() => { setCapturedSnapshot(null); setCameraMode('SIMULATION'); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                cameraMode === 'SIMULATION'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Image className="w-3.5 h-3.5 text-sky-600" />
              <span>Conveyor Simulator</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {cameraMode === 'LAPTOP_WEBCAM' && isCameraActive && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[11px] font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Webcam Active
              </span>
            )}
            <span className="text-[11px] text-slate-500 font-medium">
              Confidence Req: <strong className="text-slate-800 font-mono">{(threshold * 100).toFixed(0)}%</strong>
            </span>
          </div>
        </div>

        {/* Camera Error Notice if any */}
        {cameraError && cameraMode === 'LAPTOP_WEBCAM' && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start justify-between gap-3 text-xs text-amber-900">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Camera Notice</p>
                <p className="text-amber-700 mt-0.5">{cameraError}</p>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={startCamera}>
              Retry Camera
            </Button>
          </div>
        )}

        {/* Camera Viewport */}
        <div className="relative aspect-video w-full bg-slate-950 rounded-2xl overflow-hidden border-2 border-slate-800 flex items-center justify-center shadow-inner">
          {capturedSnapshot ? (
            /* Frozen Snapshot View */
            <img
              src={capturedSnapshot}
              alt="Captured Produce"
              className="w-full h-full object-cover"
            />
          ) : cameraMode === 'LAPTOP_WEBCAM' ? (
            /* Real Laptop Webcam Stream */
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform scale-x-[-1]"
            />
          ) : (
            /* Conveyor Simulation Image */
            <img
              src="https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800"
              alt="Produce Camera Stream"
              className="w-full h-full object-cover opacity-85"
            />
          )}

          {/* AI Bounding Box Overlay */}
          <div className="absolute inset-8 sm:inset-12 border-2 border-dashed border-emerald-400 rounded-xl pointer-events-none flex flex-col justify-between p-3 shadow-[0_0_20px_rgba(52,211,153,0.3)]">
            <div className="flex items-center justify-between">
              <span className="bg-emerald-600/90 text-white font-mono text-[11px] font-bold px-2 py-0.5 rounded backdrop-blur-sm flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> ROI: SCAN_TARGET
              </span>
              <span className="bg-slate-900/80 text-emerald-400 font-mono text-[10px] px-2 py-0.5 rounded">
                {cameraMode === 'LAPTOP_WEBCAM' ? 'WEBCAM 720p' : 'SIMULATION'}
              </span>
            </div>

            {selectedCandidate && (
              <div className="bg-slate-900/90 text-white p-2.5 rounded-xl border border-emerald-500/50 backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-sm text-emerald-300 block">{selectedCandidate.name}</span>
                    <span className="text-[11px] text-slate-300">Rate: ₹{selectedCandidate.price}/{selectedCandidate.unit}</span>
                  </div>
                  <span className={`font-mono text-xs font-bold px-2 py-1 rounded ${
                    selectedCandidate.confidence >= threshold
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    Match: {(selectedCandidate.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Scan Actions */}
        <div className="flex items-center justify-between gap-3">
          {capturedSnapshot ? (
            <Button
              variant="outline"
              onClick={handleRetake}
              leftIcon={<RotateCcw className="w-4 h-4" />}
            >
              Retake Frame
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={handleCaptureAndIdentify}
              isLoading={isCapturing}
              leftIcon={<Camera className="w-4 h-4" />}
            >
              Scan & Identify Object
            </Button>
          )}

          <span className="text-xs text-slate-500">
            Hold produce in front of webcam reticle and click scan.
          </span>
        </div>

        {/* AI Candidates List */}
        {candidates.length > 0 && (
          <div className="space-y-2 pt-1">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
              Classification Predictions ({candidates.length} detected):
            </span>
            <div className="grid grid-cols-2 gap-2">
              {candidates.map((c) => {
                const isSelected = selectedCandidate?.productId === c.productId;
                const isBelowThreshold = c.confidence < threshold;

                return (
                  <div
                    key={c.productId}
                    onClick={() => setSelectedCandidate(c)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/70 shadow-sm ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-slate-900">{c.name}</span>
                      <span
                        className={`text-[11px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          c.confidence >= threshold ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {(c.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Rate: ₹{c.price}/{c.unit}</span>
                      {c.suggestedPlu && <span className="font-mono">PLU: {c.suggestedPlu}</span>}
                    </div>

                    {isBelowThreshold && (
                      <p className="text-[10px] text-amber-600 font-medium mt-1 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 shrink-0" /> Requires Cashier Confirmation
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Cashier Safety Verification Notice */}
        {selectedCandidate && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-2.5 text-xs text-blue-900">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Cashier Verification Required</p>
              <p className="text-blue-700 mt-0.5">
                Ensure visual match with physical object. Clicking &quot;Verify & Add to Bill&quot; logs this verification under your cashier ID.
              </p>
            </div>
          </div>
        )}

        {/* Modal Buttons */}
        <div className="flex gap-3 pt-3 border-t border-slate-100">
          <Button variant="outline" className="flex-1" onClick={() => { stopCamera(); onClose(); }}>
            Cancel
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            disabled={!selectedCandidate}
            onClick={handleConfirmAndAdd}
            leftIcon={<CheckCircle2 className="w-4 h-4" />}
          >
            Verify & Add to Bill
          </Button>
        </div>
      </div>
    </Modal>
  );
};
