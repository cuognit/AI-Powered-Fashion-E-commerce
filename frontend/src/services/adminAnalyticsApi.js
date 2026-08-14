import axiosClient from './axiosClient.js'

export const getAdminAnalyticsOverview = (range = '30d') =>
  axiosClient.get('/admin/analytics/overview', { params: { range } }).then(({ data }) => data)
