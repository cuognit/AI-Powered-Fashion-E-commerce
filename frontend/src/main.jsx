import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { ToastBar, Toaster, toast } from 'react-hot-toast'
import { X } from 'lucide-react'
import { AuthProvider } from './contexts/AuthContext.jsx'
import router from './routes/index.jsx'
import './assets/styles/global.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster position="top-right" toastOptions={{ className: '!rounded-none' }}>
        {(currentToast) => (
          <ToastBar toast={currentToast}>
            {({ icon, message }) => (
              <>
                {icon}
                <span className='flex-1'>{message}</span>
                <button
                  type='button'
                  onClick={() => toast.dismiss(currentToast.id)}
                  className='ml-2 grid h-7 w-7 shrink-0 place-items-center border-l border-neutral-200 text-neutral-500 transition hover:bg-black hover:text-white'
                  aria-label='Đóng thông báo'
                >
                  <X className='h-4 w-4' />
                </button>
              </>
            )}
          </ToastBar>
        )}
      </Toaster>
    </AuthProvider>
  </StrictMode>,
)
