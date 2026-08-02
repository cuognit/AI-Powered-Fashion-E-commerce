import { X, Globe, Fingerprint, Box, Check, ShieldCheck, Sparkles } from 'lucide-react'

export function LanguageModal({ isOpen, onClose }) {
  if (!isOpen) return null

  const languages = [
    { code: 'vi', name: 'Tiếng Việt (VN)', region: 'Việt Nam', active: true },
    { code: 'en', name: 'English (US)', region: 'United States', active: false },
    { code: 'ja', name: '日本語 (JP)', region: 'Japan', active: false },
    { code: 'fr', name: 'Français (FR)', region: 'France', active: false },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-black p-1 rounded-full hover:bg-gray-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gray-100 rounded-xl">
            <Globe className="w-6 h-6 text-black" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-gray-900">Select Region & Language</h3>
            <p className="text-xs text-gray-500">Choose your preferred shopping experience</p>
          </div>
        </div>

        <div className="space-y-2">
          {languages.map((item) => (
            <button
              key={item.code}
              onClick={onClose}
              className={`w-full flex items-center justify-between p-3.5 rounded-xl text-left border transition cursor-pointer ${
                item.active
                  ? 'border-black bg-gray-50 font-semibold text-black'
                  : 'border-gray-100 hover:border-gray-300 text-gray-700'
              }`}
            >
              <div>
                <p className="text-sm">{item.name}</p>
                <p className="text-xs text-gray-400 font-normal">{item.region}</p>
              </div>
              {item.active && <Check className="w-4 h-4 text-black" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export function SecurityModal({ isOpen, onClose }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-black p-1 rounded-full hover:bg-gray-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gray-100 rounded-xl">
            <Fingerprint className="w-6 h-6 text-black" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-gray-900">AI Privacy & Security</h3>
            <p className="text-xs text-gray-500">Biometric & Fit Protection</p>
          </div>
        </div>

        <div className="space-y-4 text-sm text-gray-600">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
            <ShieldCheck className="w-5 h-5 text-black shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">Zero Biometric Storage</p>
              <p className="text-xs text-gray-500">Your uploaded photos and body measurements are processed on-the-fly for AI Try-On and immediately discarded.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
            <Sparkles className="w-5 h-5 text-black shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">Encrypted Generative Pipeline</p>
              <p className="text-xs text-gray-500">All neural render data is end-to-end encrypted with AES-256 standard protocols.</p>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full py-3 bg-black text-white font-medium text-sm rounded-xl hover:bg-gray-800 transition cursor-pointer"
        >
          Got it
        </button>
      </div>
    </div>
  )
}

export function ARModal({ isOpen, onClose }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-black p-1 rounded-full hover:bg-gray-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gray-100 rounded-xl">
            <Box className="w-6 h-6 text-black" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-gray-900">3D & AR Fitting Studio</h3>
            <p className="text-xs text-gray-500">Next-Generation Virtual Wardrobe</p>
          </div>
        </div>

        <div className="space-y-3 text-sm text-gray-600">
          <p>
            AESTHETIX utilizes real-time WebGL rendering and spatial AR modeling to let you inspect fabrics, fit draping, and 360-degree textures directly on your device.
          </p>
          <div className="p-4 bg-black text-white rounded-xl flex items-center justify-between">
            <div>
              <p className="font-semibold text-xs tracking-wider uppercase">Active Engine</p>
              <p className="text-sm text-gray-300">Aesthetix Spatial Engine v2.4</p>
            </div>
            <Sparkles className="w-5 h-5 text-amber-300" />
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full py-3 bg-black text-white font-medium text-sm rounded-xl hover:bg-gray-800 transition cursor-pointer"
        >
          Explore 3D Catalog
        </button>
      </div>
    </div>
  )
}
