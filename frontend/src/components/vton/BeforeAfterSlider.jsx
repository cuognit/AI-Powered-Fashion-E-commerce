import { useState, useRef, useCallback } from 'react'
import { Split, Eye, Sparkles } from 'lucide-react'

export default function BeforeAfterSlider({
  beforeImage,
  afterImage,
  aspectRatio = 'aspect-[3/4]',
  className = '',
}) {
  const [sliderPosition, setSliderPosition] = useState(50)
  const [isDragging, setIsDragging] = useState(false)
  const [viewMode, setViewMode] = useState('slider') // 'slider' | 'side-by-side' | 'toggle'
  const [activeToggle, setActiveToggle] = useState('after') // 'before' | 'after'
  const containerRef = useRef(null)

  const handleMove = useCallback((clientX) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width))
    const percentage = (x / rect.width) * 100
    setSliderPosition(percentage)
  }, [])

  const handleTouchMove = useCallback(
    (e) => {
      if (!isDragging) return
      handleMove(e.touches[0].clientX)
    },
    [isDragging, handleMove]
  )

  const handleMouseMove = useCallback(
    (e) => {
      if (!isDragging) return
      handleMove(e.clientX)
    },
    [isDragging, handleMove]
  )

  const handlePointerDown = () => setIsDragging(true)
  const handlePointerUp = () => setIsDragging(false)

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Controls Bar */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-purple-50 text-purple-700 rounded-full">
            <Sparkles size={13} />
            So sánh AI
          </span>
        </div>

        <div className="flex items-center bg-gray-100 p-1 rounded-xl text-xs font-medium text-gray-600">
          <button
            type="button"
            onClick={() => setViewMode('slider')}
            className={`px-3 py-1 rounded-lg transition ${
              viewMode === 'slider' ? 'bg-white text-black shadow-xs font-bold' : 'hover:text-black'
            }`}
          >
            <span className="flex items-center gap-1">
              <Split size={13} />
              Thanh trượt
            </span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('side-by-side')}
            className={`px-3 py-1 rounded-lg transition ${
              viewMode === 'side-by-side' ? 'bg-white text-black shadow-xs font-bold' : 'hover:text-black'
            }`}
          >
            Song song
          </button>
          <button
            type="button"
            onClick={() => setViewMode('toggle')}
            className={`px-3 py-1 rounded-lg transition ${
              viewMode === 'toggle' ? 'bg-white text-black shadow-xs font-bold' : 'hover:text-black'
            }`}
          >
            <span className="flex items-center gap-1">
              <Eye size={13} />
              Chuyển đổi
            </span>
          </button>
        </div>
      </div>

      {/* Slider View Mode */}
      {viewMode === 'slider' && (
        <div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerUp}
          onTouchMove={handleTouchMove}
          onTouchEnd={handlePointerUp}
          className={`relative w-full ${aspectRatio} rounded-2xl overflow-hidden select-none cursor-ew-resize bg-gray-900 border border-gray-100 shadow-inner`}
        >
          {/* After Image (Full background) */}
          <img
            src={afterImage}
            alt="AI Try-On Result"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          />
          <div className="absolute top-4 right-4 z-10 px-2.5 py-1 bg-black/70 backdrop-blur-md text-white text-[11px] font-bold rounded-lg tracking-wider uppercase">
            Sau khi thử đồ (AI)
          </div>

          {/* Before Image (Clipped overlay) */}
          <div
            className="absolute inset-0 overflow-hidden pointer-events-none"
            style={{ width: `${sliderPosition}%` }}
          >
            <img
              src={beforeImage}
              alt="Original Person"
              className="absolute inset-0 w-full h-full object-cover max-w-none"
              style={{
                width: containerRef.current ? `${containerRef.current.clientWidth}px` : '100%',
              }}
            />
            <div className="absolute top-4 left-4 z-10 px-2.5 py-1 bg-white/80 backdrop-blur-md text-black text-[11px] font-bold rounded-lg tracking-wider uppercase shadow-xs">
              Ảnh gốc
            </div>
          </div>

          {/* Divider Line & Handle */}
          <div
            className="absolute top-0 bottom-0 z-20 w-0.5 bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] cursor-ew-resize"
            style={{ left: `${sliderPosition}%` }}
            onMouseDown={handlePointerDown}
            onTouchStart={handlePointerDown}
          >
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white text-black shadow-lg flex items-center justify-center border-2 border-purple-600 transition transform hover:scale-110 active:scale-95">
              <Split size={14} className="rotate-90" />
            </div>
          </div>
        </div>
      )}

      {/* Side by Side View Mode */}
      {viewMode === 'side-by-side' && (
        <div className="grid grid-cols-2 gap-3">
          <div className={`relative ${aspectRatio} rounded-2xl overflow-hidden bg-gray-100 border border-gray-100`}>
            <img src={beforeImage} alt="Original" className="w-full h-full object-cover" />
            <div className="absolute top-3 left-3 px-2 py-0.5 bg-white/90 backdrop-blur-xs text-black text-[10px] font-bold rounded-md">
              Ảnh gốc
            </div>
          </div>
          <div className={`relative ${aspectRatio} rounded-2xl overflow-hidden bg-gray-900 border border-gray-100`}>
            <img src={afterImage} alt="AI Result" className="w-full h-full object-cover" />
            <div className="absolute top-3 right-3 px-2 py-0.5 bg-purple-600 text-white text-[10px] font-bold rounded-md">
              AI Thử đồ
            </div>
          </div>
        </div>
      )}

      {/* Toggle View Mode */}
      {viewMode === 'toggle' && (
        <div className="space-y-2">
          <div className={`relative w-full ${aspectRatio} rounded-2xl overflow-hidden bg-gray-900 border border-gray-100`}>
            <img
              src={activeToggle === 'after' ? afterImage : beforeImage}
              alt="Toggle View"
              className="w-full h-full object-cover transition-opacity duration-300"
            />
            <div className="absolute top-4 right-4 px-3 py-1 bg-black/75 backdrop-blur-md text-white text-xs font-bold rounded-xl">
              {activeToggle === 'after' ? '✨ Kết quả AI' : '📷 Ảnh gốc'}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveToggle('before')}
              className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition ${
                activeToggle === 'before'
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Xem ảnh gốc
            </button>
            <button
              type="button"
              onClick={() => setActiveToggle('after')}
              className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition ${
                activeToggle === 'after'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Xem AI thử đồ
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
