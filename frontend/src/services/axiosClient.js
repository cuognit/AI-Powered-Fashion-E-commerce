import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL || '/api'

const axiosClient = axios.create({
  baseURL,
  withCredentials: true,
})

// A separate client prevents the refresh request from entering the response
// interceptor and recursively trying to refresh itself.
const refreshClient = axios.create({
  baseURL,
  withCredentials: true,
})

let authBridge = {
  getAccessToken: () => null,
  onTokenRefreshed: () => {},
  onSessionExpired: () => {},
}

let refreshPromise = null

export function configureAuthClient(bridge) {
  authBridge = { ...authBridge, ...bridge }
}

export function requestNewAccessToken() {
  if (!refreshPromise) {
    refreshPromise = refreshClient
      .post('/auth/refresh')
      .then(({ data }) => {
        if (!data?.accessToken) {
          throw new Error('Refresh response did not include an access token')
        }

        authBridge.onTokenRefreshed(data.accessToken)
        return data.accessToken
      })
      .catch((error) => {
        authBridge.onSessionExpired()
        throw error
      })
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}

axiosClient.interceptors.request.use((config) => {
  const accessToken = authBridge.getAccessToken()

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }

  return config
})

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const authEndpoints = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout']
    const isAuthRequest = authEndpoints.some((endpoint) => originalRequest?.url?.includes(endpoint))

    if (error.response?.status !== 401 || !originalRequest || originalRequest._retry || isAuthRequest) {
      return Promise.reject(error)
    }

    originalRequest._retry = true

    try {
      const accessToken = await requestNewAccessToken()
      originalRequest.headers.Authorization = `Bearer ${accessToken}`
      return axiosClient(originalRequest)
    } catch (refreshError) {
      return Promise.reject(refreshError)
    }
  },
)

export default axiosClient
