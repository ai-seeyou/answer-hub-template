/**
 * Hub Configuration Types
 * Matches the Publisher's HubConfig schema
 */

export interface HubBrand {
  name: string;
  logoUrl?: string;
  faviconUrl?: string;
  tagline?: string;
  primaryColour?: string;
  secondaryColour?: string;
  websiteUrl: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface HubServiceImages {
  primary?: string;
  category?: string;
  hero?: string;
  general?: string;
}

export interface HubService {
  slug: string;
  name: string;
  summary: string;
  description?: string;
  priceModel?: string;
  duration?: string;
  bookingUrl?: string;
  relatedFaqSlugs?: string[];
  url?: string;
  images?: HubServiceImages;
  richDescriptionHtml?: string;
  keyBenefits?: string[];
  routine?: { step: string; when: string; detail: string }[];
  routineV2?: { step: string; product: string; timing: string; instruction: string }[];
  contentSections?: { id: string; title: string; html: string }[];
  audience?: { primary: string; secondary?: string[] };
  bestFor?: string[];
  generatedSections?: { id: string; title: string; items: string[] }[];
}

export interface HubFAQ {
  slug: string;
  category: string;
  question: string;
  answerHtml: string;
  answerMarkdown?: string;
  relatedServiceSlugs?: string[];
}

export interface HubProfile {
  type: 'directory' | 'social' | 'review';
  platform: string;
  url: string;
  status?: 'active' | 'pending' | 'claimed';
}

export interface HubReview {
  platform: string;
  rating?: number | null;
  count?: number;
  url?: string;
}

export interface HubCredential {
  name: string;
  issuer?: string;
  year?: string;
}

export interface HubPolicy {
  name: string;
  url?: string;
  summary?: string;
}

export interface HubProofStripItem {
  label: string;
  value: string;
  icon?: string;
}

export interface HubProof {
  reviews?: HubReview[] | { summary?: ReviewSummary; items?: ReviewItem[] };
  credentials?: HubCredential[];
  policies?: HubPolicy[];
  disclaimers?: string[];
  proofStrip?: HubProofStripItem[];
}

export interface ReviewItem {
  platform?: string;
  source?: string | null;
  rating?: number | null;
  count?: number | null;
  url?: string | null;
  author_name?: string | null;
  review_text?: string | null;
}

export interface ReviewSummary {
  status?: string;
  total_review_count?: number;
  average_rating?: number;
  last_checked?: string;
  primary_source?: string;
  source_url?: string;
}

export interface EcommerceFunnelStageLabels {
  tof?: string;
  mof?: string;
  bof?: string;
}

export interface AnswerPage {
  slug: string;
  url: string;
  canonical_url?: string;
  question: string;
  intent_phase: 'tof' | 'mof' | 'bof';
  archetype?: string;
  answer_units?: { label: string; content: string }[];
  topic?: string;
}

export interface HubConfig {
  brand: HubBrand;
  services: HubService[];
  faqs: HubFAQ[];
  profiles: HubProfile[];
  proof: HubProof;
  visit?: {
    address: string;
    phone?: string;
    email?: string;
    bookingUrl?: string;
  };
  answersEngine?: {
    ecommerceFunnel?: {
      stageLabels?: EcommerceFunnelStageLabels;
    };
  };
  answerPages?: AnswerPage[];
}
