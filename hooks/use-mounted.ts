"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const onClient = () => true;
const onServer = () => false;

/**
 * False through SSR and the hydrating render, true from then on.
 *
 * For anything whose output depends on the clock or on `matchMedia`, which the
 * server cannot know and so can never agree with. A `useState` + `useEffect`
 * flag does the same job but trips the cascading-render rule; this reads the
 * environment instead of setting state during an effect.
 */
export function useMounted() {
  return useSyncExternalStore(subscribe, onClient, onServer);
}
