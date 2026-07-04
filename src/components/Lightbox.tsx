import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, ChevronLeft, ChevronRight, Heart, Edit2, Check, Trash2, 
  Download, Calendar, Tag, Info, FileText, FolderOpen, Lock
} from 'lucide-react';
import { MediaItem } from '../types';

interface LightboxProps {
  item: MediaItem;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onUpdateItem: (updatedItem: MediaItem) => void;
  onDeleteItem: (id: string) => void;
  isAdmin?: boolean;
}

export default function Lightbox({ 
  item, onClose, onPrev, onNext, onToggleFavorite, onUpdateItem, onDeleteItem, isAdmin = false 
}: LightboxProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(item.title);
  const [editDesc, setEditDesc] = useState(item.description);
  const [editCategory, setEditCategory] = useState(item.category);
  const [editTags, setEditTags] = useState(item.tags.join(', '));

  // Reset local form whenever item shifts
  useEffect(() => {
    setEditTitle(item.title);
    setEditDesc(item.description);
    setEditCategory(item.category);
    setEditTags(item.tags.join(', '));
    setIsEditing(false);
  }, [item]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEditing) return; // Ignore hotkeys while editing forms
      
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onPrev, onNext, isEditing]);

  const handleSave = () => {
    const tags = editTags
      .split(',')
      .map(t => t.trim().toLowerCase())
      .filter(t => t.length > 0);

    onUpdateItem({
      ...item,
      title: editTitle.trim() || item.title,
      description: editDesc.trim() || item.description,
      category: editCategory,
      tags: tags.length > 0 ? tags : ['portfolio'],
    });
    setIsEditing(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isUploaded = item.id.startsWith('uploaded-');

  return (
    <div className="fixed inset-0 bg-neutral-950/95 backdrop-blur-md z-50 flex flex-col md:flex-row overflow-hidden" id="lightbox-overlay">
      
      {/* Immersive Main Media Section */}
      <div className="relative flex-1 flex items-center justify-center bg-black/40 p-4 md:p-8 select-none" id="lightbox-media-viewer">
        
        {/* Floating Close Button for mobile */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 md:hidden p-2.5 rounded-full bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 z-10 hover:text-white"
          id="mobile-close-btn"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Navigation - Previous */}
        <button
          onClick={onPrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white transition-all duration-200 z-10 hover:scale-110 active:scale-95 shadow-xl shadow-black/40"
          title="Previous (Left Arrow)"
          id="prev-media-btn"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Media Container with smooth mount transitions */}
        <AnimatePresence mode="wait">
          <motion.div
            key={item.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full max-h-[75vh] md:max-h-[85vh] flex items-center justify-center relative"
          >
            {item.type === 'image' ? (
              <img
                src={item.src}
                alt={item.title}
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl shadow-black"
                referrerPolicy="no-referrer"
              />
            ) : (
              <video
                key={item.id}
                src={item.src}
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl shadow-black"
                controls
                autoPlay
                playsInline
                loop
                id={`lightbox-video-${item.id}`}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation - Next */}
        <button
          onClick={onNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white transition-all duration-200 z-10 hover:scale-110 active:scale-95 shadow-xl shadow-black/40"
          title="Next (Right Arrow)"
          id="next-media-btn"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Side Details/Editing Panel */}
      <div 
        className="w-full md:w-[400px] border-t md:border-t-0 md:border-l border-neutral-800/80 bg-neutral-900/90 backdrop-blur-md flex flex-col justify-between"
        id="lightbox-sidebar-panel"
      >
        {/* Header Options */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-800/80">
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => onToggleFavorite(item.id, e)}
              className={`p-2 rounded-lg border transition-all duration-200 ${
                item.isFavorite
                  ? 'bg-rose-500/20 border-rose-500/30 text-rose-500'
                  : 'bg-neutral-950/60 hover:bg-neutral-950/90 border-neutral-800 text-neutral-400 hover:text-white'
              }`}
              title={item.isFavorite ? "Remove from Favorites" : "Add to Favorites"}
              id={`lightbox-fav-btn-${item.id}`}
            >
              <Heart className={`w-4 h-4 ${item.isFavorite ? 'fill-rose-500' : ''}`} />
            </button>
            <a
              href={item.src}
              download={item.title}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-neutral-950/60 hover:bg-neutral-950/90 border border-neutral-800 text-neutral-400 hover:text-white transition-all duration-200 flex items-center justify-center"
              title="Open full resolution or download file"
              id="lightbox-download-btn"
            >
              <Download className="w-4 h-4" />
            </a>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin ? (
              <>
                {/* Edit / Save Button */}
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-2 rounded-lg bg-neutral-950/60 hover:bg-neutral-950/90 border border-neutral-800 text-neutral-400 hover:text-emerald-400 transition-all duration-200 flex items-center gap-1 text-xs"
                    title="Edit details"
                    id="lightbox-edit-btn"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                ) : (
                  <button
                    onClick={handleSave}
                    className="p-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 border border-emerald-500 text-black transition-all duration-200 flex items-center gap-1 text-xs font-bold"
                    title="Save changes"
                    id="lightbox-save-btn"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save</span>
                  </button>
                )}

                {/* Delete button (Only show for uploaded items, or permit user to delete anything) */}
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this media item from your showcase?')) {
                      onDeleteItem(item.id);
                    }
                  }}
                  className="p-2 rounded-lg bg-neutral-950/60 hover:bg-rose-950/40 border border-neutral-800 hover:border-rose-900 text-neutral-500 hover:text-rose-400 transition-all duration-200 flex items-center justify-center"
                  title="Delete item"
                  id="lightbox-delete-btn"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div 
                className="px-2.5 py-1.5 rounded-lg bg-neutral-950/40 border border-neutral-800 text-[10px] text-neutral-500 font-mono flex items-center gap-1.5"
                title="Admin access required to modify showcase items"
                id="lightbox-locked-badge"
              >
                <Lock className="w-3 h-3 text-neutral-600" />
                <span>Read Only</span>
              </div>
            )}

            {/* Large Screen Close Button */}
            <button
              onClick={onClose}
              className="hidden md:flex p-2 rounded-lg bg-neutral-950/60 hover:bg-neutral-950/90 border border-neutral-800 text-neutral-400 hover:text-white transition-all duration-200"
              id="desktop-close-btn"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Details Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6" id="lightbox-sidebar-scrollable">
          {!isEditing ? (
            /* VIEW MODE */
            <div className="space-y-5">
              <div>
                <span className="px-2.5 py-1 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 rounded uppercase tracking-widest">
                  {item.category}
                </span>
                <h2 className="text-lg font-semibold text-white mt-2 leading-snug">
                  {item.title}
                </h2>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-neutral-400 text-xs font-medium uppercase tracking-wider">
                  <FileText className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Description</span>
                </div>
                <p className="text-sm text-neutral-300 leading-relaxed font-sans bg-neutral-950/30 p-3 rounded-xl border border-neutral-800/30">
                  {item.description}
                </p>
              </div>

              {/* System Metadata */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-1.5 text-neutral-400 text-xs font-medium uppercase tracking-wider">
                  <Info className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Metadata Info</span>
                </div>
                
                <div className="bg-neutral-950/40 border border-neutral-800/40 rounded-xl p-3 space-y-2 text-[11px] font-mono text-neutral-400">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">File Type:</span>
                    <span className="text-neutral-300 capitalize">{item.type}</span>
                  </div>
                  {item.duration && (
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Duration:</span>
                      <span className="text-neutral-300">{item.duration}</span>
                    </div>
                  )}
                  {item.size && (
                    <div className="flex justify-between">
                      <span className="text-neutral-500">File Size:</span>
                      <span className="text-neutral-300">{item.size}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Date Logged:</span>
                    <span className="text-neutral-300">{formatDate(item.dateAdded)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Origin:</span>
                    <span className="text-neutral-300">{isUploaded ? 'User Upload' : 'Curated Gallery'}</span>
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-neutral-400 text-xs font-medium uppercase tracking-wider">
                  <Tag className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Tags</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {item.tags.map(tag => (
                    <span 
                      key={tag} 
                      className="inline-flex items-center gap-1 text-[10px] font-mono text-neutral-400 bg-neutral-950 px-2.5 py-1 rounded-full border border-neutral-800/80"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* EDIT MODE */
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">Category</label>
                <select
                  value={editCategory}
                  onChange={e => setEditCategory(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-2 text-sm text-neutral-300 focus:outline-none focus:border-emerald-500"
                >
                  <option value="Nature">Nature</option>
                  <option value="Travel">Travel</option>
                  <option value="Architecture">Architecture</option>
                  <option value="Space">Space</option>
                  <option value="Still Life">Still Life</option>
                  <option value="Uploaded">Uploaded</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={editTags}
                  onChange={e => setEditTags(e.target.value)}
                  placeholder="ocean, beach, holiday"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">Description</label>
                <textarea
                  value={editDesc}
                  onChange={e => setEditDesc(e.target.value)}
                  rows={4}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 bg-neutral-950 hover:bg-neutral-800 text-neutral-300 font-medium py-2 rounded-xl text-xs border border-neutral-800 transition-colors"
                >
                  Discard Changes
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-2 rounded-xl text-xs transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Short footer with action guide */}
        <div className="p-4 bg-neutral-950/40 border-t border-neutral-800/60 text-[10px] text-center text-neutral-500 font-mono">
          Press <kbd className="px-1.5 py-0.5 bg-neutral-900 border border-neutral-800 rounded">ESC</kbd> to exit • <kbd className="px-1.5 py-0.5 bg-neutral-900 border border-neutral-800 rounded">←</kbd> <kbd className="px-1.5 py-0.5 bg-neutral-900 border border-neutral-800 rounded">→</kbd> to navigate
        </div>
      </div>
    </div>
  );
}
