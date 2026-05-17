import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";

export function NotFound() {
  return (
    <section className="bg-gray-50 py-20">
      <div className="mx-auto max-w-xl px-4 sm:px-6 lg:px-8">
        <Card className="border-0 p-8 text-center lg:p-12">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-patriot-red">
            404 — Page not found
          </p>
          <h1 className="mb-4 text-2xl font-bold text-charcoal">
            We couldn't find that page.
          </h1>
          <p className="mb-6 text-sm text-gray-600">
            The link may be out of date. Try the home page or the data
            downloads.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/"
              className="rounded-md bg-patriot-red px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700"
            >
              Back to home
            </Link>
            <Link
              to="/data"
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-charcoal shadow-sm transition-colors hover:border-patriot-red hover:text-patriot-red"
            >
              Data &amp; Downloads
            </Link>
          </div>
        </Card>
      </div>
    </section>
  );
}
