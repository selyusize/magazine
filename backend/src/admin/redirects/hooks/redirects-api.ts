import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { adminFetch } from "../../lib/admin-fetch";

export const REDIRECT_CODES = [301, 302, 410] as const;
export type RedirectCode = (typeof REDIRECT_CODES)[number];

export type AdminRedirect = {
  id: string;
  from_path: string;
  to_path: string | null;
  code: RedirectCode;
  entity_type: string | null;
  entity_id: string | null;
  updated_at: string;
};

export type RedirectInput = {
  from_path: string;
  to_path: string | null;
  code: RedirectCode;
};

type RedirectsPage = {
  redirects: AdminRedirect[];
  count: number;
  limit: number;
  offset: number;
};

const REDIRECTS_KEY = ["admin-redirects"] as const;

export function useRedirects(params: {
  q: string;
  limit: number;
  offset: number;
}) {
  return useQuery({
    queryKey: [...REDIRECTS_KEY, params],
    queryFn: () =>
      adminFetch<RedirectsPage>("/admin/redirects", {
        query: {
          q: params.q || undefined,
          limit: params.limit,
          offset: params.offset,
        },
      }),
    placeholderData: (previous) => previous,
  });
}

function useRedirectsMutation<TInput, TResult>(
  mutationFn: (input: TInput) => Promise<TResult>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: REDIRECTS_KEY }),
  });
}

export const useSaveRedirect = () =>
  useRedirectsMutation((body: RedirectInput) =>
    adminFetch<{ redirect: AdminRedirect }>("/admin/redirects", {
      method: "POST",
      body,
    }),
  );

export const useDeleteRedirect = () =>
  useRedirectsMutation((id: string) =>
    adminFetch(`/admin/redirects/${id}`, { method: "DELETE" }),
  );

export const useImportRedirects = () =>
  useRedirectsMutation((csv: string) =>
    adminFetch<{ count: number }>("/admin/redirects/import", {
      method: "POST",
      body: { csv },
    }),
  );
