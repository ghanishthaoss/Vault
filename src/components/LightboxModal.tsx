import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, ChevronLeft, ChevronRight, Download, Trash2, Heart, 
  Play, Pause, Info, Calendar, HardDrive, Tag, Check, Sparkles 
} from 'lucide-react';
import { Photo, Album, VaultInfo } from '../types/vault';

interface LightboxModalProps {
  photos: Photo[];
  albums: Album[];
  vault: VaultInfo;
  token: string;
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (index: number) => void;
  onToggleFavorite: (photoId: string, current: boolean) => void;
  onDeletePhoto: (photoId: string) => void;
  onUpdateCaption: (photoId: string, caption: string) => void;
  onUpdateAlbum: (photoId: string, albumId: string) => void;
}

export const LightboxModal: React.FC<LightboxModalProps> = ({
  photos,
  albums,
  vault,
  token,
  currentIndex,
  isOpen,
  onClose,
  onNavigate,
  onToggleFavorite,
  onDeletePhoto,
  onUpdateCaption,
  onUpdateAlbum,
}) => {
  const [showInfo, setShowInfo] = useState(false);
  const [isSlideshow, setIsSlideshow] = useState(false);
  const [captionText, setCaptionText] = useState('');
  const [isEditingCaption, setIsEditingCaption] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const activePhoto = photos[currentIndex];
  const isVault1 = vault.id === 'vault_1';
  const themeColor = vault.themeColor || (isVault1 ? '#38bdf8' : '#ec4899');

  useEffect(() => {
    if (activePhoto) {
      setCaptionText(activePhoto.caption || '');
      setIsEditingCaption(false);
      setDeleteConfirm(false);
    }
  }, [activePhoto]);

  const handleNext = useCallback(() => {
    if (photos.length <= 1) return;
    const nextIdx = (currentIndex + 1) % photos.length;
    onNavigate(nextIdx);
  }, [currentIndex, photos.length, onNavigate]);

  const handlePrev = useCallback(() => {
    if (photos.length <= 1) return;
    const prevIdx = (currentIndex - 1 + photos.length) % photos.length;
    onNavigate(prevIdx);
  }, [currentIndex, photos.length, onNavigate]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === ' ') {
        e.preventDefault();
        setIsSlideshow(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleNext, handlePrev, onClose]);

  // Slideshow timer
  useEffect(() => {
    if (!isOpen || !isSlideshow || photos.length <= 1) return;
    const intervalSec = vault.settings.slideshowInterval || 4;
    const timer = setInterval(() => {
      handleNext();
    }, intervalSec * 1000);
    return () => clearInterval(timer);
  }, [isOpen, isSlideshow, photos.length, vault.settings.slideshowInterval, handleNext]);

  if (!isOpen || !activePhoto) return null;

  const currentAlbum = albums.find(a => a.id === activePhoto.albumId);
  const formattedSize = activePhoto.size > 1024 * 1024 
    ? `${(activePhoto.size / (1024 * 1024)).toFixed(2)} MB`
    : `${Math.round(activePhoto.size / 1024)} KB`;

  const photoFileUrl = `/api/vault/photos/${activePhoto.id}/file?token=${token}`;
  const downloadUrl = `/api/vault/photos/${activePhoto.id}/file?token=${token}&download=1`;

  const handleSaveCaption = () => {
    onUpdateCaption(activePhoto.id, captionText);
    setIsEditingCaption(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl animate-in fade-in duration-200">
      
      {/* Top action bar */}
      <div className="absolute top-0 inset-x-0 h-14 sm:h-16 px-2 sm:px-6 flex items-center justify-between z-30 bg-gradient-to-b from-black/90 to-transparent">
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <span className="text-[11px] sm:text-xs font-mono text-gray-300 bg-white/10 border border-white/15 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full shrink-0">
            {currentIndex + 1} / {photos.length}
          </span>
          {/* Display filename on larger screens in top bar; on phone it displays at the bottom */}
          <span className="hidden md:inline text-xs sm:text-sm font-medium text-white truncate max-w-xs font-mono">
            {activePhoto.originalName}
          </span>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Slideshow button */}
          <button
            type="button"
            onClick={() => setIsSlideshow(!isSlideshow)}
            className={`p-1.5 sm:p-2 rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 text-xs font-medium ${
              isSlideshow 
                ? 'bg-purple-600/30 border-purple-500 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                : 'bg-white/5 border-white/10 text-gray-300 hover:text-white hover:bg-white/10'
            }`}
            title={isSlideshow ? 'Pause Slideshow' : 'Play Slideshow'}
          >
            {isSlideshow ? <Pause className="w-4 h-4 text-purple-400" /> : <Play className="w-4 h-4" />}
            <span className="hidden lg:inline">{isSlideshow ? 'Pause' : 'Slideshow'}</span>
          </button>

          {/* Favorite button */}
          <button
            type="button"
            onClick={() => onToggleFavorite(activePhoto.id, activePhoto.favorite)}
            className={`p-1.5 sm:p-2 rounded-lg border transition-all cursor-pointer ${
              activePhoto.favorite 
                ? 'bg-pink-600/20 border-pink-500 text-pink-400 shadow-[0_0_12px_rgba(236,72,153,0.3)]'
                : 'bg-white/5 border-white/10 text-gray-300 hover:text-white hover:bg-white/10'
            }`}
            title="Toggle Favorite"
          >
            <Heart className={`w-4 h-4 ${activePhoto.favorite ? 'fill-pink-500 text-pink-500' : ''}`} />
          </button>

          {/* Info toggle */}
          <button
            type="button"
            onClick={() => setShowInfo(!showInfo)}
            className={`p-1.5 sm:p-2 rounded-lg border transition-all cursor-pointer ${
              showInfo 
                ? 'bg-cyan-600/20 border-cyan-500 text-cyan-300'
                : 'bg-white/5 border-white/10 text-gray-300 hover:text-white hover:bg-white/10'
            }`}
            title="Photo Details"
          >
            <Info className="w-4 h-4" />
          </button>

          {/* Download button */}
          <a
            href={downloadUrl}
            download={activePhoto.originalName}
            className="p-1.5 sm:p-2 rounded-lg border bg-white/5 border-white/10 text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
            title="Download Original Photo"
          >
            <Download className="w-4 h-4" />
          </a>

          {/* Delete button */}
          <div className="relative">
            {deleteConfirm ? (
              <div className="flex items-center gap-1 bg-red-950/90 border border-red-500/50 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => {
                    onDeletePhoto(activePhoto.id);
                    setDeleteConfirm(false);
                  }}
                  className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-[11px] font-semibold"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteConfirm(false)}
                  className="px-1.5 py-1 text-gray-400 hover:text-white text-[11px]"
                  title="Cancel"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setDeleteConfirm(true)}
                className="p-1.5 sm:p-2 rounded-lg border bg-white/5 border-white/10 text-gray-300 hover:text-red-400 hover:border-red-500/30 hover:bg-red-950/20 transition-all cursor-pointer"
                title="Delete Photo"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-lg border bg-white/5 border-white/10 text-gray-300 hover:text-white hover:bg-white/15 transition-colors ml-1 sm:ml-2"
            title="Close Lightbox (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Navigation Arrows */}
      {photos.length > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30 p-2 sm:p-3 rounded-full bg-black/60 hover:bg-black/80 border border-white/15 text-white/80 hover:text-white transition-all cursor-pointer hover:scale-110"
            aria-label="Previous photo"
          >
            <ChevronLeft className="w-5 sm:w-6 h-5 sm:h-6" />
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-30 p-2 sm:p-3 rounded-full bg-black/60 hover:bg-black/80 border border-white/15 text-white/80 hover:text-white transition-all cursor-pointer hover:scale-110"
            aria-label="Next photo"
          >
            <ChevronRight className="w-5 sm:w-6 h-5 sm:h-6" />
          </button>
        </>
      )}

      {/* Main Image Stage */}
      <div 
        className="relative w-full h-full flex items-center justify-center p-2 sm:p-14 overflow-hidden select-none"
        onClick={() => {
          if (showInfo) setShowInfo(false);
        }}
      >
        <img
          src={photoFileUrl}
          alt={activePhoto.caption || activePhoto.originalName}
          className="max-w-full max-h-[76vh] sm:max-h-[82vh] object-contain rounded-lg shadow-2xl transition-transform duration-300 ease-out"
          style={{
            filter: 'drop-shadow(0 15px 30px rgba(0,0,0,0.8))',
          }}
        />

        {/* Detail display at bottom (displays photo filename and caption at bottom so top bar buttons remain fully responsive on phone) */}
        {!showInfo && (
          <div 
            className="absolute bottom-3 sm:bottom-6 inset-x-3 sm:inset-x-auto sm:max-w-md md:max-w-xl mx-auto z-20 pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-black/80 backdrop-blur-md border border-white/10 shadow-2xl flex flex-col items-center text-center">
              <span className="text-xs sm:text-sm font-semibold text-white tracking-wide truncate max-w-full font-mono">
                {activePhoto.originalName}
              </span>
              {activePhoto.caption && (
                <p className="text-[11px] sm:text-xs text-gray-300 mt-1 line-clamp-2">
                  {activePhoto.caption}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Sidebar / Bottom Sheet Details Drawer */}
      {showInfo && (
        <div className="absolute sm:top-16 bottom-0 inset-x-0 sm:inset-x-auto sm:right-0 max-h-[75vh] sm:max-h-none sm:bottom-0 w-full sm:w-96 bg-[#0a0e1c]/95 border-t sm:border-t-0 sm:border-l border-white/10 p-4 sm:p-5 z-40 overflow-y-auto backdrop-blur-xl rounded-t-2xl sm:rounded-none shadow-2xl animate-in slide-in-from-bottom sm:slide-in-from-right duration-200">
          <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-white/10 mb-4 sm:mb-5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Photo Details
            </h3>
            <button
              type="button"
              onClick={() => setShowInfo(false)}
              className="p-1 text-gray-400 hover:text-white rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4 text-xs">
            {/* Caption editor */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-gray-400 font-medium">Caption / Note</label>
                {!isEditingCaption && (
                  <button
                    type="button"
                    onClick={() => setIsEditingCaption(true)}
                    className="text-cyan-400 hover:underline text-[11px]"
                  >
                    Edit
                  </button>
                )}
              </div>
              {isEditingCaption ? (
                <div className="space-y-2">
                  <textarea
                    value={captionText}
                    onChange={(e) => setCaptionText(e.target.value)}
                    rows={3}
                    className="w-full p-2.5 bg-[#070913] border border-gray-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-400"
                    placeholder="Add a loving memory or description..."
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSaveCaption}
                      className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-medium flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" /> Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingCaption(false)}
                      className="px-3 py-1 bg-white/10 text-gray-300 rounded"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="p-2.5 rounded-lg bg-black/40 border border-white/5 text-gray-300 italic">
                  {activePhoto.caption || 'No caption added yet. Click edit to add a memory note.'}
                </p>
              )}
            </div>

            {/* Album selector */}
            <div>
              <label className="text-gray-400 font-medium block mb-1.5 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" /> Album Assignment
              </label>
              <select
                value={activePhoto.albumId || ''}
                onChange={(e) => onUpdateAlbum(activePhoto.id, e.target.value)}
                className="w-full p-2.5 bg-[#070913] border border-gray-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-400"
              >
                <option value="">No Album (General Vault)</option>
                {albums.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Technical metadata */}
            <div className="pt-3 border-t border-white/10 space-y-2.5">
              <div className="flex items-center justify-between text-gray-400">
                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Date Added</span>
                <span className="text-gray-200">{new Date(activePhoto.uploadDate).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center justify-between text-gray-400">
                <span className="flex items-center gap-1.5"><HardDrive className="w-3.5 h-3.5" /> File Size</span>
                <span className="text-gray-200">{formattedSize}</span>
              </div>
              <div className="flex items-center justify-between text-gray-400">
                <span>MIME Format</span>
                <span className="text-gray-200 uppercase">{activePhoto.mimeType.split('/')[1] || 'image'}</span>
              </div>
              <div className="flex items-center justify-between text-gray-400">
                <span>Vault Privacy</span>
                <span className="text-emerald-400 font-medium">Encrypted &bull; Isolated</span>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
