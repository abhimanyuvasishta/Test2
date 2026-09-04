import { z } from "zod";

export const productHighlightSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Title is required").max(80),
  description: z.string().min(1, "Description is required").max(300),
  metric: z.string().max(40).optional(),
  kind: z.enum(["capability", "outcome", "proof"]).optional(),
});

export const clientBriefSchema = z.object({
  clientName: z.string().min(1, "Client name is required").max(100),
  productName: z.string().min(1, "Product name is required").max(100),
  tagline: z.string().min(1, "Tagline is required").max(150),
  industry: z.string().min(1, "Industry is required").max(80),
  problemStatement: z.string().min(1, "The problem to call out is required").max(280),
  desiredOutcome: z.string().min(1, "Desired outcome is required").max(200),
  customerQuote: z.string().max(240).optional(),
  quoteAttribution: z.string().max(80).optional(),
  targetAudience: z.enum(["ceo", "cto", "marketing", "mixed"]),
  tone: z.enum(["executive", "technical", "visionary", "bold"]),
  brandColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Valid hex color required"),
  highlights: z
    .array(productHighlightSchema)
    .min(1, "Add at least one product callout")
    .max(12),
  callToAction: z.string().min(1, "Call to action is required").max(120),
});

export type ClientBriefInput = z.infer<typeof clientBriefSchema>;

export const defaultBrief: ClientBriefInput = {
  clientName: "",
  productName: "",
  tagline: "",
  industry: "",
  problemStatement: "",
  desiredOutcome: "",
  customerQuote: "",
  quoteAttribution: "",
  targetAudience: "mixed",
  tone: "executive",
  brandColor: "#c4a574",
  highlights: [
    {
      id: "1",
      title: "",
      description: "",
      metric: "",
      kind: "capability",
    },
  ],
  callToAction: "Schedule a strategic briefing",
};

export const sampleBrief: ClientBriefInput = {
  clientName: "Meridian Systems",
  productName: "Aether Control",
  tagline: "The operating system for industrial intelligence",
  industry: "Industrial AI",
  problemStatement:
    "Plant leaders still run mission-critical operations on fragmented dashboards, tribal knowledge, and lagging reports — so every incident becomes a board-level surprise.",
  desiredOutcome:
    "One live picture of the operation that a CEO, CTO, and plant GM can act on in the same meeting.",
  customerQuote:
    "For the first time, my operators and my board are looking at the same truth.",
  quoteAttribution: "Elena Voss, COO, Northline Steel",
  targetAudience: "mixed",
  tone: "executive",
  brandColor: "#c4a574",
  highlights: [
    {
      id: "1",
      title: "Live Operational Twin",
      description:
        "Unify sensors, ERP, and maintenance into a single live model so leadership sees risk before it hits the P&L.",
      metric: "18 min to insight",
      kind: "capability",
    },
    {
      id: "2",
      title: "Autonomous Exception Routing",
      description:
        "AI triages anomalies, assigns owners, and records the decision trail — no more war-room guesswork.",
      metric: "62% fewer escalations",
      kind: "outcome",
    },
    {
      id: "3",
      title: "Board-Grade Assurance",
      description:
        "SOC 2, air-gapped deployment, and a 99.99% control-plane SLA designed for regulated plants.",
      metric: "99.99% SLA",
      kind: "proof",
    },
    {
      id: "4",
      title: "90-Day Value Path",
      description:
        "A named executive sponsor, a 12-week rollout, and a contractual outcome review at day 90.",
      metric: "3.4x year-one ROI",
      kind: "outcome",
    },
  ],
  callToAction: "Request the executive briefing",
};

export const kiwiBrief: ClientBriefInput = {
  clientName: "KIWI Insurance",
  productName: "Car Insurance",
  tagline: "Super NCB",
  industry: "General Insurance",
  problemStatement:
    "A single motor claim still erases years of no-claim bonus, so loyal drivers watch their premium jump overnight — and blame the brand, not the accident.",
  desiredOutcome:
    "Super NCB keeps the bonus intact so one scrape does not wipe the discount at renewal.",
  customerQuote:
    "I filed a claim and my NCB was still there at renewal. That is the first time an insurer felt fair.",
  quoteAttribution: "Rahul M., policyholder, Bengaluru",
  targetAudience: "marketing",
  tone: "executive",
  brandColor: "#000000",
  highlights: [
    {
      id: "1",
      title: "Super NCB protection",
      description:
        "One claim no longer wipes years of no-claim bonus. Super NCB keeps the discount even after a single incident.",
      metric: "NCB stays intact",
      kind: "outcome",
    },
    {
      id: "2",
      title: "Digital claim in minutes",
      description:
        "Start a motor claim from the phone — photos, garage, status — without a branch visit.",
      metric: "15 min FNOL",
      kind: "capability",
    },
    {
      id: "3",
      title: "Bumper-to-bumper certainty",
      description:
        "Zero-depreciation cover so a new car is repaired to new, not written down by wear tables.",
      metric: "Zero dep add-on",
      kind: "proof",
    },
  ],
  callToAction: "Activate Super NCB on your motor book",
};
