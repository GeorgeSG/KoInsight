export const API_URL = `${import.meta.env.VITE_WEB_API_URL ?? ''}/api`;
export const SERVER_URL = `${import.meta.env.VITE_WEB_API_URL ?? ''}`;

export async function fetchFromAPI<T>(
  endpoint: string,
  method: string = 'GET',
  body: Record<string, unknown> | null = null
) {
  let searchParams: string = '';

  if (method === 'GET' && body) {
    let tempSearchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(body)) {
      tempSearchParams.set(key, String(value));
    }

    searchParams = `?${tempSearchParams.toString()}`;
  }

  const response = await fetch(`${API_URL}/${endpoint}${searchParams}`, {
    method,
    body: method !== 'GET' && body ? JSON.stringify(body) : null,
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch data, ${method} ${endpoint}`);
  }
  return response.json() as Promise<T>;
}
