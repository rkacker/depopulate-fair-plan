const GITHUB_URL = "https://github.com/rkacker/depopulate-fair-plan";

export function Footer() {
  return (
    <footer className="bg-charcoal py-12 text-white">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <h3 className="mb-3 text-2xl font-bold">Depopulate the FAIR Plan</h3>
        <p className="mb-1 text-sm text-gray-300">
          A non-profit initiative dedicated to data-driven research,
          transparency, and public education on California's insurance crisis.
        </p>
        <p className="mb-6 text-xs text-gray-500">501(c)(3) status pending</p>
        <a
          href="mailto:info@depopulatefairplan.com"
          className="text-sm text-golden-yellow transition-colors hover:text-golden-yellow-soft"
        >
          info@depopulatefairplan.com
        </a>
        <nav
          aria-label="Site links"
          className="mt-6 flex items-center justify-center gap-4 text-sm"
        >
          <a
            href="/analysis"
            className="text-golden-yellow transition-colors hover:text-golden-yellow-soft"
          >
            Analysis
          </a>
          <span aria-hidden className="text-gray-600">·</span>
          <a
            href="/data"
            className="text-golden-yellow transition-colors hover:text-golden-yellow-soft"
          >
            Data &amp; Downloads
          </a>
          <span aria-hidden className="text-gray-600">·</span>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-golden-yellow transition-colors hover:text-golden-yellow-soft"
          >
            GitHub
          </a>
        </nav>
        <p className="mt-6 text-xs text-gray-500">
          © {new Date().getFullYear()} Depopulate the FAIR Plan. All rights
          reserved.
        </p>
      </div>
    </footer>
  );
}
