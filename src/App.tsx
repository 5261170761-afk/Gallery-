import { useState, useEffect, useMemo, MouseEvent, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Sparkles, Image as ImageIcon, Film, Heart, Grid, 
  Layers, UploadCloud, Info, Trash2, Camera, X, Lock, Unlock, Key, ShieldAlert, Loader2,
  Download
} from 'lucide-react';

import { MediaItem, FilterOptions, ViewMode } from './types';
import { INITIAL_MEDIA_ITEMS, AVAILABLE_CATEGORIES } from './data/defaultMedia';
import UploadZone from './components/UploadZone';
import GalleryControls from './components/GalleryControls';
import GalleryGrid from './components/GalleryGrid';
import Lightbox from './components/Lightbox';

// Firestore integration imports
import { db, handleFirestoreError, OperationType } from './firebase';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';

export default function App() {
  // 1. Core State
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('masonry');
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [showUploader, setShowUploader] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return localStorage.getItem('portfolio_admin_auth') === 'true';
  });
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showRecoveryHint, setShowRecoveryHint] = useState(false);

  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    searchQuery: '',
    mediaType: 'all',
    category: 'All',
    sortBy: 'dateAdded-desc',
    onlyFavorites: false,
  });

  // 1.5 Loading State
  const [dbLoading, setDbLoading] = useState(true);

  // 2. Load from Firestore with local safety fallback
  useEffect(() => {
    async function loadMediaItems() {
      setDbLoading(true);
      let snapshot;
      try {
        const mediaCol = collection(db, 'media');
        snapshot = await getDocs(mediaCol);
      } catch (err) {
        console.error("Failed to fetch media from Firestore:", err);
        // Fallback locally
        const saved = localStorage.getItem('media_showcase_items_v2');
        if (saved) {
          try {
            setMediaItems(JSON.parse(saved) as MediaItem[]);
          } catch (e) {
            setMediaItems(INITIAL_MEDIA_ITEMS);
          }
        } else {
          setMediaItems(INITIAL_MEDIA_ITEMS);
        }
        setDbLoading(false);
        // Call standardized handler
        handleFirestoreError(err, OperationType.LIST, 'media');
        return;
      }

      try {
        if (snapshot.empty) {
          console.log("Firestore media collection is empty. Seeding with default items...");
          const saved = localStorage.getItem('media_showcase_items_v2');
          let initialToSeed = INITIAL_MEDIA_ITEMS;
          
          if (saved) {
            try {
              initialToSeed = JSON.parse(saved) as MediaItem[];
            } catch (e) {
              initialToSeed = INITIAL_MEDIA_ITEMS;
            }
          }

          // Safe migration of any blob / stale URLs in default or saved items
          const cleaned = initialToSeed.map(item => {
            if (item.src.startsWith('blob:')) {
              const seed = item.id.replace(/\D/g, '') || '42';
              return {
                ...item,
                src: item.type === 'image' 
                  ? `https://picsum.photos/seed/${seed}/800/600`
                  : 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4'
              };
            }
            if (item.src && item.src.includes('mixkit.co')) {
              let newSrc = 'https://vjs.zencdn.net/v/oceans.mp4';
              if (item.id === 'video-1') {
                newSrc = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4';
              } else if (item.id === 'video-2') {
                newSrc = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
              }
              return { ...item, src: newSrc };
            }
            return item;
          });

          // Seed each document to firestore
          for (const item of cleaned) {
            try {
              await setDoc(doc(db, 'media', item.id), item);
            } catch (err) {
              console.error("Failed to seed item to Firestore:", err);
              handleFirestoreError(err, OperationType.WRITE, `media/${item.id}`);
            }
          }
          setMediaItems(cleaned);
          localStorage.setItem('media_showcase_items_v2', JSON.stringify(cleaned));
        } else {
          const items: MediaItem[] = [];
          snapshot.forEach((doc) => {
            items.push(doc.data() as MediaItem);
          });
          // Sort items by dateAdded desc
          items.sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime());
          setMediaItems(items);
          localStorage.setItem('media_showcase_items_v2', JSON.stringify(items));
        }
      } catch (err) {
        console.error("Failed to process loaded Firestore data:", err);
        const saved = localStorage.getItem('media_showcase_items_v2');
        if (saved) {
          try {
            setMediaItems(JSON.parse(saved) as MediaItem[]);
          } catch (e) {
            setMediaItems(INITIAL_MEDIA_ITEMS);
          }
        } else {
          setMediaItems(INITIAL_MEDIA_ITEMS);
        }
      } finally {
        setDbLoading(false);
      }
    }

    loadMediaItems();
  }, []);

  // 3. Save to localStorage and state helper
  const saveItemsLocalOnly = (items: MediaItem[]) => {
    setMediaItems(items);
    localStorage.setItem('media_showcase_items_v2', JSON.stringify(items));
  };

  // 4. Statistics Panel Data
  const stats = useMemo(() => {
    const total = mediaItems.length;
    const images = mediaItems.filter(i => i.type === 'image').length;
    const videos = mediaItems.filter(i => i.type === 'video').length;
    const favorites = mediaItems.filter(i => i.isFavorite).length;
    return { total, images, videos, favorites };
  }, [mediaItems]);

  // 5. Dynamic Category Counts (Absolute Counts across type filter)
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    AVAILABLE_CATEGORIES.forEach(cat => {
      if (cat === 'All') {
        counts[cat] = mediaItems.length;
      } else {
        counts[cat] = mediaItems.filter(item => item.category === cat).length;
      }
    });
    return counts;
  }, [mediaItems]);

  // 5.5. Bento Featured Item
  const featuredItem = useMemo(() => {
    return mediaItems.find(item => item.isFavorite) || mediaItems[0] || null;
  }, [mediaItems]);

  // 6. Filtering and Sorting Pipeline
  const filteredAndSortedItems = useMemo(() => {
    let result = [...mediaItems];

    // Filter by type
    if (filterOptions.mediaType !== 'all') {
      result = result.filter(item => item.type === filterOptions.mediaType);
    }

    // Filter by category
    if (filterOptions.category !== 'All') {
      result = result.filter(item => item.category === filterOptions.category);
    }

    // Filter by favorites only
    if (filterOptions.onlyFavorites) {
      result = result.filter(item => item.isFavorite);
    }

    // Filter by search text
    const query = filterOptions.searchQuery.trim().toLowerCase();
    if (query) {
      result = result.filter(item => 
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Sorting
    result.sort((a, b) => {
      if (filterOptions.sortBy === 'dateAdded-desc') {
        return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
      }
      if (filterOptions.sortBy === 'dateAdded-asc') {
        return new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime();
      }
      if (filterOptions.sortBy === 'title-asc') {
        return a.title.localeCompare(b.title);
      }
      if (filterOptions.sortBy === 'title-desc') {
        return b.title.localeCompare(a.title);
      }
      return 0;
    });

    return result;
  }, [mediaItems, filterOptions]);

  // 7. Core Operations
  const handleUploadItem = async (newItem: MediaItem) => {
    // 1. Instantly update local state and localStorage
    const updated = [newItem, ...mediaItems];
    saveItemsLocalOnly(updated);

    // 2. Persist to Firestore
    try {
      await setDoc(doc(db, 'media', newItem.id), newItem);
      console.log("Media item successfully saved to Firestore.");
    } catch (err) {
      console.error("Failed to save media item to Firestore:", err);
      handleFirestoreError(err, OperationType.WRITE, `media/${newItem.id}`);
    }
  };

  const handleToggleFavorite = async (id: string, e?: MouseEvent) => {
    if (e) {
      e.stopPropagation(); // Prevent opening Lightbox when hitting heart on card
    }

    const targetItem = mediaItems.find(item => item.id === id);
    if (!targetItem) return;

    const updatedItem = { ...targetItem, isFavorite: !targetItem.isFavorite };

    // Update local state and localStorage instantly
    const updated = mediaItems.map(item => 
      item.id === id ? updatedItem : item
    );
    saveItemsLocalOnly(updated);

    // If currently selected in Lightbox, sync
    if (selectedItem && selectedItem.id === id) {
      setSelectedItem(updatedItem);
    }

    // Persist update to Firestore
    try {
      await setDoc(doc(db, 'media', id), updatedItem);
    } catch (err) {
      console.error("Failed to update favorite status in Firestore:", err);
      handleFirestoreError(err, OperationType.WRITE, `media/${id}`);
    }
  };

  const handleUpdateItem = async (updatedItem: MediaItem) => {
    // Update local state instantly
    const updated = mediaItems.map(item => 
      item.id === updatedItem.id ? updatedItem : item
    );
    saveItemsLocalOnly(updated);

    if (selectedItem?.id === updatedItem.id) {
      setSelectedItem(updatedItem);
    }

    // Persist to Firestore
    try {
      await setDoc(doc(db, 'media', updatedItem.id), updatedItem);
    } catch (err) {
      console.error("Failed to update media item in Firestore:", err);
      handleFirestoreError(err, OperationType.WRITE, `media/${updatedItem.id}`);
    }
  };

  const handleDeleteItem = async (id: string) => {
    // Update local state instantly
    const updated = mediaItems.filter(item => item.id !== id);
    saveItemsLocalOnly(updated);
    
    // Close Lightbox if deleting the active item
    if (selectedItem?.id === id) {
      setSelectedItem(null);
    }

    // Delete from Firestore
    try {
      await deleteDoc(doc(db, 'media', id));
      console.log("Media item successfully deleted from Firestore.");
    } catch (err) {
      console.error("Failed to delete media item from Firestore:", err);
      handleFirestoreError(err, OperationType.DELETE, `media/${id}`);
    }
  };

  const handleResetFilters = () => {
    setFilterOptions({
      searchQuery: '',
      mediaType: 'all',
      category: 'All',
      sortBy: 'dateAdded-desc',
      onlyFavorites: false,
    });
  };

  // 7.5 Admin Operations
  const handleLoginSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (password.toLowerCase() === 'admin') {
      setIsAdmin(true);
      localStorage.setItem('portfolio_admin_auth', 'true');
      setShowLoginModal(false);
      setPassword('');
      setLoginError('');
    } else {
      setLoginError('Invalid Admin Password. Hint: Enter "admin".');
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
    localStorage.removeItem('portfolio_admin_auth');
    setShowUploader(false);
  };

  const handleExportCSV = () => {
    // Generate CSV headers and rows
    const headers = ['Title', 'Category', 'Date Added', 'Type'];
    const rows = mediaItems.map(item => [
      // Escape commas and double quotes for safety
      `"${(item.title || '').replace(/"/g, '""')}"`,
      `"${(item.category || '').replace(/"/g, '""')}"`,
      `"${(item.dateAdded || '').replace(/"/g, '""')}"`,
      `"${(item.type || '').replace(/"/g, '""')}"`,
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `media_gallery_export_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 8. Lightbox Navigation (Cycles within the current filtered/sorted list)
  const handlePrevItem = () => {
    if (!selectedItem || filteredAndSortedItems.length <= 1) return;
    const currentIndex = filteredAndSortedItems.findIndex(i => i.id === selectedItem.id);
    const prevIndex = (currentIndex - 1 + filteredAndSortedItems.length) % filteredAndSortedItems.length;
    setSelectedItem(filteredAndSortedItems[prevIndex]);
  };

  const handleNextItem = () => {
    if (!selectedItem || filteredAndSortedItems.length <= 1) return;
    const currentIndex = filteredAndSortedItems.findIndex(i => i.id === selectedItem.id);
    const nextIndex = (currentIndex + 1) % filteredAndSortedItems.length;
    setSelectedItem(filteredAndSortedItems[nextIndex]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 text-neutral-200 selection:bg-indigo-500/30 pb-20 font-sans" id="app-root-container">
      
      {/* Dynamic Glowing Accent Background behind header */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] pointer-events-none overflow-hidden opacity-30 z-0">
        <div className="absolute top-[-250px] left-1/4 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[160px]" />
        <div className="absolute top-[-200px] right-1/4 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[140px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 relative z-10">
        
        {/* Navigation / Header */}
        <header className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-6 mb-8 border-b border-neutral-800/60" id="main-header">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center font-bold text-black text-sm tracking-tighter">
              MS
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                MEDIA / SHOWCASE
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 border border-neutral-700">v1.2</span>
              </h1>
              <p className="text-xs text-neutral-400">Curated photography & video production archive</p>
            </div>
          </div>

          {/* Action trigger & basic counters */}
          <div className="flex items-center gap-3">
            <nav className="hidden md:flex gap-8 text-xs font-semibold text-neutral-400 uppercase tracking-widest mr-4">
              <span className="text-white cursor-pointer hover:text-emerald-400 transition-colors">Showcase</span>
              <span className="hover:text-white cursor-pointer transition-colors">Archive</span>
              <span className="hover:text-white cursor-pointer transition-colors">About</span>
            </nav>

            {isAdmin ? (
              <div className="flex items-center gap-2 animate-fade-in">
                <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold tracking-widest rounded-full border border-emerald-500/35 uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Admin Mode
                </span>
                <button
                  onClick={handleExportCSV}
                  className="px-5 py-2.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all duration-300 shadow-md"
                  title="Export gallery metadata as CSV for backup"
                  id="admin-export-csv-btn"
                >
                  <Download className="w-3.5 h-3.5 text-neutral-400 group-hover:text-emerald-400 transition-colors" />
                  <span>Export Data</span>
                </button>
                <button
                  onClick={() => setShowUploader(!showUploader)}
                  className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all duration-300 shadow-md ${
                    showUploader 
                      ? 'bg-neutral-800 border border-neutral-700 text-neutral-200 hover:bg-neutral-700' 
                      : 'bg-white hover:bg-neutral-200 text-black'
                  }`}
                  id="toggle-uploader-btn"
                >
                  {showUploader ? <X className="w-3.5 h-3.5" /> : <UploadCloud className="w-3.5 h-3.5" />}
                  <span>{showUploader ? 'Close' : 'Add Content'}</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="p-2.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-rose-400 hover:border-rose-950 hover:bg-rose-950/20 transition-all duration-300"
                  title="Exit Admin Session"
                  id="admin-logout-btn"
                >
                  <Unlock className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all duration-300 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white shadow-md group"
                id="admin-login-trigger-btn"
              >
                <Lock className="w-3.5 h-3.5 text-neutral-500 group-hover:text-emerald-400 transition-colors" />
                <span>Admin Login</span>
              </button>
            )}
          </div>
        </header>

        {/* Dynamic Slid-down Upload zone */}
        <AnimatePresence>
          {showUploader && (
            <motion.div
              initial={{ height: 0, opacity: 0, marginBottom: 0 }}
              animate={{ height: 'auto', opacity: 1, marginBottom: 40 }}
              exit={{ height: 0, opacity: 0, marginBottom: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <UploadZone 
                onUpload={handleUploadItem} 
                categories={AVAILABLE_CATEGORIES} 
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bento Grid Hero Showcase */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10" id="stats-section">
          {/* Bento Cell 1: Large Primary Showcase (Dynamic Featured Work) */}
          <div className="md:col-span-2 lg:row-span-2 bg-neutral-900 rounded-3xl relative overflow-hidden group border border-neutral-800/80 min-h-[320px] lg:min-h-[380px] flex flex-col justify-end p-6 md:p-8" id="bento-featured-cell">
            {featuredItem ? (
              <div 
                className="absolute inset-0 cursor-pointer" 
                onClick={() => setSelectedItem(featuredItem)}
                id="bento-featured-media-container"
              >
                {featuredItem.type === 'image' ? (
                  <img
                    src={featuredItem.src}
                    alt={featuredItem.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <video
                    key={featuredItem.id}
                    src={featuredItem.src}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    muted
                    playsInline
                    loop
                    autoPlay
                  />
                )}
                {/* Immersive overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent z-10" />
                
                {/* Floating details overlay */}
                <div className="absolute bottom-6 left-6 right-6 z-20">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] rounded uppercase font-bold tracking-widest border border-emerald-500/30">
                      {featuredItem.category} • Featured
                    </span>
                    {featuredItem.duration && (
                      <span className="text-neutral-400 text-xs font-mono">Duration {featuredItem.duration}</span>
                    )}
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                    {featuredItem.title}
                  </h2>
                  <p className="text-neutral-300 text-xs mt-1.5 line-clamp-2 max-w-xl font-sans font-light">
                    {featuredItem.description}
                  </p>
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-neutral-500">
                <ImageIcon className="w-12 h-12 text-neutral-700 mb-3" />
                <p className="text-sm font-sans">No featured work selected yet.</p>
                <p className="text-xs text-neutral-600 mt-1">Upload files or favorite items to populate this slot.</p>
              </div>
            )}
          </div>

          {/* Bento Cell 2: High-Contrast White Artist Bio Card */}
          <div className="bg-white text-black rounded-3xl p-6 flex flex-col justify-between shadow-lg min-h-[180px] lg:min-h-0" id="bento-bio-cell">
            <p className="text-neutral-900 text-[15px] sm:text-[16px] leading-snug font-medium font-sans">
              "Capturing the intersection of light, depth, and human emotion through premium cinematography and high-fidelity documentary photography."
            </p>
            <div className="flex items-center gap-2.5 pt-4 border-t border-neutral-100">
              <div className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center font-bold text-xs">
                AR
              </div>
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-black">Curator Profile</span>
                <span className="block text-[9px] text-neutral-500 font-mono">portfolio.rivera</span>
              </div>
            </div>
          </div>

          {/* Bento Cell 3: Emerald Statistic Card */}
          <div className="bg-emerald-500 text-black rounded-3xl p-6 flex flex-col justify-between shadow-lg min-h-[180px] lg:min-h-0" id="bento-stats-cell">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-950">Showcase Assets</span>
              <span className="text-[10px] font-mono bg-emerald-600/20 px-1.5 py-0.5 rounded text-emerald-950 font-bold">2026 Live</span>
            </div>
            <div className="my-auto py-2 text-center">
              <span className="text-6xl font-black italic tracking-tighter block leading-none text-emerald-950">
                {stats.total}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-900 block mt-1">
                Active Projects
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono pt-2 border-t border-emerald-600/30 text-emerald-950">
              <span>{stats.images} Photos</span>
              <span>•</span>
              <span>{stats.videos} Videos</span>
            </div>
          </div>

          {/* Bento Cell 4: Detailed Technical Spec & Active Status Card */}
          <div className="md:col-span-2 bg-neutral-900 rounded-3xl border border-neutral-800/80 p-6 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 min-h-[140px] lg:min-h-0" id="bento-specs-cell">
            <div className="flex flex-col justify-between h-full gap-4">
              <div className="flex flex-wrap gap-1.5" id="spec-tech-pills">
                <span className="px-2.5 py-1 bg-neutral-950 rounded-lg text-[10px] font-medium text-neutral-400 font-mono border border-neutral-800">VITE REFRESH</span>
                <span className="px-2.5 py-1 bg-neutral-950 rounded-lg text-[10px] font-medium text-neutral-400 font-mono border border-neutral-800">TAILWIND 4</span>
                <span className="px-2.5 py-1 bg-neutral-950 rounded-lg text-[10px] font-medium text-neutral-400 font-mono border border-neutral-800">REACT 19</span>
                <span className="px-2.5 py-1 bg-neutral-950 rounded-lg text-[10px] font-medium text-neutral-400 font-mono border border-neutral-800">MOTION</span>
              </div>
              <div>
                <p className="text-neutral-500 text-[9px] uppercase font-bold tracking-widest mb-0.5">Platform Core</p>
                <p className="text-neutral-300 text-xs font-mono">Cloud Sandbox Storage Enabled</p>
              </div>
            </div>
            <div className="flex flex-col justify-between items-start sm:items-end h-full pt-4 sm:pt-0 border-t sm:border-t-0 sm:border-l border-neutral-800/80 sm:pl-6">
              <div className="text-left sm:text-right">
                <p className="text-neutral-500 text-[9px] uppercase font-bold tracking-widest mb-1">Availability</p>
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span>System Active / Ready</span>
                </div>
              </div>
              <div className="mt-4 sm:mt-auto">
                <span className="text-[10px] font-mono text-neutral-600 block sm:text-right">Based in San Francisco</span>
              </div>
            </div>
          </div>
        </section>

        {/* Main Interface Content Grid */}
        <main className="space-y-6" id="main-content-area">
          {/* Gallery Controls (Search, Sort, Filters, Tabs) */}
          <GalleryControls
            options={filterOptions}
            onChange={setFilterOptions}
            viewMode={viewMode}
            onChangeViewMode={setViewMode}
            categories={AVAILABLE_CATEGORIES}
            counts={categoryCounts}
            totalCount={filteredAndSortedItems.length}
          />

          {/* Interactive Media Grid Display */}
          {dbLoading ? (
            <div className="py-24 flex flex-col items-center justify-center text-neutral-400 gap-3" id="db-loading-indicator">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
              <p className="text-xs font-mono uppercase tracking-widest text-neutral-500 animate-pulse">Syncing Showcase Database...</p>
            </div>
          ) : (
            <GalleryGrid
              items={filteredAndSortedItems}
              viewMode={viewMode}
              onSelectItem={setSelectedItem}
              onToggleFavorite={handleToggleFavorite}
              onResetFilters={handleResetFilters}
            />
          )}
        </main>

        {/* Sticky footer helper banner */}
        <footer className="mt-20 pt-8 border-t border-neutral-800/40 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-500 font-mono gap-4" id="main-footer">
          <div>
            <span>Media Showcase Gallery • Built in 2026</span>
          </div>
          <div className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Interactive sandbox storage enabled</span>
          </div>
        </footer>

      </div>

      {/* Cinematic Modal Lightbox Component */}
      <AnimatePresence>
        {selectedItem && (
          <Lightbox
            item={selectedItem}
            onClose={() => setSelectedItem(null)}
            onPrev={handlePrevItem}
            onNext={handleNextItem}
            onToggleFavorite={handleToggleFavorite}
            onUpdateItem={handleUpdateItem}
            onDeleteItem={handleDeleteItem}
            isAdmin={isAdmin}
          />
        )}
      </AnimatePresence>

      {/* Admin Login Modal Overlay */}
      <AnimatePresence>
        {showLoginModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4"
            id="login-modal-overlay"
            onClick={() => {
              setShowLoginModal(false);
              setLoginError('');
              setShowRecoveryHint(false);
            }}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 relative shadow-2xl"
              id="login-modal-card"
            >
              <button 
                onClick={() => {
                  setShowLoginModal(false);
                  setLoginError('');
                  setShowRecoveryHint(false);
                }}
                className="absolute top-5 right-5 text-neutral-400 hover:text-white transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
                  <Key className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-white tracking-tight">Admin Authentication</h2>
                <p className="text-xs text-neutral-400 mt-1.5 max-w-[280px]">
                  Unlock manager access to upload custom media assets, organize categories, and delete entries.
                </p>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 font-mono">
                      Admin Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowRecoveryHint(!showRecoveryHint)}
                      className="text-[10px] text-neutral-500 hover:text-emerald-400 transition-colors cursor-pointer select-none font-medium hover:underline"
                      id="forgot-password-link"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <input 
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password..."
                    autoFocus
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-neutral-200 placeholder-neutral-700 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                  {loginError && (
                    <p className="text-rose-400 text-xs mt-2.5 flex items-center gap-1.5 font-sans animate-pulse">
                      <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
                      {loginError}
                    </p>
                  )}
                </div>

                <AnimatePresence>
                  {showRecoveryHint && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, scale: 0.95 }}
                      animate={{ opacity: 1, height: 'auto', scale: 1 }}
                      exit={{ opacity: 0, height: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 p-3.5 rounded-2xl text-xs space-y-1 overflow-hidden"
                      id="recovery-hint-notification"
                    >
                      <p className="font-bold flex items-center gap-1.5 text-emerald-400 text-[11px] uppercase tracking-wider">
                        <Sparkles className="w-3.5 h-3.5" />
                        Access Recovery Key
                      </p>
                      <p className="text-neutral-300 text-[11px] leading-relaxed">
                        Security verification completed. The developer sandbox administrator password is:
                      </p>
                      <div className="bg-neutral-950 px-2.5 py-1.5 rounded-xl border border-neutral-800/80 flex justify-between items-center mt-2.5">
                        <code className="text-emerald-400 font-mono text-xs select-all font-bold">admin</code>
                        <span className="text-[9px] text-neutral-500 uppercase font-bold tracking-wider font-mono">Access Key</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="pt-2">
                  <button 
                    type="submit"
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold uppercase tracking-wider py-3 rounded-xl text-xs transition-colors shadow-lg"
                  >
                    Authenticate
                  </button>
                </div>
                
                <div className="text-center pt-1">
                  <span className="text-[10px] font-mono text-neutral-500">
                    Curator Dashboard System
                  </span>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
