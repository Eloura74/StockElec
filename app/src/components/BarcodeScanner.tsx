'use client'

import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import { X } from 'lucide-react'

interface BarcodeScannerProps {
  onScan: (decodedText: string) => void
  onClose: () => void
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const [error, setError] = useState<string | null>(null)
  const scannerRef = useRef<Html5Qrcode | null>(null)

  useEffect(() => {
    // Initialiser le scanner
    const html5QrCode = new Html5Qrcode("reader", {
      verbose: false,
      formatsToSupport: [
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.QR_CODE
      ],
      experimentalFeatures: {
        useBarCodeDetectorIfSupported: true
      }
    })
    scannerRef.current = html5QrCode

    const startScanner = async () => {
      try {
        await html5QrCode.start(
          { facingMode: "environment" }, // Caméra arrière
          {
            fps: 30,
            qrbox: { width: 300, height: 150 }, // Plus large pour les EAN
            aspectRatio: 1.0
          },
          (decodedText) => {
            // Succès
            // html5-qrcode a tendance à scanner plusieurs fois de suite, 
            // on arrête le scanner dès la première lecture pour éviter les appels multiples
            if (scannerRef.current?.isScanning) {
              scannerRef.current.stop().then(() => {
                onScan(decodedText)
              }).catch(err => console.error(err))
            }
          },
          (errorMessage) => {
            // Les erreurs de scan sont normales (quand il n'y a pas de code en vue)
            // On les ignore
          }
        )
      } catch (err: any) {
        console.error("Erreur de démarrage du scanner", err)
        setError("Impossible d'accéder à la caméra. Vérifiez les autorisations de votre navigateur.")
      }
    }

    startScanner()

    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(err => console.error(err))
      }
    }
  }, [onScan])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-2xl relative flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="font-bold text-gray-900">Scanner un article</h3>
          <button 
            onClick={onClose}
            className="p-2 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scanner Area */}
        <div className="relative w-full bg-black flex items-center justify-center" style={{ minHeight: '300px' }}>
          {error ? (
            <div className="p-6 text-center text-red-500">
              <p className="font-medium">{error}</p>
            </div>
          ) : (
            <div id="reader" className="w-full h-full"></div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 text-center text-sm text-gray-500">
          Placez le code-barres au centre de la zone de détection.
        </div>
      </div>
    </div>
  )
}
