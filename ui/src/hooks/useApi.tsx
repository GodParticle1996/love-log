import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const API_BASE = '/api';

interface ApiOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
  formData?: FormData;
}

function useApiState() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('lovelog_token'));
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const headers = useCallback((): Record<string, string> => {
    const h: Record<string, string> = {};
    if (token) h['Authorization'] = `Bearer ${token}`;
    return h;
  }, [token]);

  const api = useCallback(async <T = any,>(path: string, options: ApiOptions = {}): Promise<T> => {
    const { method = 'GET', body, formData } = options;

    const fetchOptions: RequestInit = {
      method,
      headers: formData ? { Authorization: headers().Authorization } : { ...headers(), 'Content-Type': 'application/json' },
    };

    if (formData) {
      fetchOptions.body = formData;
    } else if (body && method !== 'GET') {
      fetchOptions.body = JSON.stringify(body);
    }

    const res = await fetch(`${API_BASE}${path}`, fetchOptions);
    const data = await res.json();

    if (!res.ok) {
      if (res.status === 401) {
        localStorage.removeItem('lovelog_token');
        setToken(null);
        setUser(null);
      }
      throw new Error(data.error || 'Request failed');
    }

    return data;
  }, [headers]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await api<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    localStorage.setItem('lovelog_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  }, [api]);

  const register = useCallback(async (email: string, password: string, name: string, partnerName: string) => {
    const data = await api<{ token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: { email, password, name, partnerName },
    });
    localStorage.setItem('lovelog_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  }, [api]);

  const logout = useCallback(() => {
    localStorage.removeItem('lovelog_token');
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    if (token) {
      api('/auth/me')
        .then((d: any) => setUser(d.user))
        .catch(() => { logout(); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token, api, logout]);

  return { api, token, user, loading, login, register, logout };
}

type ApiContextValue = ReturnType<typeof useApiState>;

const ApiContext = createContext<ApiContextValue | null>(null);

export function ApiProvider({ children }: { children: React.ReactNode }) {
  const value = useApiState();
  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
}

/**
 * Shared auth/API state. Must be used within <ApiProvider> — every component
 * sees the same token/user, and /auth/me is fetched once instead of per mount.
 */
export function useApi(): ApiContextValue {
  const ctx = useContext(ApiContext);
  if (!ctx) throw new Error('useApi must be used within <ApiProvider>');
  return ctx;
}
