import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

export type ChipType = 'connected' | 'loading' | 'error' | 'warning' | 'disabled' | 'success';

export interface StatusChip {
  id: string;
  type: ChipType;
  label: string;
  /** Auto-dismiss after ms. 0 = persist until manually hidden. Default: 4000 */
  duration?: number;
}

interface StatusContextValue {
  chips: StatusChip[];
  showStatus: (chip: Omit<StatusChip, 'id'> & { id?: string }) => string;
  hideStatus: (id: string) => void;
  updateStatus: (id: string, patch: Partial<Omit<StatusChip, 'id'>>) => void;
}

const StatusContext = createContext<StatusContextValue>({
  chips: [],
  showStatus: () => '',
  hideStatus: () => {},
  updateStatus: () => {},
});

let _idCounter = 0;

export function StatusProvider({ children }: { children: React.ReactNode }) {
  const [chips, setChips] = useState<StatusChip[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const hideStatus = useCallback((id: string) => {
    setChips(prev => prev.filter(c => c.id !== id));
    const t = timers.current.get(id);
    if (t) { clearTimeout(t); timers.current.delete(id); }
  }, []);

  const showStatus = useCallback((
    config: Omit<StatusChip, 'id'> & { id?: string }
  ): string => {
    const id = config.id ?? `chip_${++_idCounter}`;
    const duration = config.duration ?? 4000;

    setChips(prev => {
      // Replace if same id already exists
      const exists = prev.some(c => c.id === id);
      const chip: StatusChip = { ...config, id, duration };
      return exists ? prev.map(c => c.id === id ? chip : c) : [...prev, chip];
    });

    // Clear any existing timer for this id
    const existing = timers.current.get(id);
    if (existing) clearTimeout(existing);

    if (duration > 0) {
      const t = setTimeout(() => {
        setChips(prev => prev.filter(c => c.id !== id));
        timers.current.delete(id);
      }, duration);
      timers.current.set(id, t);
    }

    return id;
  }, []);

  const updateStatus = useCallback((id: string, patch: Partial<Omit<StatusChip, 'id'>>) => {
    setChips(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c));
    // If duration is being set, restart timer
    if (patch.duration !== undefined && patch.duration > 0) {
      const existing = timers.current.get(id);
      if (existing) clearTimeout(existing);
      const t = setTimeout(() => {
        setChips(prev => prev.filter(c => c.id !== id));
        timers.current.delete(id);
      }, patch.duration);
      timers.current.set(id, t);
    }
  }, []);

  return (
    <StatusContext.Provider value={{ chips, showStatus, hideStatus, updateStatus }}>
      {children}
    </StatusContext.Provider>
  );
}

export function useStatus() {
  return useContext(StatusContext);
}
