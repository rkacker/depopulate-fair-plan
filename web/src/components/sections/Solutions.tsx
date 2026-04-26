import { Building2, FileText, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { scrollToSection } from "@/lib/utils";

const PILLARS = [
  {
    icon: FileText,
    title: "Regulatory Transparency",
    blurb:
      "Californians deserve clear, timely information about how insurance rates are set and why coverage decisions are made.",
    cardClass: "from-red-50 border-red-100",
    iconBg: "bg-patriot-red/10 text-patriot-red",
  },
  {
    icon: Building2,
    title: "Market Stability",
    blurb:
      "A healthy insurance market requires conditions that keep private insurers engaged in California's communities, especially in high-risk areas.",
    cardClass: "from-blue-50 border-blue-100",
    iconBg: "bg-navy-blue/10 text-navy-blue",
  },
  {
    icon: ShieldCheck,
    title: "Consumer Protection",
    blurb:
      "Every California family should have access to fair, affordable coverage — and be treated justly when disaster strikes.",
    cardClass: "from-amber-50 border-amber-100",
    iconBg: "bg-amber-500/10 text-amber-600",
  },
];

export function Solutions() {
  return (
    <section id="solutions" className="bg-white py-20 scroll-mt-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-charcoal lg:text-4xl">
            A Path Forward
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-600">
            We believe meaningful change starts with shared principles —
            transparency, stability, and fairness for every Californian.
          </p>
        </div>

        <div className="mb-12 grid gap-6 md:grid-cols-3">
          {PILLARS.map(({ icon: Icon, title, blurb, cardClass, iconBg }) => (
            <div
              key={title}
              className={`rounded-xl border bg-gradient-to-br to-white p-6 ${cardClass}`}
            >
              <div
                className={`mb-4 flex h-12 w-12 items-center justify-center rounded-lg ${iconBg}`}
              >
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="mb-3 text-xl font-semibold text-charcoal">
                {title}
              </h3>
              <p className="text-sm text-gray-600">{blurb}</p>
            </div>
          ))}
        </div>

        <div className="mx-auto max-w-3xl rounded-xl border border-green-200 bg-green-50 p-6 text-center">
          <p className="mb-2 font-semibold text-green-700">Our Goal</p>
          <p className="text-gray-700">
            Help Californians understand the forces shaping their insurance
            options and advocate for a system that works for families,
            communities, and the market alike.
          </p>
        </div>

        <div className="mt-8 text-center">
          <Button size="lg" onClick={() => scrollToSection("signup")}>
            Get Involved
          </Button>
        </div>
      </div>
    </section>
  );
}
