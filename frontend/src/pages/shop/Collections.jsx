import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axiosClient from '../../services/axiosClient';
import { 
  SlidersHorizontal, 
  Search, 
  Eye, 
  ShoppingBag, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles,
  Database,
  RotateCcw,
  LayoutGrid,
  Tag,
  Ruler,
  Palette,
  Banknote
} from 'lucide-react';
import toast from 'react-hot-toast';

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
        <img 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
          alt={product.name}
          src={product.images[0] || "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600"}
        />
        
        {isAiRecommended && (
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            <span className="glass-ai px-3 py-1 rounded-full font-technical-mono text-[10px] text-primary flex items-center gap-1 bg-white/20">
              <Sparkles className="w-[14px] h-[14px] fill-current" />
              AI RECOMMENDATION
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

  // Read URL search params
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

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

  // Sync state when URL search param changes (e.g. from header search bar)
  useEffect(() => {
    const query = searchParams.get('search') || '';
    setSearchTerm(query);
    setCurrentPage(1);
  }, [searchParams]);

  // Update URL search parameters alongside state
  const handleSearchChange = (value) => {
    setSearchTerm(value);
    if (value) {
      setSearchParams({ search: value });
    } else {
      setSearchParams({});
    }
    setCurrentPage(1);
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await axiosClient.get('/products');
      if (response.data.success) {
        setProducts(response.data.data);
      }
    } catch (error) {
      console.error("Lỗi gọi API products từ axiosClient, đang thử gọi trực tiếp:", error);
      // Fallback
      try {
        const response = await fetch('http://localhost:5000/api/products');
        const data = await response.json();
        if (data.success) {
          setProducts(data.data);
        }
      } catch (fallbackError) {
        console.error("Lỗi gọi API trực tiếp:", fallbackError);
        toast.error("Không thể kết nối với server backend.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

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
      // 1. Search term filter
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            product.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      // 2. Category filter
      const catType = getProductCategoryType(product);
      const matchesCategory = selectedCategories.includes(catType);
      
      // 3. Brand filter
      const matchesBrand = selectedBrands.includes('All') || selectedBrands.includes(product.brand);
      
      // 4. Size filter
      const matchesSize = !selectedSize || (product.variants && product.variants.some(v => v.size.toUpperCase() === selectedSize.toUpperCase() && v.stock > 0));
      
      // 5. Color filter
      const matchesColor = !selectedColor || (product.variants && product.variants.some(v => v.color.toLowerCase() === selectedColor.toLowerCase()));

      // 6. Price filter (represented as USD where $1 = 25,000 VND)
      const currentPrice = product.sale_price !== null && product.sale_price !== undefined ? product.sale_price : product.base_price;
      const currentPriceUsd = currentPrice / 25000;
      const matchesPrice = currentPriceUsd <= maxPriceUsd;

      return matchesSearch && matchesCategory && matchesBrand && matchesSize && matchesColor && matchesPrice;
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
    <div className="min-h-screen bg-background">
      <main className="max-w-[var(--spacing-container-max)] mx-auto px-margin-desktop flex gap-gutter w-full flex-1 py-10">
        
        {/* Dynamic Sidebar with exact layout and styles */}
        <aside className="hidden lg:flex flex-col gap-stack-md py-4 pr-gutter h-[calc(100vh-80px)] w-64 left-0 sticky overflow-y-auto custom-scrollbar shrink-0">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-headline-md text-headline-md text-primary dark:text-primary-fixed">Filters</h2>
              <p className="font-label-caps text-[10px] text-on-surface-variant tracking-wider uppercase">Refine your selection</p>
            </div>
            <button 
              onClick={handleResetFilters}
              title="Reset all filters"
              className="p-1.5 hover:bg-surface-container-high rounded transition-colors text-outline hover:text-primary"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Search bar inside Sidebar */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-on-surface-variant pl-4 py-1">
              <Search className="w-[16px] h-[16px]" />
              <span className="font-label-caps text-[11px] uppercase tracking-wider">Search Keyword</span>
            </div>
            <div className="pl-8 relative">
              <input 
                type="text"
                placeholder="Search..."
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
                  Tops
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
                  Bottoms
                </span>
              </label>
            </div>
          </div>

          {/* Brands */}
          <div className="flex flex-col gap-2 mt-4">
            <div className="flex items-center gap-2 text-on-surface-variant pl-4 hover:bg-surface-container-high transition-colors cursor-pointer py-1">
              <Tag className="w-[18px] h-[18px]" />
              <span className="font-label-caps text-label-caps">Brands</span>
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
                    {brand === 'All' ? 'All Brands' : brand}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Sizes */}
          <div className="flex flex-col gap-2 mt-4">
            <div className="flex items-center gap-2 text-on-surface-variant pl-4 hover:bg-surface-container-high transition-colors cursor-pointer py-1">
              <Ruler className="w-[18px] h-[18px]" />
              <span className="font-label-caps text-label-caps">Sizes</span>
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
              <span className="font-label-caps text-label-caps">Colors</span>
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
              <span className="font-label-caps text-label-caps">Price Limit</span>
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
            Apply Filters
          </button>
        </aside>
        
        {/* Catalog Section */}
        <section className="flex-1 py-10 min-w-0">
          <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="font-technical-mono text-[12px] text-outline uppercase tracking-[0.3em]">Browsing Catalog</span>
              <h1 className="font-headline-xl text-headline-xl text-primary mt-2">
                {searchTerm ? `Search results for "${searchTerm}"` : "Curated Collections"}
              </h1>
              <p className="text-on-surface-variant mt-2 font-body-md">
                Showing {filteredProducts.length} curated pieces that match your aesthetic profile.
              </p>
            </div>
            
            {/* Sorting */}
            <div className="flex items-center gap-4">
              <span className="font-label-caps text-label-caps text-on-surface-variant whitespace-nowrap">Sort by:</span>
              <select 
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setCurrentPage(1);
                }}
                className="border-none bg-transparent font-label-caps text-label-caps focus:ring-0 cursor-pointer py-0 outline-none pr-8 relative"
              >
                <option>Featured</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
                <option>Newest</option>
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
          ) : products.length === 0 ? (
            /* Database is empty - Seed prompt */
            <div className="text-center py-16 bg-surface-container-low rounded-2xl border border-outline-variant p-6 max-w-xl mx-auto">
              <div className="h-14 w-14 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-500">
                <Database className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-primary">No Products in Database</h3>
              <p className="text-outline text-xs mt-2 mb-6 max-w-sm mx-auto leading-relaxed">
                Your MongoDB Atlas collection is currently empty. Click the button below to seed sample high-quality products.
              </p>
              <button
                onClick={handleSeedData}
                disabled={seeding}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-xs font-semibold tracking-wider uppercase hover:opacity-85 disabled:bg-slate-300 transition-all cursor-pointer"
              >
                {seeding ? "Seeding..." : "Seed Database"}
              </button>
            </div>
          ) : filteredProducts.length === 0 ? (
            /* Empty Filter results */
            <div className="text-center py-20 bg-surface-container-low rounded-2xl border border-outline-variant">
              <div className="h-10 w-10 bg-surface rounded-full flex items-center justify-center mx-auto mb-3 text-outline">
                <Search className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-sm text-primary">No items match your criteria</h4>
              <p className="text-outline text-xs mt-1">Try resetting the filters or altering your search term.</p>
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

      {/* Quick View / Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="relative bg-white rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col md:flex-row max-h-[90vh]">
            
            {/* Close Button */}
            <button 
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-white/80 hover:bg-slate-100 rounded-full border border-slate-200 text-slate-800 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Left Column: Image */}
            <div className="md:w-1/2 bg-slate-50 flex items-center justify-center p-4 min-h-[300px]">
              <img 
                src={selectedProduct.images[0] || "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600"} 
                alt={selectedProduct.name}
                className="max-h-[400px] w-full object-cover rounded-2xl shadow-sm"
              />
            </div>

            {/* Right Column: Information */}
            <div className="md:w-1/2 p-6 md:p-8 flex flex-col overflow-y-auto max-h-[50vh] md:max-h-[90vh]">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest bg-amber-50 px-2 py-0.5 rounded">
                  {selectedProduct.brand}
                </span>
                <span className="text-slate-400 text-xs">• ID: {selectedProduct._id}</span>
              </div>

              <h2 className="text-xl md:text-2xl font-bold text-slate-950 mb-3 leading-snug">
                {selectedProduct.name}
              </h2>

              {/* Price section */}
              <div className="flex items-baseline gap-3 mb-6 bg-slate-50 p-3.5 rounded-2xl">
                {selectedProduct.sale_price ? (
                  <>
                    <span className="text-2xl font-extrabold text-red-500">
                      {selectedProduct.sale_price.toLocaleString('vi-VN')} đ
                    </span>
                    <span className="text-sm text-slate-400 line-through">
                      {selectedProduct.base_price.toLocaleString('vi-VN')} đ
                    </span>
                  </>
                ) : (
                  <span className="text-2xl font-extrabold text-slate-950">
                    {selectedProduct.base_price.toLocaleString('vi-VN')} đ
                  </span>
                )}
              </div>

              {/* Description */}
              <div className="mb-6">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Mô tả sản phẩm</h4>
                <p className="text-slate-600 text-sm leading-relaxed">
                  {selectedProduct.description || "Sản phẩm thời trang cao cấp được thiết kế theo xu hướng mới nhất, sử dụng chất liệu an toàn, thoáng mát, mang lại sự tự tin và thoải mái tối đa cho người mặc."}
                </p>
              </div>

              {/* Variants (Colors, Sizes, Stock) */}
              <div className="mb-6">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Phiên bản có sẵn</h4>
                <div className="space-y-2">
                  {selectedProduct.variants && selectedProduct.variants.length > 0 ? (
                    selectedProduct.variants.map((v, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors text-xs">
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-slate-700 bg-slate-200 px-2 py-0.5 rounded">SKU: {v.sku}</span>
                          <span className="text-slate-500">Màu: <strong>{v.color}</strong></span>
                          <span className="text-slate-500">Size: <strong>{v.size}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {v.stock > 0 ? (
                            <>
                              <span className="inline-block h-2 w-2 bg-green-500 rounded-full"></span>
                              <span className="font-medium text-green-700">Còn {v.stock} sản phẩm</span>
                            </>
                          ) : (
                            <>
                              <span className="inline-block h-2 w-2 bg-red-500 rounded-full"></span>
                              <span className="font-medium text-red-600">Hết hàng</span>
                            </>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400 text-xs italic">Không có thông tin phiên bản</p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-auto">
                <button
                  disabled={selectedProduct.status === 'out_of_stock'}
                  onClick={() => {
                    toast.success("Đã thêm vào giỏ hàng mẫu!");
                    setSelectedProduct(null);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white rounded-xl font-semibold text-sm transition-colors cursor-pointer"
                >
                  <ShoppingBag className="h-4 w-4" />
                  Thêm vào giỏ hàng
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
