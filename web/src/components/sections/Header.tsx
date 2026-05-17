import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { scrollToSection } from "@/lib/utils";

// In-page section anchors on the home route. From /data these become links
// back to "/#<id>" — Home.tsx handles the hash and scrolls on mount.
const HOME_SECTIONS: Array<{ id: string; label: string }> = [
  { id: "mission", label: "Mission" },
  { id: "crisis", label: "Crisis" },
  { id: "heatmap", label: "Map" },
];

const GITHUB_URL = "https://github.com/rkacker/depopulate-fair-plan";

export function Header() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const onHome = pathname === "/";

  return (
    <header className="sticky top-0 z-50 border-b-2 border-patriot-red bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="flex items-center gap-3 transition-opacity hover:opacity-80"
          aria-label="Home"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-patriot-red">
            <span className="text-sm font-bold text-white">DP</span>
          </div>
          <h1 className="text-lg font-bold text-charcoal sm:text-xl">
            Depopulate the FAIR Plan
          </h1>
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          {HOME_SECTIONS.map((item) =>
            onHome ? (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className="text-sm font-medium text-gray-600 transition-colors hover:text-patriot-red"
              >
                {item.label}
              </button>
            ) : (
              <Link
                key={item.id}
                to={`/#${item.id}`}
                className="text-sm font-medium text-gray-600 transition-colors hover:text-patriot-red"
              >
                {item.label}
              </Link>
            ),
          )}
          <Link
            to="/data"
            className="text-sm font-medium text-gray-600 transition-colors hover:text-patriot-red"
          >
            Data
          </Link>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-gray-600 transition-colors hover:text-patriot-red"
          >
            GitHub
          </a>
          <Button
            size="sm"
            onClick={() => {
              if (onHome) scrollToSection("signup");
              else navigate("/#signup");
            }}
          >
            Get Updates
          </Button>
        </nav>
      </div>
    </header>
  );
}
