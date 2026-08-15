/**
 * Phát âm thanh chuông thông báo nhẹ nhàng bằng Web Audio API
 * (Không phụ thuộc vào file âm thanh ngoài, hoạt động mượt mà trên mọi trình duyệt)
 */
export function playNotificationSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext
    if (!AudioContext) return

    const ctx = new AudioContext()
    const now = ctx.currentTime

    // Tạo âm sắc hài hòa 2 nốt nhẹ (E6 -> G#6) tạo cảm giác êm dịu, sang trọng
    const freqs = [1318.51, 1661.22]

    freqs.forEach((freq, index) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now + index * 0.08)

      gain.gain.setValueAtTime(0, now + index * 0.08)
      gain.gain.linearRampToValueAtTime(0.12, now + index * 0.08 + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.08 + 0.4)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now + index * 0.08)
      osc.stop(now + index * 0.08 + 0.45)
    })
  } catch {
    // Bỏ qua nếu trình duyệt chặn autoplay trước khi có tương tác người dùng
  }
}
