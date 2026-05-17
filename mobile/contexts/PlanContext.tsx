import React, { createContext, useContext, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PlanContextValue {
  planId: string | null;
  setPlanId: (id: string | null) => void;
}

const PlanContext = createContext<PlanContextValue>({
  planId: null,
  setPlanId: () => {},
});

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const [planId, setPlanIdState] = useState<string | null>(null);

  const setPlanId = useCallback((id: string | null) => {
    setPlanIdState(id);
    if (id) {
      AsyncStorage.setItem('@cityira_last_plan_id', id).catch(() => {});
    }
  }, []);

  return (
    <PlanContext.Provider value={{ planId, setPlanId }}>
      {children}
    </PlanContext.Provider>
  );
}

export function usePlanContext() {
  return useContext(PlanContext);
}
