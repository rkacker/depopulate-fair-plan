import { scrollToSection } from "@/lib/utils";

const HOME_SECTIONS: Array<{ id: string; label: string }> = [
  { id: "why", label: "Why it matters" },
  { id: "where", label: "By county" },
  { id: "zip", label: "Your ZIP code" },
  { id: "regulation", label: "Who is responsible" },
  { id: "lara-era", label: "The last 8 years" },
  { id: "kim-era", label: "The next 4 years" },
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
          <span className="text-lg font-bold text-charcoal sm:text-xl">
            Depopulate the FAIR Plan
          </span>
        </a>
        <nav className="hidden items-center gap-5 lg:flex">
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
        </nav>
        <a
          href="/take-action"
          aria-current={pathname.startsWith("/take-action") ? "page" : undefined}
          className="rounded-md bg-patriot-red px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-patriot-red-dark"
          >
          Take action
        </a>
      </div>
    </header>
  );
}
