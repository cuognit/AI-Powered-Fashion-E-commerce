import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { configureAuthClient, requestNewAccessToken } from '../services/axiosClient.js'
import { logout as logoutRequest } from '../services/authApi.js'

const AuthContext = createContext(null)

function getUserFromToken(token) {
  try {
    const encodedPayload = token.split('.')[1]
    const normalizedPayload = encodedPayload.replace(/-/g, '+').replace(/_/g, '/')
    const paddedPayload = normalizedPayload.padEnd(Math.ceil(normalizedPayload.length / 4) * 4, '=')
    const payload = JSON.parse(atob(paddedPayload))

    return {
      id: payload.sub,
      role: payload.role,
    }
  } catch {
    return null
  }
}

function AuthLoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f2f0eb]" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-4">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-black" />
        <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-neutral-500">Đang khôi phục phiên đăng nhập</span>
      </div>
    </div>
  )
}

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(null)
  const [user, setUser] = useState(null)
  const [isInitializing, setIsInitializing] = useState(true)
  const accessTokenRef = useRef(null)

  const applyAccessToken = useCallback((token, userData) => {
    accessTokenRef.current = token
    setAccessToken(token)
    setUser((currentUser) => userData || currentUser || getUserFromToken(token))
  }, [])

  const clearSession = useCallback(() => {
    accessTokenRef.current = null
    setAccessToken(null)
    setUser(null)
  }, [])

  const establishSession = useCallback((userData, token) => {
    applyAccessToken(token, userData)
  }, [applyAccessToken])

  const updateUser = useCallback((patch) => {
    setUser((currentUser) => (currentUser ? { ...currentUser, ...patch } : currentUser))
  }, [])

  const logout = useCallback(async () => {
    try {
      await logoutRequest()
    } finally {
      clearSession()
    }
  }, [clearSession])

  useEffect(() => {
    let active = true

    // Remove tokens saved by the previous localStorage-based implementation.
    localStorage.removeItem('accessToken')

    configureAuthClient({
      getAccessToken: () => accessTokenRef.current,
      onTokenRefreshed: (token) => {
        if (active) applyAccessToken(token)
      },
      onSessionExpired: () => {
        if (active) clearSession()
      },
    })

    requestNewAccessToken()
      .catch(() => null)
      .finally(() => {
        if (active) setIsInitializing(false)
      })

    return () => {
      active = false
    }
  }, [applyAccessToken, clearSession])

  const value = useMemo(() => ({
    accessToken,
    user,
    isAuthenticated: Boolean(accessToken),
    isInitializing,
    establishSession,
    updateUser,
    clearSession,
    logout,
  }), [accessToken, user, isInitializing, establishSession, updateUser, clearSession, logout])

  return (
    <AuthContext.Provider value={value}>
      {isInitializing ? <AuthLoadingScreen /> : children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }

  return context
}
