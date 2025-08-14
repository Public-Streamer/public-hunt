import { Database } from "@/integrations/supabase/types";
type EventData = Database["public"]["Tables"]["events"]["Row"];

type Listener = () => void;

const state: { event: EventData | null } = { event: null };
const listeners = new Set<Listener>();

export function getSnapshot() {
  return state.event;
}

export function subscribe(l: Listener) {
  listeners.add(l);
  return () => listeners.delete(l);
}

// Helper for shallow array equality (handles undefined/null)
function arrayShallowEqual<T>(a?: T[], b?: T[]) {
  if (a === b) return true;
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (!Object.is(a[i], b[i])) return false;
  }
  return true;
}

/**
 * Patch only changed fields and preserve reference stability
 * so selectors don’t re-render unnecessarily.
 */
export function patchEvent(patch: Partial<EventData>) {
  const prev = state.event;

  if (!prev) {
    state.event = patch as EventData;
  } else {
    let changed = false;
    const next: EventData = { ...prev };

    for (const k of Object.keys(patch) as (keyof EventData)[]) {
      const incoming = patch[k];

      if (k === "media_urls") {
        // add any other arrays here if needed
        // keep old array reference if contents are equal
        if (
          !arrayShallowEqual(prev.media_urls, incoming as string[] | undefined)
        ) {
          (next as any)[k] = incoming;
          changed = true;
        }
      } else {
        if (!Object.is(prev[k], incoming)) {
          (next as any)[k] = incoming;
          changed = true;
        }
      }
    }

    if (!changed) return;
    state.event = next;
  }

  // notify once
  listeners.forEach((l) => l());
}
