import React, { useState, useEffect, useRef } from 'react';
import { Lock, Eye, EyeOff, X, ShieldAlert, ArrowRight } from 'lucide-react';
import { VaultId } from '../types/vault';

interface PasswordModalProps {
  vaultId: VaultId;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (token: string, vaultData: any) => void;
}

export const PasswordModal: React.FC<PasswordModalProps> = ({
  vaultId,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isVault1 = vaultId === 'vault_1';
  const themeColor = isVault1 ? '#38bdf8' : '#ec4899';
  const themeName = isVault1 ? 'Vault I' : 'Vault II';
  const themeSymbol = isVault1 ? '♂' : '♀';

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setError(null);
      setShowPassword(false);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!password.trim()) {
      setError('Please enter your vault password.');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vaultId, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed. Please check password.');
      }

      onSuccess(data.token, data.vault);
    } catch (err: any) {
      setError(err.message || 'Access denied');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      inputRef.current?.select();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="fixed inset-0" 
        onClick={onClose} 
      />

      <div 
        className={`relative z-10 w-full max-w-md max-h-[92vh] overflow-y-auto rounded-2xl bg-[#0c1020] border p-5 sm:p-8 shadow-2xl transition-all duration-200 ${
          shake ? 'animate-bounce' : ''
        }`}
        style={{
          borderColor: isVault1 ? 'rgba(56, 189, 248, 0.45)' : 'rgba(236, 72, 153, 0.45)',
          boxShadow: isVault1 
            ? '0 0 35px rgba(56, 189, 248, 0.25)' 
            : '0 0 35px rgba(236, 72, 153, 0.25)',
        }}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with symbol and title */}
        <div className="flex flex-col items-center text-center mb-6">
          <div 
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3 border shadow-lg"
            style={{
              backgroundColor: isVault1 ? 'rgba(56, 189, 248, 0.1)' : 'rgba(236, 72, 153, 0.1)',
              borderColor: isVault1 ? 'rgba(56, 189, 248, 0.5)' : 'rgba(236, 72, 153, 0.5)',
              boxShadow: isVault1 ? '0 0 20px rgba(56,189,248,0.3)' : '0 0 20px rgba(236,72,153,0.3)',
            }}
          >
            <span 
              className="text-2xl font-bold"
              style={{ color: themeColor }}
            >
              {themeSymbol}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-['Outfit']">
            Unlock Vault
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Enter security passphrase to access protected private memories.
          </p>
        </div>

        {/* Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-300">
              Vault Passphrase
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                ref={inputRef}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..."
                disabled={loading}
                className="w-full pl-10 pr-10 py-3 bg-[#070913] border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all"
                style={{
                  outlineColor: themeColor,
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-200 transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs animate-in fade-in">
              <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}


          {/* Action buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 px-4 rounded-xl text-sm font-medium text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-gray-800 transition-all cursor-pointer"
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              style={{
                backgroundColor: themeColor,
                color: isVault1 ? '#070913' : '#ffffff',
                boxShadow: `0 0 18px ${themeColor}60`,
              }}
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Unlock</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
