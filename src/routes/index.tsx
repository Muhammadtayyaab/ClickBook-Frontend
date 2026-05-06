import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Check, Layers, MousePointerClick, Palette, Rocket, Sparkles, Star, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { TemplatePreview, StarRating } from "@/components/template-preview";
import { TEMPLATES } from "@/data/templates";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ClickBook — Build a beautiful website in minutes" },
      { name: "description", content: "Pick a template, customize it visually with drag and drop, and publish to your custom domain. No code required." },
      { property: "og:title", content: "ClickBook — Beautiful websites, built visually" },
      { property: "og:description", content: "Drag-and-drop website builder with stunning templates and custom domains." },
    ],
  }),
  component: LandingPage,
});

const FEATURES = [
  { icon: MousePointerClick, title: "Click-to-edit canvas", body: "Edit any section visually. What you see is what you publish." },
  { icon: Palette, title: "Designer templates", body: "Start from professionally crafted templates across 10+ industries." },
  { icon: Layers, title: "Drag-and-drop sections", body: "Reorder, duplicate, hide. Build your page like Lego." },
  { icon: Rocket, title: "1-click publish", body: "Ship to a free subdomain or your own custom domain." },
];

const STEPS = [
  { num: "01", title: "Pick a template", body: "Browse 50+ industry templates. Preview before you commit." },
  { num: "02", title: "Customize visually", body: "Click anything on the canvas to edit copy, colors, and layout." },
  { num: "03", title: "Publish & grow", body: "Connect a domain and watch your traffic with built-in analytics." },
];

const PLANS = [
  { name: "Starter", price: "$9", features: ["1 site", "ClickBook subdomain", "Basic analytics", "Community support"] },
  { name: "Pro", price: "$29", features: ["5 sites", "Custom domain", "Forms & integrations", "Priority email support"], highlight: true },
  { name: "Studio", price: "$79", features: ["Unlimited sites", "Team seats", "Advanced analytics", "24/7 support"] },
];

const TESTIMONIALS = [
  { name: "Sara Khalid", role: "Founder, Lumen Studio", quote: "We launched our entire marketing site in one afternoon. ClickBook is unreal." },
  { name: "Diego Marín", role: "Owner, Forge Gym", quote: "Our members can finally book classes online. Bookings doubled in a month." },
  { name: "Priya Anand", role: "Director, Anand Realty", quote: "The templates look like a senior designer made them. Just polished and clean." },
];

const FAQS = [
  { q: "Do I need to know how to code?", a: "No. Everything is visual — click to edit, drag to reorder. We handle the code under the hood." },
  { q: "Can I use my own domain?", a: "Yes. The Pro plan and above let you connect any domain you own in just a few clicks." },
  { q: "Is there a free trial?", a: "All plans come with a 14-day free trial. No credit card required to get started." },
  { q: "What happens to my site if I cancel?", a: "Your site stays online for 30 days. You can export your content anytime." },
];

function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <Hero />
      <Features />
      <HowItWorks />
      <TemplatesShowcase />
      <Pricing />
      <Testimonials />
      <FAQ />
      <SiteFooter />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-subtle" />
      <div className="absolute -top-40 left-1/2 -z-10 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-hero opacity-20 blur-3xl" />
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-4xl text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            New: AI section suggestions are here
          </span>
          <h1 className="mt-6 text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            Build a beautiful website in <span className="text-gradient">minutes</span>.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Pick a template, customize every part of it visually, and ship to your domain.
            No designers, no developers, no excuses.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="xl" variant="hero">
              <Link to="/templates">
                Browse templates <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <p className="mt-6 text-xs text-muted-foreground">14-day free trial · No credit card required</p>
        </motion.div>

        {/* Floating template preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="relative mx-auto mt-16 max-w-5xl"
        >
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-glow">
            <div className="aspect-[16/9]">
              <TemplatePreview template={TEMPLATES[0]} />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section id="features" className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Everything you need to launch</h2>
          <p className="mt-4 text-muted-foreground">Powerful enough for designers. Simple enough for everyone else.</p>
        </div>
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:shadow-md"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-hero text-primary-foreground">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="bg-gradient-subtle px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">From idea to live in 3 steps</h2>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.num} className="relative rounded-2xl border border-border bg-card p-7 shadow-sm">
              <span className="text-5xl font-bold text-gradient">{s.num}</span>
              <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TemplatesShowcase() {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Stunning templates</h2>
            <p className="mt-3 text-muted-foreground">Designed by professionals. Ready to ship in minutes.</p>
          </div>
          <Button asChild variant="outline">
            <Link to="/templates">View all templates <ArrowRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {TEMPLATES.slice(0, 6).map((t) => (
            <Link
              key={t.id}
              to="/templates"
              className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="aspect-[4/3]">
                <TemplatePreview template={t} />
              </div>
              <div className="flex items-center justify-between p-4">
                <div>
                  <h3 className="font-semibold">{t.name}</h3>
                  <p className="text-xs text-muted-foreground">{t.category}</p>
                </div>
                <StarRating value={t.rating} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section id="pricing" className="bg-gradient-subtle px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Simple, transparent pricing</h2>
          <p className="mt-4 text-muted-foreground">Pick a plan that fits. Upgrade or cancel anytime.</p>
        </div>
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {PLANS.map((p) => (
            <div
              key={p.name}
              className={`relative rounded-2xl border bg-card p-7 ${p.highlight ? "border-primary shadow-glow" : "border-border shadow-sm"}`}
            >
              {p.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-hero px-3 py-1 text-xs font-semibold text-primary-foreground shadow">
                  Most popular
                </span>
              )}
              <h3 className="text-lg font-semibold">{p.name}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-5xl font-bold tracking-tight">{p.price}</span>
                <span className="text-sm text-muted-foreground">/month</span>
              </div>
              <ul className="mt-6 space-y-3 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-success/15 text-success">
                      <Check className="h-3 w-3" />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <Button className="mt-7 w-full" variant={p.highlight ? "hero" : "outline"} size="lg">
                Start free trial
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">Loved by 50,000+ creators</h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <figure key={t.name} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-3 flex gap-0.5">
                {Array.from({ length: 5 }).map((_, k) => (
                  <Star key={k} className="h-4 w-4 fill-yellow-400 stroke-yellow-500" />
                ))}
              </div>
              <blockquote className="text-foreground">"{t.quote}"</blockquote>
              <figcaption className="mt-4 text-sm text-muted-foreground">
                <strong className="text-foreground">{t.name}</strong> · {t.role}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="bg-gradient-subtle px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">Frequently asked questions</h2>
        <div className="mt-10 divide-y divide-border rounded-2xl border border-border bg-card shadow-sm">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <button
                key={f.q}
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full flex-col gap-3 px-6 py-5 text-left"
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="font-medium">{f.q}</span>
                  <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </div>
                {isOpen && <p className="text-sm text-muted-foreground">{f.a}</p>}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
