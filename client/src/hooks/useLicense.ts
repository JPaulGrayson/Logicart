import { useState, useEffect, useCallback, useRef } from 'react';

const STORAGE_KEY = 'voyai_token';
const DEMO_MODE_KEY = 'logigo_demo_mode';
const VOYAI_LOGIN_URL = 'https://voyai.org/login?app=logigo&return_to=';
const DEFAULT_MANAGED_ALLOWANCE = 50;

interface VoyaiTokenPayload {
  userId: string;
  email: string;
  name?: string;
  appId: string;
  tier: string;
  features: {
    history_database?: boolean;
    rabbit_hole_rescue?: boolean;
    github_sync?: boolean;
    managed_allowance?: number;
  };
  iat: number;
  exp: number;
}

interface UsageState {
  currentUsage: number;
  managedAllowance: number;
  remaining: number;
  isLoading: boolean;
}

interface LicenseState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: VoyaiTokenPayload | null;
  token: string | null;
}

function decodeJWT(token: string): VoyaiTokenPayload | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

function isTokenExpired(payload: VoyaiTokenPayload): boolean {
  return payload.exp * 1000 < Date.now();
}

const DEMO_USER: VoyaiTokenPayload = {
  userId: 'demo-user-123',
  email: 'demo@logigo.dev',
  name: 'Demo User',
  appId: 'logigo',
  tier: 'founder',
  features: {
    history_database: true,
    rabbit_hole_rescue: true,
    github_sync: true,
    managed_allowance: 100,
  },
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 86400 * 365,
};

export function useLicense() {
  const [state, setState] = useState<LicenseState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    token: null,
  });
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    const demoMode = localStorage.getItem(DEMO_MODE_KEY) === 'true';
    if (demoMode) {
      console.log('[Demo] Restored demo mode session');
      setIsDemoMode(true);
      setState({
        isAuthenticated: true,
        isLoading: false,
        user: DEMO_USER,
        token: 'demo-token',
      });
      return;
    }

    const storedToken = localStorage.getItem(STORAGE_KEY);
    if (storedToken) {
      const payload = decodeJWT(storedToken);
      if (payload && !isTokenExpired(payload) && (payload.appId === 'logigo' || payload.email)) {
        console.log('[Voyai] Restored session for:', payload.email);
        setState({
          isAuthenticated: true,
          isLoading: false,
          user: payload,
          token: storedToken,
        });
      } else {
        console.log('[Voyai] Clearing invalid stored token');
        localStorage.removeItem(STORAGE_KEY);
        setState({
          isAuthenticated: false,
          isLoading: false,
          user: null,
          token: null,
        });
      }
    } else {
      setState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        token: null,
      });
    }
  }, []);

  const setToken = useCallback((token: string) => {
    const payload = decodeJWT(token);
    console.log('[Voyai] Token payload:', payload);
    if (payload && !isTokenExpired(payload)) {
      // Accept token if appId is 'logigo' or if it's a valid Voyai token
      if (payload.appId === 'logigo' || payload.email) {
        localStorage.setItem(STORAGE_KEY, token);
        setState({
          isAuthenticated: true,
          isLoading: false,
          user: payload,
          token,
        });
        console.log('[Voyai] Token accepted, user:', payload.email);
        return true;
      }
      console.log('[Voyai] Token rejected: appId mismatch', payload.appId);
    } else if (payload) {
      console.log('[Voyai] Token expired');
    } else {
      console.log('[Voyai] Failed to decode token');
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(DEMO_MODE_KEY);
    setIsDemoMode(false);
    setState({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      token: null,
    });
  }, []);

  const login = useCallback(() => {
    const currentUrl = window.location.href;
    window.location.href = VOYAI_LOGIN_URL + encodeURIComponent(currentUrl);
  }, []);

  const toggleDemoMode = useCallback(() => {
    if (isDemoMode) {
      localStorage.removeItem(DEMO_MODE_KEY);
      setIsDemoMode(false);
      const storedToken = localStorage.getItem(STORAGE_KEY);
      if (storedToken) {
        const payload = decodeJWT(storedToken);
        if (payload && !isTokenExpired(payload)) {
          setState({
            isAuthenticated: true,
            isLoading: false,
            user: payload,
            token: storedToken,
          });
          console.log('[Demo] Demo mode disabled, restored session for:', payload.email);
          return;
        }
      }
      setState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        token: null,
      });
      console.log('[Demo] Demo mode disabled');
    } else {
      localStorage.setItem(DEMO_MODE_KEY, 'true');
      setIsDemoMode(true);
      setState({
        isAuthenticated: true,
        isLoading: false,
        user: DEMO_USER,
        token: 'demo-token',
      });
      console.log('[Demo] Demo mode enabled');
    }
  }, [isDemoMode]);

  const hasFeature = useCallback(
    (feature: 'history_database' | 'rabbit_hole_rescue' | 'github_sync'): boolean => {
      return state.user?.features?.[feature] ?? false;
    },
    [state.user]
  );

  const isFounder = useCallback((): boolean => {
    return state.user?.tier === 'founder';
  }, [state.user]);

  const hasHistory = state.user?.features?.history_database ?? false;
  const hasRescue = state.user?.features?.rabbit_hole_rescue ?? false;
  const hasGitSync = state.user?.features?.github_sync ?? false;
  const hasManagedAI = state.user?.features?.managed_allowance !== undefined && state.user.features.managed_allowance > 0;
  const managedAllowance = state.user?.features?.managed_allowance ?? 0;

  return {
    ...state,
    setToken,
    logout,
    login,
    hasFeature,
    isFounder,
    hasHistory,
    hasRescue,
    hasGitSync,
    hasManagedAI,
    managedAllowance,
    isDemoMode,
    toggleDemoMode,
  };
}

export function useTokenFromUrl() {
  const { setToken } = useLicense();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      const success = setToken(token);
      if (success) {
        params.delete('token');
        const newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
        window.history.replaceState({}, '', newUrl);
      }
    }
  }, [setToken]);
}

export function useUsage(token: string | null, isAuthenticated: boolean, hasManagedAI: boolean, isDemoMode: boolean = false) {
  const [usage, setUsage] = useState<UsageState>({
    currentUsage: 0,
    managedAllowance: 0,
    remaining: 0,
    isLoading: true,
  });
  const prevDemoMode = useRef(isDemoMode);

  useEffect(() => {
    if (prevDemoMode.current && !isDemoMode) {
      setUsage({
        currentUsage: 0,
        managedAllowance: 0,
        remaining: 0,
        isLoading: true,
      });
    }
    prevDemoMode.current = isDemoMode;
  }, [isDemoMode]);

  const fetchUsage = useCallback(async () => {
    if (isDemoMode && hasManagedAI) {
      setUsage({
        currentUsage: 23,
        managedAllowance: 100,
        remaining: 77,
        isLoading: false,
      });
      return;
    }

    if (!token || !isAuthenticated || !hasManagedAI) {
      setUsage(prev => ({ ...prev, isLoading: false, managedAllowance: 0 }));
      return;
    }

    try {
      const response = await fetch('/api/ai/usage', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsage({
          currentUsage: data.currentUsage,
          managedAllowance: data.managedAllowance,
          remaining: data.remaining,
          isLoading: false,
        });
      } else {
        setUsage(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error('[Usage] Failed to fetch usage:', error);
      setUsage(prev => ({ ...prev, isLoading: false }));
    }
  }, [token, isAuthenticated, hasManagedAI, isDemoMode]);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  return { ...usage, refetch: fetchUsage };
}
