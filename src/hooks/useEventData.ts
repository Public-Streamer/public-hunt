// useEventSelector.ts
// Correct: use the *with-selector* variant
import { useSyncExternalStoreWithSelector } from "use-sync-external-store/shim/with-selector";
import { subscribe, getSnapshot } from "@/lib/eventStore";

// Generic shallow-equal for POJOs
export function shallowEqual(a: any, b: any) {
  if (Object.is(a, b)) return true;
  if (!a || !b) return false;
  const ka = Object.keys(a),
    kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  for (const k of ka) if (!Object.is(a[k], b[k])) return false;
  return true;
}

/**
 * Subscribe to a *slice* of the external store.
 * Only re-renders when the selected slice changes per `equal`.
 */
export function useEventSelector<T>(
  selector: (event: any) => T,
  equal: (a: T, b: T) => boolean = Object.is
) {
  return useSyncExternalStoreWithSelector(
    subscribe, // how to subscribe
    getSnapshot, // get client snapshot
    getSnapshot, // get server snapshot (same here)
    selector, // derive the slice
    equal // equality to suppress re-renders
  );
}
