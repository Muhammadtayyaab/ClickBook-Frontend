import type { SectionDef, SectionStyle } from "@/data/sections";
import { Check, Mail, Star, Sparkles, Globe, Zap, Shield, Heart, Rocket, Image as ImageIcon } from "lucide-react";
import { useState } from "react";
import { submitContactForm } from "@/lib/notifications-api";
import { ApiError } from "@/lib/api";
import { toast } from "sonner";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Check, Sparkles, Globe, Zap, Shield, Heart, Rocket, Star,
};

function styleFor(style?: SectionStyle): React.CSSProperties {
  const s: React.CSSProperties = {};
  if (style?.bg) s.background = style.bg;
  if (style?.fg) s.color = style.fg;
  if (style?.paddingY != null) {
    s.paddingTop = `${style.paddingY}px`;
    s.paddingBottom = `${style.paddingY}px`;
  }
  return s;
}

function alignClass(a?: string) {
  return a === "left" ? "text-left" : a === "right" ? "text-right" : "text-center";
}

function containerClass(width?: string) {
  return width === "full" ? "mx-auto w-full px-6" : "mx-auto max-w-6xl px-6";
}

export function SectionRenderer({ section, siteId }: { section: SectionDef; siteId?: string }) {
  const d = (section.data ?? {}) as any;
  const st = section.style;
  const inline = styleFor(st);
  const align = alignClass(st?.align);
  const cont = containerClass(st?.width);

  switch (section.type) {
    case "hero":
      return (
        <section
          className="relative overflow-hidden bg-gradient-hero text-primary-foreground"
          style={{
            ...inline,
            ...(d.bgImage ? { backgroundImage: `linear-gradient(rgba(0,0,0,0.4),rgba(0,0,0,0.4)), url(${d.bgImage})`, backgroundSize: "cover", backgroundPosition: "center" } : {}),
          }}
        >
          <div className={`${cont} ${align}`}>
            {d.eyebrow && (
              <span className="inline-flex rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
                {d.eyebrow}
              </span>
            )}
            <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-6xl">{d.headline}</h1>
            <p className={`mt-5 max-w-2xl text-lg text-white/85 ${st?.align === "center" || !st?.align ? "mx-auto" : ""}`}>{d.subheadline}</p>
            <div className={`mt-8 flex flex-wrap gap-3 ${st?.align === "center" || !st?.align ? "justify-center" : st?.align === "right" ? "justify-end" : ""}`}>
              {d.ctaPrimary && (
                <button className="h-11 rounded-lg bg-white px-6 text-sm font-semibold text-foreground shadow-lg hover:opacity-95">
                  {d.ctaPrimary}
                </button>
              )}
              {d.ctaSecondary && (
                <button className="h-11 rounded-lg border border-white/40 px-6 text-sm font-semibold text-white hover:bg-white/10">
                  {d.ctaSecondary}
                </button>
              )}
            </div>
          </div>
        </section>
      );
    case "about":
      return (
        <section style={inline}>
          <div className={`${cont} grid gap-10 md:grid-cols-2 items-center`}>
            <div className={align}>
              <h2 className="text-3xl font-bold tracking-tight">{d.title}</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">{d.body}</p>
            </div>
            <div className="aspect-video overflow-hidden rounded-2xl bg-gradient-card">
              {d.image && <img src={d.image} alt={d.title} className="h-full w-full object-cover" />}
            </div>
          </div>
        </section>
      );
    case "features": {
      const cols = d.columns ?? 3;
      const grid = cols === 2 ? "md:grid-cols-2" : cols === 4 ? "md:grid-cols-2 lg:grid-cols-4" : "md:grid-cols-3";
      return (
        <section className="bg-muted/40" style={inline}>
          <div className={cont}>
            <div className={align}>
              <h2 className="text-3xl font-bold tracking-tight">{d.title}</h2>
              {d.subtitle && <p className="mt-3 text-muted-foreground">{d.subtitle}</p>}
            </div>
            <div className={`mt-12 grid gap-6 ${grid}`}>
              {(d.items ?? []).map((it: any, i: number) => {
                const Icon = ICONS[it.icon] ?? Check;
                return (
                  <div key={i} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-hero text-primary-foreground">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-semibold">{it.title}</h3>
                    <p className="mt-1.5 text-sm text-muted-foreground">{it.body}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      );
    }
    case "testimonials":
      return (
        <section style={inline}>
          <div className={cont}>
            <h2 className={`text-3xl font-bold tracking-tight ${align}`}>{d.title}</h2>
            <div className="mt-12 grid gap-6 md:grid-cols-2">
              {(d.items ?? []).map((it: any, i: number) => (
                <figure key={i} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <div className="mb-3 flex gap-0.5">
                    {Array.from({ length: it.rating ?? 5 }).map((_, k) => (
                      <Star key={k} className="h-4 w-4 fill-yellow-400 stroke-yellow-500" />
                    ))}
                  </div>
                  <blockquote className="text-foreground">"{it.quote}"</blockquote>
                  <figcaption className="mt-4 text-sm text-muted-foreground">
                    <strong className="text-foreground">{it.name}</strong> — {it.role}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      );
    case "pricing":
      return (
        <section className="bg-muted/40" style={inline}>
          <div className={cont}>
            <div className={align}>
              <h2 className="text-3xl font-bold tracking-tight">{d.title}</h2>
              {d.subtitle && <p className="mt-3 text-muted-foreground">{d.subtitle}</p>}
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {(d.plans ?? []).map((p: any, i: number) => (
                <div
                  key={i}
                  className={`rounded-2xl border bg-card p-6 ${p.highlight ? "border-primary shadow-glow" : "border-border shadow-sm"}`}
                >
                  {p.highlight && (
                    <span className="mb-3 inline-flex rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                      Most popular
                    </span>
                  )}
                  <h3 className="text-lg font-semibold">{p.name}</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-4xl font-bold">{p.price}</span>
                    <span className="text-sm text-muted-foreground">{p.period}</span>
                  </div>
                  <ul className="mt-5 space-y-2 text-sm">
                    {(p.features ?? []).map((f: string, k: number) => (
                      <li key={k} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-success" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    className={`mt-6 h-10 w-full rounded-md text-sm font-medium ${
                      p.highlight ? "bg-gradient-hero text-primary-foreground" : "border border-border hover:bg-accent"
                    }`}
                  >
                    {p.cta ?? `Choose ${p.name}`}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      );
    case "team":
      return (
        <section style={inline}>
          <div className={cont}>
            <h2 className={`text-3xl font-bold tracking-tight ${align}`}>{d.title}</h2>
            <div className="mt-12 grid gap-6 sm:grid-cols-3">
              {(d.members ?? []).map((m: any, i: number) => (
                <div key={i} className="text-center">
                  <div className="mx-auto h-24 w-24 overflow-hidden rounded-full bg-gradient-card">
                    {m.image && <img src={m.image} alt={m.name} className="h-full w-full object-cover" />}
                  </div>
                  <h3 className="mt-4 font-semibold">{m.name}</h3>
                  <p className="text-sm text-muted-foreground">{m.role}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      );
    case "gallery": {
      const images: string[] = d.images ?? [];
      const cols = d.columns ?? 3;
      const grid = cols === 2 ? "grid-cols-2" : cols === 4 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2 sm:grid-cols-3";
      return (
        <section style={inline}>
          <div className={cont}>
            <h2 className={`text-3xl font-bold tracking-tight ${align}`}>{d.title}</h2>
            <div className={`mt-10 grid gap-3 ${grid}`}>
              {images.map((src, i) => (
                <div key={i} className="aspect-square overflow-hidden rounded-xl bg-gradient-card">
                  {src ? (
                    <img src={src} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground/50">
                      <ImageIcon className="h-6 w-6" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      );
    }
    case "cta":
      return (
        <section style={inline}>
          <div className={cont}>
            <div className="rounded-3xl bg-gradient-hero p-12 text-center text-primary-foreground shadow-glow">
              <h2 className="text-3xl font-bold tracking-tight">{d.title}</h2>
              <p className="mx-auto mt-3 max-w-2xl text-white/85">{d.body}</p>
              <button className="mt-6 h-11 rounded-lg bg-white px-6 text-sm font-semibold text-foreground shadow-lg">
                {d.cta}
              </button>
            </div>
          </div>
        </section>
      );
    case "contact":
      return (
        <section className="bg-muted/40" style={inline}>
          <div className={`${cont} max-w-xl ${align}`}>
            <h2 className="text-3xl font-bold tracking-tight">{d.title}</h2>
            <p className="mt-3 inline-flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4" /> {d.email}
            </p>
            {d.showForm !== false && <ContactForm siteId={siteId} />}
          </div>
        </section>
      );
    case "footer":
      return (
        <footer className="border-t border-border bg-background px-6 py-10 text-center text-sm text-muted-foreground" style={inline}>
          <p className="font-semibold text-foreground">{d.brand}</p>
          {d.links && (
            <div className="mt-3 flex flex-wrap justify-center gap-4">
              {(d.links ?? []).map((l: string, i: number) => (
                <a key={i} href="#" className="hover:text-foreground">{l}</a>
              ))}
            </div>
          )}
          <p className="mt-3">{d.copyright}</p>
        </footer>
      );
  }
}

function ContactForm({ siteId }: { siteId?: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; message?: string }>({});

  function validate() {
    const next: typeof errors = {};
    if (!name.trim()) next.name = "Name is required.";
    if (!email.trim()) next.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      next.email = "Please enter a valid email address.";
    if (!message.trim()) next.message = "Message is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    if (!siteId) {
      // Editor preview / template browser — no live backend to send to.
      toast.message("Form preview only — publish the site to receive messages.");
      return;
    }
    setSubmitting(true);
    try {
      await submitContactForm(siteId, {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        message: message.trim(),
      });
      toast.success("Message sent successfully");
      setSent(true);
      setName("");
      setEmail("");
      setMessage("");
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.status === 429
            ? "You're sending messages too fast. Please try again in a few minutes."
            : err.message
          : "Failed to send message. Please try again.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="mt-8 rounded-md border border-emerald-500/40 bg-emerald-500/10 p-6 text-center">
        <p className="font-semibold text-emerald-700 dark:text-emerald-400">
          Thanks — your message was sent!
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          We'll be in touch soon.
        </p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="mt-4 text-sm font-medium underline underline-offset-4"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form className="mt-8 grid gap-3 text-left" onSubmit={onSubmit} noValidate>
      <div>
        <input
          className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={submitting}
          aria-invalid={!!errors.name}
        />
        {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name}</p>}
      </div>
      <div>
        <input
          type="email"
          className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={submitting}
          aria-invalid={!!errors.email}
        />
        {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
      </div>
      <div>
        <textarea
          className="min-h-[120px] w-full rounded-md border border-input bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="Message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={submitting}
          aria-invalid={!!errors.message}
        />
        {errors.message && <p className="mt-1 text-xs text-destructive">{errors.message}</p>}
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="h-11 rounded-md bg-foreground text-sm font-medium text-background transition disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Sending..." : "Send message"}
      </button>
    </form>
  );
}
