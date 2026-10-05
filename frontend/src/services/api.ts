const API_URL =
  import.meta.env.VITE_API_URL ??
  "http://localhost:8000";

const TOKEN_KEY = "salesia_access_token";


interface RequestOptions extends RequestInit {
  token?: string;
}


// Guarda el token durante la sesión del navegador.
export function setAccessToken(token: string) {
  sessionStorage.setItem(TOKEN_KEY, token);
}


// Obtiene el token autenticado actual.
export function getAccessToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}


// Elimina la sesión local.
export function clearAccessToken() {
  sessionStorage.removeItem(TOKEN_KEY);
}


export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const headers = new Headers(options.headers);

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  // Usa token explícito o el almacenado en sesión.
  const token =
    options.token ?? getAccessToken();

  if (token) {
    headers.set(
      "Authorization",
      `Bearer ${token}`,
    );
  }

  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      ...options,
      headers,
    },
  );

  if (response.status === 204) {
    return undefined as T;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      typeof data?.detail === "string"
        ? data.detail
        : typeof data?.message === "string"
          ? data.message
          : "Ocurrió un error al comunicarse con la API.";

    throw new Error(message);
  }

  return data as T;
}