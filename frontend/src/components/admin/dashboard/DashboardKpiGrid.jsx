import { AlertTriangle, ArrowDownRight, ArrowUpRight, DollarSign, PackageCheck, ShoppingBag, Users } from 'lucide-react'

const formatVNDNumber = (val) =>
  new Intl.NumberFormat('vi-VN').format(val || 0)

const formatFullCurrency = (val) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0)

const getValueFontSize = (valStr) => {
  const len = String(valStr || '').length
  if (len >= 14) return 'text-base sm:text-lg xl:text-base 2xl:text-lg'
  if (len >= 10) return 'text-lg sm:text-xl xl:text-lg 2xl:text-xl'
  return 'text-2xl sm:text-3xl'
}

export default function DashboardKpiGrid({ kpi, loading }) {
  const revVal = kpi?.revenue?.value || 0
  const paidRevVal = kpi?.revenue?.paidRevenue || 0
  const aovVal = kpi?.aov?.value || 0
  const ordersVal = kpi?.orders?.value || 0
  const customersVal = kpi?.customers?.value || 0
  const lowStockVal = kpi?.inventory?.lowStockCount || 0

  const cards = [
    {
      id: 'revenue',
      title: 'Tổng Doanh Thu',
      numberStr: formatVNDNumber(revVal),
      unit: '₫',
      fullText: formatFullCurrency(revVal),
      subtext: `Đã thu: ${formatFullCurrency(paidRevVal)}`,
      change: kpi?.revenue?.change ?? 0,
      icon: DollarSign,
      highlight: true,
    },
    {
      id: 'orders',
      title: 'Tổng Đơn Hàng',
      numberStr: formatVNDNumber(ordersVal),
      unit: 'đơn',
      fullText: `${ordersVal} đơn hàng`,
      subtext: `Hoàn tất: ${kpi?.orders?.successRate || 0}% (${kpi?.orders?.completed || 0} đơn)`,
      change: kpi?.orders?.change ?? 0,
      icon: ShoppingBag,
    },
    {
      id: 'aov',
      title: 'Giá Trị Đơn (AOV)',
      numberStr: formatVNDNumber(aovVal),
      unit: '₫',
      fullText: formatFullCurrency(aovVal),
      subtext: 'Bình quân trên mỗi đơn',
      change: kpi?.aov?.change ?? 0,
      icon: PackageCheck,
    },
    {
      id: 'customers',
      title: 'Khách Hàng Mới',
      numberStr: `+${formatVNDNumber(customersVal)}`,
      unit: 'user',
      fullText: `+${customersVal} người dùng mới`,
      subtext: `Tổng: ${kpi?.customers?.total || 0} khách hàng`,
      change: kpi?.customers?.change ?? 0,
      icon: Users,
    },
    {
      id: 'lowStock',
      title: 'Cảnh Báo Tồn Kho',
      numberStr: formatVNDNumber(lowStockVal),
      unit: 'mặt hàng',
      fullText: `${lowStockVal} sản phẩm sắp hết`,
      subtext: 'Tồn kho dưới an toàn (≤ 10)',
      isWarning: lowStockVal > 0,
      icon: AlertTriangle,
    },
  ]

  if (loading) {
    return (
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5'>
        {[1, 2, 3, 4, 5].map((idx) => (
          <div key={idx} className='h-36 animate-pulse border border-neutral-300 bg-white/70 p-5' />
        ))}
      </div>
    )
  }

  return (
    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5'>
      {cards.map((card) => {
        const Icon = card.icon
        const isPositive = card.change >= 0
        const fontSizeClass = getValueFontSize(card.numberStr)

        return (
          <div
            key={card.id}
            className={`group relative flex flex-col justify-between border p-4 sm:p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-md min-w-0 overflow-hidden ${
              card.highlight
                ? 'border-black bg-black text-white shadow-sm'
                : 'border-neutral-200 bg-white text-neutral-950 hover:border-black'
            }`}
          >
            <div className='flex items-start justify-between gap-2'>
              <span
                className={`text-[10px] font-bold uppercase tracking-[0.16em] truncate ${
                  card.highlight ? 'text-neutral-400' : 'text-neutral-500'
                }`}
              >
                {card.title}
              </span>
              <div
                className={`grid h-7 w-7 sm:h-8 sm:w-8 shrink-0 place-items-center rounded-sm ${
                  card.highlight
                    ? 'bg-neutral-800 text-white'
                    : card.isWarning
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-neutral-100 text-neutral-800'
                }`}
              >
                <Icon className='h-3.5 w-3.5 sm:h-4 sm:w-4' />
              </div>
            </div>

            <div className='my-3 min-w-0'>
              <div
                className='flex items-baseline gap-1 min-w-0 max-w-full overflow-hidden'
                title={card.fullText}
              >
                <h3 className={`font-black tracking-tighter truncate ${fontSizeClass}`}>
                  {card.numberStr}
                </h3>
                {card.unit && (
                  <span
                    className={`text-xs font-bold shrink-0 ${
                      card.highlight ? 'text-neutral-400' : 'text-neutral-500'
                    }`}
                  >
                    {card.unit}
                  </span>
                )}
              </div>
            </div>

            <div className='flex items-center justify-between gap-1.5 pt-2 border-t border-neutral-200/40 text-xs min-w-0'>
              {card.isWarning !== undefined ? (
                <span
                  className={`text-[10px] sm:text-[11px] font-medium truncate ${
                    card.isWarning ? 'text-amber-600 font-semibold' : 'text-neutral-500'
                  }`}
                  title={card.subtext}
                >
                  {card.subtext}
                </span>
              ) : (
                <>
                  <div
                    className={`flex items-center gap-0.5 text-xs font-bold shrink-0 ${
                      isPositive
                        ? card.highlight
                          ? 'text-emerald-400'
                          : 'text-emerald-600'
                        : card.highlight
                        ? 'text-rose-400'
                        : 'text-rose-600'
                    }`}
                  >
                    {isPositive ? (
                      <ArrowUpRight className='h-3 w-3 sm:h-3.5 sm:w-3.5' />
                    ) : (
                      <ArrowDownRight className='h-3 w-3 sm:h-3.5 sm:w-3.5' />
                    )}
                    <span>{Math.abs(card.change)}%</span>
                  </div>
                  <span
                    className={`text-[10px] sm:text-[11px] truncate max-w-[130px] sm:max-w-none ${
                      card.highlight ? 'text-neutral-400' : 'text-neutral-500'
                    }`}
                    title={card.subtext}
                  >
                    {card.subtext}
                  </span>
                </>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
