import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, LockKeyhole, Mail } from 'lucide-react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { login as loginRequest } from '../../services/authApi.js'
import useAuth from '../../hooks/useAuth.js'
import AuthFormField from './AuthFormField.jsx'
import { WISHLIST_INTENT_KEY } from '../../components/FavoriteButton.jsx'
import useWishlistStore from '../../store/wishlistStore.js'

const loginSchema = z.object({
  email: z.string().trim().email('Vui lòng nhập địa chỉ email hợp lệ'),
  password: z.string().min(8, 'Mật khẩu phải có ít nhất 8 ký tự'),
  remember: z.boolean().optional(),
})

export default function Login() {
  const navigate = useNavigate()
  const { establishSession } = useAuth()
  const addFavorite = useWishlistStore((state) => state.add)
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
      const rawIntent = sessionStorage.getItem(WISHLIST_INTENT_KEY)
      let returnTo = '/'
      if (rawIntent) {
        try {
          const intent = JSON.parse(rawIntent)
          returnTo = intent.returnTo || '/'
          await addFavorite(intent.productId)
          sessionStorage.removeItem(WISHLIST_INTENT_KEY)
          toast.success('Đã lưu sản phẩm vào yêu thích')
        } catch {
          toast.error('Đăng nhập thành công nhưng chưa thể lưu sản phẩm yêu thích')
        }
      }
      toast.success('Đăng nhập thành công')
      navigate(returnTo)
    } catch {
      toast.error('Không thể đăng nhập. Vui lòng kiểm tra thông tin và thử lại.')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
      <AuthFormField label="Email" name="email" type="email" icon={Mail} register={register} error={errors.email} autoComplete="email" />
      <AuthFormField label="Mật khẩu" name="password" type="password" icon={LockKeyhole} register={register} error={errors.password} autoComplete="current-password" />

      <div className="flex items-center justify-between pb-3 text-xs">
        <label className="flex cursor-pointer items-center gap-2 text-neutral-600">
          <input type="checkbox" {...register('remember')} className="h-4 w-4 accent-black" />
          Ghi nhớ đăng nhập
        </label>
        <button type="button" className="font-semibold text-black underline decoration-neutral-300 underline-offset-4 hover:decoration-black">
          Quên mật khẩu?
        </button>
      </div>

      <button type="submit" disabled={isSubmitting} className="group flex h-13 w-full items-center justify-center gap-2 bg-black px-5 text-xs font-bold uppercase tracking-[0.18em] text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60">
        {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
        {!isSubmitting && <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />}
      </button>
    </form>
  )
}
