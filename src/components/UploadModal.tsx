import React, { useState, useRef } from 'react';
import { X, UploadCloud, Image, Trash2, Folder, Check, AlertCircle } from 'lucide-react';
import { Album, VaultInfo } from '../types/vault';

interface UploadModalProps {
  vault: VaultInfo;
  albums: Album[];
  token: string;
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
}

interface FilePreview {
  file: File;
  previewUrl: string;
  name: string;
  size: number;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  vault,
  albums,
  token,
  isOpen,
  onClose,
  onUploadSuccess,
}) => {
  const [previews, setPreviews] = useState<FilePreview[]>([]);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string>('');
  const [caption, setCaption] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isVault1 = vault.id === 'vault_1';
  const themeColor = vault.themeColor || (isVault1 ? '#38bdf8' : '#ec4899');

  if (!isOpen) return null;

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setError(null);

    const newPreviews: FilePreview[] = [];
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (!validTypes.includes(file.type)) {
        setError(`"${file.name}" is not a supported image format.`);
        continue;
      }
      if (file.size > 30 * 1024 * 1024) {
        setError(`"${file.name}" exceeds the 30MB file size limit.`);
        continue;
      }
      const previewUrl = URL.createObjectURL(file);
      newPreviews.push({
        file,
        previewUrl,
        name: file.name,
        size: file.size,
      });
    }

    setPreviews(prev => [...prev, ...newPreviews]);
  };

  const handleRemove = (index: number) => {
    setPreviews(prev => {
      URL.revokeObjectURL(prev[index].previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleClearAll = () => {
    previews.forEach(p => URL.revokeObjectURL(p.previewUrl));
    setPreviews([]);
    setError(null);
  };

  const handleUpload = async () => {
    if (previews.length === 0) {
      setError('Please select at least one photo to upload.');
      return;
    }

    setUploading(true);
    setError(null);
    setProgress(20);

    const formData = new FormData();
    previews.forEach(p => {
      formData.append('photos', p.file);
    });
    if (selectedAlbumId) {
      formData.append('albumId', selectedAlbumId);
    }
    if (caption.trim()) {
      formData.append('caption', caption.trim());
    }

    try {
      setProgress(50);
      const res = await fetch('/api/vault/photos/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload photos.');
      }

      setProgress(100);
      setTimeout(() => {
        handleClearAll();
        setUploading(false);
        onUploadSuccess();
        onClose();
      }, 400);
    } catch (err: any) {
      setError(err.message || 'Upload error');
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={() => !uploading && onClose()} />

      <div 
        className="relative z-10 w-full max-w-2xl rounded-2xl bg-[#0c1020] border p-4 sm:p-6 shadow-2xl flex flex-col max-h-[90vh]"
        style={{
          borderColor: isVault1 ? 'rgba(56, 189, 248, 0.4)' : 'rgba(236, 72, 153, 0.4)',
          boxShadow: `0 0 30px ${themeColor}25`,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-800">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <UploadCloud className="w-5 h-5" style={{ color: themeColor }} />
              Upload Photos to Vault
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Images are encrypted and stored in your isolated personal vault.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={uploading}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {/* Drag & drop box */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOver(false);
              handleFiles(e.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center ${
              isDragOver 
                ? 'border-cyan-400 bg-cyan-950/20 shadow-[0_0_20px_rgba(56,189,248,0.2)]'
                : 'border-gray-700 hover:border-gray-500 bg-white/[0.02]'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
              style={{ backgroundColor: `${themeColor}15`, color: themeColor }}
            >
              <UploadCloud className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-white">
              Drag & drop photos here, or <span className="underline" style={{ color: themeColor }}>browse</span>
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Supports JPEG, PNG, WebP, GIF up to 30MB each. Multi-file upload supported.
            </p>
          </div>

          {/* Error notice */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Options: Album assignment and initial caption */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="text-xs font-medium text-gray-300 block mb-1 flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5" style={{ color: themeColor }} /> Target Album (Optional)
              </label>
              <select
                value={selectedAlbumId}
                onChange={(e) => setSelectedAlbumId(e.target.value)}
                className="w-full p-2.5 bg-[#070913] border border-gray-700 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-400"
              >
                <option value="">General Vault (No Album)</option>
                {albums.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-300 block mb-1">
                Batch Caption / Note (Optional)
              </label>
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="e.g. Summer vacation memories..."
                className="w-full p-2.5 bg-[#070913] border border-gray-700 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-400"
              />
            </div>
          </div>

          {/* Selected File Previews */}
          {previews.length > 0 && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>Selected Files ({previews.length})</span>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-red-400 hover:underline"
                >
                  Clear all
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-48 overflow-y-auto p-1">
                {previews.map((item, idx) => (
                  <div key={idx} className="relative group rounded-xl overflow-hidden border border-gray-800 bg-black/40">
                    <img
                      src={item.previewUrl}
                      alt={item.name}
                      className="w-full h-24 object-cover"
                    />
                    <div className="p-1.5 text-[11px] truncate text-gray-300 bg-[#070913]">
                      {item.name}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemove(idx)}
                      className="absolute top-1 right-1 p-1 rounded-md bg-black/70 text-red-400 hover:text-white hover:bg-red-600 transition-colors opacity-90 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Progress bar */}
          {uploading && (
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs text-gray-300">
                <span>Encrypting & uploading...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full transition-all duration-300"
                  style={{ width: `${progress}%`, backgroundColor: themeColor }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="pt-4 border-t border-gray-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={uploading}
            className="px-4 py-2 text-xs font-medium text-gray-400 hover:text-white bg-white/5 rounded-xl border border-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={uploading || previews.length === 0}
            className="px-5 py-2 text-xs font-semibold rounded-xl text-white flex items-center gap-2 transition-all disabled:opacity-50"
            style={{
              backgroundColor: themeColor,
              color: isVault1 ? '#070913' : '#ffffff',
              boxShadow: `0 0 15px ${themeColor}50`,
            }}
          >
            {uploading ? (
              <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <UploadCloud className="w-4 h-4" />
                <span>Upload {previews.length > 0 ? `(${previews.length})` : ''}</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
