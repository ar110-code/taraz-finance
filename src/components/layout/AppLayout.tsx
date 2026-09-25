'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { TransactionModal } from '@/components/transactions/TransactionModal';
import { ResetConfirmModal } from '@/components/ui/ResetConfirmModal';
import { LockScreen } from '@/components/ui/LockScreen';
import { ChangePinModal } from '@/components/ui/ChangePinModal';
import { BottomNav } from './BottomNav';
import { formatToman } from '@/lib/utils';

interface AppContextType {
  openTransactionModal: () => void;
  openResetModal: () => void;
  openChangePinModal: () => void;
  appPin: string;
  refreshKey: number;
  triggerRefresh: () => void;
  isPrivacyMode: boolean;
  togglePrivacyMode: () => void;
  isLocked: boolean;
  lockApp: () => void;
  unlockApp: (pin: string) => boolean;
  changePin: (newPin: string) => void;
  formatMoney: (amount: number, showSign?: boolean) => string;
}

const AppContext = createContext<AppContextType>({
  openTransactionModal: () => {},
  openResetModal: () => {},
  openChangePinModal: () => {},
  appPin: '1234',
  refreshKey: 0,
  triggerRefresh: () => {},
  isPrivacyMode: false,
  togglePrivacyMode: () => {},
  isLocked: false,
  lockApp: () => {},
  unlockApp: () => false,
  changePin: () => {},
  formatMoney: (amount) => formatToman(amount),
});

export const useApp = () => useContext(AppContext);

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [txModalOpen, setTxModalOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Privacy Mode State
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);

  // App Lock State
  const [isLocked, setIsLocked] = useState(false);
  const [appPin, setAppPin] = useState('1234');
  const [isChangePinOpen, setIsChangePinOpen] = useState(false);

  const changePin = (newPin: string) => {
    setAppPin(newPin);
    localStorage.setItem('taraz_app_pin', newPin);
  };

  useEffect(() => {
    // Load persisted privacy mode
    const savedPrivacy = localStorage.getItem('taraz_privacy');
    if (savedPrivacy === 'true') {
      setIsPrivacyMode(true);
    }

    // Load persisted PIN
    const savedPin = localStorage.getItem('taraz_app_pin');
    if (savedPin) {
      setAppPin(savedPin);
    }
  }, []);

  const triggerRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const togglePrivacyMode = () => {
    setIsPrivacyMode((prev) => {
      const next = !prev;
      localStorage.setItem('taraz_privacy', String(next));
      return next;
    });
  };

  const lockApp = () => {
    setIsLocked(true);
  };

  const unlockApp = (enteredPin: string): boolean => {
    if (enteredPin === appPin) {
      setIsLocked(false);
      return true;
    }
    return false;
  };

  const formatMoney = (amount: number, showSign: boolean = false): string => {
    if (isPrivacyMode) {
      return '••••••••';
    }
    return formatToman(amount, showSign);
  };

  const handleConfirmReset = async (mode: 'zero' | 'seed' = 'zero') => {
    setIsResetting(true);
    try {
      const res = await fetch('/api/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });
      const data = await res.json();
      if (data.success) {
        setResetModalOpen(false);
        triggerRefresh();
      }
    } catch (err) {
      console.error('Failed to reset data:', err);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <AppContext.Provider
      value={{
        openTransactionModal: () => setTxModalOpen(true),
        openResetModal: () => setResetModalOpen(true),
        openChangePinModal: () => setIsChangePinOpen(true),
        appPin,
        refreshKey,
        triggerRefresh,
        isPrivacyMode,
        togglePrivacyMode,
        isLocked,
        lockApp,
        unlockApp,
        changePin,
        formatMoney,
      }}
    >
      <div className={`min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans ${isPrivacyMode ? 'privacy-mode' : ''}`}>
        {/* App Lock Screen Overlay */}
        {isLocked && (
          <LockScreen
            onUnlock={unlockApp}
            onOpenChangePin={() => setIsChangePinOpen(true)}
          />
        )}

        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main Content Area (shifted left on desktop for RTL) */}
        <div className="flex-1 flex flex-col lg:mr-64 transition-all duration-200">
          <Header
            onOpenSidebar={() => setSidebarOpen(true)}
            onOpenTransactionModal={() => setTxModalOpen(true)}
            onOpenResetModal={() => setResetModalOpen(true)}
          />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>

        {/* Mobile Bottom Navigation Bar */}
        <BottomNav onOpenTransactionModal={() => setTxModalOpen(true)} />

        {/* Global Transaction Creation Modal */}
        <TransactionModal
          isOpen={txModalOpen}
          onClose={() => setTxModalOpen(false)}
          onSuccess={() => {
            setTxModalOpen(false);
            triggerRefresh();
          }}
        />

        {/* Global Reset Confirmation Modal */}
        <ResetConfirmModal
          isOpen={resetModalOpen}
          onClose={() => setResetModalOpen(false)}
          onConfirm={handleConfirmReset}
          isLoading={isResetting}
        />

        {/* Global Change PIN Modal */}
        <ChangePinModal
          isOpen={isChangePinOpen}
          onClose={() => setIsChangePinOpen(false)}
          currentPin={appPin}
          onSuccess={changePin}
        />
      </div>
    </AppContext.Provider>
  );
}
