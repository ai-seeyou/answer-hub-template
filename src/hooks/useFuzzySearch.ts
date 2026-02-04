import { useMemo, useState, useEffect } from 'react';
import Fuse from 'fuse.js';
import type { HubFAQ, HubService, AnswerPage } from '@/types/hub';

export interface SearchResult {
  type: 'faq' | 'service' | 'answer';
  slug: string;
  title: string;
  subtitle: string;
  path: string;
}

interface UseFuzzySearchOptions {
  faqs: HubFAQ[];
  services: HubService[];
  answerPages?: AnswerPage[];
  debounceMs?: number;
}

export function useFuzzySearch({ faqs, services, answerPages = [], debounceMs = 150 }: UseFuzzySearchOptions) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), debounceMs);
    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  const fuse = useMemo(() => {
    const searchItems: (SearchResult & { searchText: string })[] = [
      ...faqs.map((faq) => ({
        type: 'faq' as const,
        slug: faq.slug || '',
        title: faq.question || '',
        subtitle: faq.category || '',
        path: `/faqs#${faq.slug || ''}`,
        searchText: `${faq.question || ''} ${faq.category || ''} ${(faq.answerHtml || '').replace(/<[^>]*>/g, '')}`,
      })),
      ...services.map((service) => ({
        type: 'service' as const,
        slug: service.slug || '',
        title: service.name || '',
        subtitle: service.summary || '',
        path: `/services/${service.slug || ''}`,
        searchText: `${service.name || ''} ${service.summary || ''} ${service.description || ''}`,
      })),
      ...answerPages.map((answer) => ({
        type: 'answer' as const,
        slug: answer.slug || '',
        title: answer.question || '',
        subtitle: answer.topic || answer.intent_phase || '',
        path: `/answer/${answer.slug || ''}`,
        searchText: `${answer.question || ''} ${answer.topic || ''} ${answer.intent_phase || ''}`,
      })),
    ];

    return new Fuse(searchItems, {
      keys: ['title', 'subtitle', 'searchText'],
      threshold: 0.4,
      includeScore: true,
      minMatchCharLength: 2,
    });
  }, [faqs, services, answerPages]);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      return;
    }
    const searchResults = fuse.search(debouncedQuery, { limit: 5 });
    setResults(searchResults.map((result) => ({
      type: result.item.type,
      slug: result.item.slug,
      title: result.item.title,
      subtitle: result.item.subtitle,
      path: result.item.path,
    })));
  }, [debouncedQuery, fuse]);

  return { query, setQuery, results, hasResults: results.length > 0 };
}
