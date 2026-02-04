import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AnswerEngine } from '@/components/AnswerEngine';
import type { HubConfig, AnswerPage } from '@/types/hub';

// Get businessId from environment variable
const BUSINESS_ID = import.meta.env.VITE_BUSINESS_ID || '';

function App() {
  const [hubConfig, setHubConfig] = useState<HubConfig | null>(null);
  const [answerPages, setAnswerPages] = useState<AnswerPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadHubConfig() {
      try {
        // Fetch hub.json from the business folder
        const hubPath = BUSINESS_ID 
          ? `/businesses/${BUSINESS_ID}/hub.json`
          : '/hub.json';
        
        const response = await fetch(hubPath);
        if (!response.ok) {
          throw new Error(`Failed to load hub.json: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Transform to HubConfig format if needed
        const config = transformToHubConfig(data);
        setHubConfig(config);
        
        // Extract answer pages
        const pages = (data.answerPages || data.answer_pages || []) as AnswerPage[];
        setAnswerPages(pages);
        
      } catch (err) {
        console.error('Error loading hub config:', err);
        setError(err instanceof Error ? err.message : 'Failed to load configuration');
      } finally {
        setLoading(false);
      }
    }

    loadHubConfig();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !hubConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md mx-auto p-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">Configuration Error</h1>
          <p className="text-muted-foreground mb-4">{error || 'Unable to load hub configuration'}</p>
          <p className="text-sm text-muted-foreground">
            Ensure hub.json is available at the expected path.
          </p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/*" 
          element={<AnswerEngine hubConfig={hubConfig} answerPages={answerPages} />} 
        />
      </Routes>
    </BrowserRouter>
  );
}

/**
 * Transform raw YAML/JSON data to HubConfig format
 */
function transformToHubConfig(data: Record<string, unknown>): HubConfig {
  // If it's already in HubConfig format (has 'brand' key)
  if (data.brand) {
    return data as unknown as HubConfig;
  }
  
  // Transform from V5 YAML format (has 'business' key)
  const business = data.business as Record<string, unknown> | undefined;
  
  return {
    brand: {
      name: (business?.name as string) || 'Answers Hub',
      websiteUrl: (business?.website as string) || '',
      logoUrl: (business?.logo_url as string) || undefined,
      faviconUrl: (business?.favicon_url as string) || undefined,
      tagline: (business?.tagline as string) || undefined,
      phone: (business?.phone as string) || undefined,
      email: (business?.email as string) || undefined,
      address: (business?.address as string) || undefined,
    },
    services: (data.services as HubConfig['services']) || [],
    faqs: (data.faqs as HubConfig['faqs']) || [],
    profiles: (data.profiles as HubConfig['profiles']) || [],
    proof: (data.proof as HubConfig['proof']) || {},
    visit: data.visit as HubConfig['visit'],
    answersEngine: data.answersEngine as HubConfig['answersEngine'],
    answerPages: (data.answer_pages || data.answerPages) as AnswerPage[] | undefined,
  };
}

export default App;
