import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { sdk } from "../../lib/sdk";
import { type CRUDResource, type CRUDRow, isCRUDRow } from "../types";

type Page = { rows: CRUDRow[]; count: number };

/** Запросы раздела: список, создание, изменение, удаление. После изменений список перезапрашивается. */
export function useCRUDApi(resource: CRUDResource) {
  const queryClient = useQueryClient();
  const key = ["admin-crud", resource.path] as const;

  const useList = (params: { q: string; limit: number; offset: number }) =>
    useQuery({
      queryKey: [...key, params],
      queryFn: async (): Promise<Page> => {
        const data = await sdk.client.fetch<Record<string, unknown>>(
          resource.path,
          {
            query: {
              q: params.q || undefined,
              limit: params.limit,
              offset: params.offset,
            },
          },
        );
        const rows = data[resource.response.many];
        return {
          rows: Array.isArray(rows) ? rows.filter(isCRUDRow) : [],
          count: typeof data.count === "number" ? data.count : 0,
        };
      },
      placeholderData: (previous) => previous,
    });

  const useSave = () =>
    useMutation({
      mutationFn: async ({
        id,
        body,
      }: {
        id: string | null;
        body: Record<string, unknown>;
      }) => {
        const data = await sdk.client.fetch<Record<string, unknown>>(
          id ? `${resource.path}/${id}` : resource.path,
          {
            method: "POST",
            body,
          },
        );
        const row = data[resource.response.one];
        if (!isCRUDRow(row)) throw new Error("Сервер вернул запись без id");
        return row;
      },
      onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
    });

  const useDelete = () =>
    useMutation({
      mutationFn: (id: string) =>
        sdk.client.fetch(`${resource.path}/${id}`, { method: "DELETE" }),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
    });

  return { useList, useSave, useDelete };
}
