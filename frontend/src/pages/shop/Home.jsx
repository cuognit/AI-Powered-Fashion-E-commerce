import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, Sparkles, ArrowUpRight } from 'lucide-react'
import { getProducts } from '../../services/productApi'
import heroImg from '../../assets/images/fashion_hero_banner.jpg'
import intelligentWardrobeImg from '../../assets/images/intelligent_wardrobe_bg.jpg'
import intelligentWardrobeImg2 from '../../assets/images/intelligent_wardrobe_bg2.jpg'
import intelligentWardrobeImg3 from '../../assets/images/intelligent_wardrobe_bg3.jpg'

export default function Home() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('01')

  const wardrobeTabs = {
    '01': {
      image: intelligentWardrobeImg,
      title: 'Virtual Size Mapping',
      fitScore: '98%',
      fitDesc: 'Precision 3D body contour mapping calculated from 12 silhouette data points.',
      badgeTitle: 'Personal Style',
      details: [
        { label: 'Style Match', val: '96%' },
        { label: 'Trend Relevance', val: 'High' },
        { label: 'Occasion', val: 'Street / Casual' },
        { label: 'Brand Affinity', val: 'Ader Error' },
      ],
    },
    '02': {
      image: intelligentWardrobeImg2,
      title: 'Dynamic Style Generation',
      fitScore: '95%',
      fitDesc: 'Neural outfit synthesis algorithm matching monochrome palettes and weather trends.',
      badgeTitle: 'Dynamic Outfit',
      details: [
        { label: 'Palette Match', val: '100% Monochrome' },
        { label: 'Layering Balance', val: 'Optimal' },
        { label: 'Silhouette', val: 'Boxy / Minimal' },
        { label: 'Versatility', val: 'High (Day & Night)' },
      ],
    },
    '03': {
      image: intelligentWardrobeImg3,
      title: 'Predictive Tailoring',
      fitScore: '99%',
      fitDesc: 'AI-assisted custom seam, sleeve and shoulder adjustments for tailored perfection.',
      badgeTitle: 'Custom Fit',
      details: [
        { label: 'Sleeve Precision', val: '± 0.2 cm' },
        { label: 'Shoulder Drop', val: 'Exact Match' },
        { label: 'Fabric Drape', val: 'Structured Wool' },
        { label: 'Comfort Rating', val: '9.9 / 10' },
      ],
    },
  }

  const currentTab = wardrobeTabs[activeTab] || wardrobeTabs['01']

  useEffect(() => {
    async function fetchDbProducts() {
      try {
        setLoading(true)
        const response = await getProducts({ limit: 10 })
        const fetchedData = response.data?.data || response.data || []
        if (Array.isArray(fetchedData) && fetchedData.length > 0) {
          setProducts(fetchedData)
        }
      } catch (err) {
        console.error('Failed to fetch DB products for homepage:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchDbProducts()
  }, [])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/collections?search=${encodeURIComponent(searchQuery.trim())}`)
    } else {
      navigate('/collections')
    }
  }

  // Helper format price
  const formatPrice = (amount, fallbackUsd) => {
    if (typeof amount === 'number') {
      if (amount > 5000) {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
      }
      return `$${amount}`
    }
    return fallbackUsd || '$199.00'
  }

  // Fallback items matching image design if DB products are loading/empty
  const fallbackFeatured1 = {
    _id: products[0]?._id || 'feat-1',
    name: products[0]?.name || 'Modular Trench Coat',
    category: 'TECH-CORE',
    price: products[0]?.base_price ? formatPrice(products[0].base_price, '$450.00') : '$450.00',
    image: products[0]?.images?.[0] || 'https://images.unsplash.com/photo-1544441893-675973e31985?w=1000&q=80',
  }

  const fallbackFeatured2 = {
    _id: products[1]?._id || 'feat-2',
    name: products[1]?.name || 'Oversized Hoodie',
    price: products[1]?.base_price ? formatPrice(products[1].base_price, '$180.00') : '$180.00',
    image: products[1]?.images?.[0] || 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&q=80',
  }

  const fallbackNewArrivals = [
    {
      _id: products[2]?._id || 'na-1',
      category: 'BOTTOMS',
      name: products[2]?.name || 'Cargo V1',
      price: products[2]?.base_price ? formatPrice(products[2].base_price, '$240') : '$240',
      image: products[2]?.images?.[0] || 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&q=80',
      badge: 'NEW',
    },
    {
      _id: products[3]?._id || 'na-2',
      category: 'OUTERWEAR',
      name: products[3]?.name || 'Utility Vest',
      price: products[3]?.base_price ? formatPrice(products[3].base_price, '$160') : '$160',
      image: products[3]?.images?.[0] || 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&q=80',
    },
    {
      _id: products[4]?._id || 'na-3',
      category: 'ACCESSORIES',
      name: products[4]?.name || 'Matte Sling',
      price: products[4]?.base_price ? formatPrice(products[4].base_price, '$95') : '$95',
      image: products[4]?.images?.[0] || 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80',
    },
    {
      _id: products[5]?._id || 'na-4',
      category: 'FOOTWEAR',
      name: products[5]?.name || 'A-1 Runner',
      price: products[5]?.base_price ? formatPrice(products[5].base_price, '$310') : '$310',
      image: products[5]?.images?.[0] || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80',
    },
  ]

  const newArrivalsList = products.length >= 6
    ? products.slice(2, 6).map((p, idx) => ({
        _id: p._id,
        category: p.brand?.toUpperCase() || (idx === 0 ? 'BOTTOMS' : idx === 1 ? 'OUTERWEAR' : idx === 2 ? 'ACCESSORIES' : 'FOOTWEAR'),
        name: p.name,
        price: formatPrice(p.base_price, `$${200 + idx * 40}`),
        image: p.images?.[0] || fallbackNewArrivals[idx].image,
        badge: idx === 0 ? 'NEW' : null,
      }))
    : fallbackNewArrivals

  return (
    <div className="w-full bg-[#fcfcfc] text-gray-900 font-sans selection:bg-black selection:text-white">
      {/* ========================================================================= */}
      {/* 1. HERO SECTION - FULL WIDTH */}
      {/* ========================================================================= */}
      <section className="relative w-full">
        <div className="relative w-full rounded-none min-h-[560px] sm:min-h-[660px] lg:min-h-[780px] flex flex-col justify-center items-start bg-black shadow-2xl overflow-visible">
          {/* Background image with subtle slow zoom animation - Full Bleed */}
          <div className="absolute inset-0 z-0 overflow-hidden">
            <motion.img
              src={heroImg}
              alt="Future of Fit Virtual Try-On"
              initial={{ scale: 1 }}
              animate={{ scale: [1, 1.07, 1] }}
              transition={{ repeat: Infinity, duration: 18, ease: 'easeInOut' }}
              className="w-full h-full object-cover object-top opacity-85"
            />
            {/* Gradient vignetting & subtle dark ambient overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/30" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent" />

            {/* Monochrome Ambient Light Beam Accent */}
            <motion.div
              animate={{ opacity: [0.2, 0.4, 0.2], scale: [0.9, 1.1, 0.9] }}
              transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
              className="absolute top-1/4 left-1/3 w-96 h-96 bg-white/10 blur-[120px] pointer-events-none rounded-full"
            />
          </div>

          {/* Hero Inner Content Container */}
          <div className="relative z-10 w-full max-w-[1360px] mx-auto px-6 sm:px-12 lg:px-16 my-auto">
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-2xl space-y-6"
            >
              {/* AI Status Badge */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 text-white text-[11px] font-bold uppercase tracking-widest"
              >
                <Sparkles className="w-3.5 h-3.5 text-white animate-spin-slow" />
                <span>AI Neural Fitting Engine v2.4</span>
              </motion.div>

              {/* Main Headline */}
              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.7, delay: 0.3 }}
                className="text-4xl sm:text-6xl lg:text-7xl font-extrabold uppercase tracking-tight text-white leading-[1.05] drop-shadow-lg"
              >
                Future of Fit: <br />
                <span className="bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                  Virtual Try-On
                </span>
              </motion.h1>

              {/* Action CTA Button */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.7, delay: 0.4 }}
              >
                <Link
                  to="/ai-try-on"
                  className="group relative inline-flex items-center gap-3 bg-white hover:bg-gray-100 text-black border border-white text-xs sm:text-sm font-bold tracking-widest uppercase px-8 py-4 rounded-none shadow-2xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-white/20"
                >
                  <span>Try It Now</span>
                  <motion.span
                    animate={{ x: [0, 4, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                  >
                    <ArrowUpRight className="w-4 h-4 text-black" />
                  </motion.span>
                </Link>
              </motion.div>
            </motion.div>
          </div>

          {/* Floating AI Search Bar (Centered at Bottom Edge - Monochrome Full Width Centered) */}
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: [0, -6, 0], opacity: 1 }}
            transition={{
              y: { repeat: Infinity, duration: 4, ease: 'easeInOut' },
              opacity: { duration: 0.6, delay: 0.5 },
            }}
            className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-40 w-full max-w-3xl px-4 sm:px-0"
          >
            <form
              onSubmit={handleSearchSubmit}
              className="bg-white border border-gray-300 rounded-none h-[80px] px-6 shadow-2xl flex items-center gap-4 transition-all hover:shadow-black/20 focus-within:ring-2 focus-within:ring-black"
            >
              <Search className="w-6 h-6 text-gray-500 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Find a pastel beach outfit for men..."
                className="w-full bg-transparent text-base sm:text-lg text-gray-900 placeholder-gray-400 focus:outline-none font-medium"
              />
              <button
                type="submit"
                className="shrink-0 bg-black text-white border border-black hover:bg-gray-800 text-xs sm:text-sm font-bold tracking-wide px-6 py-3 rounded-none transition flex items-center gap-2 shadow-xs group"
              >
                <Sparkles className="w-4 h-4 text-white group-hover:rotate-12 transition-transform" />
                <span>AI Search</span>
              </button>
            </form>
          </motion.div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. FEATURED PIECES SECTION (#F5F5F1 Background, Asymmetrical Heights) */}
      {/* ========================================================================= */}
      <section className="bg-[#F5F5F1] pt-16 sm:pt-20 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1360px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 0.99, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-10 gap-4"
          >
            <div>
              <span className="text-[11px] font-bold tracking-widest text-gray-600 uppercase block mb-1">
                Curated Selection
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold uppercase tracking-tight text-gray-800">
                Featured Pieces
              </h2>
            </div>
            <Link
              to="/collections"
              className="text-xs font-bold uppercase tracking-wider text-gray-700 underline underline-offset-4 hover:text-black transition"
            >
              View All
            </Link>
          </motion.div>

          {/* Featured Grid with Asymmetrical High-Low Heights */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10 items-start">
            {/* Card 1: Main Large Featured (Taller: 480px, Spans 2 cols) */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-2 group relative"
            >
              <Link to={`/collections`} className="block w-full">
                <div className="relative w-full h-[380px] sm:h-[480px] overflow-hidden rounded-none bg-[#eaeaea] mb-4 shadow-lg group-hover:shadow-2xl transition-shadow duration-500">
                  <img
                    src={fallbackFeatured1.image}
                    alt={fallbackFeatured1.name}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs font-medium">
                    <span className="tracking-widest text-gray-500 group-hover:tracking-[0.2em] transition-all duration-300 uppercase">
                      {fallbackFeatured1.category}
                    </span>
                    <span className="text-gray-900 font-semibold group-hover:scale-105 transition-transform">
                      {fallbackFeatured1.price}
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 group-hover:text-black group-hover:translate-x-1 transition-all duration-300 inline-block underline-offset-4 group-hover:underline">
                    {fallbackFeatured1.name}
                  </h3>
                </div>
              </Link>
            </motion.div>

            {/* Card 2: Right Featured (Shorter: 370px, 1 col - High-Low Contrast) */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="group relative"
            >
              <Link to={`/collections`} className="block w-full">
                <div className="relative w-full h-[300px] sm:h-[370px] overflow-hidden rounded-none bg-[#eaeaea] mb-4 shadow-md group-hover:shadow-xl transition-shadow duration-500">
                  <img
                    src={fallbackFeatured2.image}
                    alt={fallbackFeatured2.name}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                </div>
                <div className="flex justify-between items-center text-sm sm:text-base font-semibold">
                  <h3 className="text-gray-900 group-hover:text-black group-hover:translate-x-1 transition-all duration-300 underline-offset-4 group-hover:underline">
                    {fallbackFeatured2.name}
                  </h3>
                  <span className="text-gray-900 font-medium">
                    {fallbackFeatured2.price}
                  </span>
                </div>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. INTELLIGENT WARDROBE SECTION */}
      {/* ========================================================================= */}
      <section className="bg-[#f0f0f0] py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1360px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Visual Column with AI Badges */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative rounded-none overflow-hidden"
          >
            <div className="relative rounded-none overflow-hidden aspect-[4/5] sm:aspect-[1/1] lg:aspect-[4/5] bg-gray-900">
              {Object.keys(wardrobeTabs).map((key) => {
                const tab = wardrobeTabs[key]
                const isSelected = activeTab === key
                return (
                  <motion.img
                    key={key}
                    src={tab.image}
                    alt={tab.title}
                    initial={false}
                    animate={{ opacity: isSelected ? 1 : 0 }}
                    transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
                    className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
                  />
                )
              })}
              <div className="absolute inset-0 bg-black/20 pointer-events-none" />

              {/* Floating Glassmorphism Badge 1: Dynamic Details */}
              <motion.div
                key={`badge1-${activeTab}`}
                initial={{ opacity: 0.6 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="absolute top-6 right-6 bg-black/75 backdrop-blur-md border border-white/20 text-white rounded-none p-3.5 text-xs space-y-1.5 w-48 shadow-2xl"
              >
                <div className="text-[10px] uppercase font-semibold tracking-widest text-gray-300">
                  {currentTab.badgeTitle}
                </div>
                {currentTab.details.map((d, i) => (
                  <div key={i} className="flex justify-between font-medium text-gray-200">
                    <span>{d.label}</span>
                    <span className="font-semibold text-white">{d.val}</span>
                  </div>
                ))}
              </motion.div>

              {/* Floating Glassmorphism Badge 2: AI Fit Score */}
              <motion.div
                key={`badge2-${activeTab}`}
                initial={{ opacity: 0.6 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="absolute bottom-6 left-6 right-6 bg-black/70 backdrop-blur-xl border border-white/20 text-white rounded-none p-4 shadow-2xl"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-6 h-6 rounded-none bg-white/15 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="font-semibold text-xs uppercase tracking-wider text-white">
                    AI Fit Score: {currentTab.fitScore}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed text-gray-200 font-normal">
                  {currentTab.fitDesc}
                </p>
              </motion.div>
            </div>
          </motion.div>

          {/* Right Content Column */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="flex flex-col justify-center items-start text-left my-auto space-y-8 pl-0 lg:pl-12"
          >
            <div>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight text-black leading-[0.95] mb-6 text-left">
                INTELLIGENT <br />
                WARDROBE
              </h2>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed max-w-lg font-normal text-left">
                Our proprietary AI learns your aesthetic signature to suggest pieces that integrate seamlessly with your current collection. No more guesswork, just curated precision.
              </p>
            </div>

            {/* Interactive Feature List (Matching Screenshot with Sequential Staggered Animations) */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-40px' }}
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.22,
                    delayChildren: 0.1,
                  },
                },
              }}
              className="space-y-4 pt-2 w-full max-w-md"
            >
              {[
                { id: '01', title: 'Virtual Size Mapping' },
                { id: '02', title: 'Dynamic Style Generation' },
                { id: '03', title: 'Predictive Tailoring' },
              ].map((item) => {
                const isActive = activeTab === item.id
                return (
                  <motion.div
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    variants={{
                      hidden: { opacity: 0, x: -30 },
                      visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
                    }}
                    whileHover={{ x: 6 }}
                    className={`group flex items-center justify-start gap-5 pl-4 py-2 cursor-pointer transition-all duration-300 border-l-2 ${
                      isActive
                        ? 'border-black bg-white/40 shadow-xs'
                        : 'border-gray-300 hover:border-black/70 hover:bg-white/20'
                    }`}
                  >
                    <span
                      className={`text-sm font-medium tracking-wide transition-all duration-300 group-hover:translate-x-1 ${
                        isActive ? 'text-black font-bold' : 'text-gray-400 group-hover:text-black'
                      }`}
                    >
                      {item.id}
                    </span>
                    <span
                      className={`text-sm tracking-tight transition-all duration-300 group-hover:translate-x-1.5 ${
                        isActive ? 'text-black font-bold' : 'text-gray-500 font-semibold group-hover:text-black'
                      }`}
                    >
                      {item.title}
                    </span>
                  </motion.div>
                )
              })}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. NEW ARRIVALS SECTION (#f5f5f1 Background, Image-Only Cards) */}
      {/* ========================================================================= */}
      <section className="w-full bg-[#f5f5f1] py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1360px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-10"
          >
            <h2 className="text-2xl sm:text-4xl font-extrabold uppercase tracking-tight text-gray-800">
              New Arrivals
            </h2>
          </motion.div>

          {/* 4-Column Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {newArrivalsList.map((item, index) => (
              <motion.div
                key={item._id || index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group relative"
              >
                <Link to="/collections" className="block w-full">
                  <div className="relative w-full aspect-[3/4] overflow-hidden rounded-none bg-gray-200 mb-3 shadow-md group-hover:shadow-xl transition-shadow duration-500">
                    {item.badge && (
                      <span className="absolute top-2.5 right-2.5 z-10 bg-black text-white text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-none shadow-sm">
                        {item.badge}
                      </span>
                    )}
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                  </div>

                  <div>
                    <span className="text-[10px] font-medium tracking-widest text-gray-500 group-hover:tracking-[0.2em] transition-all duration-300 uppercase block mb-0.5">
                      {item.category}
                    </span>
                    <div className="flex justify-between items-baseline gap-2">
                      <h3 className="text-xs sm:text-sm font-semibold text-gray-900 line-clamp-1 group-hover:text-black group-hover:translate-x-1 transition-all duration-300 underline-offset-4 group-hover:underline">
                        {item.name}
                      </h3>
                      <span className="text-xs sm:text-sm font-medium text-gray-900 shrink-0">
                        {item.price}
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

