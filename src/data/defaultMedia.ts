import { MediaItem } from '../types';

import urbanMinimalist from '../assets/images/urban_minimalist_1783064343503.jpg';
import mountFuji from '../assets/images/mount_fuji_1783064356828.jpg';
import stillLife from '../assets/images/still_life_1783064369835.jpg';
import cosmicNeon from '../assets/images/cosmic_neon_1783064383270.jpg';

export const INITIAL_MEDIA_ITEMS: MediaItem[] = [
  {
    id: 'photo-1',
    type: 'image',
    src: mountFuji,
    title: 'Sunrise over Mount Fuji',
    description: 'A majestic view of Mount Fuji captured at the break of dawn, with blooming cherry blossoms softly framing the golden horizon.',
    tags: ['fuji', 'landscape', 'japan', 'sunrise'],
    category: 'Travel',
    dateAdded: '2026-06-15T06:30:00Z',
    isFavorite: true,
  },
  {
    id: 'video-1',
    type: 'video',
    src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    title: 'Sunlit Forest Stream',
    description: 'A soothing slow-motion shot of a crystal-clear stream gently flowing over polished pebbles, bathed in warm afternoon sunlight filtering through the canopy.',
    tags: ['forest', 'water', 'sunlight', 'relaxing'],
    category: 'Nature',
    dateAdded: '2026-06-20T14:15:00Z',
    duration: '0:14',
    isFavorite: false,
  },
  {
    id: 'photo-2',
    type: 'image',
    src: urbanMinimalist,
    title: 'Geometric Concrete Steps',
    description: 'An abstract architectural study highlighting the sharp, clean diagonal shadows of concrete steps contrasting against brilliant blue sky.',
    tags: ['architecture', 'minimalist', 'lines', 'shadows'],
    category: 'Architecture',
    dateAdded: '2026-06-25T11:00:00Z',
    isFavorite: false,
  },
  {
    id: 'video-2',
    type: 'video',
    src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    title: 'Cosmic Night Sky Timelapse',
    description: 'A beautiful timelapse showing millions of brilliant stars dancing across a deep indigo night sky, with soft wisps of purple nebula-like clouds.',
    tags: ['stars', 'timelapse', 'milky way', 'cosmos'],
    category: 'Space',
    dateAdded: '2026-06-28T22:45:00Z',
    duration: '0:22',
    isFavorite: true,
  },
  {
    id: 'photo-3',
    type: 'image',
    src: stillLife,
    title: 'Minimalist Dried Pampas',
    description: 'An elegant interior portrait featuring dried pampas grass in a handmade ceramic vase, illuminated by warm morning sun filtering through window blinds.',
    tags: ['aesthetic', 'still life', 'pampas', 'interior'],
    category: 'Still Life',
    dateAdded: '2026-07-01T08:10:00Z',
    isFavorite: false,
  },
  {
    id: 'video-3',
    type: 'video',
    src: 'https://vjs.zencdn.net/v/oceans.mp4',
    title: 'Underwater Light Rays',
    description: 'An immersive viewpoint from beneath the surface, showing warm shimmering sunrays piercing through ocean waves and dancing in the deep blue sea.',
    tags: ['ocean', 'underwater', 'light rays', 'marine'],
    category: 'Nature',
    dateAdded: '2026-07-02T16:20:00Z',
    duration: '0:12',
    isFavorite: false,
  },
  {
    id: 'photo-4',
    type: 'image',
    src: cosmicNeon,
    title: 'Glow of the Milky Way',
    description: 'A striking close-up photograph capturing the stellar density of the Milky Way, displaying dust lanes and vibrant star fields in high detail.',
    tags: ['astrophotography', 'galaxy', 'milky way', 'stars'],
    category: 'Space',
    dateAdded: '2026-07-03T00:05:00Z',
    isFavorite: true,
  },
];

export const AVAILABLE_CATEGORIES = [
  'All',
  'Nature',
  'Travel',
  'Architecture',
  'Space',
  'Still Life',
  'Uploaded',
];
