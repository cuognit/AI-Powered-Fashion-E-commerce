import mongoose from 'mongoose'
import Order from '../models/Order.js'
import Product from '../models/product.model.js'
import User from '../models/User.js'
import Category from '../models/Category.js'

/**
 * Calculates start and end dates for current and previous comparative period.
 */
function getDateRanges(rangeKey = '30d') {
  const now = new Date()
  let startDate = new Date()
  let previousStartDate = new Date()
  let previousEndDate = new Date()
  let groupFormat = '%Y-%m-%d'
  let labelFormat = 'day'

  switch (rangeKey) {
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
      previousStartDate = new Date(startDate.getTime() - 24 * 60 * 60 * 1000)
      previousEndDate = new Date(startDate.getTime() - 1)
      groupFormat = '%Y-%m-%d %H:00'
      labelFormat = 'hour'
      break
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      previousStartDate = new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000)
      previousEndDate = new Date(startDate.getTime() - 1)
      groupFormat = '%Y-%m-%d'
      labelFormat = 'day'
      break
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0)
      previousStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0)
      previousEndDate = new Date(startDate.getTime() - 1)
      groupFormat = '%Y-%m-%d'
      labelFormat = 'day'
      break
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0)
      previousStartDate = new Date(now.getFullYear() - 1, 0, 1, 0, 0, 0)
      previousEndDate = new Date(startDate.getTime() - 1)
      groupFormat = '%Y-%m'
      labelFormat = 'month'
      break
    case '30d':
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      previousStartDate = new Date(startDate.getTime() - 30 * 24 * 60 * 60 * 1000)
      previousEndDate = new Date(startDate.getTime() - 1)
      groupFormat = '%Y-%m-%d'
      labelFormat = 'day'
      break
  }

  return {
    now,
    startDate,
    previousStartDate,
    previousEndDate,
    groupFormat,
    labelFormat,
  }
}

function calculatePercentageChange(current, previous) {
  if (!previous || previous === 0) {
    return current > 0 ? 100 : 0
  }
  const change = ((current - previous) / previous) * 100
  return Math.round(change * 10) / 10
}

export const getDashboardOverview = async (rangeKey = '30d') => {
  const { now, startDate, previousStartDate, previousEndDate, groupFormat } = getDateRanges(rangeKey)

  // 1. KPI Aggregation for Current Period
  const [currentMetrics] = await Order.aggregate([
    { $match: { createdAt: { $gte: startDate, $lte: now } } },
    {
      $group: {
        _id: null,
        totalRevenue: {
          $sum: {
            $cond: [{ $ne: ['$status', 'canceled'] }, '$total_amount', 0],
          },
        },
        paidRevenue: {
          $sum: {
            $cond: [
              { $in: ['$payment_status', ['paid']] },
              '$total_amount',
              0,
            ],
          },
        },
        totalOrders: { $sum: 1 },
        completedOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
        },
        canceledOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'canceled'] }, 1, 0] },
        },
      },
    },
  ]) || [{ totalRevenue: 0, paidRevenue: 0, totalOrders: 0, completedOrders: 0, canceledOrders: 0 }]

  // 2. KPI Aggregation for Previous Period (For % calculation)
  const [prevMetrics] = await Order.aggregate([
    { $match: { createdAt: { $gte: previousStartDate, $lte: previousEndDate } } },
    {
      $group: {
        _id: null,
        totalRevenue: {
          $sum: {
            $cond: [{ $ne: ['$status', 'canceled'] }, '$total_amount', 0],
          },
        },
        totalOrders: { $sum: 1 },
        completedOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
        },
      },
    },
  ]) || [{ totalRevenue: 0, totalOrders: 0, completedOrders: 0 }]

  // 3. Customer Acquisition (Current vs Prev)
  const [currentNewCustomers, prevNewCustomers, totalCustomers] = await Promise.all([
    User.countDocuments({ role: 'customer', createdAt: { $gte: startDate, $lte: now } }),
    User.countDocuments({ role: 'customer', createdAt: { $gte: previousStartDate, $lte: previousEndDate } }),
    User.countDocuments({ role: 'customer' }),
  ])

  const curRev = currentMetrics?.totalRevenue || 0
  const curOrders = currentMetrics?.totalOrders || 0
  const curAov = curOrders > 0 ? Math.round(curRev / curOrders) : 0

  const prevRev = prevMetrics?.totalRevenue || 0
  const prevOrders = prevMetrics?.totalOrders || 0
  const prevAov = prevOrders > 0 ? Math.round(prevRev / prevOrders) : 0

  // 4. Low stock count and items
  const lowStockThreshold = 10
  const [lowStockCount, lowStockProducts] = await Promise.all([
    Product.countDocuments({ is_deleted: false, total_stock: { $lte: lowStockThreshold } }),
    Product.find({ is_deleted: false, total_stock: { $lte: lowStockThreshold } })
      .select('name total_stock variants base_price images image_assets category_id')
      .populate('category_id', 'name')
      .sort({ total_stock: 1 })
      .limit(6)
      .lean(),
  ])

  // 5. Time Series Trend for Revenue & Orders
  const timeSeriesTrend = await Order.aggregate([
    { $match: { createdAt: { $gte: startDate, $lte: now } } },
    {
      $group: {
        _id: { $dateToString: { format: groupFormat, date: '$createdAt', timezone: '+07:00' } },
        revenue: {
          $sum: {
            $cond: [{ $ne: ['$status', 'canceled'] }, '$total_amount', 0],
          },
        },
        orders: { $sum: 1 },
        completed: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
        },
        canceled: {
          $sum: { $cond: [{ $eq: ['$status', 'canceled'] }, 1, 0] },
        },
      },
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        _id: 0,
        date: '$_id',
        revenue: 1,
        orders: 1,
        completed: 1,
        canceled: 1,
      },
    },
  ])

  // 6. Order Status Breakdown
  const orderStatusBreakdown = await Order.aggregate([
    { $match: { createdAt: { $gte: startDate, $lte: now } } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$total_amount' },
      },
    },
    {
      $project: {
        _id: 0,
        status: '$_id',
        count: 1,
        totalAmount: 1,
      },
    },
  ])

  // 7. Payment Method Breakdown
  const paymentMethodBreakdown = await Order.aggregate([
    { $match: { createdAt: { $gte: startDate, $lte: now } } },
    {
      $group: {
        _id: '$payment_method',
        count: { $sum: 1 },
        totalAmount: { $sum: '$total_amount' },
      },
    },
    {
      $project: {
        _id: 0,
        method: '$_id',
        count: 1,
        totalAmount: 1,
      },
    },
  ])

  // 8. Sales Breakdown by Category
  const categorySales = await Order.aggregate([
    { $match: { createdAt: { $gte: startDate, $lte: now }, status: { $ne: 'canceled' } } },
    { $unwind: '$items' },
    {
      $lookup: {
        from: 'products',
        localField: 'items.product_id',
        foreignField: '_id',
        as: 'product',
      },
    },
    { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: 'categories',
        localField: 'product.category_id',
        foreignField: '_id',
        as: 'category',
      },
    },
    { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: '$category.name',
        revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        unitsSold: { $sum: '$items.quantity' },
        ordersCount: { $addToSet: '$_id' },
      },
    },
    {
      $project: {
        _id: 0,
        categoryName: { $ifNull: ['$_id', 'Chưa phân loại'] },
        revenue: 1,
        unitsSold: 1,
        orderCount: { $size: '$ordersCount' },
      },
    },
    { $sort: { revenue: -1 } },
    { $limit: 6 },
  ])

  // 9. Top 5 Best-Selling Products
  const topProducts = await Order.aggregate([
    { $match: { createdAt: { $gte: startDate, $lte: now }, status: { $ne: 'canceled' } } },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.product_id',
        productName: { $first: '$items.product_name' },
        image: { $first: '$items.image_url' },
        totalSold: { $sum: '$items.quantity' },
        totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
      },
    },
    { $sort: { totalSold: -1, totalRevenue: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'productDoc',
      },
    },
    { $unwind: { path: '$productDoc', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 1,
        name: { $ifNull: ['$productDoc.name', '$productName'] },
        image: {
          $ifNull: [
            { $arrayElemAt: ['$productDoc.images', 0] },
            '$image',
          ],
        },
        base_price: '$productDoc.base_price',
        currentStock: '$productDoc.total_stock',
        totalSold: 1,
        totalRevenue: 1,
      },
    },
  ])

  // 10. Top 5 Best Customers (Top Spenders by order count and revenue)
  const topCustomers = await Order.aggregate([
    { $match: { createdAt: { $gte: startDate, $lte: now }, status: { $ne: 'canceled' }, user_id: { $ne: null } } },
    {
      $group: {
        _id: '$user_id',
        orderCount: { $sum: 1 },
        totalSpent: { $sum: '$total_amount' },
        completedOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
        },
        lastOrderAt: { $max: '$createdAt' },
      },
    },
    { $sort: { totalSpent: -1, orderCount: -1 } },
    { $limit: 15 },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'userDoc',
      },
    },
    { $unwind: { path: '$userDoc', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 1,
        name: { $ifNull: ['$userDoc.name', 'Khách hàng'] },
        email: { $ifNull: ['$userDoc.email', ''] },
        phone: { $ifNull: ['$userDoc.phone', ''] },
        orderCount: 1,
        totalSpent: 1,
        completedOrders: 1,
        lastOrderAt: 1,
      },
    },
  ])

  // 11. Recent 6 Orders
  const recentOrders = await Order.find()
    .select('order_code user_id total_amount payment_method payment_status status createdAt items')
    .populate('user_id', 'name email')
    .sort({ createdAt: -1 })
    .limit(6)
    .lean()

  // Format response
  return {
    period: {
      range: rangeKey,
      startDate,
      endDate: now,
    },
    kpi: {
      revenue: {
        value: curRev,
        change: calculatePercentageChange(curRev, prevRev),
        paidRevenue: currentMetrics?.paidRevenue || 0,
      },
      orders: {
        value: curOrders,
        change: calculatePercentageChange(curOrders, prevOrders),
        completed: currentMetrics?.completedOrders || 0,
        canceled: currentMetrics?.canceledOrders || 0,
        successRate: curOrders > 0 ? Math.round(((currentMetrics?.completedOrders || 0) / curOrders) * 100) : 0,
      },
      aov: {
        value: curAov,
        change: calculatePercentageChange(curAov, prevAov),
      },
      customers: {
        value: currentNewCustomers,
        total: totalCustomers,
        change: calculatePercentageChange(currentNewCustomers, prevNewCustomers),
      },
      inventory: {
        lowStockCount,
      },
    },
    charts: {
      timeSeriesTrend,
      orderStatusBreakdown,
      paymentMethodBreakdown,
      categorySales,
    },
    widgets: {
      topProducts,
      topCustomers,
      recentOrders: recentOrders.map((o) => ({
        _id: o._id,
        order_code: o.order_code,
        customerName: o.user_id?.name || 'Khách vãng lai',
        customerEmail: o.user_id?.email || '',
        total_amount: o.total_amount,
        payment_method: o.payment_method,
        payment_status: o.payment_status,
        status: o.status,
        itemCount: o.items?.length || 0,
        createdAt: o.createdAt,
      })),
      lowStockProducts: lowStockProducts.map((p) => ({
        _id: p._id,
        name: p.name,
        category: p.category_id?.name || 'Chưa phân loại',
        total_stock: p.total_stock,
        base_price: p.base_price,
        image: p.image_assets?.[0]?.url || p.images?.[0] || '',
        variantsCount: p.variants?.length || 0,
      })),
    },
  }
}
