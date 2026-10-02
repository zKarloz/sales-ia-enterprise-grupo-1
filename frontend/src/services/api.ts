const API_URL = "http://localhost:8000";

interface RequestOptions extends RequestInit {
  token?: string;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const { token, ...fetchOptions } = options;

  const headers = new Headers(fetchOptions.headers);

  headers.set("Content-Type", "application/json");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    let message = "Ocurrió un error en la solicitud.";

    try {
      const errorData = await response.json();

      if (errorData.message) {
        message = errorData.message;
      }

      if (errorData.detail) {
        message = errorData.detail;
      }
    } catch {
      // La respuesta puede no contener JSON.
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export { API_URL };