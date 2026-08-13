import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axiosClient from '../../services/axiosClient';
import SemanticSearchBar from '../../components/SemanticSearchBar.jsx';
import { 
  SlidersHorizontal, 
  Search, 
  Eye, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles,
  Database,
  RotateCcw,
  LayoutGrid,
  Tag,
  Ruler,
  Palette,
  Banknote,
  Cpu,
  CheckCircle2
} from 'lucide-react';
import toast from 'react-hot-toast';
import ProductQuickView from '../../components/ProductQuickView.jsx';
import FavoriteButton from '../../components/FavoriteButton.jsx';

// Embedded ProductCard component with the exact requested layout
function ProductCard({ product, onClick }) {
  const inStock = product.status === 'available' && product.variants && product.variants.some(v => v.stock > 0);
  const currentPrice = product.sale_price !== null && product.sale_price !== undefined ? product.sale_price : product.base_price;
  const originalPrice = product.sale_price ? product.base_price : null;
  const isAiRecommended = product.embedding_vector && product.embedding_vector.length > 0;

  return (
    <div 
      onClick={onClick} 
      className={`group cursor-pointer ${!inStock ? 'opacity-80' : ''}`}
    >
      <div className={`relative overflow-hidden aspect-[3/4] bg-surface-container-low ${!inStock ? 'grayscale' : ''}`}>
        <FavoriteButton product={product} className='absolute right-3 top-3 z-20' />
        <img 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
          alt={product.name}
          src={product.images[0] || "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600"}
        />
        
        {isAiRecommended && (
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            <span className="glass-ai px-3 py-1 rounded-full font-technical-mono text-[10px] text-primary flex items-center gap-1 bg-white/20">
              <Sparkles className="w-[14px] h-[14px] fill-current" />
              AI EMBEDDED
            </span>
          </div>
        )}

        {product.score !== undefined && (
          <div className="absolute top-4 right-4 flex flex-col gap-2">
            <span className="px-2.5 py-1 rounded-full font-technical-mono text-[10px] font-bold text-white bg-purple-600/90 backdrop-blur-xs flex items-center gap-1 shadow-sm">
              <Sparkles className="w-[12px] h-[12px] fill-current" />
              {Math.round(product.score * 100)}% MATCH
            </span>
          </div>
        )}

        {inStock ? (
          <div className="absolute bottom-4 left-4">
            <span className="bg-primary text-white px-2 py-1 font-label-caps text-[10px] tracking-widest">IN STOCK</span>
          </div>
        ) : (
          <div className="absolute inset-0 bg-black/5 flex items-center justify-center">
            <span className="bg-surface border border-outline px-4 py-2 font-label-caps text-[12px] tracking-[0.2em] text-primary bg-white">OUT OF STOCK</span>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-1">
        <h3 className="font-body-md text-[14px] text-primary group-hover:underline transition-all">
          {product.name}
        </h3>
        <div className="flex items-center gap-3 mt-1">
          <span className="font-technical-mono text-[14px] font-bold">
            {currentPrice.toLocaleString('vi-VN')} đ
          </span>
          {originalPrice && (
            <span className="font-technical-mono text-[12px] text-outline line-through">
              {originalPrice.toLocaleString('vi-VN')} đ
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Collections() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [searchMode, setSearchMode] = useState(null); // 'semantic' | 'keyword_fallback' | null
  const [searchSuggestions, setSearchSuggestions] = useState([
    'Áo chống nắng UPF 50+',
    'Đồ bơi bikini đi biển',
    'Áo sơ mi lụa công sở',
    'Set đồ tập gym yoga',
    'Đầm dạ tiệc cao cấp',
    'Áo thun streetwear unisex'
  ]);

  // Read URL search params
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get('q') || searchParams.get('search') || '';

  // Filters state
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedCategories, setSelectedCategories] = useState(['Tops', 'Bottoms']);
  const [selectedBrands, setSelectedBrands] = useState(['All']);
  const [selectedSize, setSelectedSize] = useState(null); // null means all
  const [selectedColor, setSelectedColor] = useState(null); // null means all
  const [maxPriceUsd, setMaxPriceUsd] = useState(500); // slider $0 to $500+ (divide VND by 25,000 for representation)
  const [sortBy, setSortBy] = useState('Featured'); // Featured, price-asc, price-desc, newest
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Quick View Modal
  const [selectedProduct, setSelectedProduct] = useState(null);

  const fetchProducts = async (query = '') => {
    setLoading(true);
    try {
      let response;
      if (query && query.trim()) {
        // Gọi API Smart Semantic Search (với cơ chế Fallback tự động ở backend)
        response = await axiosClient.get(`/search/semantic?q=${encodeURIComponent(query.trim())}&limit=50`);
        if (response.data.success) {
          setProducts(response.data.data || []);
          setSearchMode(response.data.search_mode);
          if (response.data.meta?.suggestions?.length > 0) {
            setSearchSuggestions(response.data.meta.suggestions);
          }
        }
      } else {
        response = await axiosClient.get('/products');
        if (response.data.success) {
          setProducts(response.data.data || []);
          setSearchMode(null);
        }
      }
    } catch (error) {
      console.error("Lỗi gọi API products từ axiosClient, đang thử gọi trực tiếp:", error);
      // Fallback
      try {
        const url = query && query.trim() 
          ? `http://localhost:5000/api/v1/search/semantic?q=${encodeURIComponent(query.trim())}&limit=50`
          : 'http://localhost:5000/api/products';
        const response = await fetch(url);
        const data = await response.json();
        if (data.success) {
          setProducts(data.data || []);
          setSearchMode(data.search_mode || null);
          if (data.meta?.suggestions?.length > 0) {
            setSearchSuggestions(data.meta.suggestions);
          }
        }
      } catch (fallbackError) {
        console.error("Lỗi gọi API trực tiếp:", fallbackError);
        toast.error("Không thể kết nối với server backend.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Sync state when URL search param changes (e.g. from header search bar or SemanticSearchBar)
  useEffect(() => {
    const query = searchParams.get('q') || searchParams.get('search') || '';
    setSearchTerm(query);
    setCurrentPage(1);
    fetchProducts(query);
  }, [searchParams]);

  // Update URL search parameters alongside state
  const handleSearchChange = (value) => {
    setSearchTerm(value);
    if (value) {
      setSearchParams({ q: value });
    } else {
      setSearchParams({});
    }
    setCurrentPage(1);
  };

  // Handle seeding database
  const handleSeedData = async () => {
    setSeeding(true);
    try {
      const response = await axiosClient.post('/products/seed');
      if (response.data.success) {
        toast.success("Nạp dữ liệu mẫu thành công!");
        fetchProducts();
      }
    } catch (error) {
      console.error("Lỗi seed data:", error);
      try {
        const response = await fetch('http://localhost:5000/api/products/seed', { method: 'POST' });
        const data = await response.json();
        if (data.success) {
          toast.success("Nạp dữ liệu mẫu thành công!");
          fetchProducts();
        } else {
          toast.error("Seed dữ liệu thất bại.");
        }
      } catch (fallbackError) {
        toast.error("Lỗi khi kết nối với endpoint seed data.");
      }
    } finally {
      setSeeding(false);
    }
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setSearchParams({});
    setSelectedCategories(['Tops', 'Bottoms']);
    setSelectedBrands(['All']);
    setSelectedSize(null);
    setSelectedColor(null);
    setMaxPriceUsd(500);
    setSortBy('Featured');
    setCurrentPage(1);
    toast.success("Đã reset bộ lọc!");
  };

  // Get unique brands dynamically
  const brands = ['All', ...new Set(products.map(p => p.brand).filter(Boolean))];

  // Helper to determine product category type (Tops vs Bottoms) dynamically based on name and SKUs
  const getProductCategoryType = (product) => {
    const name = product.name.toLowerCase();
    const isTop = name.includes('áo') || name.includes('t-shirt') || name.includes('thun') || 
                  (product.variants && product.variants.some(v => v.sku.startsWith('TS')));
    return isTop ? 'Tops' : 'Bottoms';
  };

  // Handler for category selection checkboxes
  const handleCategoryToggle = (cat) => {
    if (selectedCategories.includes(cat)) {
      setSelectedCategories(selectedCategories.filter(c => c !== cat));
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
    setCurrentPage(1);
  };

  // Handler for brand checkboxes
  const handleBrandToggle = (brand) => {
    if (brand === 'All') {
      setSelectedBrands(['All']);
    } else {
      let nextBrands = selectedBrands.filter(b => b !== 'All');
      if (nextBrands.includes(brand)) {
        nextBrands = nextBrands.filter(b => b !== brand);
        if (nextBrands.length === 0) nextBrands = ['All'];
      } else {
        nextBrands = [...nextBrands, brand];
      }
      setSelectedBrands(nextBrands);
    }
    setCurrentPage(1);
  };

  // Handler for sizes
  const handleSizeToggle = (size) => {
    if (selectedSize === size) {
      setSelectedSize(null);
    } else {
      setSelectedSize(size);
    }
    setCurrentPage(1);
  };

  // Handler for colors
  const handleColorToggle = (color) => {
    if (selectedColor === color) {
      setSelectedColor(null);
    } else {
      setSelectedColor(color);
    }
    setCurrentPage(1);
  };

  // Apply filters button action
  const handleApplyFilters = () => {
    toast.success("Đã áp dụng các bộ lọc!");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Filter and sort products based on active sidebar controls
  const filteredProducts = products
    .filter(product => {
      // 1. Category filter
      const catType = getProductCategoryType(product);
      const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(catType);
      
      // 2. Brand filter
      const matchesBrand = selectedBrands.includes('All') || selectedBrands.includes(product.brand);
      
      // 3. Size filter
      const matchesSize = !selectedSize || (product.variants && product.variants.some(v => v.size.toUpperCase() === selectedSize.toUpperCase() && v.stock > 0));
      
      // 4. Color filter
      const matchesColor = !selectedColor || (product.variants && product.variants.some(v => v.color.toLowerCase() === selectedColor.toLowerCase()));

      // 5. Price filter (represented as USD where $1 = 25,000 VND)
      const currentPrice = product.sale_price !== null && product.sale_price !== undefined ? product.sale_price : product.base_price;
      const currentPriceUsd = (currentPrice || 0) / 25000;
      const matchesPrice = currentPriceUsd <= maxPriceUsd;

      return matchesCategory && matchesBrand && matchesSize && matchesColor && matchesPrice;
    })
    .sort((a, b) => {
      const getPrice = (p) => p.sale_price !== null && p.sale_price !== undefined ? p.sale_price : p.base_price;
      if (sortBy === 'Price: Low to High') return getPrice(a) - getPrice(b);
      if (sortBy === 'Price: High to Low') return getPrice(b) - getPrice(a);
      if (sortBy === 'Newest') return new Date(b.createdAt) - new Date(a.createdAt);
      return 0; // Featured (Default)
    });

  // Client-side pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  return (
    <div className="h-full overflow-hidden bg-background">
      <main className="max-w-[var(--spacing-container-max)] mx-auto px-4 sm:px-6 lg:px-8 flex h-full gap-gutter w-full overflow-hidden">
        
        {/* Dynamic Sidebar with exact layout and styles */}
        <aside className="custom-scrollbar hidden h-full w-64 shrink-0 flex-col gap-stack-md overflow-y-auto overscroll-contain py-6 pr-gutter lg:flex">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-headline-md text-headline-md text-primary dark:text-primary-fixed">Bộ lọc</h2>
              <p className="font-label-caps text-[10px] text-on-surface-variant tracking-wider uppercase">Tinh chỉnh lựa chọn</p>
            </div>
            <button 
              onClick={handleResetFilters}
              title="Đặt lại tất cả bộ lọc"
              className="p-1.5 hover:bg-surface-container-high rounded transition-colors text-outline hover:text-primary"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Search bar inside Sidebar */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-on-surface-variant pl-4 py-1">
              <Search className="w-[16px] h-[16px]" />
              <span className="font-label-caps text-[11px] uppercase tracking-wider">Từ khóa tìm kiếm</span>
            </div>
            <div className="pl-8 relative">
              <input 
                type="text"
                placeholder="Tìm kiếm..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant focus:border-primary focus:outline-none text-xs px-3 py-1.5 rounded transition-all"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="flex flex-col gap-2 mt-2">
            <div className="flex items-center gap-2 text-primary font-bold border-l-4 border-primary pl-2 duration-150 cursor-pointer group">
              <LayoutGrid className="w-[18px] h-[18px]" />
              <span className="font-label-caps text-label-caps">Categories</span>
            </div>
            <div className="pl-8 flex flex-col gap-2 mt-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input 
                  checked={selectedCategories.includes('Tops')} 
                  onChange={() => handleCategoryToggle('Tops')} 
                  className="rounded-none border-outline focus:ring-primary text-primary w-4 h-4 accent-primary" 
                  type="checkbox"
                />
                <span className={`font-technical-mono text-[13px] group-hover:text-primary transition-colors ${selectedCategories.includes('Tops') ? 'text-primary font-bold' : 'text-on-surface-variant'}`}>
                    Áo
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer group mt-1">
                <input 
                  checked={selectedCategories.includes('Bottoms')} 
                  onChange={() => handleCategoryToggle('Bottoms')} 
                  className="rounded-none border-outline focus:ring-primary text-primary w-4 h-4 accent-primary" 
                  type="checkbox"
                />
                <span className={`font-technical-mono text-[13px] group-hover:text-primary transition-colors ${selectedCategories.includes('Bottoms') ? 'text-primary font-bold' : 'text-on-surface-variant'}`}>
                    Quần
                </span>
              </label>
            </div>
          </div>

          {/* Brands */}
          <div className="flex flex-col gap-2 mt-4">
            <div className="flex items-center gap-2 text-on-surface-variant pl-4 hover:bg-surface-container-high transition-colors cursor-pointer py-1">
              <Tag className="w-[18px] h-[18px]" />
              <span className="font-label-caps text-label-caps">Thương hiệu</span>
            </div>
            <div className="pl-8 flex flex-col gap-2 mt-2">
              {brands.map(brand => (
                <label key={brand} className="flex items-center gap-2 cursor-pointer group">
                  <input 
                    checked={selectedBrands.includes(brand)} 
                    onChange={() => handleBrandToggle(brand)} 
                    className="rounded-none border-outline focus:ring-primary text-primary w-4 h-4 accent-primary" 
                    type="checkbox"
                  />
                  <span className={`font-technical-mono text-[13px] group-hover:text-primary transition-colors ${selectedBrands.includes(brand) ? 'text-primary font-bold' : 'text-on-surface-variant'}`}>
                    {brand === 'All' ? 'Tất cả thương hiệu' : brand}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Sizes */}
          <div className="flex flex-col gap-2 mt-4">
            <div className="flex items-center gap-2 text-on-surface-variant pl-4 hover:bg-surface-container-high transition-colors cursor-pointer py-1">
              <Ruler className="w-[18px] h-[18px]" />
              <span className="font-label-caps text-label-caps">Kích thước</span>
            </div>
            <div className="pl-8 flex flex-wrap gap-2 mt-2">
              {['S', 'M', 'L', 'XL'].map(size => {
                const isSelected = selectedSize === size;
                return (
                  <button 
                    key={size}
                    onClick={() => handleSizeToggle(size)}
                    className={`w-10 h-10 border flex items-center justify-center font-technical-mono text-[12px] cursor-pointer transition-colors ${
                      isSelected 
                        ? 'border-primary bg-primary text-white font-bold' 
                        : 'border-outline-variant text-outline hover:border-primary'
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Colors */}
          <div className="flex flex-col gap-2 mt-4">
            <div className="flex items-center gap-2 text-on-surface-variant pl-4 hover:bg-surface-container-high transition-colors cursor-pointer py-1">
              <Palette className="w-[18px] h-[18px]" />
              <span className="font-label-caps text-label-caps">Màu sắc</span>
            </div>
            <div className="pl-8 flex flex-wrap gap-3 mt-2">
              {[
                { hex: '#FFB7B2', name: 'Pink' },
                { hex: '#B2E2F2', name: 'Blue' },
                { hex: '#F2F2B2', name: 'Yellow' },
                { hex: '#D1B2F2', name: 'Purple' },
                { hex: '#F5F5F1', name: 'White' },
                { hex: '#1A1A1A', name: 'Black' }
              ].map(colorObj => {
                const isSelected = selectedColor === colorObj.name;
                const isDark = colorObj.hex === '#1A1A1A';
                return (
                  <div 
                    key={colorObj.name}
                    onClick={() => handleColorToggle(colorObj.name)}
                    title={colorObj.name}
                    style={{ backgroundColor: colorObj.hex }}
                    className={`w-6 h-6 rounded-full cursor-pointer transition-all ${
                      isDark ? 'border border-outline' : 'border border-outline-variant/30'
                    } ${
                      isSelected 
                        ? 'ring-offset-2 ring-1 ring-primary scale-110' 
                        : 'hover:scale-110'
                    }`}
                  />
                );
              })}
            </div>
          </div>

          {/* Price (Expressed in USD, mapped to VND in database where $1 = 25k VND) */}
          <div className="flex flex-col gap-2 mt-4">
            <div className="flex items-center gap-2 text-on-surface-variant pl-4 hover:bg-surface-container-high transition-colors cursor-pointer py-1">
              <Banknote className="w-[18px] h-[18px]" />
              <span className="font-label-caps text-label-caps">Giới hạn giá</span>
            </div>
            <div className="pl-8 pt-4">
              <input 
                min="0"
                max="500"
                step="10"
                value={maxPriceUsd}
                onChange={(e) => {
                  setMaxPriceUsd(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="w-full h-1 bg-surface-container-highest appearance-none cursor-pointer accent-primary" 
                type="range"
              />
              <div className="flex justify-between mt-2 font-technical-mono text-[11px] text-on-surface-variant">
                <span>$0</span>
                <span>${maxPriceUsd}{maxPriceUsd === 500 ? '+' : ''}</span>
              </div>
            </div>
          </div>

          <button 
            onClick={handleApplyFilters}
            className="mt-stack-md bg-primary text-white py-3 font-label-caps text-label-caps tracking-[0.2em] hover:opacity-90 transition-all rounded-sm active:scale-[0.98] cursor-pointer"
          >
            Áp dụng bộ lọc
          </button>
        </aside>
        
        {/* Catalog Section */}
        <section className="custom-scrollbar min-w-0 flex-1 overflow-y-auto overscroll-contain py-6 pr-2 md:py-10">
          {/* Top Smart Semantic Search Bar */}
          <div className="mb-8 p-5 bg-gradient-to-r from-gray-50 via-white to-gray-50 border border-gray-200/80 rounded-2xl shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
                <Sparkles className="w-3.5 h-3.5 text-purple-600 animate-pulse" />
                Tìm kiếm ngữ nghĩa thông minh bằng AI
              </span>
              <span className="text-xs text-gray-500 hidden sm:inline">
                • Tìm kiếm bằng ngôn ngữ tự nhiên, cảm xúc, phong cách thời trang
              </span>
            </div>
            <SemanticSearchBar 
              targetPath="/shop"
              placeholder="Thử gõ: 'áo sơ mi trắng dự tiệc thanh lịch', 'đầm hoa mùa hè vintage', 'streetwear oversize'..."
              onSearch={(val) => handleSearchChange(val)}
            />
          </div>

          <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-technical-mono text-[12px] text-outline uppercase tracking-[0.3em]">Đang xem danh mục</span>
                {searchMode === 'semantic' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                    <Sparkles className="w-3 h-3 text-purple-500" />
                    Chế độ: AI Semantic Match
                  </span>
                )}
                {searchMode === 'keyword_fallback' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    <CheckCircle2 className="w-3 h-3 text-amber-600" />
                    Chế độ: Keyword Fallback
                  </span>
                )}
              </div>

              <h1 className="font-headline-xl text-headline-xl text-primary mt-2">
                {searchTerm ? `Kết quả tìm kiếm cho "${searchTerm}"` : "Bộ sưu tập tuyển chọn"}
              </h1>
              <p className="text-on-surface-variant mt-1 font-body-md text-sm">
                Tìm thấy {filteredProducts.length} sản phẩm phù hợp phong cách của bạn.
              </p>
            </div>
            
            {/* Sorting */}
            <div className="flex items-center gap-4 shrink-0">
              <span className="font-label-caps text-label-caps text-on-surface-variant whitespace-nowrap">Sắp xếp:</span>
              <select 
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setCurrentPage(1);
                }}
                className="border-none bg-transparent font-label-caps text-label-caps focus:ring-0 cursor-pointer py-0 outline-none pr-8 relative"
              >
                <option value="Featured">Nổi bật</option>
                <option value="Price: Low to High">Giá: Thấp đến cao</option>
                <option value="Price: High to Low">Giá: Cao đến thấp</option>
                <option value="Newest">Mới nhất</option>
              </select>
            </div>
          </header>

          {/* Loader or Product List */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-gutter gap-y-stack-lg">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse flex flex-col gap-4">
                  <div className="aspect-[3/4] bg-surface-container-low w-full"></div>
                  <div className="h-4 bg-surface-container-low w-2/3 rounded"></div>
                  <div className="h-4 bg-surface-container-low w-1/3 rounded"></div>
                </div>
              ))}
            </div>
          ) : products.length === 0 && searchTerm ? (
            /* AI Empty Search State */
            <div className="text-center py-14 px-6 bg-gradient-to-b from-purple-50/50 to-surface-container-low rounded-2xl border border-purple-100 max-w-2xl mx-auto">
              <div className="h-14 w-14 bg-purple-100/80 rounded-full flex items-center justify-center mx-auto mb-4 text-purple-600 shadow-sm">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-primary">
                Không tìm thấy sản phẩm thời trang nào khớp với "{searchTerm}"
              </h3>
              <p className="text-on-surface-variant text-xs mt-2 mb-6 max-w-md mx-auto leading-relaxed">
                Hệ thống AI không tìm thấy trang phục hoặc phụ kiện liên quan đến từ khóa này trong danh mục thời trang hiện tại. Bạn có thể tham khảo các từ khóa xu hướng dưới đây:
              </p>
              
              {/* Popular Suggestions Pills */}
              <div className="flex flex-wrap justify-center gap-2 mb-6 max-w-lg mx-auto">
                {searchSuggestions.map((sug, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSearchChange(sug)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-white text-purple-700 border border-purple-200 hover:bg-purple-600 hover:text-white hover:border-purple-600 shadow-2xs transition-all cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    {sug}
                  </button>
                ))}
              </div>

              <button
                onClick={() => handleSearchChange('')}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-xs font-semibold tracking-wider uppercase hover:opacity-85 transition-all cursor-pointer rounded-lg"
              >
                Xem toàn bộ bộ sưu tập
              </button>
            </div>
          ) : products.length === 0 ? (
            /* Database is empty - Seed prompt */
            <div className="text-center py-16 bg-surface-container-low rounded-2xl border border-outline-variant p-6 max-w-xl mx-auto">
              <div className="h-14 w-14 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-500">
                <Database className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-primary">Chưa có sản phẩm trong Database</h3>
              <p className="text-outline text-xs mt-2 mb-6 max-w-sm mx-auto leading-relaxed">
                MongoDB Atlas hiện chưa có dữ liệu sản phẩm mẫu. Nhấn nút bên dưới để tự động tạo 26 sản phẩm thời trang cao cấp kèm Vector AI Embeddings.
              </p>
              <button
                onClick={handleSeedData}
                disabled={seeding}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-xs font-semibold tracking-wider uppercase hover:opacity-85 disabled:bg-slate-300 transition-all cursor-pointer"
              >
                {seeding ? "Đang tạo dữ liệu..." : "Tạo dữ liệu mẫu (Seed Database)"}
              </button>
            </div>
          ) : filteredProducts.length === 0 ? (
            /* Empty Filter results */
            <div className="text-center py-20 bg-surface-container-low rounded-2xl border border-outline-variant">
              <div className="h-10 w-10 bg-surface rounded-full flex items-center justify-center mx-auto mb-3 text-outline">
                <Search className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-sm text-primary">Không có sản phẩm nào khớp bộ lọc</h4>
              <p className="text-outline text-xs mt-1">Thử bỏ bớt bộ lọc danh mục hoặc thay đổi mức giá.</p>
            </div>
          ) : (
            /* Actual Product Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-gutter gap-y-stack-lg">
              {paginatedProducts.map(product => (
                <ProductCard 
                  key={product._id} 
                  product={product} 
                  onClick={() => setSelectedProduct(product)}
                />
              ))}
            </div>
          )}

          {/* Dynamic Pagination UI */}
          {!loading && filteredProducts.length > 0 && (
            <div className="mt-stack-lg border-t border-outline-variant pt-10 flex items-center justify-between">
              <button 
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="flex items-center gap-2 font-label-caps text-label-caps text-outline hover:text-primary disabled:opacity-40 disabled:hover:text-outline transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-[18px] h-[18px]" />
                PREVIOUS
              </button>

              <div className="flex gap-4">
                {Array.from({ length: totalPages }).map((_, index) => {
                  const pageNum = index + 1;
                  const isActive = currentPage === pageNum;
                  return (
                    <span 
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`font-technical-mono text-[14px] cursor-pointer transition-colors pb-0.5 ${
                        isActive 
                          ? 'font-bold border-b-2 border-primary text-primary' 
                          : 'text-outline hover:text-primary'
                      }`}
                    >
                      {pageNum.toString().padStart(2, '0')}
                    </span>
                  );
                })}
              </div>

              <button 
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="flex items-center gap-2 font-label-caps text-label-caps text-primary hover:opacity-70 disabled:opacity-40 disabled:hover:opacity-40 transition-colors cursor-pointer"
              >
                NEXT
                <ChevronRight className="w-[18px] h-[18px]" />
              </button>
            </div>
          )}
        </section>
      </main>

      <ProductQuickView product={selectedProduct} onClose={() => setSelectedProduct(null)} />
    </div>
  );
}
