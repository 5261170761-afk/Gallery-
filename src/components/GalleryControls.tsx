import { ChangeEvent } from 'react';
import { Search, Heart, LayoutGrid, SlidersHorizontal, Image as ImageIcon, Film, PlayCircle, Eye, ListFilter } from 'lucide-react';
import { FilterOptions, ViewMode } from '../types';

interface GalleryControlsProps {
  options: FilterOptions;
  onChange: (options: FilterOptions) => void;
  viewMode: ViewMode;
  onChangeViewMode: (mode: ViewMode) => void;
  categories: string[];
  counts: Record<string, number>;
  totalCount: number;
}

export default function GalleryControls({
  options,
  onChange,
  viewMode,
  onChangeViewMode,
  categories,
  counts,
  totalCount,
}: GalleryControlsProps) {
  
  const handleSearchChange = (val: string) => {
    onChange({ ...options, searchQuery: val });
  };

  const handleTypeChange = (type: 'all' | 'image' | 'video') => {
    onChange({ ...options, mediaType: type });
  };

  const handleCategoryChange = (cat: string) => {
    onChange({ ...options, category: cat });
  };

  const handleSortChange = (e: ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...options, sortBy: e.target.value as any });
  };

  const handleFavoriteToggle = () => {
    onChange({ ...options, onlyFavorites: !options.onlyFavorites });
  };

  return (
    <div className="w-full bg-neutral-900/60 border border-neutral-800 rounded-3xl p-5 mb-8 space-y-5 shadow-lg backdrop-blur-md" id="gallery-controls-bar">
      
      {/* Top row: Search + Filters + Layout toggle */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            value={options.searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search titles, tags, descriptions..."
            className="w-full bg-neutral-950/80 border border-neutral-800 hover:border-neutral-700/60 focus:border-emerald-500 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none transition-all duration-200"
            id="search-input-field"
          />
          {options.searchQuery && (
            <button
              onClick={() => handleSearchChange('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-neutral-500 hover:text-neutral-300 font-medium"
              id="clear-search-btn"
            >
              Clear
            </button>
          )}
        </div>

        {/* Secondary controls grid */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 bg-neutral-950/60 border border-neutral-800 rounded-2xl px-3 py-1.5" id="sort-controls">
            <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-500" />
            <select
              value={options.sortBy}
              onChange={handleSortChange}
              className="bg-transparent text-xs text-neutral-300 focus:outline-none cursor-pointer font-sans"
              id="sort-select-element"
            >
              <option value="dateAdded-desc">Newest Added</option>
              <option value="dateAdded-asc">Oldest Added</option>
              <option value="title-asc">Title (A-Z)</option>
              <option value="title-desc">Title (Z-A)</option>
            </select>
          </div>

          {/* Only Favorites filter button */}
          <button
            onClick={handleFavoriteToggle}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl border text-xs font-medium transition-all duration-200 ${
              options.onlyFavorites
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700'
            }`}
            id="favorites-filter-toggle"
          >
            <Heart className={`w-3.5 h-3.5 ${options.onlyFavorites ? 'fill-rose-500 text-rose-500' : ''}`} />
            <span>Favorites</span>
          </button>

          {/* Separator line */}
          <div className="h-6 w-[1px] bg-neutral-800 hidden sm:block" />

          {/* View Mode Switcher */}
          <div className="flex bg-neutral-950/60 border border-neutral-800 rounded-2xl p-1" id="view-mode-toggle">
            <button
              onClick={() => onChangeViewMode('grid')}
              className={`p-1.5 rounded-xl transition-all duration-200 ${
                viewMode === 'grid'
                  ? 'bg-neutral-800 text-white shadow-inner shadow-black/20'
                  : 'text-neutral-500 hover:text-neutral-300'
              }`}
              title="Grid View"
              id="grid-view-btn"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => onChangeViewMode('masonry')}
              className={`p-1.5 rounded-xl transition-all duration-200 ${
                viewMode === 'masonry'
                  ? 'bg-neutral-800 text-white shadow-inner shadow-black/20'
                  : 'text-neutral-500 hover:text-neutral-300'
              }`}
              title="Masonry Gallery View"
              id="masonry-view-btn"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Middle row: Media Type filter tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between pt-1 border-t border-neutral-800/40 gap-3">
        
        {/* Type tabs */}
        <div className="flex bg-neutral-950/60 p-1 border border-neutral-800 rounded-2xl" id="media-type-tabs">
          <button
            onClick={() => handleTypeChange('all')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
              options.mediaType === 'all'
                ? 'bg-emerald-500 text-black'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
            id="type-all-btn"
          >
            <PlayCircle className="w-3.5 h-3.5" />
            <span>All Media</span>
          </button>
          <button
            onClick={() => handleTypeChange('image')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
              options.mediaType === 'image'
                ? 'bg-emerald-500 text-black'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
            id="type-photo-btn"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Photos Only</span>
          </button>
          <button
            onClick={() => handleTypeChange('video')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
              options.mediaType === 'video'
                ? 'bg-emerald-500 text-black'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
            id="type-video-btn"
          >
            <Film className="w-3.5 h-3.5" />
            <span>Videos Only</span>
          </button>
        </div>

        {/* Global info summary */}
        <div className="text-[11px] font-mono text-neutral-500 flex items-center gap-1.5 self-center sm:self-auto" id="results-count-stats">
          <Eye className="w-3.5 h-3.5 text-neutral-600" />
          <span>Showing {totalCount} showcase item{totalCount !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Bottom row: Dynamic Categories horizontally scrollable ribbon */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center gap-1 text-neutral-500 text-[10px] font-semibold uppercase tracking-wider mb-2">
          <ListFilter className="w-3 h-3" />
          <span>Categories</span>
        </div>
        <div 
          className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none snap-x"
          id="category-ribbon-scroller"
        >
          {categories.map((cat) => {
            const isActive = options.category === cat;
            const count = counts[cat] || 0;

            return (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`snap-start inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 whitespace-nowrap border cursor-pointer ${
                  isActive
                    ? 'bg-white border-white text-black font-semibold'
                    : 'bg-neutral-950/40 border-neutral-800 hover:border-neutral-700/80 text-neutral-400 hover:text-neutral-200'
                }`}
                id={`category-pill-${cat.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <span>{cat}</span>
                <span className={`inline-flex items-center justify-center px-1.5 py-0.5 text-[9px] font-mono rounded-full font-bold ${
                  isActive ? 'bg-black text-white' : 'bg-neutral-800 text-neutral-400'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}
