import { Button } from "@/components/ui/button";
import { scrollToSection } from "@/lib/utils";

const HOME_SECTIONS: Array<{ id: string; label: string }> = [
  { id: "mission", label: "Mission" },
  { id: "crisis", label: "Crisis" },
  { id: "heatmap", label: "Map" },
];

export function Header({ pathname }: { pathname: string }) {
  const onHome = pathname === "/";

  return (
    <header className="sticky top-0 z-50 border-b-2 border-patriot-red bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <a
          href="/"
          className="flex items-center gap-3 transition-opacity hover:opacity-80"
          aria-label="Home"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-patriot-red">
            <span className="text-sm font-bold text-white">DP</span>
          </div>
          <h1 className="text-lg font-bold text-charcoal sm:text-xl">
            Depopulate the FAIR Plan
          </h1>
        </a>
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
              <a
                key={item.id}
                href={`/#${item.id}`}
                className="text-sm font-medium text-gray-600 transition-colors hover:text-patriot-red"
              >
                {item.label}
              </a>
            ),
          )}
          <Button
            size="sm"
            onClick={() => {
              if (onHome) scrollToSection("signup");
              else window.location.href = "/#signup";
            }}
          >
            Get Updates
          </Button>
        </nav>
      </div>
    </header>
  );
}
