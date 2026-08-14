import {
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

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className='border border-black bg-black p-3 text-white shadow-xl min-w-44'>
        <p className='text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-400 border-b border-neutral-800 pb-1 mb-2'>
          {data.categoryName}
        </p>
        <div className='text-xs space-y-1'>
          <p className='text-neutral-300'>Doanh thu: <span className='font-bold text-white'>{formatCurrency(data.revenue)}</span></p>
          <p className='text-neutral-300'>Đã bán: <span className='font-bold text-white'>{data.unitsSold} sản phẩm</span></p>
          <p className='text-neutral-300'>Số đơn xuất hiện: <span className='font-bold text-white'>{data.orderCount} đơn</span></p>
        </div>
      </div>
    )
  }
  return null
}

export default function CategorySalesChart({ data = [], loading }) {
  return (
    <div className='border border-neutral-200 bg-white p-6'>
      <div className='border-b border-neutral-200 pb-4'>
        <span className='text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500'>Danh mục hàng hóa</span>
        <h3 className='text-lg font-black uppercase tracking-tight text-neutral-950'>
          Doanh Thu Theo Danh Mục
        </h3>
      </div>

      <div className='mt-6 h-[260px] w-full'>
        {loading ? (
          <div className='h-full w-full animate-pulse bg-neutral-100' />
        ) : data.length === 0 ? (
          <div className='flex h-full items-center justify-center text-xs font-bold uppercase text-neutral-400'>
            Chưa có doanh số theo danh mục
          </div>
        ) : (
          <ResponsiveContainer width='100%' height='100%'>
            <BarChart layout='vertical' data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray='3 3' stroke='#f1f1f1' horizontal={false} />
              <XAxis
                type='number'
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: '#737373', fontWeight: 600 }}
                tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`}
              />
              <YAxis
                dataKey='categoryName'
                type='category'
                tickLine={false}
                axisLine={{ stroke: '#e5e5e5' }}
                tick={{ fontSize: 11, fill: '#18181b', fontWeight: 700 }}
                width={100}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey='revenue' fill='#18181b' radius={[0, 3, 3, 0]} barSize={18} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
