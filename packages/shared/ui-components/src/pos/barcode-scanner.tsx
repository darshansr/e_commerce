'use client';

import * as React from 'react';
import { cn } from '@meghana/shared-utils';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Camera, Zap, Settings, X, ChevronDown } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (barcode: string, source: 'CAMERA' | 'HARDWARE_SCANNER' | 'MANUAL_ENTRY') => void;
  isActive?: boolean;
  className?: string;
}

export function BarcodeScanner({ onScan, isActive = true, className }: BarcodeScannerProps) {
  const [isCameraActive, setIsCameraActive] = React.useState(false);
  const [manualBarcode, setManualBarcode] = React.useState('');
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const scanIntervalRef = React.useRef<NodeJS.Timeout | undefined>(undefined);

  // Initialize camera
  React.useEffect(() => {
    if (!isActive || !isCameraActive) return;

    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          startScanning();
        }
      } catch (error) {
        console.error('Camera access denied:', error);
        setIsCameraActive(false);
      }
    };

    initCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    };
  }, [isActive, isCameraActive]);

  const startScanning = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return;

    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const scan = () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        
        // Try to use Barcode Detection API if available
        if ('BarcodeDetector' in window) {
          try {
            const detector = new (window as any).BarcodeDetector({
              formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code'],
            });
            detector.detect(imageData).then((barcodes: any[]) => {
              if (barcodes.length > 0) {
                onScan(barcodes[0].rawValue, 'CAMERA');
              }
            }).catch(() => {});
          } catch {}
        }
      }
      scanIntervalRef.current = setTimeout(scan, 100);
    };

    scan();
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualBarcode.trim()) {
      onScan(manualBarcode.trim(), 'MANUAL_ENTRY');
      setManualBarcode('');
    }
  };

  const handleHardwareScan = (barcode: string) => {
    onScan(barcode, 'HARDWARE_SCANNER');
  };

  // Listen for hardware scanner input (acts like keyboard)
  React.useEffect(() => {
    let buffer = '';
    let lastKeyTime = 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      const now = Date.now();
      if (now - lastKeyTime > 100) buffer = '';
      lastKeyTime = now;

      if (e.key === 'Enter') {
        if (buffer.length >= 8) {
          e.preventDefault();
          handleHardwareScan(buffer);
        }
        buffer = '';
      } else if (e.key.length === 1) {
        buffer += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onScan]);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Camera Scanner */}
      <div className="relative">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Camera Scanner
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCameraActive(!isCameraActive)}
            className={cn(isCameraActive ? 'bg-green-50 text-green-700' : '')}
          >
            {isCameraActive ? 'Stop Camera' : 'Start Camera'}
          </Button>
        </div>

        {isCameraActive ? (
          <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />
            <canvas ref={canvasRef} className="hidden" />
            {/* Scan overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-64 h-32">
                <div className="absolute inset-0 border-2 border-green-500 rounded-lg" />
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 px-2 py-0.5 rounded text-white text-xs">
                  Align barcode here
                </div>
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-black/80 px-2 py-0.5 rounded text-white text-xs">
                  Scanning...
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border-2 border-dashed border-gray-300 aspect-video flex items-center justify-center">
            <div className="text-center text-gray-500 p-4">
              <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Camera scanner is off</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={() => setIsCameraActive(true)}>
                Enable Camera
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Manual Entry */}
      <div className="border-t pt-4">
        <h3 className="font-medium mb-2 flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Manual Entry
        </h3>
        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <Input
            value={manualBarcode}
            onChange={(e) => setManualBarcode(e.target.value)}
            placeholder="Enter ISBN, SKU, or Barcode"
            autoComplete="off"
            className="flex-1 text-lg"
            inputMode="numeric"
            pattern="[0-9]*"
          />
          <Button type="submit" size="lg" disabled={!manualBarcode.trim()}>
            <Zap className="h-5 w-5 mr-2" />
            Add
          </Button>
        </form>
        <p className="mt-2 text-sm text-gray-500">
          Supports ISBN-13, ISBN-10, EAN-13, UPC-A, Code-128, QR codes
        </p>
      </div>

      {/* Hardware Scanner Status */}
      <div className="border-t pt-4">
        <h3 className="font-medium mb-2 flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Hardware Scanner
        </h3>
        <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
          <p>Connect a USB/Bluetooth barcode scanner.</p>
          <p className="mt-1">Scans are detected automatically when focused on any input field.</p>
        </div>
      </div>
    </div>
  );
}

// Quick scan button for POS grid
export function QuickScanButton({ onScan, className }: { onScan: () => void; className?: string }) {
  return (
    <Button
      variant="pos"
      size="pos"
      className={cn('w-full flex-col gap-2', className)}
      onClick={onScan}
    >
      <Camera className="h-10 w-10" />
      <span>Scan Barcode</span>
      <span className="text-sm opacity-75">Camera or Hardware</span>
    </Button>
  );
}