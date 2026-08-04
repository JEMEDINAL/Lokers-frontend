import { apiFetch } from './client';


export interface JwtClaims {
  sub: number;
  username: string;
  role: string;
  iat: number;
  exp: number;
}


interface RawLoginResponse {
  access_token?: string;
  accessToken?: string;
}

export interface LoginResponse {
  token: string;
}

export function login(username: string, password: string): Promise<LoginResponse> {
  return apiFetch<RawLoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  }).then((raw) => {
    const token = raw.access_token ?? raw.accessToken;
    if (!token) {
      throw new Error('El backend no devolvió un token en la respuesta de login.');
    }
    return { token };
  });
}


export function register(username: string, password: string): Promise<LoginResponse | { token: null }> {
  return apiFetch<RawLoginResponse>('/auth/register-user', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  }).then((raw) => {
    const token = raw.access_token ?? raw.accessToken;
    return token ? { token } : { token: null };
  });
}


export function decodeJwt(token: string): JwtClaims | null {
  try {
    const payload = token.split('.')[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join(''),
    );
    return JSON.parse(json) as JwtClaims;
  } catch {
    return null;
  }
}
