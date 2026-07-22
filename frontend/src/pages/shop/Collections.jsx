export default function Collections() {
  return (
    <div className="max-w-6xl mx-auto py-16 px-4 sm:px-6">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-black uppercase tracking-wider text-gray-900 mb-2">Collections</h1>
        <p className="text-sm text-gray-500">Explore curated minimalist fashion catalogs.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {['Monochrome Minimal', 'Cyber Avant-Garde', 'Architectural Outerwear', 'Urban Essential', 'Zero-G Knitwear', 'Raw Organic Denim'].map((title, i) => (
          <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs hover:shadow-md transition">
            <div className="w-full h-48 bg-gray-100 rounded-xl mb-4 flex items-center justify-center font-bold text-gray-400 uppercase text-xs tracking-widest">
              Collection #{i + 1}
            </div>
            <h3 className="font-bold text-lg text-gray-900">{title}</h3>
            <p className="text-xs text-gray-500 mt-1">2024 Autumn / Winter Edition</p>
          </div>
        ))}
      </div>
    </div>
  )
}
