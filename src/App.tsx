/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Homepage } from './components/Homepage';
import { PasswordModal } from './components/PasswordModal';
import { VaultDashboard } from './components/VaultDashboard';
import { VaultId, VaultInfo } from './types/vault';

const TOKEN_KEY = 'kg_vault_session_token';
const VAULT_KEY = 'kg_vault_session_data';

export default function App() {
  const [selectedVaultForLogin, setSelectedVaultForLogin] = useState<VaultId | null>(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [activeVault, setActiveVault] = useState<VaultInfo | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // Restore session on refresh if valid
  useEffect(() => {
    const savedToken = sessionStorage.getItem(TOKEN_KEY);
    const savedVaultRaw = sessionStorage.getItem(VAULT_KEY);

    if (savedToken && savedVaultRaw) {
      try {
        const parsedVault: VaultInfo = JSON.parse(savedVaultRaw);
        fetch('/api/auth/session', {
          headers: { Authorization: `Bearer ${savedToken}` },
        })
          .then((res) => {
            if (res.ok) {
              return res.json();
            }
            throw new Error('Session expired');
          })
          .then((data) => {
            setAuthToken(savedToken);
            setActiveVault(data.vault || parsedVault);
          })
          .catch(() => {
            // Invalid or expired session
            sessionStorage.removeItem(TOKEN_KEY);
            sessionStorage.removeItem(VAULT_KEY);
            setAuthToken(null);
            setActiveVault(null);
          })
          .finally(() => {
            setIsCheckingSession(false);
          });
        return;
      } catch {
        sessionStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(VAULT_KEY);
      }
    }
    setIsCheckingSession(false);
  }, []);

  const handleSelectVault = (vaultId: VaultId) => {
    setSelectedVaultForLogin(vaultId);
    setIsPasswordModalOpen(true);
  };

  const handleLoginSuccess = (token: string, vaultData: VaultInfo) => {
    setAuthToken(token);
    setActiveVault(vaultData);
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(VAULT_KEY, JSON.stringify(vaultData));
    setIsPasswordModalOpen(false);
    setSelectedVaultForLogin(null);
  };

  const handleLockVault = async () => {
    if (authToken) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${authToken}` },
        });
      } catch (e) {
        console.error('Logout error:', e);
      }
    }
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(VAULT_KEY);
    setAuthToken(null);
    setActiveVault(null);
  };

  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-[#070913] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If user is authenticated and has an active vault, show the VaultDashboard
  if (authToken && activeVault) {
    return (
      <VaultDashboard
        initialVault={activeVault}
        token={authToken}
        onLockVault={handleLockVault}
      />
    );
  }

  // Otherwise, show the Homepage matching the screenshot
  return (
    <>
      <Homepage onSelectVault={handleSelectVault} />

      {selectedVaultForLogin && (
        <PasswordModal
          vaultId={selectedVaultForLogin}
          isOpen={isPasswordModalOpen}
          onClose={() => {
            setIsPasswordModalOpen(false);
            setSelectedVaultForLogin(null);
          }}
          onSuccess={handleLoginSuccess}
        />
      )}
    </>
  );
}
