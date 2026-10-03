"use client";

import { useEffect, useState } from "react";

/** Значение, которое обновляется через `delay` мс после последнего изменения: запрос не на каждый символ. */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
