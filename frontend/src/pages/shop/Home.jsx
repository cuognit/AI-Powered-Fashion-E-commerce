import { Link } from 'react-router-dom'
import { Sparkles, ArrowRight, Layers, ShieldCheck } from 'lucide-react'

export default function Home() {
  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[#f4f4f4] py-20 lg:py-28 px-4 sm:px-6 lg:px-8 border-b border-gray-200/50">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/5 text-black text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-purple-600 animate-pulse" />
            <span>AI-Driven Virtual Wardrobe</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black uppercase tracking-tight text-gray-900 leading-tight">
            Redefining High Fashion <br />
            <span className="bg-gradient-to-r from-gray-900 via-gray-700 to-gray-500 bg-clip-text text-transparent">
              With Neural Precision
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-gray-600 font-normal">
            Experience real-time 3D garments, instant generative try-on, and curated luxury collections tailored specifically to your aesthetic profile.
          </p>

          <div className="pt-4 flex flex-wrap justify-center gap-4">
            <Link
              to="/ai-try-on"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-black text-white font-bold text-sm uppercase tracking-wider rounded-xl hover:bg-gray-800 transition shadow-lg shadow-black/10"
            >
              <span>Launch AI Try-On</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/collections"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-white text-black border border-gray-300 font-bold text-sm uppercase tracking-wider rounded-xl hover:bg-gray-50 transition"
            >
              Explore Collections
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-xs space-y-3">
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-black font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg text-gray-900">Virtual Fitting Room</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Upload your silhouette to preview drapery and fit accuracy with generative AI rendering.
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-xs space-y-3">
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-black font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg text-gray-900">Curated Capsule Sets</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Limited minimalist drops created in partnership with vanguard global designers.
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-xs space-y-3">
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-black font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg text-gray-900">Biometric Safeguards</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Your fit profile and imagery are ephemeral—processed on-the-fly and never stored.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
