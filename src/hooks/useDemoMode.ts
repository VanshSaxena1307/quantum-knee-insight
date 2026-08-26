import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { listSettings, setSetting } from "@/services/hqmlService";
import type { ResultMode } from "@/types/hqml";

/**
 * Global Real ML / Demo Mode switch. Persisted in system_settings, writable
 * only by Admins (enforced by RLS). Demo mode never rewrites real records — it
 * only decides which mode newly created records carry and which records the
 * console highlights.
 */
export function useDemoMode() {
  const qc = useQueryClient();
  const settings = useQuery({ queryKey: ["settings"], queryFn: listSettings });

  const raw = settings.data?.find((s) => s.key === "demo_mode")?.value?.value;
  const demoMode = raw === true || raw === "true";

  const toggle = useMutation({
    mutationFn: (next: boolean) => setSetting("demo_mode", next),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["settings"] });
    },
  });

  const activeMode: ResultMode = demoMode ? "demo" : "real";

  return { demoMode, activeMode, isLoading: settings.isLoading, toggle };
}

export function useSetting<T>(key: string, fallback: T): T {
  const settings = useQuery({ queryKey: ["settings"], queryFn: listSettings });
  const v = settings.data?.find((s) => s.key === key)?.value?.value;
  return (v === undefined || v === null ? fallback : v) as T;
}
