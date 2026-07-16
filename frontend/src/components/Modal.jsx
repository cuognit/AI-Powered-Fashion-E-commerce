export default function Modal({ open, children, onClose }) {
  if (!open) return null

  return (
    <div role="dialog" aria-modal="true">
      <button type="button" onClick={onClose} aria-label="Đóng">
        ×
      </button>
      {children}
    </div>
  )
}
