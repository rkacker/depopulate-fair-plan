export function Signup() {
  return (
    <section id="signup" className="bg-gray-50 py-20 scroll-mt-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border-t-4 border-patriot-red bg-white p-8 shadow-xl lg:p-12">
          <div className="mb-8 text-center">
            <h2 className="mb-3 text-3xl font-bold text-charcoal">
              Stay Informed
            </h2>
            <p className="mx-auto max-w-xl text-gray-600">
              Join a growing community of Californians who want to understand
              and address the insurance crisis. Get updates on data, policy
              developments, and ways to get involved.
            </p>
          </div>

          <div className="mx-auto max-w-xl">
            <iframe
              src="https://docs.google.com/forms/d/e/1FAIpQLScX_qIs9YL8ww_G8CKPEqJZeEEnrLAcqLZB62ssH1hlQHjDJQ/viewform?embedded=true"
              width={640}
              height={395}
              className="mx-auto block w-full max-w-[640px] rounded-lg border-0"
              title="Subscribe to Depopulate the FAIR Plan updates"
            >
              Loading…
            </iframe>
            <p className="mt-4 text-center text-xs text-gray-400">
              We respect your privacy and will never share your information.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
