export default function NewArrivals() {
  return (
    <div className="max-w-6xl mx-auto py-16 px-4 sm:px-6">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-black uppercase tracking-wider text-gray-900 mb-2">New Arrivals</h1>
        <p className="text-sm text-gray-500">Freshly dropped silhouettes for the season.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { name: 'Oversized Struct Shirt', price: '$290' },
          { name: 'Tapered Wool Trousers', price: '$340' },
          { name: 'Minimalist Parka Coat', price: '$580' },
          { name: 'Asymmetric Ribbed Top', price: '$180' }
        ].map((item, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs hover:shadow-md transition">
            <div className="w-full h-56 bg-gray-100 rounded-xl mb-4 flex items-center justify-center font-bold text-gray-400 uppercase text-xs">
              Item #{i + 1}
            </div>
            <h3 className="font-semibold text-sm text-gray-900">{item.name}</h3>
            <p className="text-xs text-gray-500 font-mono mt-1">{item.price}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
