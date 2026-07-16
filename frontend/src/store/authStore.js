import { create } from 'zustand'

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: Boolean(localStorage.getItem('accessToken')),
  setUser: (user) => set({ user, isAuthenticated: Boolean(user) }),
  logout: () => {
    localStorage.removeItem('accessToken')
    set({ user: null, isAuthenticated: false })
  },
}))

export default useAuthStore
