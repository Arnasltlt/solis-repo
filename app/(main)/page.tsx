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

        const rawData = await response.text();
        let data;

        try {
          data = JSON.parse(rawData);
        } catch (parseError) {
          console.error('Failed to parse JSON response:', parseError);
          console.log('Raw response:', rawData.substring(0, 500));
          throw new Error('Serverio atsakymas nėra teisingo formato');
        }

        setData({
          content: Array.isArray(data.content) ? data.content : [],
          ageGroups: Array.isArray(data.ageGroups) ? data.ageGroups : [],
          categories: Array.isArray(data.categories) ? data.categories : [],
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