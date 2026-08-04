const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

interface ApiOptions extends RequestInit {
  token?: string | null;
}

export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { token, headers, ...rest } = options;

  const finalHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((headers as Record<string, string>) ?? {}),
  };
  if (token) {
    finalHeaders.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, { ...rest, headers: finalHeaders });
  } catch {
    throw new ApiError('No se pudo contactar al servidor. Verifica que el backend esté corriendo.', 0);
  }

  const rawText = await res.text();
  let data: unknown = null;
  if (rawText) {
    try {
      data = JSON.parse(rawText);
    } catch {
      data = rawText;
    }
  }

  if (!res.ok) {
    const parsed = data as { message?: string | string[]; error?: string } | null;
    const message = parsed?.message ?? parsed?.error ?? `Error ${res.status}`;
    throw new ApiError(Array.isArray(message) ? message.join(', ') : String(message), res.status);
  }

  return data as T;
}
