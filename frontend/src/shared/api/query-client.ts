import { QueryClient, isServer } from "@tanstack/react-query";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // При SSR не рефетчим сразу после гидратации
        staleTime: 60 * 1000,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

/** На сервере — новый клиент на каждый запрос, в браузере — синглтон. */
export function getQueryClient() {
  if (isServer) return makeQueryClient();
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}
