import { Outlet } from 'react-router-dom'

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-[#f2f0eb] selection:bg-black selection:text-white">
      <Outlet />
    </div>
  )
}
