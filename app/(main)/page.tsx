'use client';

import { Suspense, useState, useEffect } from 'react'
import { ContentSkeleton } from '@/components/ui/loading-state'
import { HomeClientContent } from './home-client-content'
import { ErrorWrapper } from './error-wrapper'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Define the error type
type ErrorType = {
  message: string;
  name: string;
} | null;

// Define the state type
interface HomePageState {
  content: any[];
  ageGroups: any[];
  categories: any[];
  loading: boolean;
  error: ErrorType;
}

export default function HomePage() {
  const [data, setData] = useState<HomePageState>({
    content: [],
    ageGroups: [],
    categories: [],
    loading: true,
    error: null
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/content');
        
        if (!response.ok) {
          throw new Error('Nepavyko gauti turinio duomenų');
        }
        
        const data = await response.json();
        setData({
          content: data.content || [],
          ageGroups: data.ageGroups || [],
          categories: data.categories || [],
          loading: false,
          error: null
        });
      } catch (error) {
        console.error('Error fetching data:', error);
        setData(prev => ({
          ...prev,
          loading: false,
          error: {
            message: error instanceof Error ? error.message : 'Įvyko nežinoma klaida',
            name: error instanceof Error ? error.name : 'Klaida'
          }
        }));
      }
    }

    fetchData();
  }, []);

  if (data.loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="p-8">
          <ContentSkeleton count={6} />
        </div>
      </div>
    );
  }

  if (data.error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="p-8">
          <ErrorWrapper error={data.error} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4">
        <HomeClientContent 
          initialContent={data.content}
          ageGroups={data.ageGroups}
          categories={data.categories}
        />
      </div>
    </div>
  );
} 