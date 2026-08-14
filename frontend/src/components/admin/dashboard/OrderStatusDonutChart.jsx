import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

const STATUS_CONFIG = {
  pending: { label: 'Chờ xử lý', color: '#f59e0b' },
  processing: { label: 'Đang xử lý', color: '#3b82f6' },
  ready_to_ship: { label: 'Sẵn sàng giao', color: '#8b5cf6' },
  shipped: { label: 'Đang vận chuyển', color: '#06b6d4' },
  completed: { label: 'Đã hoàn thành', color: '#10b981' },
  canceled: { label: 'Đã hủy', color: '#ef4444' },
}

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const item = payload[0]
    return (
      <div className='border border-black bg-black p-2.5 text-white shadow-xl min-w-32'>
        <p className='text-[10px] font-bold uppercase tracking-widest text-neutral-400'>
          {item.name}
        </p>
        <p className='mt-1 text-sm font-bold text-white'>
          {item.value} đơn ({((item.value / item.payload.total) * 100).toFixed(1)}%)
        </p>
      </div>
    )
  }
  return null
}

export default function OrderStatusDonutChart({ data = [], loading }) {
  const total = data.reduce((sum, item) => sum + (item.count || 0), 0)

  const chartData = data.map((item) => ({
    name: STATUS_CONFIG[item.status]?.label || item.status,
    value: item.count,
    color: STATUS_CONFIG[item.status]?.color || '#9ca3af',
    total,
  }))

  return (
    <div className='border border-neutral-200 bg-white p-6'>
      <div className='border-b border-neutral-200 pb-4'>
        <span className='text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500'>Vận hành</span>
        <h3 className='text-lg font-black uppercase tracking-tight text-neutral-950'>
          Trạng Thái Đơn Hàng
        </h3>
      </div>

      <div className='mt-4 flex flex-col items-center sm:flex-row'>
        <div className='relative h-60 w-full sm:w-1/2'>
          {loading ? (
            <div className='h-full w-full animate-pulse rounded-full bg-neutral-100' />
          ) : chartData.length === 0 ? (
            <div className='flex h-full items-center justify-center text-xs font-bold uppercase text-neutral-400'>
              Chưa có dữ liệu
            </div>
          ) : (
            <>
              <ResponsiveContainer width='100%' height='100%'>
                <PieChart>
                  <Tooltip content={<CustomTooltip />} />
                  <Pie
                    data={chartData}
                    cx='50%'
                    cy='50%'
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey='value'
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className='pointer-events-none absolute inset-0 flex flex-col items-center justify-center'>
                <span className='text-xl font-black'>{total}</span>
                <span className='text-[9px] font-bold uppercase tracking-wider text-neutral-500'>Tổng đơn</span>
              </div>
            </>
          )}
        </div>

        <div className='mt-4 grid w-full grid-cols-2 gap-2 sm:mt-0 sm:w-1/2 sm:grid-cols-1 sm:pl-4'>
          {chartData.map((item, idx) => (
            <div key={idx} className='flex items-center justify-between text-xs py-1 border-b border-neutral-100'>
              <div className='flex items-center gap-2 truncate'>
                <span className='h-2.5 w-2.5 rounded-full shrink-0' style={{ backgroundColor: item.color }} />
                <span className='truncate font-medium text-neutral-700'>{item.name}</span>
              </div>
              <div className='flex items-center gap-2 font-bold text-neutral-950 shrink-0'>
                <span>{item.value}</span>
                <span className='text-[10px] text-neutral-400 font-normal'>
                  ({total > 0 ? ((item.value / total) * 100).toFixed(0) : 0}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
