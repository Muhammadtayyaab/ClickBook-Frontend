import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Github, Twitter, Linkedin, Sparkles } from "lucide-react";
import { APP_NAME, APP_COPYRIGHT } from "@/lib/brand";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-gradient-subtle">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 font-semibold">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-hero text-primary-foreground shadow-glow">
                <Sparkles className="h-4 w-4" />
              </span>
              <span className="text-lg tracking-tight">{APP_NAME}</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
              The fastest way to design, customize, and launch your website. No code required.
            </p>
            <NewsletterForm />
          </div>
          {[
            { title: "Product", links: ["Templates", "Editor", "Pricing", "Changelog"] },
            { title: "Company", links: ["About", "Careers", "Blog", "Press"] },
            { title: "Resources", links: ["Docs", "Help center", "Community", "Contact"] },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold text-foreground">{col.title}</h4>
              <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
                {col.links.map((l) => (
                  <li key={l}>
                    <a href="#" className="hover:text-foreground">{l}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border/60 pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>{APP_COPYRIGHT}</p>
          <div className="flex items-center gap-3">
            <a href="#" aria-label="Twitter" className="hover:text-foreground"><Twitter className="h-4 w-4" /></a>
            <a href="#" aria-label="GitHub" className="hover:text-foreground"><Github className="h-4 w-4" /></a>
            <a href="#" aria-label="LinkedIn" className="hover:text-foreground"><Linkedin className="h-4 w-4" /></a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [subscribed, setSubscribed] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = email.trim();
    if (!value) {
      setError("Email is required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setError("Enter a valid email.");
      return;
    }
    setError(null);
    setSubscribed(true);
    setEmail("");
  }

  return (
    <form className="mt-6 max-w-sm" onSubmit={onSubmit} noValidate>
      <div className="flex gap-2">
        <input
          type="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError(null);
            if (subscribed) setSubscribed(false);
          }}
          aria-invalid={!!error}
          className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        <button
          type="submit"
          className="h-10 rounded-md bg-foreground px-4 text-sm font-medium text-background hover:opacity-90"
        >
          Subscribe
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
      {!error && subscribed && (
        <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">
          Thanks — you're subscribed.
        </p>
      )}
    </form>
  );
}
