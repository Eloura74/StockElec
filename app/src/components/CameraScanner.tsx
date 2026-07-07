"use client"

import { useEffect, useRef, useState } from "react"
import { Html5Qrcode } from "html5-qrcode"
import { Camera, X } from "lucide-react"

interface CameraScannerProps {
  onScan: (decodedText: string) => void;
}

export function CameraScanner({ onScan }: CameraScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const regionId = "qr-reader";

  const startScanning = async () => {
    setIsScanning(true);
    setError(null);
    try {
      const html5QrCode = new Html5Qrcode(regionId);
      scannerRef.current = html5QrCode;
      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 150 },
        },
        (decodedText) => {
          onScan(decodedText);
          stopScanning();
        },
        (errorMessage) => {
          // Ignore frequent scan errors when no barcode is in view
        }
      );
    } catch (err) {
      setError("Impossible d'accéder à la caméra. Vérifiez les permissions.");
      setIsScanning(false);
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        console.error("Failed to stop scanner", err);
      }
    }
    setIsScanning(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current && isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, [isScanning]);

  return (
    <div>
      {!isScanning ? (
        <button
          type="button"
          onClick={startScanning}
          className="flex items-center gap-2 rounded-md bg-blue-50 dark:bg-blue-500/10 px-3 py-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors border border-blue-200 dark:border-blue-500/30"
        >
          <Camera className="w-5 h-5" />
          Scanner avec Caméra
        </button>
      ) : (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-4">
          <div className="w-full max-w-md relative">
            <button 
              onClick={stopScanning}
              className="absolute -top-12 right-0 p-2 text-white bg-white/20 rounded-full hover:bg-white/30"
            >
              <X className="w-6 h-6" />
            </button>
            <div id={regionId} className="w-full rounded-xl overflow-hidden bg-black" />
            <p className="text-center text-white mt-4 font-medium">Placez le code-barres dans le cadre</p>
            {error && <p className="text-red-400 text-center mt-2 text-sm">{error}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
