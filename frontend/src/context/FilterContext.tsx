import { createContext, useContext, useState, useCallback, useEffect, useMemo, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';

// ============================================================
// Types
// ============================================================
interface FilterState {
  year: number;
  province: string | null;
  infraType: string | null;
  lastUpdated: string;
  setYear: (year: number) => void;
  setProvince: (province: string | null) => void;
  setInfraType: (infraType: string | null) => void;
}

// ============================================================
// Context
// ============================================================
const FilterContext = createContext<FilterState | undefined>(undefined);

// ============================================================
// Provider
// ============================================================
export function FilterProvider({ children }: { children: ReactNode }) {
  const [searchParams, setSearchParams] = useSearchParams();

  const readFromUrl = useCallback(() => {
    const yearParam = searchParams.get('year');
    const provinceParam = searchParams.get('province');
    const typeParam = searchParams.get('type');
    return {
      year: yearParam ? parseInt(yearParam, 10) : 2026,
      province: provinceParam || null,
      infraType: typeParam || null,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [state, setState] = useState<{
    year: number;
    province: string | null;
    infraType: string | null;
    lastUpdated: string;
  }>(() => ({
    ...readFromUrl(),
    lastUpdated: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
  }));

  // Sync state to URL on change
  useEffect(() => {
    const params = new URLSearchParams();
    if (state.year !== 2026) params.set('year', state.year.toString());
    if (state.province) params.set('province', state.province);
    if (state.infraType) params.set('type', state.infraType);
    setSearchParams(params, { replace: true });
  }, [state.year, state.province, state.infraType, setSearchParams]);

  const setYear = useCallback((year: number) => {
    setState((prev) => ({
      ...prev,
      year,
      lastUpdated: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    }));
  }, []);

  const setProvince = useCallback((province: string | null) => {
    setState((prev) => ({
      ...prev,
      province,
      lastUpdated: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    }));
  }, []);

  const setInfraType = useCallback((infraType: string | null) => {
    setState((prev) => ({
      ...prev,
      infraType,
      lastUpdated: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    }));
  }, []);

  const value = useMemo<FilterState>(
    () => ({
      year: state.year,
      province: state.province,
      infraType: state.infraType,
      lastUpdated: state.lastUpdated,
      setYear,
      setProvince,
      setInfraType,
    }),
    [state.year, state.province, state.infraType, state.lastUpdated, setYear, setProvince, setInfraType],
  );

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
}

// ============================================================
// Hook
// ============================================================
export function useFilter(): FilterState {
  const ctx = useContext(FilterContext);
  if (!ctx) {
    throw new Error('useFilter must be used within a FilterProvider');
  }
  return ctx;
}
