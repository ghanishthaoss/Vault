import React, { useState } from 'react';
import { 
  X, Shield, Lock, Palette, Clock, Trash2, Eye, EyeOff, 
  Check, HardDrive, LogOut, CheckCircle2, AlertCircle, LayoutGrid, Layers
} from 'lucide-react';
import { VaultInfo, VaultSettings } from '../types/vault';

interface SettingsModalProps {
  vault: VaultInfo;
  token: string;
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  onUpdateSettings: (newSettings: Partial<VaultSettings>, newName?: string) => void;
  storageFormatted: string;
  totalPhotos: number;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  vault,
  token,
  isOpen,
  onClose,
  onLogout,
  onUpdateSettings,
  storageFormatted,
  totalPhotos,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'storage'>('general');
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);
  const [pwError, setPwError] = useState<string | null>(null);

  // Settings local state
  const [settings, setSettings] = useState<VaultSettings>(vault.settings);
  const [vaultName, setVaultName] = useState(vault.name);
  const [savedNotice, setSavedNotice] = useState(false);

  const isVault1 = vault.id === 'vault_1';
  const themeColor = vault.themeColor || (isVault1 ? '#38bdf8' : '#ec4899');

  if (!isOpen) return null;

  const handleSaveSettings = async (partial: Partial<VaultSettings>, updatedName?: string) => {
    const updated = { ...settings, ...partial };
    setSettings(updated);
    onUpdateSettings(partial, updatedName);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);

    try {
      await fetch('/api/vault/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...partial,
          name: updatedName || vaultName,
        }),
      });
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(null);

    if (!currentPassword) {
      setPwError('Please enter current password');
      return;
    }
    if (newPassword.length < 6) {
      setPwError('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError('New passwords do not match');
      return;
    }

    setPwLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update password');
      }

      setPwSuccess('Password changed successfully! Keep it safe.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPwError(err.message || 'Error changing password');
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} />

      <div 
        className="relative z-10 w-full max-w-xl rounded-2xl bg-[#0c1020] border p-6 shadow-2xl flex flex-col max-h-[88vh]"
        style={{
          borderColor: isVault1 ? 'rgba(56, 189, 248, 0.4)' : 'rgba(236, 72, 153, 0.4)',
          boxShadow: `0 0 30px ${themeColor}20`,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <div 
              className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md border"
              style={{ 
                backgroundColor: `${themeColor}20`, 
                borderColor: `${themeColor}40`,
                color: themeColor 
              }}
            >
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">Vault Settings</h2>
              <p className="text-xs text-gray-400">Configure privacy, visual themes, and security preferences</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab navigation */}
        <div className="flex items-center gap-2 pt-4 pb-2 border-b border-gray-800/80">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'general'
                ? 'bg-white/10 text-white font-semibold'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Preferences
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'security'
                ? 'bg-white/10 text-white font-semibold'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Security & Password
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('storage')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'storage'
                ? 'bg-white/10 text-white font-semibold'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Storage & Isolation
          </button>
          {savedNotice && (
            <span className="ml-auto text-[11px] text-emerald-400 flex items-center gap-1 animate-in fade-in">
              <Check className="w-3 h-3" /> Saved
            </span>
          )}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-5 pr-1 text-xs text-gray-300">
          
          {/* TAB 1: General Preferences */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              {/* Vault Title */}
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Vault Name / Alias
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={vaultName}
                    onChange={(e) => setVaultName(e.target.value)}
                    className="flex-1 p-2.5 bg-[#070913] border border-gray-700 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveSettings({}, vaultName)}
                    className="px-3 py-2 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-medium"
                  >
                    Rename
                  </button>
                </div>
              </div>

              {/* Layout Preference */}
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-2">
                  Default Gallery Layout
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleSaveSettings({ layout: 'grid' })}
                    className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all text-left ${
                      settings.layout === 'grid'
                        ? 'border-cyan-400 bg-cyan-950/30 text-white'
                        : 'border-gray-800 bg-white/[0.02] text-gray-400 hover:border-gray-700'
                    }`}
                  >
                    <LayoutGrid className="w-4 h-4 text-cyan-400" />
                    <div>
                      <div className="font-semibold text-xs">Uniform Grid</div>
                      <div className="text-[10px] text-gray-400">Square cropped tiles</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSaveSettings({ layout: 'masonry' })}
                    className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all text-left ${
                      settings.layout === 'masonry'
                        ? 'border-pink-400 bg-pink-950/30 text-white'
                        : 'border-gray-800 bg-white/[0.02] text-gray-400 hover:border-gray-700'
                    }`}
                  >
                    <Layers className="w-4 h-4 text-pink-400" />
                    <div>
                      <div className="font-semibold text-xs">Masonry Feed</div>
                      <div className="text-[10px] text-gray-400">Natural image proportions</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Thumbnail Size */}
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">
                  Thumbnail Size
                </label>
                <div className="flex gap-2 p-1 bg-[#070913] border border-gray-800 rounded-xl">
                  {(['compact', 'medium', 'large'] as const).map(size => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => handleSaveSettings({ thumbnailSize: size })}
                      className={`flex-1 py-1.5 text-xs font-medium capitalize rounded-lg transition-colors ${
                        settings.thumbnailSize === size
                          ? 'bg-white/15 text-white font-semibold'
                          : 'text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Slideshow Interval */}
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">
                  Slideshow Transition Interval
                </label>
                <select
                  value={settings.slideshowInterval || 4}
                  onChange={(e) => handleSaveSettings({ slideshowInterval: parseInt(e.target.value, 10) })}
                  className="w-full p-2.5 bg-[#070913] border border-gray-700 rounded-xl text-xs text-white focus:outline-none"
                >
                  <option value={3}>3 Seconds (Fast)</option>
                  <option value={4}>4 Seconds (Standard)</option>
                  <option value={6}>6 Seconds (Relaxed)</option>
                  <option value={10}>10 Seconds (Cinematic)</option>
                </select>
              </div>

              {/* Confirm before delete */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-gray-800">
                <div>
                  <div className="font-medium text-white text-xs">Confirm Before Deletion</div>
                  <div className="text-[11px] text-gray-400">Show prompt before permanently removing photos</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.confirmDelete}
                  onChange={(e) => handleSaveSettings({ confirmDelete: e.target.checked })}
                  className="w-4 h-4 rounded text-cyan-500 focus:ring-0 cursor-pointer"
                />
              </div>

            </div>
          )}

          {/* TAB 2: Security & Password */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              {/* Inactivity Auto-Lock */}
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  Auto-Lock Inactivity Timeout
                </label>
                <select
                  value={settings.autoLockMinutes}
                  onChange={(e) => handleSaveSettings({ autoLockMinutes: parseInt(e.target.value, 10) })}
                  className="w-full p-2.5 bg-[#070913] border border-gray-700 rounded-xl text-xs text-white focus:outline-none"
                >
                  <option value={5}>5 Minutes of Inactivity</option>
                  <option value={15}>15 Minutes (Recommended)</option>
                  <option value={30}>30 Minutes</option>
                  <option value={60}>1 Hour</option>
                  <option value={0}>Disabled (Never Auto-Lock)</option>
                </select>
                <p className="text-[11px] text-gray-400 mt-1">
                  Locks vault and returns to landing screen if user is idle.
                </p>
              </div>

              {/* Password Change Form */}
              <form onSubmit={handlePasswordSubmit} className="pt-3 border-t border-gray-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white text-xs flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-purple-400" /> Change Passphrase
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="text-[11px] text-gray-400 hover:text-gray-200"
                  >
                    {showPw ? 'Hide' : 'Show'} inputs
                  </button>
                </div>

                <div>
                  <input
                    type={showPw ? 'text' : 'password'}
                    placeholder="Current Password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full p-2.5 bg-[#070913] border border-gray-700 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type={showPw ? 'text' : 'password'}
                    placeholder="New Password (min 6 chars)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full p-2.5 bg-[#070913] border border-gray-700 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none"
                  />
                  <input
                    type={showPw ? 'text' : 'password'}
                    placeholder="Confirm New Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full p-2.5 bg-[#070913] border border-gray-700 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none"
                  />
                </div>

                {pwError && (
                  <div className="p-2.5 rounded-lg bg-red-950/60 border border-red-500/40 text-red-300 text-[11px] flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{pwError}</span>
                  </div>
                )}

                {pwSuccess && (
                  <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-[11px] flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>{pwSuccess}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={pwLoading}
                  className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-semibold text-xs transition-colors disabled:opacity-50"
                >
                  {pwLoading ? 'Hashing & Updating...' : 'Update Password Hash'}
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: Storage & Isolation */}
          {activeTab === 'storage' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-white/[0.02] border border-gray-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 font-medium">Vault Storage Used</span>
                  <span className="text-white font-mono font-semibold">{storageFormatted}</span>
                </div>
                <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-cyan-400"
                    style={{ width: '12%' }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-gray-500">
                  <span>{totalPhotos} Photos Encrypted</span>
                  <span>Unlimited Vault Capacity</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/30 text-cyan-200 text-xs space-y-2">
                <div className="font-semibold flex items-center gap-1.5 text-cyan-300">
                  <Shield className="w-4 h-4 text-cyan-400" />
                  Dual-Vault Isolation Guarantee
                </div>
                <p className="text-[11px] text-cyan-200/80 leading-relaxed">
                  Every photo file and database record is tagged with its owner vault. 
                  Sessions are cryptographically bound to one vault; no API query or direct URL 
                  can cross-reference photos between Vault I and Vault II without authenticating with that specific password.
                </p>
              </div>

              {/* Logout button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onLogout}
                  className="w-full py-2.5 px-4 rounded-xl bg-red-950/40 hover:bg-red-900/50 border border-red-500/30 text-red-300 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Lock Vault & Sign Out</span>
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
