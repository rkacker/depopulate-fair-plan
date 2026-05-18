import { useEffect } from "react";

/**
 * On page load, if the URL has a hash, scroll to that anchor — retried a few
 * times because anchor targets may mount asynchronously (client islands,
 * loading guards, lazy data fetches). The browser's built-in hash-scroll
 * fires before client islands hydrate and gives up if the element is missing.
 */
export function ScrollManager() {
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;
    const id = hash.slice(1);
    const tryScroll = () => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        return true;
      }
      return false;
    };
    if (tryScroll()) return;
    const timers = [
      setTimeout(tryScroll, 100),
      setTimeout(tryScroll, 400),
      setTimeout(tryScroll, 1000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return null;
}
