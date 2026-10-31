export type VaultId = 'vault_1' | 'vault_2';

export interface Photo {
  id: string;
  vaultId: VaultId;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadDate: string;
  caption?: string;
  favorite: boolean;
  albumId?: string;
  filePath: string;
}

export interface Album {
  id: string;
  vaultId: VaultId;
  name: string;
  description?: string;
  color?: string;
  createdAt: string;
}

export interface ActivityItem {
  id: string;
  vaultId: VaultId;
  type: 'LOGIN' | 'UPLOAD' | 'DELETE' | 'PASSWORD_CHANGE' | 'ALBUM_CREATE';
  description: string;
  timestamp: string;
}

export interface VaultSettings {
  layout: 'grid' | 'masonry';
  thumbnailSize: 'compact' | 'medium' | 'large';
  autoLockMinutes: number;
  confirmDelete: boolean;
  slideshowInterval: number;
  accentTheme: 'cyan' | 'pink' | 'purple' | 'emerald';
}

export interface VaultInfo {
  id: VaultId;
  name: string;
  themeColor: string;
  symbol: string;
  settings: VaultSettings;
}

export interface VaultDataResponse {
  vault: VaultInfo;
  photos: Photo[];
  albums: Album[];
  activity: ActivityItem[];
  stats: {
    totalPhotos: number;
    favoriteCount: number;
    albumCount: number;
    totalStorageBytes: number;
    storageFormatted: string;
  };
}
