import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { sdk } from "../../lib/sdk";

/** Поставщик для страницы импорта: настройки обмена хранятся в `exchange`, наценка — в `markup`. */
export type ExchangeSupplier = {
  id: string;
  name: string;
  is_active: boolean;
  exchange: Record<string, unknown>;
  markup: Record<string, unknown>;
};

export type ImportRunStatus = "receiving" | "queued" | "running" | "done" | "failed";

export type ImportRun = {
  id: string;
  supplier_id: string;
  supplier_name: string | null;
  source: "push" | "pull" | "manual";
  status: ImportRunStatus;
  files: string[];
  only_changes: boolean;
  current_file: string | null;
  cursor: number;
  stats: Record<string, Record<string, number>>;
  errors?: { external_id: string | null; message: string }[];
  message: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
};

export type ExchangeGroup = {
  id: string;
  external_id: string;
  parent_external_id: string | null;
  name: string;
  category_id: string | null;
  category_name: string | null;
};

export type ExchangeProperty = {
  id: string;
  external_id: string;
  name: string;
  values: Record<string, string>;
  attribute_id: string | null;
  attribute_name: string | null;
};

export type ExchangeReview = {
  products: {
    external_id: string;
    product_id: string | null;
    title: string;
    status: string | null;
    problems: string[];
  }[];
  count: number;
  unmapped_groups: number;
};

/** Запуск ещё идёт — список и карточку обновляем, пока не закончится. */
export const isActiveRun = (run: Pick<ImportRun, "status">) =>
  run.status === "receiving" || run.status === "queued" || run.status === "running";

const POLL_MS = 3000;
const KEY = ["admin-exchange"] as const;

export function useExchangeSuppliers() {
  return useQuery({
    queryKey: [...KEY, "suppliers"],
    queryFn: () =>
      sdk.client.fetch<{ suppliers: ExchangeSupplier[] }>("/admin/suppliers", {
        query: { limit: 100 },
      }),
    select: (data) => data.suppliers,
  });
}

export function useImportRuns(params: { supplier_id: string | null; limit: number; offset: number }) {
  return useQuery({
    queryKey: [...KEY, "runs", params],
    queryFn: () =>
      sdk.client.fetch<{ import_runs: ImportRun[]; count: number }>("/admin/import-runs", {
        query: { supplier_id: params.supplier_id ?? undefined, limit: params.limit, offset: params.offset },
      }),
    enabled: Boolean(params.supplier_id),
    placeholderData: (previous) => previous,
    refetchInterval: (query) => (query.state.data?.import_runs.some(isActiveRun) ? POLL_MS : false),
  });
}

export function useImportRun(id: string | null) {
  return useQuery({
    queryKey: [...KEY, "run", id],
    queryFn: () => sdk.client.fetch<{ import_run: ImportRun }>(`/admin/import-runs/${id}`),
    select: (data) => data.import_run,
    enabled: Boolean(id),
    refetchInterval: (query) => (query.state.data && isActiveRun(query.state.data.import_run) ? POLL_MS : false),
  });
}

export function useExchangeGroups(supplierId: string | null) {
  return useQuery({
    queryKey: [...KEY, "groups", supplierId],
    queryFn: () =>
      sdk.client.fetch<{ exchange_groups: ExchangeGroup[] }>(`/admin/suppliers/${supplierId}/exchange-groups`),
    select: (data) => data.exchange_groups,
    enabled: Boolean(supplierId),
  });
}

export function useExchangeProperties(supplierId: string | null) {
  return useQuery({
    queryKey: [...KEY, "properties", supplierId],
    queryFn: () =>
      sdk.client.fetch<{ exchange_properties: ExchangeProperty[] }>(
        `/admin/suppliers/${supplierId}/exchange-properties`,
      ),
    select: (data) => data.exchange_properties,
    enabled: Boolean(supplierId),
  });
}

export function useExchangeReview(params: { supplier_id: string | null; limit: number; offset: number }) {
  return useQuery({
    queryKey: [...KEY, "review", params],
    queryFn: () =>
      sdk.client.fetch<ExchangeReview>(`/admin/suppliers/${params.supplier_id}/exchange-review`, {
        query: { limit: params.limit, offset: params.offset },
      }),
    enabled: Boolean(params.supplier_id),
    placeholderData: (previous) => previous,
  });
}

/** Характеристики магазина — для маппинга свойств. Их десятки — первой сотни хватает. */
export function useAttributeOptions() {
  return useQuery({
    queryKey: [...KEY, "attributes"],
    queryFn: () =>
      sdk.client.fetch<{ attributes: { id: string; name: string }[] }>("/admin/attributes", {
        query: { limit: 100 },
      }),
    select: (data) => data.attributes,
  });
}

function useExchangeMutation<TInput, TResult>(mutationFn: (input: TInput) => Promise<TResult>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

export const useSaveExchangeSettings = () =>
  useExchangeMutation((input: { supplier_id: string; body: Record<string, unknown> }) =>
    sdk.client.fetch(`/admin/suppliers/${input.supplier_id}`, { method: "POST", body: input.body }),
  );

export const usePullSupplier = () =>
  useExchangeMutation((supplierId: string) =>
    sdk.client.fetch<{ import_run: ImportRun }>(`/admin/suppliers/${supplierId}/import-runs`, { method: "POST" }),
  );

export const useRetryImportRun = () =>
  useExchangeMutation((id: string) =>
    sdk.client.fetch<{ import_run: ImportRun }>(`/admin/import-runs/${id}/retry`, { method: "POST" }),
  );

export const useMapExchangeGroup = () =>
  useExchangeMutation((input: { id: string; category_id: string | null }) =>
    sdk.client.fetch(`/admin/exchange-groups/${input.id}`, {
      method: "POST",
      body: { category_id: input.category_id },
    }),
  );

export const useMapExchangeProperty = () =>
  useExchangeMutation((input: { id: string; attribute_id: string | null }) =>
    sdk.client.fetch(`/admin/exchange-properties/${input.id}`, {
      method: "POST",
      body: { attribute_id: input.attribute_id },
    }),
  );
