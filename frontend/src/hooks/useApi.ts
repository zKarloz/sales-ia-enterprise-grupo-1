import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  apiRequest,
} from "../services/api";


interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}


export function useApi<T>(
  endpoint: string,
  options?: RequestInit,
  enabled = true,
) {
  const [
    state,
    setState,
  ] = useState<UseApiState<T>>({
    data: null,
    loading: enabled,
    error: null,
  });


  const execute =
    useCallback(async () => {
      if (!enabled) {
        setState({
          data: null,
          loading: false,
          error: null,
        });

        return null;
      }

      setState((current) => ({
        ...current,
        loading: true,
        error: null,
      }));

      try {
        const data =
          await apiRequest<T>(
            endpoint,
            options,
          );

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
    }, [
      enabled,
      endpoint,
      options,
    ]);


  useEffect(() => {
    if (!enabled) {
      setState({
        data: null,
        loading: false,
        error: null,
      });

      return;
    }

    execute().catch(() => {
      // El error ya fue almacenado
      // en el estado.
    });
  }, [
    enabled,
    execute,
  ]);


  return {
    ...state,
    refetch: execute,
  };
}