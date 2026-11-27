import { useCallback, useEffect, useRef, useState } from "react";
import { initialState, registrationReducer, type Action, type State, type WalkthroughView } from "./registration-model";

const historyKey = "alumniUniversityWalkthrough";

type Entry = {
  run: string;
  order: number;
  depth: number;
  view: WalkthroughView;
};

function getView({ stage, step, editing, section, setting, reviewOnOpen }: State): WalkthroughView {
  return { stage, step, editing, section, setting, reviewOnOpen };
}

function isSameView(a: WalkthroughView, b: WalkthroughView) {
  return a.stage === b.stage && a.step === b.step && a.editing === b.editing &&
    a.section === b.section && a.setting === b.setting && a.reviewOnOpen === b.reviewOnOpen;
}

function readEntry(historyState: { [historyKey]?: Entry } | null): Entry | undefined {
  return historyState?.[historyKey];
}

function beginRun(state: State): Entry {
  const entry = {
    run: crypto.randomUUID(),
    order: readEntry(window.history.state)?.order ?? 0,
    depth: 0,
    view: getView(state),
  };
  // Keep the router metadata on this entry. Only the current document is updated.
  window.history.replaceState({ ...window.history.state, [historyKey]: entry }, "");
  return entry;
}

export default function useWalkthroughHistory() {
  const current = useRef(initialState);
  const entry = useRef<Entry | null>(null);
  const [snapshot, render] = useState({ state: initialState, canGoBack: false });

  const commit = useCallback((state: State, depth: number) => {
    current.current = state;
    render({ state, canGoBack: depth > 0 });
  }, []);

  useEffect(() => {
    const path = window.location.pathname;
    entry.current = beginRun(current.current);

    function restore(event: PopStateEvent) {
      const active = entry.current;
      const next = readEntry(event.state);
      if (window.location.pathname !== path || !active || !next) return;

      if (next.run !== active.run) {
        // Refresh and Restart start a clean demo. Skip old entries without restoring their screens.
        window.history.go(next.order < active.order ? -1 : 1);
        return;
      }

      entry.current = next;
      commit({ ...current.current, ...next.view }, next.depth);
    }

    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, [commit]);

  const dispatch = useCallback((action: Action) => {
    const previous = current.current;
    const next = registrationReducer(previous, action);
    if (previous === next) return;

    const active = entry.current ?? beginRun(previous);
    if (action.type === "restart") {
      entry.current = beginRun(next);
    } else if (!isSameView(active.view, next)) {
      const newEntry = {
        ...active,
        order: (readEntry(window.history.state)?.order ?? active.order) + 1,
        depth: active.depth + 1,
        view: getView(next),
      };
      window.history.pushState({ ...window.history.state, [historyKey]: newEntry }, "");
      entry.current = newEntry;
    } else {
      entry.current = active;
    }
    commit(next, entry.current.depth);
  }, [commit]);

  const back = useCallback(() => {
    if (entry.current && entry.current.depth > 0) window.history.back();
  }, []);

  return { ...snapshot, dispatch, back };
}
