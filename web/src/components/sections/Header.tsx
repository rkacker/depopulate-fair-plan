
const HOME_SECTIONS: Array<{ id: string; label: string }> = [
  { id: "why", label: "Why it matters" },
  { id: "where", label: "The impact" },
  { id: "regulation", label: "Who is responsible" },
  { id: "lara-era", label: "2019-2026" },
  { id: "kim-era", label: "2027 onward" },
];

export function Header({ pathname }: { pathname: string }) {
  const onHome = pathname === "/";

  return (
    <header className="sticky top-0 z-50 border-b-2 border-patriot-red bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3 sm:px-6 lg:px-8">
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
        <nav
          aria-label="Sections"
          className="-mx-1 flex w-full items-center gap-5 overflow-x-auto whitespace-nowrap px-1 pb-1 lg:mx-0 lg:w-auto lg:overflow-visible lg:px-0 lg:pb-0"
        >
          {HOME_SECTIONS.map((item) => (
            // Plain links, so each section has its own address (/#lara-era)
            // that can be bookmarked, shared, and opened from other pages.
            <a
              key={item.id}
              href={onHome ? `#${item.id}` : `/#${item.id}`}
              className="text-sm font-medium text-gray-600 transition-colors hover:text-patriot-red"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
