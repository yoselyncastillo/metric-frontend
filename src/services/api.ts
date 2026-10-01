export async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('metric_token') : null;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const headers = new Headers(options?.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('metric_token');
      window.location.href = '/login';
    }
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    let errorMessage = 'Error en la petición al servidor';
    
    if (errorData) {
      if (typeof errorData.message === 'string') {
        errorMessage = errorData.message;
      } else if (Array.isArray(errorData.message)) {
        errorMessage = errorData.message.join(', ');
      } else if (errorData.error) {
        errorMessage = errorData.error;
      }
    }
    
    throw new Error(errorMessage);
  }

  const text = await response.text();
  if (!text) {
    return {} as T;
  }
  
  try {
    return JSON.parse(text);
  } catch (e) {
    return text as unknown as T;
  }
}
