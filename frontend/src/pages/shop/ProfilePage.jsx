import { zodResolver } from '@hookform/resolvers/zod'
import { AtSign, KeyRound, Loader2, MapPin, Phone, Save, UserRound } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { z } from 'zod'
import useAuth from '../../hooks/useAuth.js'
import { changePassword as changePasswordRequest, getProfile, updateProfile as updateProfileRequest } from '../../services/authApi.js'

const profileSchema = z.object({
  name: z.string().trim().min(2, 'Họ tên phải có ít nhất 2 ký tự').max(80, 'Họ tên quá dài'),
  phone: z
    .string()
    .trim()
    .max(20, 'Số điện thoại quá dài')
    .regex(/^[0-9+\-\s()]*$/, 'Số điện thoại không hợp lệ'),
  address: z.string().trim().max(255, 'Địa chỉ quá dài'),
})

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
    newPassword: z
      .string()
      .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
      .max(72, 'Mật khẩu không được vượt quá 72 ký tự')
      .regex(/[A-Z]/, 'Cần ít nhất một chữ cái viết hoa')
      .regex(/[0-9]/, 'Cần ít nhất một chữ số'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'Mật khẩu mới phải khác mật khẩu hiện tại',
    path: ['newPassword'],
  })

const messageOf = (error) => error.response?.data?.message || 'Không thể xử lý yêu cầu'

function Field({ label, icon: Icon, children }) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.17em] text-neutral-500">
        <Icon className="h-4 w-4" /> {label}
      </span>
      {children}
    </label>
  )
}

const inputClass = 'h-12 w-full rounded-none border border-neutral-300 bg-white px-4 text-[15px] text-neutral-950 outline-none transition placeholder:text-neutral-300 focus:border-black'

export default function ProfilePage() {
  const { user: authUser, updateUser, establishSession } = useAuth()

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [email, setEmail] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordChange, setPasswordChange] = useState(null)

  const profileForm = useForm({ resolver: zodResolver(profileSchema), defaultValues: { name: '', phone: '', address: '' } })
  const passwordForm = useForm({ resolver: zodResolver(passwordSchema), defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' } })

  const load = useCallback(async () => {
    setLoading(true); setLoadError('')
    try {
      const { data } = await getProfile()
      const profile = data?.user || {}
      setEmail(profile.email || '')
      profileForm.reset({ name: profile.name || '', phone: profile.phone || '', address: profile.address || '' })
      if (authUser) updateUser(profile)
      setPasswordChange(data?.passwordChange || null)
    } catch (error) {
      setLoadError(messageOf(error))
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { load() }, [load])

  const onSaveProfile = async ({ name, phone, address }) => {
    setSavingProfile(true)
    try {
      const { data } = await updateProfileRequest({ name, phone, address })
      if (data?.user) updateUser(data.user)
      toast.success('Đã cập nhật thông tin cá nhân')
    } catch (error) {
      toast.error(messageOf(error))
    } finally {
      setSavingProfile(false)
    }
  }

  const onChangePassword = async ({ currentPassword, newPassword, confirmPassword }) => {
    setSavingPassword(true)
    try {
      const { data } = await changePasswordRequest({ currentPassword, newPassword, confirmPassword })
      if (data?.passwordChange) setPasswordChange(data.passwordChange)
      if (data?.accessToken) establishSession(data.user || null, data.accessToken)
      passwordForm.reset()
      toast.success('Đổi mật khẩu thành công')
    } catch (error) {
      toast.error(messageOf(error))
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <main className="min-h-[75vh] bg-[#f4f2ed] py-10">
      <div className="mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8">
        <div className="border-b border-black pb-6">
          <p className="text-xs font-bold uppercase tracking-[.25em] text-neutral-500">Tài khoản</p>
          <h1 className="mt-2 text-3xl font-black uppercase sm:text-5xl">Hồ sơ của tôi</h1>
          <p className="mt-2 text-sm text-neutral-600">Quản lý thông tin cá nhân và mật khẩu tài khoản của bạn.</p>
        </div>

        {loading ? (
          <div className="mt-8 space-y-4">
            {[1, 2].map((item) => <div key={item} className="h-64 animate-pulse rounded-none bg-white" />)}
          </div>
        ) : loadError ? (
          <div className="mt-8 rounded-none bg-white p-10 text-center">
            <p className="text-sm text-neutral-600">{loadError}</p>
            <button onClick={load} className="mt-4 bg-black px-5 py-3 text-xs font-black uppercase text-white">Thử lại</button>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            {/* Thông tin cá nhân */}
            <section className="rounded-none bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-lg font-black uppercase tracking-wide">Thông tin cá nhân</h2>
              <p className="mt-1 text-xs text-neutral-500">Cập nhật họ tên, số điện thoại và địa chỉ của bạn.</p>

              <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="mt-6 space-y-4" noValidate>
                <Field label="Họ và tên" icon={UserRound}>
                  <input className={inputClass} type="text" autoComplete="name" {...profileForm.register('name')} />
                  {profileForm.formState.errors.name && <span className="mt-1.5 block text-xs text-red-600">{profileForm.formState.errors.name.message}</span>}
                </Field>

                <Field label="Email" icon={AtSign}>
                  <input className={`${inputClass} cursor-not-allowed bg-neutral-100 text-neutral-500`} type="email" value={email || authUser?.email || ''} readOnly disabled />
                  <span className="mt-1.5 block text-xs text-neutral-400">Email dùng để đăng nhập, không thể chỉnh sửa.</span>
                </Field>

                <Field label="Số điện thoại" icon={Phone}>
                  <input className={inputClass} type="tel" autoComplete="tel" placeholder="0123 456 789" {...profileForm.register('phone')} />
                  {profileForm.formState.errors.phone && <span className="mt-1.5 block text-xs text-red-600">{profileForm.formState.errors.phone.message}</span>}
                </Field>

                <Field label="Địa chỉ" icon={MapPin}>
                  <textarea className="w-full rounded-none border border-neutral-300 bg-white px-4 py-3 text-[15px] text-neutral-950 outline-none transition placeholder:text-neutral-300 focus:border-black" rows={3} autoComplete="street-address" placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành" {...profileForm.register('address')} />
                  {profileForm.formState.errors.address && <span className="mt-1.5 block text-xs text-red-600">{profileForm.formState.errors.address.message}</span>}
                </Field>

                <button type="submit" disabled={savingProfile} className="flex h-12 w-full items-center justify-center gap-2 bg-black px-5 text-xs font-bold uppercase tracking-[0.18em] text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60">
                  {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {savingProfile ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </form>
            </section>

            {/* Đổi mật khẩu */}
            <section className="rounded-none bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-lg font-black uppercase tracking-wide">Đổi mật khẩu</h2>
              <p className="mt-1 text-xs text-neutral-500">Mật khẩu cần ít nhất 8 ký tự, gồm chữ hoa và số.</p>

              {passwordChange && (
                <div className={`mt-3 rounded-none border px-4 py-3 text-xs ${passwordChange.remaining > 0 ? 'border-neutral-200 bg-neutral-50 text-neutral-600' : 'border-red-200 bg-red-50 text-red-700'}`}>
                  {passwordChange.remaining > 0
                    ? `Bạn còn ${passwordChange.remaining}/${passwordChange.maxPerDay} lần đổi mật khẩu trong hôm nay.`
                    : `Bạn đã dùng hết ${passwordChange.maxPerDay} lần đổi mật khẩu hôm nay. Vui lòng quay lại vào ngày mai.`}
                </div>
              )}

              <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="mt-6 space-y-4" noValidate>
                <Field label="Mật khẩu hiện tại" icon={KeyRound}>
                  <input className={inputClass} type="password" autoComplete="current-password" {...passwordForm.register('currentPassword')} />
                  {passwordForm.formState.errors.currentPassword && <span className="mt-1.5 block text-xs text-red-600">{passwordForm.formState.errors.currentPassword.message}</span>}
                </Field>

                <Field label="Mật khẩu mới" icon={KeyRound}>
                  <input className={inputClass} type="password" autoComplete="new-password" {...passwordForm.register('newPassword')} />
                  {passwordForm.formState.errors.newPassword && <span className="mt-1.5 block text-xs text-red-600">{passwordForm.formState.errors.newPassword.message}</span>}
                </Field>

                <Field label="Xác nhận mật khẩu mới" icon={KeyRound}>
                  <input className={inputClass} type="password" autoComplete="new-password" {...passwordForm.register('confirmPassword')} />
                  {passwordForm.formState.errors.confirmPassword && <span className="mt-1.5 block text-xs text-red-600">{passwordForm.formState.errors.confirmPassword.message}</span>}
                </Field>

                <button type="submit" disabled={savingPassword || passwordChange?.remaining === 0} className="flex h-12 w-full items-center justify-center gap-2 bg-black px-5 text-xs font-bold uppercase tracking-[0.18em] text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60">
                  {savingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                  {savingPassword ? 'Đang đổi...' : 'Đổi mật khẩu'}
                </button>
              </form>
            </section>
          </div>
        )}
      </div>
    </main>
  )
}
