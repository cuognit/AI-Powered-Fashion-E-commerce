import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, LockKeyhole, Mail } from 'lucide-react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { login as loginRequest } from '../../services/authApi.js'
import useAuth from '../../hooks/useAuth.js'
import AuthFormField from './AuthFormField.jsx'

const loginSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must contain at least 8 characters'),
  remember: z.boolean().optional(),
})

export default function Login() {
  const navigate = useNavigate()
  const { establishSession } = useAuth()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', remember: true },
  })

  const onSubmit = async (values) => {
    try {
      const { data } = await loginRequest({ email: values.email, password: values.password })
      establishSession(data.user, data.accessToken)
      toast.success('Signed in successfully')
      navigate('/')
    } catch {
      toast.error('Unable to sign in. Please check your details and try again.')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
      <AuthFormField label="Email" name="email" type="email" icon={Mail} register={register} error={errors.email} autoComplete="email" />
      <AuthFormField label="Password" name="password" type="password" icon={LockKeyhole} register={register} error={errors.password} autoComplete="current-password" />

      <div className="flex items-center justify-between pb-3 text-xs">
        <label className="flex cursor-pointer items-center gap-2 text-neutral-600">
          <input type="checkbox" {...register('remember')} className="h-4 w-4 accent-black" />
          Remember me
        </label>
        <button type="button" className="font-semibold text-black underline decoration-neutral-300 underline-offset-4 hover:decoration-black">
          Forgot password?
        </button>
      </div>

      <button type="submit" disabled={isSubmitting} className="group flex h-13 w-full items-center justify-center gap-2 bg-black px-5 text-xs font-bold uppercase tracking-[0.18em] text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60">
        {isSubmitting ? 'Signing in...' : 'Sign in'}
        {!isSubmitting && <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />}
      </button>
    </form>
  )
}
