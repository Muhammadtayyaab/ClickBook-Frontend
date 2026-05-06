export type SectionType =
  | "hero"
  | "features"
  | "about"
  | "testimonials"
  | "pricing"
  | "team"
  | "gallery"
  | "cta"
  | "contact"
  | "footer";

export interface SectionStyle {
  bg?: string;          // background color (CSS value) or "" for default
  fg?: string;          // text color
  paddingY?: number;    // py in px
  align?: "left" | "center" | "right";
  width?: "boxed" | "full";
  radius?: number;      // px
}

export interface SectionDef {
  id: string;
  type: SectionType;
  name: string;
  visible: boolean;
  data: Record<string, unknown>;
  style?: SectionStyle;
}

export interface SectionTypeMeta {
  type: SectionType;
  label: string;
  category: string;
  description: string;
}

export const SECTION_LIBRARY: SectionTypeMeta[] = [
  { type: "hero", label: "Hero", category: "Hero sections", description: "Big headline with CTA buttons" },
  { type: "about", label: "About", category: "About sections", description: "Tell your story" },
  { type: "features", label: "Features grid", category: "Feature sections", description: "Highlight 3-6 key features" },
  { type: "testimonials", label: "Testimonials", category: "Testimonial sections", description: "Customer quotes" },
  { type: "pricing", label: "Pricing", category: "Pricing sections", description: "Plans & pricing tiers" },
  { type: "team", label: "Team", category: "Team sections", description: "Meet the team" },
  { type: "gallery", label: "Gallery", category: "Gallery sections", description: "Image grid showcase" },
  { type: "cta", label: "Call to action", category: "Contact sections", description: "Drive a single action" },
  { type: "contact", label: "Contact form", category: "Contact sections", description: "Lead capture form" },
  { type: "footer", label: "Footer", category: "Footer sections", description: "Links, copyright" },
];

let counter = 0;
const uid = () => `s_${Date.now().toString(36)}_${(++counter).toString(36)}`;

export function createSection(type: SectionType): SectionDef {
  const meta = SECTION_LIBRARY.find((m) => m.type === type)!;
  return {
    id: uid(),
    type,
    name: meta.label,
    visible: true,
    data: defaultDataFor(type),
    style: { paddingY: 80, align: "center", width: "boxed", radius: 16 },
  };
}

function defaultDataFor(type: SectionType): Record<string, unknown> {
  switch (type) {
    case "hero":
      return {
        eyebrow: "New",
        headline: "Build a beautiful website in minutes",
        subheadline: "Pick a template, customize it visually, and publish to your domain.",
        ctaPrimary: "Get started",
        ctaPrimaryUrl: "#",
        ctaSecondary: "See templates",
        ctaSecondaryUrl: "#",
        bgImage: "",
      };
    case "about":
      return { title: "About us", body: "We help small teams ship beautiful websites without writing code.", image: "" };
    case "features":
      return {
        title: "Everything you need",
        subtitle: "Powerful tools to grow your business",
        columns: 3,
        items: [
          { title: "Drag & drop editor", body: "Click anything to edit. No code required.", icon: "Check" },
          { title: "Stunning templates", body: "Designed by professionals, ready to ship.", icon: "Sparkles" },
          { title: "Custom domains", body: "Connect your domain in a few clicks.", icon: "Globe" },
        ],
      };
    case "testimonials":
      return {
        title: "Loved by builders",
        items: [
          { name: "Sara K.", role: "Founder, Lumen", quote: "Set up our marketing site in an afternoon.", rating: 5 },
          { name: "Diego M.", role: "Owner, Forge Gym", quote: "Members can finally book classes online.", rating: 5 },
        ],
      };
    case "pricing":
      return {
        title: "Simple pricing",
        subtitle: "Choose the plan that fits your needs",
        plans: [
          { name: "Starter", price: "$9", period: "/mo", features: ["1 site", "Subdomain", "Basic analytics"], cta: "Choose Starter", highlight: false },
          { name: "Pro", price: "$29", period: "/mo", features: ["5 sites", "Custom domain", "Forms"], cta: "Choose Pro", highlight: true },
          { name: "Studio", price: "$79", period: "/mo", features: ["Unlimited sites", "Team seats", "Priority support"], cta: "Choose Studio", highlight: false },
        ],
      };
    case "team":
      return {
        title: "The team",
        members: [
          { name: "Alex Rivera", role: "CEO", image: "" },
          { name: "Mia Chen", role: "Design Lead", image: "" },
          { name: "Jonas Park", role: "Engineering", image: "" },
        ],
      };
    case "gallery":
      return { title: "Gallery", columns: 3, images: ["", "", "", "", "", ""] };
    case "cta":
      return { title: "Ready to launch?", body: "Join thousands of creators building with ClickBook.", cta: "Start free", ctaUrl: "#" };
    case "contact":
      return { title: "Get in touch", email: "hello@example.com", showForm: true };
    case "footer":
      return { brand: "ClickBook", copyright: "© 2026 ClickBook. All rights reserved.", links: ["Privacy", "Terms", "Contact"] };
  }
}

/** Default sections for a freshly-scaffolded page in the local editor.
 *
 * The shape returned here matches what the backend scaffolds in
 * `backend/app/routes/site_routes.py`, so the local-only template preview and a
 * persisted backend project look the same.
 */
export function defaultPageSections(slug?: string): SectionDef[] {
  switch (slug) {
    case "about":
      return [
        withData(createSection("hero"), {
          eyebrow: "About",
          headline: "About us",
          subheadline: "Get to know our story, our mission, and the team behind the work.",
          ctaPrimary: "Our story",
          ctaSecondary: "Meet the team",
        }),
        createSection("about"),
        createSection("team"),
        withData(createSection("cta"), {
          title: "Want to work with us?",
          body: "We're always open to new collaborations.",
          cta: "Get in touch",
        }),
        createSection("footer"),
      ];
    case "services":
      return [
        withData(createSection("hero"), {
          eyebrow: "Services",
          headline: "What we do",
          subheadline: "Solutions tailored for teams that want to move faster.",
          ctaPrimary: "Get a quote",
          ctaSecondary: "View pricing",
        }),
        withData(createSection("features"), {
          title: "Our services",
          subtitle: "End-to-end services tailored to your needs.",
        }),
        createSection("pricing"),
        withData(createSection("cta"), {
          title: "Have a project in mind?",
          body: "Tell us about it — we usually reply within a day.",
          cta: "Start a project",
        }),
        createSection("footer"),
      ];
    case "contact":
      return [
        withData(createSection("hero"), {
          eyebrow: "Contact",
          headline: "Let's talk",
          subheadline: "Reach out — we'd love to hear from you.",
          ctaPrimary: "Send a message",
          ctaSecondary: "Email us",
        }),
        createSection("contact"),
        createSection("footer"),
      ];
    case "home":
    default:
      return [
        createSection("hero"),
        createSection("features"),
        createSection("testimonials"),
        createSection("pricing"),
        createSection("cta"),
        createSection("footer"),
      ];
  }
}

function withData(section: SectionDef, patch: Record<string, unknown>): SectionDef {
  return { ...section, data: { ...section.data, ...patch } };
}
