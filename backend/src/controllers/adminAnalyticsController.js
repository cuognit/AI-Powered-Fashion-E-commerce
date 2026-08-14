import * as analyticsService from '../services/adminAnalyticsService.js'

export const getOverview = async (req, res, next) => {
  try {
    const { range = '30d' } = req.query
    const validRanges = ['today', '7d', '30d', 'month', 'year']
    const selectedRange = validRanges.includes(range) ? range : '30d'

    const data = await analyticsService.getDashboardOverview(selectedRange)
    return res.status(200).json({
      success: true,
      data,
    })
  } catch (error) {
    next(error)
  }
}
