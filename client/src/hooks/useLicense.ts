import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'voyai_token';
const VOYAI_LOGIN_URL = 'https://voyai.org/login?app=logigo&return_to=';

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
  };
  iat: number;
  exp: number;
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

export function useLicense() {
  const [state, setState] = useState<LicenseState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    token: null,
  });

  useEffect(() => {
    const storedToken = localStorage.getItem(STORAGE_KEY);
    if (storedToken) {
      const payload = decodeJWT(storedToken);
      // Accept token if appId is 'logigo' or if it's a valid Voyai token with email
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

  const hasFeature = useCallback(
    (feature: keyof VoyaiTokenPayload['features']): boolean => {
      return state.user?.features?.[feature] ?? false;
    },
    [state.user]
  );

  const isFounder = useCallback((): boolean => {
    return state.user?.tier === 'founder';
  }, [state.user]);

  return {
    ...state,
    setToken,
    logout,
    login,
    hasFeature,
    isFounder,
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
