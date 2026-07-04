export type MediaType = 'image' | 'video';

export interface MediaItem {
  id: string;
  type: MediaType;
  src: string;
  title: string;
  description: string;
  tags: string[];
  category: string;
  dateAdded: string;
  size?: string;
  duration?: string;
  isFavorite: boolean;
  width?: number;
  height?: number;
}

export type ViewMode = 'grid' | 'masonry' | 'list';

export interface FilterOptions {
  searchQuery: string;
  mediaType: 'all' | 'image' | 'video';
  category: string;
  sortBy: 'dateAdded-desc' | 'dateAdded-asc' | 'title-asc' | 'title-desc';
  onlyFavorites: boolean;
}
