import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, LockKeyhole, Mail, UserRound } from 'lucide-react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { register as registerRequest } from '../../services/authApi.js'
import AuthFormField from './AuthFormField.jsx'

const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must contain at least 2 characters'),
    email: z.string().trim().email('Please enter a valid email address'),
    password: z.string().min(8, 'Password must contain at least 8 characters').max(72, 'Password cannot exceed 72 characters').regex(/[A-Z]/, 'Include at least one uppercase letter').regex(/[0-9]/, 'Include at least one number'),
    confirmPassword: z.string(),
    terms: z.literal(true, { error: 'You must accept the terms' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export default function Register() {
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '', terms: false },
  })

  const onSubmit = async ({ confirmPassword: _confirmPassword, terms: _terms, ...payload }) => {
    try {
      await registerRequest(payload)
      toast.success('Account created successfully')
      reset()
      navigate('/login')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to create your account. Please check your details and try again.')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-2" noValidate>
      <AuthFormField label="Full name" name="name" icon={UserRound} register={register} error={errors.name} autoComplete="name" />
      <AuthFormField label="Email" name="email" type="email" icon={Mail} register={register} error={errors.email} autoComplete="email" />
      <div className="grid gap-2 sm:grid-cols-2">
        <AuthFormField label="Password" name="password" type="password" icon={LockKeyhole} register={register} error={errors.password} autoComplete="new-password" />
        <AuthFormField label="Confirm" name="confirmPassword" type="password" icon={LockKeyhole} register={register} error={errors.confirmPassword} autoComplete="new-password" />
      </div>

      <label className="flex cursor-pointer items-start gap-2 pb-3 text-xs leading-5 text-neutral-500">
        <input type="checkbox" {...register('terms')} className="mt-0.5 h-4 w-4 shrink-0 accent-white" />
        <span>
          I agree to the <Link to="/terms" className="font-semibold text-white underline underline-offset-4">Terms of Service</Link> and Privacy Policy.
          {errors.terms && <span className="block text-red-300">{errors.terms.message}</span>}
        </span>
      </label>

      <button type="submit" disabled={isSubmitting} className="group flex h-13 w-full items-center justify-center gap-2 bg-white px-5 text-xs font-bold uppercase tracking-[0.18em] text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-60">
        {isSubmitting ? 'Creating account...' : 'Create account'}
        {!isSubmitting && <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />}
      </button>
    </form>
  )
}
