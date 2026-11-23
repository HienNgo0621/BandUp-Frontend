import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './Icon';

export type ToastVariant = 'success' | 'info' | 'warning' | 'error';

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant) => void;
  dismissToast: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: number) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const showToast = useCallback((message: string, variant: ToastVariant = 'info') => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setItems((current) => [...current, { id, message, variant }].slice(-4));
  }, []);

  const value = useMemo(() => ({ showToast, dismissToast }), [showToast, dismissToast]);
  const portalTarget = typeof document === 'undefined'
    ? null
    : document.getElementById('toast-root') ?? document.body;

  return (
    <ToastContext.Provider value={value}>
      {children}
      {portalTarget
        ? createPortal(
            <div className="toast-viewport" aria-live="polite" aria-atomic="false">
              {items.map((item) => (
                <ToastItemView key={item.id} item={item} onDismiss={dismissToast} />
              ))}
            </div>,
            portalTarget,
          )
        : null}
    </ToastContext.Provider>
  );
}

function ToastItemView({ item, onDismiss }: { item: ToastItem; onDismiss: (id: number) => void }) {
  useEffect(() => {
    const timeoutId = window.setTimeout(() => onDismiss(item.id), 3500);
    return () => window.clearTimeout(timeoutId);
  }, [item.id, onDismiss]);

  const iconName = item.variant === 'success'
    ? 'check'
    : item.variant === 'warning' || item.variant === 'error'
      ? 'alert-circle'
      : 'info';

  return (
    <div className={`toast-item toast-${item.variant} fi`} role="status">
      <Icon name={iconName} size={18} />
      <p>{item.message}</p>
      <button type="button" onClick={() => onDismiss(item.id)} aria-label="Dismiss notification">
        <Icon name="x" size={16} />
      </button>
    </div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider.');
  }
  return context;
}
