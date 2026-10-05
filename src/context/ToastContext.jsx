import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((payload, legacyType = 'info', legacyDuration = 4500) => {
    const normalized =
      typeof payload === 'string'
        ? { title: '', message: payload, type: legacyType || 'info', duration: legacyDuration }
        : {
            title: payload?.title ?? '',
            message: payload?.message ?? '',
            type: payload?.type ?? legacyType ?? 'info',
            duration: payload?.duration ?? legacyDuration ?? 4500,
          };

    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    const toast = {
      id,
      title: normalized.title || '',
      message: normalized.message || '',
      type: normalized.type || 'info',
      duration: normalized.duration ?? 4500,
    };

    setToasts((prev) => [...prev, toast]);

    if (toast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, toast.duration);
    }
    return id;
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
