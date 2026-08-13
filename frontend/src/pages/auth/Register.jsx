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
    name: z.string().trim().min(2, 'Họ tên phải có ít nhất 2 ký tự'),
    email: z.string().trim().email('Vui lòng nhập địa chỉ email hợp lệ'),
    password: z.string().min(8, 'Mật khẩu phải có ít nhất 8 ký tự').max(72, 'Mật khẩu không được vượt quá 72 ký tự').regex(/[A-Z]/, 'Cần ít nhất một chữ cái viết hoa').regex(/[0-9]/, 'Cần ít nhất một chữ số'),
    confirmPassword: z.string(),
    terms: z.literal(true, { error: 'Bạn phải đồng ý với điều khoản' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
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
      toast.success('Tạo tài khoản thành công')
      reset()
      navigate('/login')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể tạo tài khoản. Vui lòng kiểm tra thông tin và thử lại.')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-2" noValidate>
      <AuthFormField label="Họ và tên" name="name" icon={UserRound} register={register} error={errors.name} autoComplete="name" />
      <AuthFormField label="Email" name="email" type="email" icon={Mail} register={register} error={errors.email} autoComplete="email" />
      <div className="grid gap-2 sm:grid-cols-2">
        <AuthFormField label="Mật khẩu" name="password" type="password" icon={LockKeyhole} register={register} error={errors.password} autoComplete="new-password" />
        <AuthFormField label="Xác nhận" name="confirmPassword" type="password" icon={LockKeyhole} register={register} error={errors.confirmPassword} autoComplete="new-password" />
      </div>

      <label className="flex cursor-pointer items-start gap-2 pb-3 text-xs leading-5 text-neutral-500">
        <input type="checkbox" {...register('terms')} className="mt-0.5 h-4 w-4 shrink-0 accent-white" />
        <span>
          Tôi đồng ý với <Link to="/terms" className="font-semibold text-white underline underline-offset-4">Điều khoản dịch vụ</Link> và Chính sách quyền riêng tư.
          {errors.terms && <span className="block text-red-300">{errors.terms.message}</span>}
        </span>
      </label>

      <button type="submit" disabled={isSubmitting} className="group flex h-13 w-full items-center justify-center gap-2 bg-white px-5 text-xs font-bold uppercase tracking-[0.18em] text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-60">
        {isSubmitting ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
        {!isSubmitting && <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />}
      </button>
    </form>
  )
}
