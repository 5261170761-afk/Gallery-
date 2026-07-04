import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LayoutGrid, RefreshCw } from 'lucide-react';
import { MediaItem, ViewMode } from '../types';
import MediaCard from './MediaCard';

interface GalleryGridProps {
  items: MediaItem[];
  viewMode: ViewMode;
  onSelectItem: (item: MediaItem) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onResetFilters: () => void;
}

export default function GalleryGrid({
  items,
  viewMode,
  onSelectItem,
  onToggleFavorite,
  onResetFilters,
}: GalleryGridProps): React.JSX.Element {
  
  if (items.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center text-center py-20 px-4 bg-neutral-900/20 border border-neutral-900 rounded-3xl"
        id="empty-gallery-state"
      >
        <div className="p-4 rounded-full bg-neutral-900 text-neutral-500 mb-4 border border-neutral-800">
          <LayoutGrid className="w-8 h-8 animate-pulse" />
        </div>
        <h3 className="text-md font-medium text-neutral-300">No media items found</h3>
        <p className="text-xs text-neutral-500 mt-1 max-w-sm">
          Try relaxing your search terms, modifying your filters, or uploading a new picture or video.
        </p>
        <button
          onClick={onResetFilters}
          className="mt-6 px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-medium text-neutral-300 hover:text-white transition-all duration-200 flex items-center gap-1.5"
          id="reset-filters-empty-btn"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Reset All Filters
        </button>
      </motion.div>
    );
  }

  return (
    <div className="w-full" id="gallery-display-wrapper">
      <AnimatePresence mode="popLayout">
        {viewMode === 'masonry' ? (
          /* MASONRY VIEW (Fluid flow using CSS Columns) */
          <motion.div
            key="masonry-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 [column-fill:_balance] w-full"
            id="gallery-masonry-container"
          >
            {items.map((item) => (
              <div key={item.id} className="break-inside-avoid mb-6">
                <MediaCard
                  item={item}
                  onSelect={onSelectItem}
                  onToggleFavorite={onToggleFavorite}
                />
              </div>
            ))}
          </motion.div>
        ) : (
          /* STANDARD GRID VIEW */
          <motion.div
            key="grid-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full"
            id="gallery-grid-container"
          >
            {items.map((item) => (
              <MediaCard
                key={item.id}
                item={item}
                onSelect={onSelectItem}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
