import { useEffect, useState } from 'react'
import { Sparkles, Cpu, Clock, CheckCircle2 } from 'lucide-react'

const PHASES = [
  {
    threshold: 25,
    title: 'Phân tích vóc dáng',
    desc: 'Nhận diện tư thế, tỷ lệ cơ thể và tách phông nền thông minh...',
  },
  {
    threshold: 60,
    title: 'Cắt may kỹ thuật số',
    desc: 'Ướm trang phục, căn chỉnh form dáng và kích cỡ theo dáng người...',
  },
  {
    threshold: 88,
    title: 'Khuếch tán & Tinh chỉnh ánh sáng',
    desc: 'Mô phỏng chất liệu vải, đổ bóng chân thực và nếp gấp tự nhiên...',
  },
  {
    threshold: 100,
    title: 'Hoàn thiện chất lượng HD',
    desc: 'Tối ưu độ sắc nét và đồng bộ màu sắc tổng thể...',
  },
]

export default function TryOnProcessingState({
  personImage,
  garmentImage,
  aspectRatio = 'aspect-[3/4]',
  onCancel,
}) {
  const [progress, setProgress] = useState(5)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  useEffect(() => {
    // Tăng thời gian đếm giây
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1)
    }, 1000)

    // Mô phỏng thanh tiến độ tăng dần tự nhiên theo thời gian
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev < 30) return prev + Math.random() * 4 + 2
        if (prev < 65) return prev + Math.random() * 2 + 1
        if (prev < 90) return prev + Math.random() * 0.8 + 0.3
        if (prev < 96) return prev + 0.1
        return prev
      })
    }, 600)

    return () => {
      clearInterval(timer)
      clearInterval(progressInterval)
    }
  }, [])

  const currentPhase = PHASES.find((p) => progress <= p.threshold) || PHASES[PHASES.length - 1]
  const currentPhaseIndex = PHASES.findIndex((p) => p.title === currentPhase.title)

  return (
    <div className="relative w-full rounded-3xl overflow-hidden bg-gradient-to-b from-gray-950 to-gray-900 text-white p-6 shadow-2xl border border-gray-800">
      {/* Visual Canvas with Laser Scanner Effect */}
      <div className={`relative w-full ${aspectRatio} rounded-2xl overflow-hidden bg-gray-900 mb-6 border border-gray-800`}>
        {/* Background person image with pulsing contrast */}
        {personImage ? (
          <img
            src={personImage}
            alt="Scanning Person"
            className="w-full h-full object-cover filter brightness-75 contrast-110 blur-[0.5px]"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-950">
            <Cpu className="w-16 h-16 text-purple-500 animate-pulse" />
          </div>
        )}

        {/* Small floating garment preview badge */}
        {garmentImage && (
          <div className="absolute top-3 left-3 z-20 flex items-center gap-2 p-1.5 pr-3 bg-black/70 backdrop-blur-md rounded-xl border border-white/10">
            <img src={garmentImage} alt="Garment" className="w-9 h-9 rounded-lg object-cover" />
            <div className="text-[10px]">
              <p className="text-gray-400 font-medium">Trang phục</p>
              <p className="font-bold text-white">Đang ướm thử</p>
            </div>
          </div>
        )}

        {/* Scanning Laser Beam Line */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_20px_#22d3ee] animate-[scan_3s_ease-in-out_infinite]" />
          <div className="absolute inset-0 bg-gradient-to-b from-purple-500/10 via-transparent to-cyan-500/10 pointer-events-none" />
        </div>

        {/* Floating live status badge */}
        <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center justify-between p-3 bg-black/80 backdrop-blur-md rounded-xl border border-white/10">
          <div className="flex items-center gap-2">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500" />
            </div>
            <span className="text-xs font-bold tracking-wide text-white">AI Studio Diffusion</span>
          </div>

          <div className="flex items-center gap-1 text-xs text-gray-300 font-mono">
            <Clock size={12} className="text-purple-400" />
            <span>{elapsedSeconds}s</span>
          </div>
        </div>
      </div>

      {/* Progress & Phased Checklist */}
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between text-xs font-bold mb-2">
            <span className="flex items-center gap-1.5 text-purple-300">
              <Sparkles size={14} className="text-purple-400 animate-spin" />
              {currentPhase.title}
            </span>
            <span className="font-mono text-purple-400">{Math.min(99, Math.round(progress))}%</span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-600 via-indigo-500 to-cyan-400 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${Math.min(99, progress)}%` }}
            />
          </div>
          <p className="text-[11px] text-gray-400 mt-2 italic">{currentPhase.desc}</p>
        </div>

        {/* Step indicator pills */}
        <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-gray-800/80">
          {PHASES.map((phase, idx) => {
            const isCompleted = idx < currentPhaseIndex
            const isCurrent = idx === currentPhaseIndex
            return (
              <div
                key={phase.title}
                className={`p-2 rounded-xl text-center text-[10px] transition ${
                  isCompleted
                    ? 'bg-purple-950/40 text-purple-300 border border-purple-800/50'
                    : isCurrent
                    ? 'bg-purple-600/30 text-white border border-purple-500 font-bold'
                    : 'bg-gray-900/50 text-gray-600'
                }`}
              >
                <div className="flex items-center justify-center mb-1">
                  {isCompleted ? (
                    <CheckCircle2 size={12} className="text-purple-400" />
                  ) : (
                    <span className="font-mono text-[9px]">{idx + 1}</span>
                  )}
                </div>
                <span className="truncate block">{phase.title}</span>
              </div>
            )
          })}
        </div>

        {onCancel && (
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={onCancel}
              className="text-xs text-gray-500 hover:text-gray-300 underline cursor-pointer"
            >
              Hủy tác vụ này
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
