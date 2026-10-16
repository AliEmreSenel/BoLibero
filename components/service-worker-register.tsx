"use client";

import { useEffect } from "react";

let reloadedForController = false;

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (
      process.env.NODE_ENV === "production" &&
      "serviceWorker" in navigator
    ) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Offline support is progressive enhancement; ignore registration
        // failures (e.g. private mode).
      });
      // A mid-session takeover swaps in a new SW whose caches reference the
      // new build; reload once so chunks and RSC payloads match it.
      navigator.serviceWorker.addEventListener(
        "controllerchange",
        () => {
          if (reloadedForController) return;
          reloadedForController = true;
          location.reload();
        },
        { once: true }
      );
    }
  }, []);

  return null;
}
