import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Shield, Lock, Search, Upload, Plus, Heart, Filter, 
  Grid3X3, Layers, Settings, History, Download, Trash2, 
  CheckSquare, Square, FolderPlus, ArrowLeft, Image as ImageIcon,
  ChevronDown, Folder, Sparkles, X, Check, MoreVertical
} from 'lucide-react';
import { Photo, Album, VaultInfo, ActivityItem, VaultDataResponse } from '../types/vault';
import { LightboxModal } from './LightboxModal';
import { UploadModal } from './UploadModal';
import { SettingsModal } from './SettingsModal';
import { AlbumModal } from './AlbumModal';
import { ActivityModal } from './ActivityModal';

interface VaultDashboardProps {
  initialVault: VaultInfo;
  token: string;
  onLockVault: () => void;
}

export const VaultDashboard: React.FC<VaultDashboardProps> = ({
  initialVault,
  token,
  onLockVault,
}) => {
  const [vault, setVault] = useState<VaultInfo>(initialVault);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [stats, setStats] = useState({
    totalPhotos: 0,
    favoriteCount: 0,
    albumCount: 0,
    totalStorageBytes: 0,
    storageFormatted: '0 MB',
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAlbumFilter, setSelectedAlbumFilter] = useState<'all' | 'favorites' | string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name' | 'size'>('newest');
  
  // Selection mode for batch operations
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([]);

  // Modals state
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAlbumModalOpen, setIsAlbumModalOpen] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
  const [isActivityOpen, setIsActivityOpen] = useState(false);

  // Drag and drop directly onto gallery state
  const [isDragOverGallery, setIsDragOverGallery] = useState(false);

  // Auto-lock inactivity ref
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  const isVault1 = vault.id === 'vault_1';
  const themeColor = vault.themeColor || (isVault1 ? '#38bdf8' : '#ec4899');

  // Load vault data from server
  const fetchVaultData = async () => {
    try {
      const res = await fetch('/api/vault/data', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        onLockVault();
        return;
      }
      const data: VaultDataResponse = await res.json();
      setVault(data.vault);
      setPhotos(data.photos);
      setAlbums(data.albums);
      setActivity(data.activity);
      setStats(data.stats);
    } catch (err) {
      console.error('Failed to fetch vault data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVaultData();
  }, [token]);

  // Handle auto-lock on inactivity
  useEffect(() => {
    const minutes = vault.settings.autoLockMinutes;
    if (!minutes || minutes <= 0) return;

    const resetTimer = () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = setTimeout(() => {
        onLockVault();
      }, minutes * 60 * 1000);
    };

    resetTimer();

    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(evt => window.addEventListener(evt, resetTimer));

    return () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      events.forEach(evt => window.removeEventListener(evt, resetTimer));
    };
  }, [vault.settings.autoLockMinutes, onLockVault]);

  // Filtered & sorted photos
  const filteredPhotos = useMemo(() => {
    let result = [...photos];

    // Album / Favorites filter
    if (selectedAlbumFilter === 'favorites') {
      result = result.filter(p => p.favorite);
    } else if (selectedAlbumFilter !== 'all') {
      result = result.filter(p => p.albumId === selectedAlbumFilter);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(p => 
        p.originalName.toLowerCase().includes(q) ||
        (p.caption && p.caption.toLowerCase().includes(q))
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime();
      if (sortBy === 'oldest') return new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime();
      if (sortBy === 'name') return a.originalName.localeCompare(b.originalName);
      if (sortBy === 'size') return b.size - a.size;
      return 0;
    });

    return result;
  }, [photos, selectedAlbumFilter, searchQuery, sortBy]);

  // Favorite toggle
  const handleToggleFavorite = async (photoId: string, current: boolean) => {
    // Optimistic update
    setPhotos(prev => prev.map(p => p.id === photoId ? { ...p, favorite: !current } : p));
    try {
      await fetch(`/api/vault/photos/${photoId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ favorite: !current }),
      });
      fetchVaultData();
    } catch (e) {
      console.error('Failed to toggle favorite:', e);
    }
  };

  // Caption update
  const handleUpdateCaption = async (photoId: string, caption: string) => {
    setPhotos(prev => prev.map(p => p.id === photoId ? { ...p, caption } : p));
    try {
      await fetch(`/api/vault/photos/${photoId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ caption }),
      });
      fetchVaultData();
    } catch (e) {
      console.error('Failed to update caption:', e);
    }
  };

  // Album assignment update
  const handleUpdateAlbum = async (photoId: string, albumId: string) => {
    setPhotos(prev => prev.map(p => p.id === photoId ? { ...p, albumId: albumId || undefined } : p));
    try {
      await fetch(`/api/vault/photos/${photoId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ albumId }),
      });
      fetchVaultData();
    } catch (e) {
      console.error('Failed to update photo album:', e);
    }
  };

  // Single delete
  const handleDeletePhoto = async (photoId: string) => {
    if (vault.settings.confirmDelete && !window.confirm('Delete this photo permanently from the vault?')) {
      return;
    }
    try {
      await fetch('/api/vault/photos', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ids: [photoId] }),
      });
      setPhotos(prev => prev.filter(p => p.id !== photoId));
      if (lightboxIndex !== null) setLightboxIndex(null);
      fetchVaultData();
    } catch (e) {
      console.error('Failed to delete photo:', e);
    }
  };

  // Batch delete
  const handleBatchDelete = async () => {
    if (selectedPhotoIds.length === 0) return;
    if (vault.settings.confirmDelete && !window.confirm(`Permanently delete ${selectedPhotoIds.length} selected photos?`)) {
      return;
    }
    try {
      await fetch('/api/vault/photos', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ids: selectedPhotoIds }),
      });
      setPhotos(prev => prev.filter(p => !selectedPhotoIds.includes(p.id)));
      setSelectedPhotoIds([]);
      setIsSelectMode(false);
      fetchVaultData();
    } catch (e) {
      console.error('Failed to batch delete:', e);
    }
  };

  // Batch move to album
  const handleBatchMoveAlbum = async (albumId: string) => {
    if (selectedPhotoIds.length === 0) return;
    for (const pid of selectedPhotoIds) {
      await handleUpdateAlbum(pid, albumId);
    }
    setSelectedPhotoIds([]);
    setIsSelectMode(false);
  };

  // Batch download
  const handleBatchDownload = () => {
    selectedPhotoIds.forEach((id, idx) => {
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = `/api/vault/photos/${id}/file?token=${token}&download=1`;
        link.download = `photo_${id}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, idx * 300);
    });
  };

  // Toggle selection of photo
  const toggleSelectPhoto = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPhotoIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Delete album
  const handleDeleteAlbum = async (albumId: string, albumName: string) => {
    if (!window.confirm(`Delete album "${albumName}"? Photos inside will remain in the general vault.`)) {
      return;
    }
    try {
      await fetch(`/api/vault/albums/${albumId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (selectedAlbumFilter === albumId) setSelectedAlbumFilter('all');
      fetchVaultData();
    } catch (e) {
      console.error('Failed to delete album:', e);
    }
  };

  // Drag-and-drop file drop handler for entire gallery
  const handleGalleryDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverGallery(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setIsUploadOpen(true);
    }
  };

  // Thumbnail size classes with responsive mobile columns
  const getThumbnailGridClass = () => {
    const size = vault.settings.thumbnailSize;
    if (vault.settings.layout === 'masonry') {
      if (size === 'compact') return 'columns-2 sm:columns-3 md:columns-4 lg:columns-5 xl:columns-6 gap-2 sm:gap-3';
      if (size === 'large') return 'columns-1 sm:columns-2 md:columns-2 lg:columns-3 gap-3.5 sm:gap-5';
      return 'columns-2 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-2.5 sm:gap-4';
    } else {
      if (size === 'compact') return 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3';
      if (size === 'large') return 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5';
      return 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-4';
    }
  };

  return (
    <div 
      className="min-h-screen bg-[#070913] text-gray-100 flex flex-col relative"
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOverGallery(true);
      }}
      onDragLeave={() => setIsDragOverGallery(false)}
      onDrop={handleGalleryDrop}
    >
      {/* Drag & drop overlay indicator */}
      {isDragOverGallery && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm border-4 border-dashed border-cyan-400 flex flex-col items-center justify-center pointer-events-none animate-in fade-in">
          <Upload className="w-16 h-16 text-cyan-400 animate-bounce mb-3" />
          <h3 className="text-xl sm:text-2xl font-bold text-white font-['Outfit']">Drop Photos to Upload</h3>
          <p className="text-xs sm:text-sm text-cyan-200 mt-1">Files will be securely encrypted inside this vault</p>
        </div>
      )}

      {/* DASHBOARD TOP BAR */}
      <header className="sticky top-0 z-30 bg-[#090d1c]/95 backdrop-blur-md border-b border-gray-800/80 px-3.5 sm:px-6 py-2.5 sm:py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 sm:gap-4">
          
          {/* Brand & Home Navigation */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={onLockVault}
              className="p-1.5 sm:p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-gray-800 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-medium"
              title="Lock Vault & Return to Homepage"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Home</span>
            </button>

            {/* Glowing Brand Mark & KG-Vault Title */}
            <div className="flex items-center gap-2 sm:gap-2.5">
              <div className="relative p-1.5 rounded-lg border border-purple-500/60 bg-purple-950/20 shadow-[0_0_12px_rgba(168,85,247,0.4)]">
                <Shield className="w-4 h-4 text-purple-400 neon-purple-shield stroke-[1.8]" />
                <Lock className="w-2 h-2 text-purple-300 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[45%]" />
              </div>
              <span className="text-base sm:text-lg font-extrabold tracking-tight bg-gradient-to-r from-[#4dd0e1] via-[#60a5fa] to-[#c084fc] bg-clip-text text-transparent font-['Outfit'] select-none">
                KG-Vault
              </span>
            </div>
          </div>

          {/* Desktop Search bar */}
          <div className="flex-1 max-w-xs sm:max-w-sm hidden md:block">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search memories by name or note..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-1.5 bg-[#070913] border border-gray-800 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Action cluster */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            
            {/* Upload Button */}
            <button
              type="button"
              onClick={() => setIsUploadOpen(true)}
              className="px-3 sm:px-3.5 py-1.5 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
              style={{
                backgroundColor: themeColor,
                color: isVault1 ? '#070913' : '#ffffff',
                boxShadow: `0 0 15px ${themeColor}40`,
              }}
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden min-[380px]:inline">Upload</span>
            </button>

            {/* Activity Log */}
            <button
              type="button"
              onClick={() => setIsActivityOpen(true)}
              className="p-1.5 sm:p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-gray-800 transition-colors"
              title="Vault Activity History"
            >
              <History className="w-4 h-4" />
            </button>

            {/* Settings */}
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="p-1.5 sm:p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-gray-800 transition-colors"
              title="Vault Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Lock / Logout */}
            <button
              type="button"
              onClick={onLockVault}
              className="p-1.5 sm:p-2 rounded-xl bg-red-950/30 hover:bg-red-950/60 text-red-400 hover:text-red-300 border border-red-500/20 transition-colors"
              title="Lock Vault Now"
            >
              <Lock className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Mobile search bar if narrow screen */}
        <div className="mt-2.5 md:hidden">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search memories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-[#070913] border border-gray-800 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-cyan-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* DASHBOARD CONTROLS & ALBUMS BAR */}
      <div className="border-b border-gray-800/60 bg-[#080b18]/70 px-3.5 sm:px-6 py-2.5 sm:py-3">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-3">
          
          {/* Albums & Filters tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none w-full md:w-auto -mx-1 px-1">
            <button
              type="button"
              onClick={() => setSelectedAlbumFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                selectedAlbumFilter === 'all'
                  ? 'bg-white/15 text-white font-semibold shadow-sm'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
              }`}
            >
              All Photos ({photos.length})
            </button>

            <button
              type="button"
              onClick={() => setSelectedAlbumFilter('favorites')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                selectedAlbumFilter === 'favorites'
                  ? 'bg-pink-600/30 border border-pink-500 text-pink-300 font-semibold shadow-sm'
                  : 'text-gray-400 hover:text-pink-300 hover:bg-white/5'
              }`}
            >
              <Heart className="w-3.5 h-3.5 fill-pink-500/80 text-pink-400" />
              <span>Favorites ({stats.favoriteCount})</span>
            </button>

            {/* Custom Album Tabs */}
            {albums.map((album) => {
              const count = photos.filter(p => p.albumId === album.id).length;
              const isSelected = selectedAlbumFilter === album.id;
              return (
                <div key={album.id} className="relative group flex items-center shrink-0">
                  <button
                    type="button"
                    onClick={() => setSelectedAlbumFilter(album.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'text-white font-semibold shadow-sm'
                        : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                    }`}
                    style={{
                      backgroundColor: isSelected ? `${album.color || themeColor}25` : undefined,
                      border: isSelected ? `1px solid ${album.color || themeColor}80` : '1px solid transparent',
                    }}
                  >
                    <Folder className="w-3.5 h-3.5" style={{ color: album.color || themeColor }} />
                    <span>{album.name} ({count})</span>
                  </button>

                  {/* Album contextual actions */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingAlbum(album);
                        setIsAlbumModalOpen(true);
                      }}
                      className="text-[10px] text-gray-500 hover:text-cyan-400 px-1 py-0.5 cursor-pointer"
                      title="Edit Album"
                    >
                      edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteAlbum(album.id, album.name)}
                      className="text-[10px] text-gray-500 hover:text-red-400 px-1 py-0.5 cursor-pointer"
                      title="Delete Album"
                    >
                      del
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Create Album Button */}
            <button
              type="button"
              onClick={() => {
                setEditingAlbum(null);
                setIsAlbumModalOpen(true);
              }}
              className="px-2.5 py-1.5 rounded-xl text-xs font-medium text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-gray-800 flex items-center gap-1 whitespace-nowrap transition-colors shrink-0 cursor-pointer"
            >
              <FolderPlus className="w-3.5 h-3.5 text-cyan-400" />
              <span>New Album</span>
            </button>
          </div>

          {/* Right controls: layout, sort, multi-select */}
          <div className="flex items-center justify-between md:justify-end gap-2 w-full md:w-auto shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-gray-800/40">
            
            {/* Sort selector */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-[#070913] border border-gray-800 rounded-xl px-2.5 py-1.5 text-xs text-gray-300 focus:outline-none flex-1 md:flex-none cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">Filename A-Z</option>
              <option value="size">File Size</option>
            </select>

            {/* Layout switch */}
            <div className="flex items-center p-0.5 rounded-xl bg-[#070913] border border-gray-800 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const updated = { ...vault.settings, layout: 'grid' as const };
                  setVault(v => ({ ...v, settings: updated }));
                }}
                className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  vault.settings.layout === 'grid' ? 'bg-white/15 text-white' : 'text-gray-500 hover:text-gray-300'
                }`}
                title="Uniform Grid View"
              >
                <Grid3X3 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  const updated = { ...vault.settings, layout: 'masonry' as const };
                  setVault(v => ({ ...v, settings: updated }));
                }}
                className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  vault.settings.layout === 'masonry' ? 'bg-white/15 text-white' : 'text-gray-500 hover:text-gray-300'
                }`}
                title="Masonry Feed View"
              >
                <Layers className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Multi-select toggle */}
            <button
              type="button"
              onClick={() => {
                setIsSelectMode(!isSelectMode);
                setSelectedPhotoIds([]);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer ${
                isSelectMode 
                  ? 'bg-cyan-950/40 border-cyan-500 text-cyan-300' 
                  : 'bg-white/5 border-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Select</span>
            </button>

          </div>

        </div>
      </div>

      {/* BATCH ACTION BAR (Shown when items are selected) */}
      {isSelectMode && selectedPhotoIds.length > 0 && (
        <div className="sticky top-[61px] z-20 bg-cyan-950/90 border-b border-cyan-500/40 backdrop-blur-md px-6 py-2.5 animate-in slide-in-from-top duration-200">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-cyan-200">
                {selectedPhotoIds.length} {selectedPhotoIds.length === 1 ? 'photo' : 'photos'} selected
              </span>
              <button
                type="button"
                onClick={() => {
                  if (selectedPhotoIds.length === filteredPhotos.length) {
                    setSelectedPhotoIds([]);
                  } else {
                    setSelectedPhotoIds(filteredPhotos.map(p => p.id));
                  }
                }}
                className="text-cyan-300 hover:underline"
              >
                {selectedPhotoIds.length === filteredPhotos.length ? 'Deselect all' : 'Select all'}
              </button>
            </div>

            <div className="flex items-center gap-2">
              {/* Move to album */}
              {albums.length > 0 && (
                <select
                  onChange={(e) => e.target.value && handleBatchMoveAlbum(e.target.value)}
                  className="bg-black/60 border border-cyan-500/50 rounded-lg px-2 py-1 text-cyan-200 text-xs focus:outline-none"
                  defaultValue=""
                >
                  <option value="" disabled>Move to album...</option>
                  <option value="">General Vault</option>
                  {albums.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              )}

              {/* Download batch */}
              <button
                type="button"
                onClick={handleBatchDownload}
                className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg flex items-center gap-1 font-medium"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </button>

              {/* Delete batch */}
              <button
                type="button"
                onClick={handleBatchDelete}
                className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg flex items-center gap-1 font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsSelectMode(false);
                  setSelectedPhotoIds([]);
                }}
                className="p-1 text-cyan-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN GALLERY CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* Loading state */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-500">
            <div 
              className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin mb-4"
              style={{ borderColor: `${themeColor}40`, borderTopColor: themeColor }}
            />
            <p className="text-sm font-medium">Decrypting private vault contents...</p>
          </div>
        ) : filteredPhotos.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center max-w-md mx-auto">
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 border"
              style={{
                backgroundColor: `${themeColor}10`,
                borderColor: `${themeColor}30`,
              }}
            >
              <ImageIcon className="w-8 h-8" style={{ color: themeColor }} />
            </div>
            <h3 className="text-lg font-bold text-white mb-1 font-['Outfit']">
              {searchQuery ? 'No matching photos found' : 'No photos in this view'}
            </h3>
            <p className="text-xs text-gray-400 mb-6 leading-relaxed">
              {searchQuery 
                ? 'Try adjusting your search terms or clearing the filter.' 
                : 'Upload your first photos to this encrypted vault. Drag & drop files directly onto this screen.'}
            </p>
            <button
              type="button"
              onClick={() => setIsUploadOpen(true)}
              className="px-5 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-2 shadow-lg transition-all"
              style={{
                backgroundColor: themeColor,
                color: isVault1 ? '#070913' : '#ffffff',
                boxShadow: `0 0 20px ${themeColor}40`,
              }}
            >
              <Upload className="w-4 h-4" />
              <span>Upload First Photo</span>
            </button>
          </div>
        ) : (
          /* Gallery Grid or Masonry */
          <div className={getThumbnailGridClass()}>
            {filteredPhotos.map((photo, index) => {
              const isSelected = selectedPhotoIds.includes(photo.id);
              const fileUrl = `/api/vault/photos/${photo.id}/file?token=${token}`;
              const albumObj = albums.find(a => a.id === photo.albumId);

              return (
                <div
                  key={photo.id}
                  onClick={() => {
                    if (isSelectMode) {
                      toggleSelectPhoto(photo.id, { stopPropagation: () => {} } as any);
                    } else {
                      setLightboxIndex(index);
                    }
                  }}
                  className={`group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 bg-[#0d1224] border ${
                    vault.settings.layout === 'masonry' ? 'mb-4 break-inside-avoid' : 'aspect-square'
                  } ${
                    isSelected 
                      ? 'ring-2 ring-cyan-400 border-cyan-400 shadow-[0_0_20px_rgba(56,189,248,0.4)]'
                      : 'border-white/5 hover:border-cyan-400/50 hover:shadow-[0_0_20px_rgba(56,189,248,0.25)] hover:scale-[1.01]'
                  }`}
                >
                  <img
                    src={fileUrl}
                    alt={photo.caption || photo.originalName}
                    loading="lazy"
                    className={`w-full ${
                      vault.settings.layout === 'masonry' ? 'h-auto object-cover' : 'h-full object-cover'
                    } transition-transform duration-500 ease-out group-hover:scale-105`}
                  />

                  {/* Dark hover scrim */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

                  {/* Multi-select checkbox */}
                  {isSelectMode && (
                    <button
                      type="button"
                      onClick={(e) => toggleSelectPhoto(photo.id, e)}
                      className="absolute top-2.5 left-2.5 z-10 p-1 rounded-lg bg-black/60 backdrop-blur-md transition-transform"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-cyan-400" />
                      ) : (
                        <Square className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  )}

                  {/* Top-right Favorite Heart */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleFavorite(photo.id, photo.favorite);
                    }}
                    className={`absolute top-2.5 right-2.5 z-10 p-1.5 rounded-lg backdrop-blur-md transition-all ${
                      photo.favorite 
                        ? 'bg-pink-950/70 text-pink-400 opacity-100' 
                        : 'bg-black/50 text-gray-400 opacity-0 group-hover:opacity-100 hover:text-pink-400'
                    }`}
                    title="Favorite"
                  >
                    <Heart className={`w-3.5 h-3.5 ${photo.favorite ? 'fill-pink-500 text-pink-500' : ''}`} />
                  </button>

                  {/* Bottom caption / info strip */}
                  <div className="absolute bottom-0 inset-x-0 p-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {photo.caption && (
                      <p className="text-xs text-white font-medium line-clamp-1 mb-1 drop-shadow">
                        {photo.caption}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-[10px] text-gray-400">
                      <span className="truncate max-w-[120px] font-mono">{photo.originalName}</span>
                      {albumObj && (
                        <span 
                          className="px-1.5 py-0.5 rounded text-[9px] font-semibold"
                          style={{
                            backgroundColor: `${albumObj.color || themeColor}30`,
                            color: albumObj.color || themeColor,
                          }}
                        >
                          {albumObj.name}
                        </span>
                      )}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </main>

      {/* DASHBOARD FOOTER WITH STORAGE STATS */}
      <footer className="border-t border-gray-800/80 bg-[#080b18] px-4 sm:px-6 py-3 sm:py-4 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-4 text-xs text-gray-400 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 sm:gap-4">
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              <span>{stats.totalPhotos} Photos</span>
            </span>
            <span>&bull;</span>
            <span>{stats.albumCount} Albums</span>
            <span>&bull;</span>
            <span className="text-gray-300 font-mono">{stats.storageFormatted} Used</span>
          </div>

          <div className="text-[11px] text-gray-400 font-medium">
            KG-Vault
          </div>
        </div>
      </footer>

      {/* LIGHTBOX MODAL */}
      {lightboxIndex !== null && (
        <LightboxModal
          photos={filteredPhotos}
          albums={albums}
          vault={vault}
          token={token}
          currentIndex={lightboxIndex}
          isOpen={lightboxIndex !== null}
          onClose={() => setLightboxIndex(null)}
          onNavigate={(newIdx) => setLightboxIndex(newIdx)}
          onToggleFavorite={handleToggleFavorite}
          onDeletePhoto={handleDeletePhoto}
          onUpdateCaption={handleUpdateCaption}
          onUpdateAlbum={handleUpdateAlbum}
        />
      )}

      {/* UPLOAD MODAL */}
      <UploadModal
        vault={vault}
        albums={albums}
        token={token}
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={() => {
          fetchVaultData();
        }}
      />

      {/* SETTINGS MODAL */}
      <SettingsModal
        vault={vault}
        token={token}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onLogout={onLockVault}
        onUpdateSettings={(newSettings, newName) => {
          setVault(v => ({
            ...v,
            name: newName || v.name,
            settings: { ...v.settings, ...newSettings },
          }));
        }}
        storageFormatted={stats.storageFormatted}
        totalPhotos={stats.totalPhotos}
      />

      {/* ALBUM CREATE / EDIT MODAL */}
      <AlbumModal
        vault={vault}
        token={token}
        isOpen={isAlbumModalOpen}
        editingAlbum={editingAlbum}
        onClose={() => {
          setIsAlbumModalOpen(false);
          setEditingAlbum(null);
        }}
        onSuccess={() => {
          fetchVaultData();
        }}
      />

      {/* ACTIVITY AUDIT MODAL */}
      <ActivityModal
        vault={vault}
        activity={activity}
        isOpen={isActivityOpen}
        onClose={() => setIsActivityOpen(false)}
      />

    </div>
  );
};
