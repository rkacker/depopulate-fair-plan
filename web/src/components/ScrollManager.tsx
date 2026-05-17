import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Runs on every URL change:
 * - If the URL has a hash (#mission, #signup, etc.) scroll to that anchor.
 * - Otherwise scroll to the top of the page.
 *
 * Without this, react-router preserves the previous page's scroll position
 * when the user navigates (e.g. clicking "Data" from the bottom of the home
 * page lands at the bottom of /data), and the browser ignores `#anchor`
 * fragments because the SPA never does a real document navigation.
 *
 * Retries a few times because anchor targets may mount asynchronously
 * (loading guards, lazy data fetches, conditional renders).
 */
export function ScrollManager() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0, behavior: "auto" });
      return;
    }
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
  }, [pathname, hash]);

  return null;
}
