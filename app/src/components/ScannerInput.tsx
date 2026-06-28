'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Camera } from 'lucide-react'

// Dynamic import with SSR false to prevent 'window is not defined' during build
const BarcodeScanner = dynamic(() => import('./BarcodeScanner').then(mod => mod.BarcodeScanner), { ssr: false })

interface ScannerInputProps {
  name: string
  defaultValue?: string
  placeholder?: string
  label?: string
  onScan?: (code: string) => void
}

export function ScannerInput({ name, defaultValue = "", placeholder = "ex: 3661132... (EAN)", label, onScan }: ScannerInputProps) {
  const [value, setValue] = useState(defaultValue)
  const [isScanning, setIsScanning] = useState(false)

  const handleScan = (code: string) => {
    setValue(code)
    setIsScanning(false)
    if (onScan) {
      onScan(code)
    }
  }

  return (
    <div>
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
      <div className="mt-1 flex rounded-md shadow-sm">
        <input
          type="text"
          name={name}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="block w-full rounded-none rounded-l-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => setIsScanning(true)}
          className="relative -ml-px inline-flex items-center space-x-2 rounded-r-md border border-gray-300 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <Camera className="h-4 w-4 text-gray-400" />
          <span>Scanner</span>
        </button>
      </div>
      
      {isScanning && (
        <BarcodeScanner 
          onScan={handleScan} 
          onClose={() => setIsScanning(false)} 
        />
      )}
    </div>
  )
}
