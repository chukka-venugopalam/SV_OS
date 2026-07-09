'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

interface ModalConfig {
  id: string;
  content: ReactNode;
  onClose?: () => void;
}

interface ModalContextValue {
  openModal: (id: string, content: ReactNode, onClose?: () => void) => void;
  closeModal: (id: string) => void;
  closeAllModals: () => void;
  activeModal: ModalConfig | null;
}

const ModalContext = createContext<ModalContextValue | null>(null);

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}

interface ModalProviderProps {
  children: ReactNode;
}

export function ModalProvider({ children }: ModalProviderProps) {
  const [modals, setModals] = useState<ModalConfig[]>([]);

  const openModal = useCallback((id: string, content: ReactNode, onClose?: () => void) => {
    setModals((prev) => [...prev, { id, content, onClose }]);
  }, []);

  const closeModal = useCallback((id: string) => {
    setModals((prev) => {
      const modal = prev.find((m) => m.id === id);
      if (modal?.onClose) modal.onClose();
      return prev.filter((m) => m.id !== id);
    });
  }, []);

  const closeAllModals = useCallback(() => {
    setModals([]);
  }, []);

  const activeModal: ModalConfig | null = useMemo(() => {
    return modals.length > 0 ? (modals[modals.length - 1] ?? null) : null;
  }, [modals]);

  const value = useMemo<ModalContextValue>(
    () => ({ openModal, closeModal, closeAllModals, activeModal }),
    [openModal, closeModal, closeAllModals, activeModal],
  );

  return <ModalContext.Provider value={value}>{children}</ModalContext.Provider>;
}
