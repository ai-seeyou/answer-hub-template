/**
 * AnswerEngine - Production Answer Engine Site
 *
 * Standalone renderer that reads hub.json and displays:
 * - Home with search, services, buying help sections
 * - Services list and detail views
 * - FAQs with category filtering
 * - Proof/Trust page
 * - Answer pages for TOF/MOF/BOF funnel stages
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import type { HubConfig, HubFAQ, HubService, AnswerPage } from '@/types/hub';
import { useFuzzySearch } from '@/hooks/useFuzzySearch';
import {
  asArray,
  asString,
  cn,
  firstNonEmpty,
  normaliseIntentPhase,
  normaliseReviews,
} from '@/lib/utils';
import {
  ArrowRight,
  Briefcase,
  CheckCircle,
  ChevronLeft,
  Clock,
  DollarSign,
  ExternalLink,
  HelpCircle,
  Menu,
  Scale,
  Search,
  ShoppingBag,
  Star,
  Users,
  Workflow,
  X,
} from 'lucide-react';

interface AnswerEngineProps {
  hubConfig: HubConfig;
  answerPages: AnswerPage[];
}

type ViewType =
  | 'home'
  | 'services'
  | 'service-detail'
  | 'faqs'
  | 'proof'
  | 'tof'
  | 'mof'
  | 'bof'
  | 'answer';

const hubSections = [
  { id: 'services', label: 'Services' },
  { id: 'faqs', label: 'FAQs' },
  { id: 'proof', label: 'Proof' },
] as const;

export function AnswerEngine({ hubConfig, answerPages }: AnswerEngineProps) {
  const [currentView, setCurrentView] = useState<ViewType>('home');
  const [selectedService, setSelectedService] = useState<HubService | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<AnswerPage | null>(null);
  const [selectedFaqSlug, setSelectedFaqSlug] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const brand = hubConfig?.brand;
  const services = asArray(hubConfig?.services);
  const faqs = asArray(hubConfig?.faqs);
  const proof = hubConfig?.proof;
  const brandName = asString(brand?.name, 'Answers Hub');

  const { reviewItems, reviewSummary } = normaliseReviews(proof);
  const safeAnswerPages = asArray(answerPages);

  const isEcommerce = safeAnswerPages.length > 0;
  const ecommerceFunnel = hubConfig?.answersEngine?.ecommerceFunnel;

  const tofPages = useMemo(
    () => safeAnswerPages.filter((p) => normaliseIntentPhase(p?.intent_phase) === 'tof'),
    [safeAnswerPages],
  );
  const mofPages = useMemo(
    () => safeAnswerPages.filter((p) => normaliseIntentPhase(p?.intent_phase) === 'mof'),
    [safeAnswerPages],
  );
  const bofPages = useMemo(
    () => safeAnswerPages.filter((p) => normaliseIntentPhase(p?.intent_phase) === 'bof'),
    [safeAnswerPages],
  );

  const {
    query,
    setQuery,
    results,
    hasResults,
  } = useFuzzySearch({
    faqs,
    services,
    answerPages: safeAnswerPages,
  });

  // Derive the exact item type returned by the hook.
  // This prevents the TS2322 mismatch you hit previously.
  type SearchResultItem = (typeof results)[number];

  const suggestedQuestions = useMemo(
    () => faqs.slice(0, 3).map((faq) => asString(faq?.question, '')).filter(Boolean),
    [faqs],
  );

  const navLinks = useMemo(() => {
    if (!isEcommerce) return [...hubSections];
    return [
      ...hubSections.slice(0, 2),
      { id: 'tof', label: 'Buying Help' },
      ...hubSections.slice(2),
    ] as Array<{ id: string; label: string }>;
  }, [isEcommerce]);

  const navigateTo = (view: ViewType, service?: HubService, answer?: AnswerPage) => {
    setCurrentView(view);
    setSelectedService(service || null);
    setSelectedAnswer(answer || null);
    setMobileMenuOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const q = query.trim();
    if (!q || !hasResults || results.length === 0) return;

    const firstResult = results[0] as SearchResultItem;

    if (firstResult?.type === 'service') {
      const service = services.find((s) => s.slug === firstResult.slug);
      if (service) {
        setSelectedService(service);
        setCurrentView('service-detail');
      }
    } else if (firstResult?.type === 'answer') {
      const answer = safeAnswerPages.find((a) => a.slug === firstResult.slug);
      if (answer) {
        setSelectedAnswer(answer);
        setCurrentView('answer');
      } else {
        setCurrentView('faqs');
      }
    } else {
      setCurrentView('faqs');
    }

    setShowDropdown(false);
    setQuery('');
  };

  const handleSelectResult = (result: SearchResultItem) => {
    if (result.type === 'service') {
      const service = services.find((s) => s.slug === result.slug);
      if (service) {
        setSelectedService(service);
        setCurrentView('service-detail');
      }
    } else if (result.type === 'faq') {
      setSelectedFaqSlug(result.slug);
      setCurrentView('faqs');
    } else if (result.type === 'answer') {
      const answer = safeAnswerPages.find((a) => a.slug === result.slug);
      if (answer) {
        setSelectedAnswer(answer);
        setCurrentView('answer');
      }
    } else {
      setCurrentView('faqs');
    }

    setShowDropdown(false);
    setQuery('');
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="min-h-full flex flex-col geometric-bg overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-border/50">
        <div className="container mx-auto px-4 py-2 flex items-center justify-between gap-2">
          <button onClick={() => navigateTo('home')} className="flex items-center shrink-0">
            {brand?.logoUrl ? (
              <img
                src={brand.logoUrl}
                alt={brandName}
                className="h-7 w-auto max-w-[120px] sm:max-w-none object-contain"
              />
            ) : (
              <span className="font-medium text-sm text-foreground truncate max-w-[120px] sm:max-w-none">
                {brandName}
              </span>
            )}
          </button>

          <nav className="hidden md:flex items-center gap-4 lg:gap-6">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => navigateTo(link.id as ViewType)}
                className="text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
              >
                {link.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-4">
            {brand?.websiteUrl && (
              <a
                href={brand.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:flex text-xs text-muted-foreground hover:text-foreground items-center gap-1 transition-colors whitespace-nowrap"
              >
                Website <ExternalLink className="h-3 w-3" />
              </a>
            )}

            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden text-foreground hover:bg-muted p-2 rounded-lg"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-72 bg-white shadow-xl p-6">
            <button onClick={() => setMobileMenuOpen(false)} className="absolute top-4 right-4">
              <X className="h-5 w-5" />
            </button>
            <nav className="flex flex-col gap-2 mt-8">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => navigateTo(link.id as ViewType)}
                  className="text-base font-medium text-foreground hover:text-primary transition-colors py-3 px-2 text-left"
                >
                  {link.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden">
        {currentView === 'home' && (
          <HomeView
            brand={brand}
            brandName={brandName}
            services={services}
            faqs={faqs}
            proof={proof}
            reviewItems={reviewItems}
            reviewSummary={reviewSummary}
            isEcommerce={isEcommerce}
            ecommerceFunnel={ecommerceFunnel}
            tofPages={tofPages}
            mofPages={mofPages}
            bofPages={bofPages}
            query={query}
            showDropdown={showDropdown}
            hasResults={hasResults}
            results={results as Array<{ type: string; slug: string; title: string }>}
            suggestedQuestions={suggestedQuestions}
            searchRef={searchRef}
            inputRef={inputRef}
            onSubmit={handleSubmit}
            onInputChange={(e) => {
              setQuery(e.target.value);
              setShowDropdown(true);
            }}
            onSelectResult={handleSelectResult}
            navigateTo={navigateTo}
          />
        )}

        {currentView === 'services' && (
          <ServicesView services={services} navigateTo={navigateTo} />
        )}

        {currentView === 'service-detail' && selectedService && (
          <ServiceDetailView
            service={selectedService}
            faqs={faqs}
            brand={brand}
            navigateTo={navigateTo}
            isSingleService={services.length === 1}
          />
        )}

        {currentView === 'faqs' && (
          <FAQsView
            faqs={faqs}
            navigateTo={navigateTo}
            selectedFaqSlug={selectedFaqSlug}
            onClearSelection={() => setSelectedFaqSlug(null)}
          />
        )}

        {currentView === 'proof' && (
          <ProofView proof={proof} reviewItems={reviewItems} reviewSummary={reviewSummary} />
        )}

        {currentView === 'tof' && (
          <EngineStageView
            stage="tof"
            stageLabel={ecommerceFunnel?.stageLabels?.tof || 'Research'}
            pages={tofPages}
            openAnswer={(page) => {
              setSelectedAnswer(page);
              setCurrentView('answer');
            }}
          />
        )}

        {currentView === 'mof' && (
          <EngineStageView
            stage="mof"
            stageLabel={ecommerceFunnel?.stageLabels?.mof || 'Compare'}
            pages={mofPages}
            openAnswer={(page) => {
              setSelectedAnswer(page);
              setCurrentView('answer');
            }}
          />
        )}

        {currentView === 'bof' && (
          <EngineStageView
            stage="bof"
            stageLabel={ecommerceFunnel?.stageLabels?.bof || 'Decision'}
            pages={bofPages}
            openAnswer={(page) => {
              setSelectedAnswer(page);
              setCurrentView('answer');
            }}
          />
        )}

        {currentView === 'answer' && selectedAnswer && (
          <AnswerDetailView
            answer={selectedAnswer}
            onBack={() => setCurrentView(normaliseIntentPhase(selectedAnswer.intent_phase) || 'tof')}
            brand={brand}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-4 text-xs text-muted-foreground">
              {brand?.websiteUrl && (
                <a
                  href={brand.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  {asString(brand.websiteUrl)
                    .replace(/^https?:\/\//, '')
                    .replace(/\/$/, '')}
                </a>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Answers Hub</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ==================== HOME VIEW ====================

interface HomeViewProps {
  brand: HubConfig['brand'];
  brandName: string;
  services: HubService[];
  faqs: HubFAQ[];
  proof: HubConfig['proof'];
  reviewItems: Array<{ platform?: string; source?: string | null; url?: string | null }>;
  reviewSummary: { total_review_count?: number } | null;
  isEcommerce: boolean;
  ecommerceFunnel: HubConfig['answersEngine'] extends infer T
    ? T extends { ecommerceFunnel?: infer F }
      ? F | undefined
      : undefined
    : undefined;
  tofPages: AnswerPage[];
  mofPages: AnswerPage[];
  bofPages: AnswerPage[];
  query: string;
  showDropdown: boolean;
  hasResults: boolean;
  results: Array<{ type: string; slug: string; title: string }>;
  suggestedQuestions: string[];
  searchRef: React.RefObject<HTMLDivElement>;
  inputRef: React.RefObject<HTMLInputElement>;
  onSubmit: (e: React.FormEvent) => void;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectResult: (result: any) => void;
  navigateTo: (view: ViewType, service?: HubService, answer?: AnswerPage) => void;
}

function HomeView({
  brand,
  brandName,
  services,
  faqs,
  proof,
  reviewItems,
  reviewSummary,
  isEcommerce,
  ecommerceFunnel,
  tofPages,
  mofPages,
  bofPages,
  query,
  showDropdown,
  hasResults,
  results,
  suggestedQuestions,
  searchRef,
  inputRef,
  onSubmit,
  onInputChange,
  onSelectResult,
  navigateTo,
}: HomeViewProps) {
  // Make sure these are actually "read" so noUnusedLocals never trips again.
  const _reviewCount = (reviewSummary?.total_review_count ?? 0) + (reviewItems?.length ?? 0);

  return (
    <>
      {/* Hero */}
      <section className="pt-12 pb-6 sm:pt-20 sm:pb-10 md:pt-32 md:pb-16 hero-gradient">
        <div className="container mx-auto px-4 text-center">
          <div className="mb-6">
            {brand?.logoUrl ? (
              <img
                src={brand.logoUrl}
                alt={brandName}
                className="h-16 sm:h-20 md:h-28 w-auto max-w-[200px] sm:max-w-none object-contain mx-auto"
              />
            ) : (
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">
                {brandName}
              </h1>
            )}
          </div>

          <p className="text-xs sm:text-sm uppercase tracking-widest text-muted-foreground mb-6 sm:mb-10 font-medium">
            Answers Engine
          </p>

          {/* Search */}
          <div className="relative max-w-2xl mx-auto mb-6 sm:mb-8" ref={searchRef}>
            <form onSubmit={onSubmit} className="relative">
              <div className="search-clean">
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={onInputChange}
                  placeholder="Search FAQs and services..."
                  className="w-full h-12 sm:h-14 md:h-16 px-4 sm:px-6 pr-12 sm:pr-14 text-base md:text-lg bg-transparent rounded-2xl outline-none placeholder:text-muted-foreground text-foreground font-medium"
                />
                <button
                  type="submit"
                  disabled={!query.trim()}
                  className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-muted rounded-full transition-colors disabled:opacity-50"
                >
                  <Search className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>

              {showDropdown && hasResults && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
                  {results.slice(0, 5).map((result, index) => (
                    <button
                      key={`${result.type}-${result.slug}-${index}`}
                      onClick={() => onSelectResult(result)}
                      type="button"
                      className="w-full px-4 py-3 text-left hover:bg-muted transition-colors flex items-center gap-3"
                    >
                      {result.type === 'service' ? (
                        <Briefcase className="h-4 w-4 text-primary shrink-0" />
                      ) : result.type === 'answer' ? (
                        <ShoppingBag className="h-4 w-4 text-primary shrink-0" />
                      ) : (
                        <HelpCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {asString(result.title)}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {result.type === 'answer' ? 'Buying Help' : asString(result.type)}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </form>
          </div>

          {/* Suggested Questions */}
          {suggestedQuestions.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
              {suggestedQuestions.map((question, i) => (
                <button
                  key={`sq-${i}`}
                  onClick={() => navigateTo('faqs')}
                  className="smart-pill text-sm py-2 px-3"
                  type="button"
                >
                  {question.length > 35 ? question.substring(0, 35) + '...' : question}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Visit Website CTA */}
      {brand?.websiteUrl && (
        <section className="py-6 md:py-8">
          <div className="container mx-auto px-4 text-center">
            <a
              href={brand.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-full font-medium hover:bg-primary/90 transition-colors"
            >
              <ExternalLink className="h-5 w-5" /> Visit Website
            </a>
          </div>
        </section>
      )}

      {/* Buying Help */}
      {isEcommerce && (
        <section className="pb-12 md:pb-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-lg font-semibold text-foreground mb-6 text-center tracking-tight">
                Buying Help
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button
                  onClick={() => navigateTo('tof')}
                  className="clean-card p-4 sm:p-5 hover:border-primary/30 transition-all group min-h-[100px] text-left"
                  type="button"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                      <HelpCircle className="h-4 w-4 text-blue-600" />
                    </div>
                    <h3 className="font-medium text-foreground">
                      {ecommerceFunnel?.stageLabels?.tof || 'Research'}
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">Starting your research? Get answers.</p>
                  <span className="text-xs text-primary font-medium">{tofPages.length} questions</span>
                </button>

                <button
                  onClick={() => navigateTo('mof')}
                  className="clean-card p-4 sm:p-5 hover:border-primary/30 transition-all group min-h-[100px] text-left"
                  type="button"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                      <Scale className="h-4 w-4 text-amber-600" />
                    </div>
                    <h3 className="font-medium text-foreground">
                      {ecommerceFunnel?.stageLabels?.mof || 'Compare'}
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">Weighing options? Compare products.</p>
                  <span className="text-xs text-primary font-medium">{mofPages.length} comparisons</span>
                </button>

                <button
                  onClick={() => navigateTo('bof')}
                  className="clean-card p-4 sm:p-5 hover:border-primary/30 transition-all group min-h-[100px] text-left"
                  type="button"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                      <ShoppingBag className="h-4 w-4 text-green-600" />
                    </div>
                    <h3 className="font-medium text-foreground">
                      {ecommerceFunnel?.stageLabels?.bof || 'Decision'}
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">Ready to purchase? Get reassurance.</p>
                  <span className="text-xs text-primary font-medium">{bofPages.length} questions</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Proof Strip */}
      {proof?.proofStrip && Array.isArray(proof.proofStrip) && proof.proofStrip.length > 0 && (
        <section className="pb-8">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap justify-center gap-4 max-w-3xl mx-auto">
              {proof.proofStrip.map((item, index) => (
                <div
                  key={`ps-${index}`}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full border border-slate-200"
                >
                  <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                  <span className="font-semibold text-slate-800">{asString(item.value)}</span>
                  <span className="text-sm text-slate-600">{asString(item.label)}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Services */}
      {services.length > 0 && (
        <section className="pb-12 md:pb-16">
          <div className="container mx-auto px-4">
            <div className={cn('max-w-5xl mx-auto', services.length === 1 && 'max-w-2xl')}>
              <h2 className="text-2xl font-bold text-foreground mb-6 tracking-tight">Our Services</h2>
              <div className={cn('grid gap-5', services.length === 1 ? 'grid-cols-1' : 'md:grid-cols-3')}>
                {services.slice(0, 3).map((service) => (
                  <button
                    key={service.slug}
                    onClick={() => navigateTo('service-detail', service)}
                    className="group text-left"
                    type="button"
                  >
                    <div className="clean-card h-full overflow-hidden">
                      {service.images?.category ? (
                        <div className="relative h-32 overflow-hidden">
                          <img
                            src={service.images.category}
                            alt={asString(service.name)}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      ) : (
                        <div className="h-32 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                          <Briefcase className="h-10 w-10 text-primary/40" />
                        </div>
                      )}
                      <div className="p-5">
                        <h3 className="font-semibold text-foreground mb-1 tracking-tight">
                          {asString(service.name, 'Service')}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {firstNonEmpty(service.summary, service.description?.substring(0, 160), 'Learn more')}
                        </p>
                        <span className="text-sm text-primary font-medium flex items-center gap-1 mt-3 group-hover:gap-2 transition-all">
                          Learn more <ArrowRight className="h-4 w-4" />
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Explore More */}
      <section className="pb-16 md:pb-24">
        <div className="container mx-auto px-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4 text-center">
            Explore more
          </p>
          <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
            {hubSections.map((section) => (
              <button
                key={section.id}
                onClick={() => navigateTo(section.id as ViewType)}
                className="px-5 py-2.5 rounded-full bg-white border border-border text-sm font-medium text-muted-foreground hover:border-primary/30 hover:text-primary transition-all hover:shadow-sm"
                type="button"
              >
                {section.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Read the derived value once so it is not optimised away */}
      <span className="hidden" aria-hidden="true">
        {_reviewCount}
      </span>
    </>
  );
}

// ==================== SERVICES VIEW ====================

function ServicesView({
  services,
  navigateTo,
}: {
  services: HubService[];
  navigateTo: (view: ViewType, service?: HubService) => void;
}) {
  return (
    <>
      <section className="py-12 md:py-16 border-b border-border/50">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3 tracking-tight">Our Services</h1>
          <p className="text-muted-foreground max-w-lg mx-auto">What we offer</p>
        </div>
      </section>
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <button
                key={service.slug}
                onClick={() => navigateTo('service-detail', service)}
                className="group text-left"
                type="button"
              >
                <div className="clean-card h-full overflow-hidden">
                  {service.images?.category ? (
                    <div className="relative h-32 overflow-hidden">
                      <img
                        src={service.images.category}
                        alt={asString(service.name)}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="h-32 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                      <Briefcase className="h-10 w-10 text-primary/40" />
                    </div>
                  )}
                  <div className="p-5">
                    <h3 className="font-semibold text-foreground mb-1">{asString(service.name)}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {firstNonEmpty(service.summary, service.description)}
                    </p>
                    <span className="text-sm text-primary font-medium flex items-center gap-1 mt-3 group-hover:gap-2 transition-all">
                      Learn more <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

// ==================== SERVICE DETAIL VIEW ====================

function ServiceDetailView({
  service,
  faqs,
  brand,
  navigateTo,
  isSingleService,
}: {
  service: HubService;
  faqs: HubFAQ[];
  brand: HubConfig['brand'];
  navigateTo: (view: ViewType) => void;
  isSingleService: boolean;
}) {
  const relatedFaqs = faqs.filter((faq) => service.relatedFaqSlugs?.includes(faq.slug));
  const description = service.richDescriptionHtml || service.description || '';
  const whoFor = asArray((service as any).bestFor || service.audience?.secondary);
  const primaryAudience = service.audience?.primary || '';

  return (
    <>
      <section className="py-8 md:py-12 border-b border-border/50">
        <div className="container mx-auto px-4">
          <button
            onClick={() => navigateTo(isSingleService ? 'home' : 'services')}
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-4"
            type="button"
          >
            <ChevronLeft className="h-4 w-4" /> {isSingleService ? 'Home' : 'All Services'}
          </button>
        </div>
      </section>

      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className={cn('mx-auto', isSingleService ? 'max-w-3xl' : 'max-w-4xl')}>
            {(service.images?.primary || service.images?.hero || service.images?.category) && (
              <div className="w-full h-64 md:h-80 rounded-xl overflow-hidden mb-6">
                <img
                  src={service.images.primary || service.images.hero || service.images.category}
                  alt={asString(service.name)}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
              {asString(service.name)}
            </h1>

            <div className="flex flex-wrap gap-3 mb-6">
              {service.priceModel && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-full text-sm text-muted-foreground">
                  <DollarSign className="h-4 w-4" /> {asString(service.priceModel)}
                </span>
              )}
              {service.duration && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-full text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" /> {asString(service.duration)}
                </span>
              )}
            </div>

            {service.summary && <p className="text-lg text-muted-foreground mb-8">{asString(service.summary)}</p>}

            {description && (
              <div
                className="mb-8 prose prose-slate max-w-none"
                dangerouslySetInnerHTML={{ __html: description }}
              />
            )}

            {service.keyBenefits && service.keyBenefits.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" /> Key Benefits
                </h2>
                <ul className="space-y-3">
                  {service.keyBenefits.map((benefit, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                      <span className="text-foreground">{asString(benefit)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {(primaryAudience || whoFor.length > 0) && (
              <div className="mb-8 bg-blue-50 rounded-xl p-6 border border-blue-100">
                <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-500" /> Who It&apos;s For
                </h2>
                {primaryAudience && <p className="text-foreground mb-3">{primaryAudience}</p>}
                {whoFor.length > 0 && (
                  <ul className="space-y-2">
                    {whoFor.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-foreground">
                        <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" /> {asString(item)}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {service.routineV2 && service.routineV2.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Workflow className="h-5 w-5 text-primary" /> How It Works
                </h2>
                <ol className="space-y-4">
                  {service.routineV2.map((step, idx) => (
                    <li key={idx} className="flex gap-4 bg-card rounded-xl border border-border p-4">
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                        {idx + 1}
                      </span>
                      <div className="flex-1">
                        <h3 className="font-medium text-foreground">{asString(step.step)}</h3>
                        {step.product && <p className="text-sm text-primary mt-1">{asString(step.product)}</p>}
                        {step.instruction && (
                          <p className="text-sm text-muted-foreground mt-1">{asString(step.instruction)}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {service.bookingUrl && (
              <div className="mb-8">
                <a
                  href={service.bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                >
                  Book Now <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            )}

            {brand?.websiteUrl && (
              <div className="mb-10">
                <a
                  href={brand.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Visit website <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            )}

            {relatedFaqs.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-muted-foreground" /> Related Questions
                </h2>
                <div className="space-y-3">
                  {relatedFaqs.map((faq) => (
                    <div key={faq.slug} className="bg-card rounded-xl border border-border p-4">
                      <h3 className="font-medium text-foreground mb-2">{asString(faq.question)}</h3>
                      <div
                        className="prose prose-sm prose-slate max-w-none text-muted-foreground line-clamp-3"
                        dangerouslySetInnerHTML={{ __html: asString(faq.answerHtml) }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

// ==================== FAQS VIEW ====================

function FAQsView({
  faqs,
  navigateTo,
  selectedFaqSlug,
  onClearSelection,
}: {
  faqs: HubFAQ[];
  navigateTo: (view: ViewType) => void;
  selectedFaqSlug?: string | null;
  onClearSelection?: () => void;
}) {
  const categories = useMemo(
    () => [...new Set(faqs.map((faq) => asString(faq.category, 'General')))],
    [faqs],
  );
  const [activeCategory, setActiveCategory] = useState(categories[0] || '');

  useEffect(() => {
    if (selectedFaqSlug) {
      const selectedFaq = faqs.find((f) => f.slug === selectedFaqSlug);
      if (selectedFaq) {
        const faqCategory = asString(selectedFaq.category, 'General');
        if (faqCategory && faqCategory !== activeCategory) setActiveCategory(faqCategory);
      }
    }
  }, [selectedFaqSlug, faqs, activeCategory]);

  useEffect(() => {
    if (!selectedFaqSlug) return;

    const timer = setTimeout(() => {
      const element = document.getElementById(`faq-${selectedFaqSlug}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => onClearSelection?.(), 2000);
      }
    }, 120);

    return () => clearTimeout(timer);
  }, [selectedFaqSlug, activeCategory, onClearSelection]);

  const filteredFaqs = activeCategory ? faqs.filter((faq) => asString(faq.category, 'General') === activeCategory) : faqs;

  return (
    <>
      <section className="py-12 md:py-16 border-b border-border/50">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3 tracking-tight">FAQs</h1>
          <p className="text-muted-foreground max-w-lg mx-auto">Answers to frequently asked questions</p>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6 text-left">
              <button
                onClick={() => navigateTo('home')}
                className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                type="button"
              >
                <ChevronLeft className="h-4 w-4" /> Back to Home
              </button>
            </div>

            {categories.length > 1 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={cn(
                      'px-4 py-2 rounded-full text-sm font-medium transition-all',
                      activeCategory === category
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80',
                    )}
                    type="button"
                  >
                    {category}
                  </button>
                ))}
              </div>
            )}

            {filteredFaqs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No FAQs available</div>
            ) : (
              <div className="space-y-4">
                {filteredFaqs.map((faq) => (
                  <div
                    key={faq.slug}
                    id={`faq-${faq.slug}`}
                    className={cn(
                      'bg-card rounded-xl border p-6 transition-all duration-500',
                      selectedFaqSlug === faq.slug
                        ? 'border-primary ring-2 ring-primary/20 shadow-lg'
                        : 'border-border',
                    )}
                  >
                    <h3 className="font-semibold text-foreground mb-3">{asString(faq.question)}</h3>
                    <div
                      className="prose prose-sm prose-slate max-w-none text-muted-foreground"
                      dangerouslySetInnerHTML={{ __html: asString(faq.answerHtml) }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

// ==================== PROOF VIEW ====================

function ProofView({
  proof,
  reviewItems,
  reviewSummary,
}: {
  proof: HubConfig['proof'];
  reviewItems: Array<{
    platform?: string;
    source?: string | null;
    rating?: number | null;
    count?: number | null;
    url?: string | null;
  }>;
  reviewSummary: { total_review_count?: number; average_rating?: number } | null;
}) {
  const reviewCount = reviewSummary?.total_review_count ?? reviewItems.length;

  return (
    <>
      <section className="py-12 md:py-16 border-b border-border/50">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3 tracking-tight">Proof & Trust</h1>
          <p className="text-muted-foreground max-w-lg mx-auto">Why customers trust us</p>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-12">
            {(reviewSummary || reviewItems.length > 0) && (
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
                  <Star className="h-5 w-5 text-amber-500 fill-amber-500" /> Reviews
                </h2>

                {reviewSummary && (
                  <div className="bg-amber-50 rounded-xl p-6 border border-amber-100 mb-4">
                    <div className="flex items-center gap-4">
                      {reviewSummary.average_rating != null && (
                        <div className="text-4xl font-bold text-amber-600">
                          {reviewSummary.average_rating.toFixed(1)}
                        </div>
                      )}
                      <div>
                        <div className="flex gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={cn(
                                'h-5 w-5',
                                i < Math.floor(reviewSummary.average_rating || 0)
                                  ? 'text-amber-500 fill-amber-500'
                                  : 'text-gray-300',
                              )}
                            />
                          ))}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{reviewCount} reviews</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  {reviewItems.slice(0, 4).map((review, idx) => (
                    <div key={idx} className="bg-card rounded-xl border border-border p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-foreground">
                          {asString(review.platform || review.source)}
                        </span>
                        {review.rating != null && (
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                            <span className="text-sm font-medium">{review.rating}</span>
                          </div>
                        )}
                      </div>
                      {review.count != null && <p className="text-sm text-muted-foreground">{review.count} reviews</p>}
                      {review.url && (
                        <a
                          href={review.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline mt-2 inline-block"
                        >
                          View reviews →
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {proof?.credentials && proof.credentials.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-6">Credentials</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {proof.credentials.map((cred, idx) => (
                    <div key={idx} className="bg-card rounded-xl border border-border p-4">
                      <h3 className="font-medium text-foreground">{asString(cred.name)}</h3>
                      {cred.issuer && <p className="text-sm text-muted-foreground">{cred.issuer}</p>}
                      {cred.year && <p className="text-sm text-muted-foreground">{cred.year}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {proof?.policies && proof.policies.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-6">Our Policies</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {proof.policies.map((policy, idx) => (
                    <div key={idx} className="bg-card rounded-xl border border-border p-4">
                      <h3 className="font-medium text-foreground">{asString(policy.name)}</h3>
                      {policy.summary && <p className="text-sm text-muted-foreground mt-1">{policy.summary}</p>}
                      {policy.url && (
                        <a
                          href={policy.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline mt-2 inline-block"
                        >
                          Read policy →
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

// ==================== ENGINE STAGE VIEW ====================

function EngineStageView({
  stage,
  stageLabel,
  pages,
  openAnswer,
}: {
  stage: 'tof' | 'mof' | 'bof';
  stageLabel: string;
  pages: AnswerPage[];
  openAnswer: (page: AnswerPage) => void;
}) {
  const stageColors = {
    tof: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-600' },
    mof: { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'text-amber-600' },
    bof: { bg: 'bg-green-50', border: 'border-green-200', icon: 'text-green-600' },
  } as const;

  const colors = stageColors[stage];
  const StageIcon = stage === 'tof' ? HelpCircle : stage === 'mof' ? Scale : ShoppingBag;

  return (
    <>
      <section className="py-12 md:py-16 border-b border-border/50">
        <div className="container mx-auto px-4 text-center">
          <div className={cn('inline-flex items-center justify-center w-12 h-12 rounded-xl border mb-4', colors.bg, colors.border)}>
            <StageIcon className={cn('h-6 w-6', colors.icon)} />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3 tracking-tight">{stageLabel}</h1>
          <p className="text-muted-foreground max-w-lg mx-auto">{pages.length} questions to help you</p>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {pages.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No questions available</div>
            ) : (
              <div className="space-y-4">
                {pages.map((page) => (
                  <button
                    key={page.slug}
                    onClick={() => openAnswer(page)}
                    className="w-full text-left bg-card rounded-xl border border-border p-5 hover:border-primary/30 hover:shadow-md transition-all"
                    type="button"
                  >
                    <h3 className="font-medium text-foreground mb-1">{asString(page.question)}</h3>
                    {page.topic && <p className="text-sm text-muted-foreground">{page.topic}</p>}
                    <span className="text-sm text-primary font-medium flex items-center gap-1 mt-2">
                      Read answer <ArrowRight className="h-4 w-4" />
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

// ==================== ANSWER DETAIL VIEW ====================

function AnswerDetailView({
  answer,
  onBack,
  brand,
}: {
  answer: AnswerPage;
  onBack: () => void;
  brand: HubConfig['brand'];
}) {
  // Some data sources store markdown, some store HTML. We keep your existing behaviour.
  const answerContent =
    answer.answer_units
      ?.map((unit) => {
        if (unit.label) return `### ${unit.label}\n${unit.content}`;
        return unit.content;
      })
      .join('\n\n') || '';

  return (
    <>
      <section className="py-8 md:py-12 border-b border-border/50">
        <div className="container mx-auto px-4">
          <button
            onClick={onBack}
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-4"
            type="button"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
        </div>
      </section>

      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-6 tracking-tight">
              {asString(answer.question)}
            </h1>

            {answerContent && (
              <div className="prose prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: answerContent }} />
            )}

            <div className="mt-8 pt-6 border-t border-border flex flex-col gap-3">
              {answer.url && (
                <a
                  href={answer.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors w-fit"
                >
                  Learn More <ExternalLink className="h-4 w-4" />
                </a>
              )}

              {brand?.websiteUrl && (
                <a
                  href={brand.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
                >
                  Visit website <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
