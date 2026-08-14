import { useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const formatCurrency = (val) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(val || 0)

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className='border border-black bg-black p-3 text-white shadow-xl min-w-44'>
        <p className='text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-400 border-b border-neutral-800 pb-1 mb-2'>
          {label}
        </p>
        {payload.map((entry, index) => (
          <div key={index} className='flex items-center justify-between gap-4 text-xs py-0.5'>
            <span className='flex items-center gap-1.5 text-neutral-300'>
              <span className='h-2 w-2 rounded-full' style={{ backgroundColor: entry.color }} />
              {entry.name}:
            </span>
            <span className='font-bold text-white'>
              {entry.dataKey === 'revenue' ? formatCurrency(entry.value) : `${entry.value} đơn`}
            </span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export default function RevenueTrendChart({ data = [], loading }) {
  const [viewMode, setViewMode] = useState('revenue') // 'revenue' | 'orders'

  // Format date display for X-axis
  const formattedData = data.map((item) => {
    let displayDate = item.date
    if (item.date && item.date.includes('-')) {
      const parts = item.date.split(' ')[0].split('-')
      if (parts.length === 3) {
        displayDate = `${parts[2]}/${parts[1]}`
      }
    }
    return {
      ...item,
      displayDate,
    }
  })

  return (
    <div className='border border-neutral-200 bg-white p-6'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-neutral-200 pb-4'>
        <div>
          <span className='text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500'>Biểu đồ phân tích</span>
          <h3 className='text-lg font-black uppercase tracking-tight text-neutral-950'>
            {viewMode === 'revenue' ? 'Xu Hướng Doanh Thu' : 'Số Lượng Đơn Hàng'} Theo Thời Gian
          </h3>
        </div>

        <div className='flex items-center gap-1 rounded-sm border border-neutral-300 bg-neutral-100 p-1'>
          <button
            type='button'
            onClick={() => setViewMode('revenue')}
            className={`px-3 py-1 text-xs font-bold uppercase tracking-wider transition ${
              viewMode === 'revenue' ? 'bg-black text-white shadow-sm' : 'text-neutral-600 hover:text-black'
            }`}
          >
            Doanh Thu
          </button>
          <button
            type='button'
            onClick={() => setViewMode('orders')}
            className={`px-3 py-1 text-xs font-bold uppercase tracking-wider transition ${
              viewMode === 'orders' ? 'bg-black text-white shadow-sm' : 'text-neutral-600 hover:text-black'
            }`}
          >
            Số Đơn Hàng
          </button>
        </div>
      </div>

      <div className='mt-6 h-[320px] w-full'>
        {loading ? (
          <div className='h-full w-full animate-pulse bg-neutral-100' />
        ) : formattedData.length === 0 ? (
          <div className='flex h-full items-center justify-center text-xs font-semibold uppercase tracking-wider text-neutral-400'>
            Chưa có dữ liệu trong khoảng thời gian này
          </div>
        ) : (
          <ResponsiveContainer width='100%' height='100%'>
            {viewMode === 'revenue' ? (
              <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id='revenueGradient' x1='0' y1='0' x2='0' y2='1'>
                    <stop offset='5%' stopColor='#18181b' stopOpacity={0.4} />
                    <stop offset='95%' stopColor='#18181b' stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray='3 3' stroke='#f1f1f1' vertical={false} />
                <XAxis
                  dataKey='displayDate'
                  tickLine={false}
                  axisLine={{ stroke: '#e5e5e5' }}
                  tick={{ fontSize: 11, fill: '#737373', fontWeight: 600 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: '#737373', fontWeight: 600 }}
                  tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type='monotone'
                  dataKey='revenue'
                  name='Doanh thu'
                  stroke='#18181b'
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill='url(#revenueGradient)'
                />
              </AreaChart>
            ) : (
              <BarChart data={formattedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray='3 3' stroke='#f1f1f1' vertical={false} />
                <XAxis
                  dataKey='displayDate'
                  tickLine={false}
                  axisLine={{ stroke: '#e5e5e5' }}
                  tick={{ fontSize: 11, fill: '#737373', fontWeight: 600 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: '#737373', fontWeight: 600 }}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey='orders' name='Tổng đơn' fill='#18181b' radius={[2, 2, 0, 0]} />
                <Bar dataKey='completed' name='Hoàn thành' fill='#10b981' radius={[2, 2, 0, 0]} />
                <Bar dataKey='canceled' name='Đã hủy' fill='#ef4444' radius={[2, 2, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
