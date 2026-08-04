import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { login as loginRequest, register as registerRequest, decodeJwt, type JwtClaims } from '../api/auth';

const STORAGE_KEY = 'locker_auth_token';

interface AuthContextValue {
  token: string | null;
  claims: JwtClaims | null;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function isExpired(claims: JwtClaims | null): boolean {
  if (!claims) return true;
  return claims.exp * 1000 <= Date.now();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [claims, setClaims] = useState<JwtClaims | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const decoded = decodeJwt(stored);
      if (decoded && !isExpired(decoded)) {
        setToken(stored);
        setClaims(decoded);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  async function login(username: string, password: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await loginRequest(username, password);
      const decoded = decodeJwt(res.token);
      if (!decoded) {
        throw new Error('El token recibido no es un JWT válido.');
      }
      setToken(res.token);
      setClaims(decoded);
      localStorage.setItem(STORAGE_KEY, res.token);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo iniciar sesión';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function register(username: string, password: string): Promise<boolean> {
    setLoading(true);
    setError(null);
    try {
      const res = await registerRequest(username, password);
      if (!res.token) {
        return false;
      }
      const decoded = decodeJwt(res.token);
      if (!decoded) {
        throw new Error('El token recibido no es un JWT válido.');
      }
      setToken(res.token);
      setClaims(decoded);
      localStorage.setItem(STORAGE_KEY, res.token);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo completar el registro';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    setToken(null);
    setClaims(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      claims,
      isAdmin: Boolean(token && claims?.role === 'admin' && !isExpired(claims)),
      loading,
      error,
      login,
      register,
      logout,
    }),
    [token, claims, loading, error],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
