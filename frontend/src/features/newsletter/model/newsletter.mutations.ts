import { useMutation } from "@tanstack/react-query";

import { unwrap } from "@shared/lib/action-result";

import { subscribe } from "../api/newsletter.actions";

export function useSubscribe() {
  return useMutation({
    mutationFn: async (input: Parameters<typeof subscribe>[0]) => unwrap(await subscribe(input)),
  });
}
