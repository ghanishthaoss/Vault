import React, { useState } from 'react';
import { X, FolderPlus, FolderEdit, Check } from 'lucide-react';
import { Album, VaultInfo } from '../types/vault';

interface AlbumModalProps {
  vault: VaultInfo;
  token: string;
  isOpen: boolean;
  editingAlbum: Album | null;
  onClose: () => void;
  onSuccess: () => void;
}

const PRESET_COLORS = [
  '#38bdf8', // cyan
  '#ec4899', // pink
  '#a855f7', // purple
  '#10b981', // emerald
  '#f59e0b', // amber
  '#6366f1', // indigo
];

export const AlbumModal: React.FC<AlbumModalProps> = ({
  vault,
  token,
  isOpen,
  editingAlbum,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState(editingAlbum ? editingAlbum.name : '');
  const [description, setDescription] = useState(editingAlbum?.description || '');
  const [color, setColor] = useState(editingAlbum?.color || vault.themeColor || '#38bdf8');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide an album title');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const isEdit = Boolean(editingAlbum);
      const url = isEdit ? `/api/vault/albums/${editingAlbum!.id}` : '/api/vault/albums';
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: name.trim(), description: description.trim(), color }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save album');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error saving album');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative z-10 w-full max-w-md rounded-2xl bg-[#0c1020] border border-gray-800 p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-gray-800">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            {editingAlbum ? (
              <FolderEdit className="w-5 h-5 text-cyan-400" />
            ) : (
              <FolderPlus className="w-5 h-5 text-cyan-400" />
            )}
            <span>{editingAlbum ? 'Edit Album' : 'Create New Album'}</span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4 text-xs">
          <div>
            <label className="block text-gray-300 font-medium mb-1">Album Title *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Paris Trip, Anniversaries, Date Nights"
              className="w-full p-2.5 bg-[#070913] border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-cyan-400"
            />
          </div>

          <div>
            <label className="block text-gray-300 font-medium mb-1">Description (Optional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short note about these memories..."
              className="w-full p-2.5 bg-[#070913] border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-cyan-400"
            />
          </div>

          <div>
            <label className="block text-gray-300 font-medium mb-2">Accent Color</label>
            <div className="flex items-center gap-2.5">
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110 cursor-pointer"
                  style={{ backgroundColor: c }}
                >
                  {color === c && <Check className="w-4 h-4 text-white drop-shadow" />}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-2.5 rounded-lg bg-red-950/60 border border-red-500/40 text-red-300 text-[11px]">
              {error}
            </div>
          )}

          <div className="pt-2 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : editingAlbum ? 'Update Album' : 'Create Album'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
