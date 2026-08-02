import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'

export default function AuthFormField({ label, name, type = 'text', icon: Icon, register, error, autoComplete }) {
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'

  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.17em] text-neutral-500">{label}</span>
      <span className="group relative block">
        <Icon className="pointer-events-none absolute left-0 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-neutral-400 transition group-focus-within:text-black" />
        <input
          {...register(name)}
          type={isPassword && showPassword ? 'text' : type}
          autoComplete={autoComplete}
          className={`h-12 w-full border-0 border-b bg-transparent pl-7 pr-9 text-[15px] text-neutral-950 outline-none transition placeholder:text-neutral-300 ${error ? 'border-red-400' : 'border-neutral-300 focus:border-black'}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-neutral-400 transition hover:text-black"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
          </button>
        )}
      </span>
      <span className="mt-1.5 block min-h-4 text-xs text-red-600">{error?.message}</span>
    </label>
  )
}
