import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Sparkles, X, ArrowRight, CornerDownLeft } from 'lucide-react';

/**
 * Gợi ý tìm kiếm ngữ nghĩa thời trang mẫu
 */
const SAMPLE_AI_QUERIES = [
  'Áo blazer oversize thanh lịch phong cách Hàn Quốc',
  'Đầm lụa maxi tôn dáng dạ tiệc cao cấp',
  'Quần ống suông linen thoáng mát mùa hè',
  'Streetwear retro unisex cá tính'
];

/**
 * SemanticSearchBar - Thanh tìm kiếm thông minh tích hợp AI Semantic Search
 * 
 * @param {Object} props
 * @param {string} [props.placeholder='Tìm kiếm trang phục bằng AI (vd: áo sơ mi trắng dự tiệc, váy hoa vintage)...']
 * @param {string} [props.targetPath='/shop'] - Trang điều hướng khi submit
 * @param {string} [props.className=''] - CSS class tùy biến thêm
 * @param {boolean} [props.showSuggestions=true] - Hiển thị chip gợi ý
 * @param {Function} [props.onSearch] - Callback tùy chọn khi submit
 */
export default function SemanticSearchBar({
  placeholder = 'Tìm kiếm trang phục thông minh bằng AI (vd: blazer sang trọng, đầm lụa tiệc tối)...',
  targetPath = '/shop',
  className = '',
  showSuggestions = true,
  onSearch = null,
}) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inputRef = useRef(null);

  const initialQuery = searchParams.get('q') || searchParams.get('search') || '';
  const [query, setQuery] = useState(initialQuery);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    const cleanQuery = query.trim();
    if (!cleanQuery) return;

    if (onSearch) {
      onSearch(cleanQuery);
    } else {
      // Tự động điều hướng sang trang /shop?q=... (hoặc targetPath tùy chọn)
      navigate(`${targetPath}?q=${encodeURIComponent(cleanQuery)}`);
    }

    if (inputRef.current) {
      inputRef.current.blur();
    }
  };

  const handleClear = () => {
    setQuery('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleSelectSuggestion = (suggestion) => {
    setQuery(suggestion);
    if (onSearch) {
      onSearch(suggestion);
    } else {
      navigate(`${targetPath}?q=${encodeURIComponent(suggestion)}`);
    }
  };

  return (
    <div className={`w-full flex flex-col gap-2.5 ${className}`}>
      {/* Search Input Container */}
      <form
        onSubmit={handleSubmit}
        className={`relative flex items-center w-full transition-all duration-300 rounded-2xl bg-white border ${
          isFocused
            ? 'border-black shadow-lg ring-2 ring-black/5'
            : 'border-gray-200 hover:border-gray-300 shadow-sm'
        }`}
      >
        {/* Left Search Icon */}
        <div className="pl-4.5 pr-2 py-3.5 text-gray-400 flex items-center justify-center pointer-events-none">
          <Search className="w-5 h-5 text-gray-500 transition-colors duration-200" />
        </div>

        {/* Input Text Field */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className="w-full py-3.5 text-sm md:text-base text-gray-900 bg-transparent placeholder-gray-400 focus:outline-none pr-32 font-normal"
        />

        {/* Action Elements: AI Badge + Clear Button + Submit Arrow */}
        <div className="absolute right-2 flex items-center gap-1.5">
          {/* Nút Clear nhanh nếu có text */}
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition"
              title="Xóa tìm kiếm"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* AI Semantic Badge */}
          <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-violet-600/10 via-purple-600/10 to-indigo-600/10 border border-purple-200/60 text-purple-700 text-xs font-medium tracking-wide shadow-2xs select-none">
            <Sparkles className="w-3.5 h-3.5 text-purple-600 animate-pulse" />
            <span>AI Search</span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!query.trim()}
            className="flex items-center justify-center p-2.5 rounded-xl bg-black text-white hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition duration-200"
            title="Tìm kiếm"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* Suggested Semantic Queries (Chips) */}
      {showSuggestions && (
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-gray-600">
          <div className="flex items-center gap-1 text-gray-400 font-medium mr-1">
            <Sparkles className="w-3 h-3 text-purple-500" />
            <span>Thử tìm:</span>
          </div>
          {SAMPLE_AI_QUERIES.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSelectSuggestion(suggestion)}
              className="px-3 py-1 rounded-full bg-gray-100/80 hover:bg-gray-200/90 text-gray-700 hover:text-black border border-transparent hover:border-gray-300 transition duration-150 text-left truncate max-w-[280px]"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
