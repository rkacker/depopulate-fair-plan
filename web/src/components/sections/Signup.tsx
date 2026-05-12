import { useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Replace this placeholder with the /exec URL from your deployed Google Apps Script.
// See web/docs/apps-script.md for the full deploy guide.
const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbweo_ENLybalis8rhv5A3pTYUkpzinZXkcwtRB668uw4mVQrnnQolnp0i8aVpQU47xwhg/exec";

type FormState = "idle" | "submitting" | "success" | "error";

export function Signup() {
  const [formState, setFormState] = useState<FormState>("idle");
  const [submittedEmail, setSubmittedEmail] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormState("submitting");

    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const name = (form.elements.namedItem("name") as HTMLInputElement).value;
    const zips = (form.elements.namedItem("zips") as HTMLInputElement).value;

    setSubmittedEmail(email);

    try {
      // Google Apps Script web apps don't return permissive CORS headers for
      // normal fetch requests. Using mode: "no-cors" is the standard workaround:
      // the request goes through, but the response is opaque — we cannot read
      // res.ok, res.status, or the body. We therefore treat any non-thrown fetch
      // as a success. A thrown error (e.g. network offline) is caught below.
      await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ email, name, zips }).toString(),
      });
      setFormState("success");
    } catch {
      setFormState("error");
    }
  }

  const inputClass = cn(
    "w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-charcoal",
    "placeholder:text-gray-400",
    "focus:outline-none focus:ring-2 focus:ring-patriot-red/40 focus:border-patriot-red",
    "transition-colors",
  );

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
            {formState === "success" ? (
              <div
                role="status"
                className="flex flex-col items-center gap-4 rounded-xl border border-green-200 bg-green-50 px-6 py-10 text-center"
              >
                <CheckCircle2 className="h-10 w-10 text-green-600" />
                <div>
                  <p className="text-lg font-semibold text-green-800">
                    Thanks — you're subscribed.
                  </p>
                  <p className="mt-1 text-sm text-green-700">
                    We'll send updates to{" "}
                    <span className="font-medium">{submittedEmail}</span>.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setFormState("idle");
                    setSubmittedEmail("");
                  }}
                  className="mt-2 text-sm text-green-700 underline underline-offset-2 hover:text-green-900"
                >
                  Submit another
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                {formState === "error" && (
                  <div
                    role="alert"
                    className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                      Something went wrong. Please try again or email{" "}
                      <a
                        href="mailto:info@depopulatefairplan.com"
                        className="underline underline-offset-2"
                      >
                        info@depopulatefairplan.com
                      </a>
                      .
                    </span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label
                    htmlFor="signup-email"
                    className="block text-sm font-medium text-charcoal"
                  >
                    Email address{" "}
                    <span className="text-patriot-red" aria-hidden="true">
                      *
                    </span>
                  </label>
                  <input
                    id="signup-email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                    className={inputClass}
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="signup-name"
                    className="block text-sm font-medium text-charcoal"
                  >
                    Name{" "}
                    <span className="text-gray-400 text-xs font-normal">
                      (optional)
                    </span>
                  </label>
                  <input
                    id="signup-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    placeholder="Jane Smith"
                    className={inputClass}
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="signup-zips"
                    className="block text-sm font-medium text-charcoal"
                  >
                    ZIP code(s) you care about{" "}
                    <span className="text-gray-400 text-xs font-normal">
                      (optional)
                    </span>
                  </label>
                  <input
                    id="signup-zips"
                    name="zips"
                    type="text"
                    placeholder="90210, 94102, 95814"
                    className={inputClass}
                  />
                  <p className="text-xs text-gray-400">
                    Comma-separated if more than one.
                  </p>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={formState === "submitting"}
                  className="w-full"
                >
                  {formState === "submitting" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Subscribing…
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4" />
                      Subscribe for updates
                    </>
                  )}
                </Button>
              </form>
            )}

            <p className="mt-4 text-center text-xs text-gray-400">
              We respect your privacy and will never share your information.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
