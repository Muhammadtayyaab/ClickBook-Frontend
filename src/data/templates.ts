export type TemplateCategory =
  | "Business"
  | "Gym"
  | "Spa"
  | "Real Estate"
  | "Restaurant"
  | "Portfolio"
  | "Agency"
  | "Medical"
  | "Education"
  | "Ecommerce";

export interface Template {
  id: string;
  name: string;
  category: TemplateCategory;
  description: string;
  rating: number;
  sitesBuilt: number;
  accent: string; // hex/oklch for preview banner
  tagline: string;
}

export const CATEGORIES: ("All" | TemplateCategory)[] = [
  "All",
  "Business",
  "Gym",
  "Spa",
  "Real Estate",
  "Restaurant",
  "Portfolio",
  "Agency",
  "Medical",
  "Education",
  "Ecommerce",
];

export const TEMPLATES: Template[] = [
  { id: "nova", name: "Nova", category: "Business", description: "Clean corporate site with bold typography and trust-building sections.", rating: 4.9, sitesBuilt: 12480, accent: "#6366f1", tagline: "Grow your business" },
  { id: "ironforge", name: "Ironforge", category: "Gym", description: "High-energy fitness template with class schedules and trainer profiles.", rating: 4.8, sitesBuilt: 5210, accent: "#ef4444", tagline: "Train. Sweat. Repeat." },
  { id: "serenity", name: "Serenity", category: "Spa", description: "Calm, elegant spa & wellness template with booking-first layout.", rating: 4.9, sitesBuilt: 3870, accent: "#10b981", tagline: "Find your balance" },
  { id: "estate", name: "Estate", category: "Real Estate", description: "Property listings, agent bios, and a powerful search hero.", rating: 4.7, sitesBuilt: 8120, accent: "#0ea5e9", tagline: "Homes you'll love" },
  { id: "savor", name: "Savor", category: "Restaurant", description: "Mouth-watering food photography with menu and reservations.", rating: 4.9, sitesBuilt: 6740, accent: "#f59e0b", tagline: "Taste the moment" },
  { id: "folio", name: "Folio", category: "Portfolio", description: "Minimalist portfolio with case studies and project galleries.", rating: 4.9, sitesBuilt: 9930, accent: "#8b5cf6", tagline: "Show your craft" },
  { id: "kraft", name: "Kraft Agency", category: "Agency", description: "Bold agency template with services, work, and team sections.", rating: 4.8, sitesBuilt: 4320, accent: "#ec4899", tagline: "Brands that move" },
  { id: "carecore", name: "CareCore", category: "Medical", description: "Trustworthy medical practice template with appointment booking.", rating: 4.7, sitesBuilt: 2980, accent: "#14b8a6", tagline: "Health, simplified" },
  { id: "scholar", name: "Scholar", category: "Education", description: "Course catalog, instructor profiles, and student testimonials.", rating: 4.6, sitesBuilt: 3450, accent: "#3b82f6", tagline: "Learn without limits" },
  { id: "marketly", name: "Marketly", category: "Ecommerce", description: "Conversion-focused storefront with product grids and reviews.", rating: 4.8, sitesBuilt: 11200, accent: "#f97316", tagline: "Sell beautifully" },
  { id: "atlas", name: "Atlas", category: "Business", description: "Modern SaaS landing page with feature blocks and pricing.", rating: 4.9, sitesBuilt: 14560, accent: "#6366f1", tagline: "Built to scale" },
  { id: "luxe", name: "Luxe", category: "Spa", description: "Premium beauty & wellness template with rich visuals.", rating: 4.8, sitesBuilt: 2110, accent: "#a855f7", tagline: "Indulge the senses" },
];
