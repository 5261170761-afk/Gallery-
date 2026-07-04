import React from 'react';
import { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Heart, Play, Calendar, Tag } from 'lucide-react';
import { MediaItem } from '../types';

interface MediaCardProps {
  item: MediaItem;
  onSelect: (item: MediaItem) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
}

export const MediaCard: React.FC<MediaCardProps> = ({ item, onSelect, onToggleFavorite }) => {
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  useEffect(() => {
    if (item.type !== 'image' && videoRef.current) {
      if (isHovered) {
        videoRef.current.play().catch((err) => {
          // Ignore abort errors from rapid hover/unhover triggers or browser autoplay restrictions
          console.debug("Video hover play interrupted or blocked:", err);
        });
      } else {
        videoRef.current.pause();
        // Reset playback position on unhover for a cleaner transition
        try {
          videoRef.current.currentTime = 0;
        } catch (e) {
          // ignore
        }
      }
    }
  }, [isHovered, item.type]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.4 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSelect(item)}
      className="group relative bg-neutral-900 border border-neutral-800/80 rounded-3xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl hover:shadow-black/40 hover:border-neutral-700/60 transition-all duration-300"
      id={`media-card-${item.id}`}
    >
      {/* Media Source Container */}
      <div className="relative aspect-video sm:aspect-square md:aspect-[4/3] w-full overflow-hidden bg-black flex items-center justify-center">
        {item.type === 'image' ? (
          <img
            src={item.src}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full relative">
            <video
              ref={videoRef}
              key={item.id}
              src={item.src}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
              muted
              playsInline
              loop
            />
            {/* Play overlay in bottom-left */}
            <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md text-white rounded-full p-2 border border-white/10 shadow-lg z-10 transition-transform duration-300 group-hover:scale-110">
              <Play className="w-4 h-4 fill-white text-white" />
            </div>
            {item.duration && (
              <span className="absolute bottom-3 right-3 px-2 py-0.5 rounded bg-black/70 backdrop-blur-sm text-[10px] text-neutral-300 font-mono font-medium border border-white/5">
                {item.duration}
              </span>
            )}
          </div>
        )}

        {/* Dynamic Dark Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />

        {/* Category Badge */}
        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-neutral-950/80 backdrop-blur-md text-[10px] font-bold text-emerald-400 uppercase tracking-wider border border-emerald-500/20">
          {item.category}
        </span>

        {/* Favorite Heart Button */}
        <button
          onClick={(e) => onToggleFavorite(item.id, e)}
          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all duration-300 border ${
            item.isFavorite
              ? 'bg-rose-500/20 border-rose-500/30 text-rose-500 scale-110'
              : 'bg-neutral-950/60 hover:bg-neutral-950/90 border-neutral-800 text-neutral-400 hover:text-white hover:scale-105'
          }`}
          id={`favorite-btn-${item.id}`}
        >
          <Heart className={`w-4 h-4 ${item.isFavorite ? 'fill-rose-500' : ''}`} />
        </button>

        {/* Visual Cue on Hover */}
        <div className="absolute inset-0 bg-neutral-950/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-md text-xs font-medium text-white border border-white/20 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
            View Details
          </span>
        </div>
      </div>

      {/* Content Metadata */}
      <div className="p-4" id={`media-card-info-${item.id}`}>
        <h4 className="text-sm font-medium text-neutral-200 line-clamp-1 group-hover:text-white transition-colors">
          {item.title}
        </h4>
        <p className="text-xs text-neutral-400 line-clamp-2 mt-1 min-h-[2rem]">
          {item.description}
        </p>

        {/* Footer Details */}
        <div className="flex items-center justify-between border-t border-neutral-800/80 mt-3 pt-3 text-[10px] text-neutral-500 font-mono">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-neutral-600" />
            <span>{formatDate(item.dateAdded)}</span>
          </div>
          {item.size && (
            <span className="text-neutral-600">{item.size}</span>
          )}
        </div>

        {/* Tags Section */}
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2.5 pt-1">
            {item.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="inline-flex items-center gap-0.5 text-[9px] text-neutral-500 hover:text-emerald-400 transition-colors">
                <Tag className="w-2.5 h-2.5 text-neutral-600" />
                {tag}
              </span>
            ))}
            {item.tags.length > 3 && (
              <span className="text-[9px] text-neutral-600">+{item.tags.length - 3}</span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default MediaCard;
