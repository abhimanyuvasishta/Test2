import { z } from "zod";

export const productHighlightSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Title is required").max(80),
  description: z.string().min(1, "Description is required").max(300),
  metric: z.string().max(40).optional(),
});

export const clientBriefSchema = z.object({
  clientName: z.string().min(1, "Client name is required").max(100),
  productName: z.string().min(1, "Product name is required").max(100),
  tagline: z.string().min(1, "Tagline is required").max(150),
  industry: z.string().min(1, "Industry is required").max(80),
  targetAudience: z.enum(["ceo", "cto", "marketing", "mixed"]),
  tone: z.enum(["executive", "technical", "visionary", "bold"]),
  brandColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Valid hex color required"),
  highlights: z.array(productHighlightSchema).min(1, "Add at least one highlight").max(8),
  callToAction: z.string().min(1, "Call to action is required").max(120),
});

export type ClientBriefInput = z.infer<typeof clientBriefSchema>;

export const defaultBrief: ClientBriefInput = {
  clientName: "",
  productName: "",
  tagline: "",
  industry: "",
  targetAudience: "mixed",
  tone: "executive",
  brandColor: "#6366f1",
  highlights: [
    {
      id: "1",
      title: "",
      description: "",
      metric: "",
    },
  ],
  callToAction: "Schedule a strategic demo today",
};

export const sampleBrief: ClientBriefInput = {
  clientName: "Acme Corp",
  productName: "Nexus Platform",
  tagline: "Enterprise intelligence, reimagined",
  industry: "Enterprise SaaS",
  targetAudience: "mixed",
  tone: "executive",
  brandColor: "#6366f1",
  highlights: [
    {
      id: "1",
      title: "Unified Data Intelligence",
      description:
        "Consolidate siloed data sources into a single source of truth with real-time analytics.",
      metric: "40% faster decisions",
    },
    {
      id: "2",
      title: "Enterprise-Grade Security",
      description:
        "SOC 2 Type II certified with zero-trust architecture and end-to-end encryption.",
      metric: "99.99% uptime SLA",
    },
    {
      id: "3",
      title: "AI-Powered Insights",
      description:
        "Predictive analytics and natural language queries that surface actionable intelligence.",
      metric: "3x ROI in year one",
    },
  ],
  callToAction: "Transform your enterprise. Book a demo.",
};
