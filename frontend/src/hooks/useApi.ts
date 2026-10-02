import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "../services/api";

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useApi<T>(
  endpoint: string,
  options?: RequestInit,
) {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const execute = useCallback(async () => {
    setState((current) => ({
      ...current,
      loading: true,
      error: null,
    }));

    try {
      const data = await apiRequest<T>(endpoint, options);

      setState({
        data,
        loading: false,
        error: null,
      });

      return data;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Error desconocido.";

      setState({
        data: null,
        loading: false,
        error: message,
      });

      throw error;
    }
  }, [endpoint, options]);

  useEffect(() => {
    execute().catch(() => {
      // El error ya fue almacenado en el estado.
    });
  }, [execute]);

  return {
    ...state,
    refetch: execute,
  };
}