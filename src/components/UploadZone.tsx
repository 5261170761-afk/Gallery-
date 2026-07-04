import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, X, Film, Image as ImageIcon, Plus, Check, Loader2, AlertCircle } from 'lucide-react';
import { upload } from '@vercel/blob/client';
import type { PutBlobResult } from '@vercel/blob';
import { MediaItem } from '../types';

interface UploadZoneProps {
  onUpload: (newItem: MediaItem) => void;
  categories: string[];
}

export default function UploadZone({ onUpload, categories }: UploadZoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [fileType, setFileType] = useState<'image' | 'video' | null>(null);
  
  // Vercel Blob Upload states
  const [isUploading, setIsUploading] = useState(false);
  const [fallbackMode, setFallbackMode] = useState(false);
  
  // Metadata form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Uploaded');
  const [tagsInput, setTagsInput] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      alert('Unsupported file type! Please upload an image or video.');
      return;
    }

    const url = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(url);
    setFileType(isImage ? 'image' : 'video');
    
    // Auto-fill title from filename (removing extension)
    const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    // Humanize title
    const humanizedTitle = nameWithoutExt
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
    setTitle(humanizedTitle);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setFileType(null);
    setTitle('');
    setDescription('');
    setCategory('Uploaded');
    setTagsInput('');
    setIsSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !fileType || !previewUrl) return;

    setIsUploading(true);
    setFallbackMode(false);

    let finalUrl = previewUrl;

    try {
      // Direct secure upload from browser to Vercel Blob, bypassing Serverless Function body size limits
      const newBlob = await upload(selectedFile.name, selectedFile, {
        access: 'public',
        handleUploadUrl: '/api/upload',
      });

      if (newBlob && newBlob.url) {
        finalUrl = newBlob.url;
      }
    } catch (err) {
      console.warn('Vercel Blob direct client upload failed. Falling back to local browser storage:', err);
      setFallbackMode(true);
      // Wait briefly so the user is updated visually on fallback status
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    const tags = tagsInput
      .split(',')
      .map(t => t.trim().toLowerCase())
      .filter(t => t.length > 0);

    const newItem: MediaItem = {
      id: `uploaded-${Date.now()}`,
      type: fileType,
      src: finalUrl,
      title: title.trim() || 'Untitled Media',
      description: description.trim() || 'No description provided.',
      tags: tags.length > 0 ? tags : ['uploaded'],
      category: category,
      dateAdded: new Date().toISOString(),
      size: formatFileSize(selectedFile.size),
      isFavorite: false,
    };

    onUpload(newItem);
    setIsSuccess(true);
    setIsUploading(false);
    
    setTimeout(() => {
      resetForm();
    }, 2800);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full max-w-2xl mx-auto mb-10" id="upload-zone-container">
      <AnimatePresence mode="wait">
        {!selectedFile ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={triggerFileInput}
            className={`relative group cursor-pointer border-2 border-dashed rounded-3xl p-8 transition-all flex flex-col items-center justify-center text-center ${
              dragActive 
                ? 'border-emerald-500 bg-emerald-500/5' 
                : 'border-neutral-800 hover:border-neutral-600 bg-neutral-900/40 hover:bg-neutral-900/70'
            }`}
            id="dropzone-box"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={handleFileChange}
              id="file-input-element"
            />
            
            <div className={`p-4 rounded-full mb-4 bg-neutral-800/80 text-neutral-400 group-hover:text-emerald-400 group-hover:bg-emerald-950/30 transition-colors duration-300`}>
              <Upload className="w-8 h-8" />
            </div>
            
            <h3 className="text-sm font-medium text-neutral-200 mb-1">
              Drag & drop your photo or video here
            </h3>
            <p className="text-xs text-neutral-500 mb-3">
              or click to browse local files
            </p>
            <span className="text-[10px] text-neutral-600 font-mono">
              Supports JPG, PNG, WEBP, MP4, WEBM
            </span>
          </motion.div>
        ) : (
          <motion.div
            key="metadata-form"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="border border-neutral-800 bg-neutral-900/80 backdrop-blur-md rounded-3xl p-6 relative overflow-hidden"
            id="metadata-form-box"
          >
            {isUploading && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="absolute inset-0 bg-neutral-950/90 z-20 flex flex-col items-center justify-center text-center p-6"
                id="uploading-overlay"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
                <h3 className="text-md font-semibold text-neutral-100">Media is loading...</h3>
                <p className="text-xs text-neutral-400 mt-1 max-w-xs leading-relaxed">
                  Please wait while we sync your media.
                </p>
              </motion.div>
            )}

            {isSuccess && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="absolute inset-0 bg-neutral-950/95 z-20 flex flex-col items-center justify-center text-center p-6"
                id="upload-success-overlay"
              >
                {fallbackMode ? (
                  <>
                    <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4 border border-amber-500/20">
                      <AlertCircle className="w-6 h-6 animate-pulse" />
                    </div>
                    <h3 className="text-md font-semibold text-neutral-100">Saved to Local Showcase!</h3>
                    <p className="text-xs text-amber-300 mt-2 max-w-sm leading-relaxed px-4 bg-amber-500/10 py-2 rounded-2xl border border-amber-500/20">
                      <strong>Developer Note:</strong> No <code className="font-mono text-[10px] bg-neutral-900 px-1 py-0.5 rounded text-white border border-neutral-800">BLOB_READ_WRITE_TOKEN</code> found. Media was saved to local browser state for testing.
                    </p>
                    <p className="text-[10px] text-neutral-500 mt-3">
                      Deploying to Vercel and linking your Blob database will enable permanent cloud links!
                    </p>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 border border-emerald-500/20">
                      <Check className="w-6 h-6 animate-bounce" />
                    </div>
                    <h3 className="text-md font-semibold text-neutral-100">Uploaded to Cloud!</h3>
                    <p className="text-xs text-emerald-400 mt-1 max-w-xs">
                      Media successfully saved and persistent link generated via Vercel Blob.
                    </p>
                  </>
                )}
              </motion.div>
            )}

            <button 
              type="button" 
              onClick={resetForm} 
              className="absolute top-4 right-4 text-neutral-500 hover:text-neutral-300 p-1 hover:bg-neutral-800 rounded-full transition-colors"
              id="close-upload-btn"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-md font-medium text-neutral-200 mb-4 flex items-center gap-2">
              {fileType === 'image' ? <ImageIcon className="w-4 h-4 text-emerald-400" /> : <Film className="w-4 h-4 text-emerald-400" />}
              Configure Media Showcase
            </h3>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-6">
              {/* Media Preview Thumbnail */}
              <div className="md:col-span-2 flex flex-col items-center justify-center bg-neutral-950 rounded-2xl p-2 border border-neutral-800/60 aspect-video md:aspect-square overflow-hidden relative">
                {fileType === 'image' ? (
                  <img 
                    src={previewUrl} 
                    alt="Upload Preview" 
                    className="w-full h-full object-contain rounded-xl"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <video 
                    key={previewUrl}
                    src={previewUrl} 
                    className="w-full h-full object-contain rounded-xl" 
                    muted 
                    playsInline 
                    autoPlay 
                    loop
                  />
                )}
                <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 text-[10px] text-neutral-400 font-mono">
                  {selectedFile ? formatFileSize(selectedFile.size) : ''}
                </div>
              </div>

              {/* Form Fields */}
              <div className="md:col-span-3 flex flex-col justify-between gap-4">
                <div className="space-y-3">
                  {/* Title */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">Title</label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder="e.g. Summer Sunset Beach"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-sm text-neutral-200 focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>

                  {/* Category & Tags Row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">Category</label>
                      <select
                        value={category}
                        onChange={e => setCategory(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2 py-1.5 text-sm text-neutral-300 focus:outline-none focus:border-emerald-500 transition-colors"
                      >
                        {categories.filter(c => c !== 'All').map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">Tags (comma-separated)</label>
                      <input
                        type="text"
                        value={tagsInput}
                        onChange={e => setTagsInput(e.target.value)}
                        placeholder="ocean, holiday, calm"
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-sm text-neutral-200 focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">Description</label>
                    <textarea
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder="Share the story behind this media item..."
                      rows={2}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-sm text-neutral-200 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 border border-neutral-800 hover:bg-neutral-800 text-neutral-300 font-medium py-1.5 rounded-xl text-xs transition-colors"
                    id="cancel-upload-btn"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black font-bold uppercase tracking-wider py-1.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-lg"
                    id="publish-upload-btn"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Publish to Gallery
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
