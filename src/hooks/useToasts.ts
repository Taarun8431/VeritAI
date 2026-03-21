import { useState, useCallback } from 'react';
import { Verdict } from '../types';

export interface ToastMessage {
  id: string;
  verdict: Verdict | string;
  claimText: string;
}

export function useToasts() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((verdict: Verdict | string, claimText: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => {
      const newToasts = [...prev, { id, verdict, claimText }];
      if (newToasts.length > 5) {
        return newToasts.slice(newToasts.length - 5);
      }
      return newToasts;
    });
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return { toasts, addToast, dismissToast };
}
