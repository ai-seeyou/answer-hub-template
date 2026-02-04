import type { HubConfig, ReviewItem, ReviewSummary } from '@/types/hub';

/** Safely convert any value to string */
export function asString(value: unknown, fallback = ''): string {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return fallback;
}

/** Safely convert any value to array */
export function asArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

/** Return first non-empty string from list */
export function firstNonEmpty(...values: (string | null | undefined)[]): string {
  for (const v of values) {
    if (v && typeof v === 'string' && v.trim().length > 0) return v;
  }
  return '';
}

/** Normalizes intent phase to tof/mof/bof */
export function normaliseIntentPhase(phase: string | null | undefined): 'tof' | 'mof' | 'bof' | null {
  const normalized = asString(phase).toLowerCase().trim();
  if (['tof', 'top_of_funnel', 'top-of-funnel', 'research'].includes(normalized)) return 'tof';
  if (['mof', 'middle_of_funnel', 'middle-of-funnel', 'compare', 'consideration'].includes(normalized)) return 'mof';
  if (['bof', 'bottom_of_funnel', 'bottom-of-funnel', 'decision', 'purchase'].includes(normalized)) return 'bof';
  return null;
}

/** Normalizes proof.reviews to handle both legacy array format and new object format */
export function normaliseReviews(proof: HubConfig['proof'] | undefined): { 
  reviewItems: ReviewItem[]; 
  reviewSummary: ReviewSummary | null 
} {
  const reviews = proof?.reviews;
  
  // New schema: { summary, items }
  if (reviews && typeof reviews === 'object' && !Array.isArray(reviews)) {
    const r = reviews as { summary?: ReviewSummary; items?: ReviewItem[] };
    const items = Array.isArray(r.items) ? r.items : [];
    const summary = r.summary && typeof r.summary === 'object' ? r.summary : null;
    return { reviewItems: items, reviewSummary: summary };
  }
  
  // Legacy schema: ReviewItem[]
  if (Array.isArray(reviews)) {
    return { reviewItems: reviews as ReviewItem[], reviewSummary: null };
  }
  
  return { reviewItems: [], reviewSummary: null };
}

/** Utility for className merging */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
