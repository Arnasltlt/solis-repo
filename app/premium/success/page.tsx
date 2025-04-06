'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { SparklesIcon } from '@heroicons/react/24/solid';

export default function PaymentSuccessPage() {
  const router = useRouter();

  const handleGoHome = () => {
    router.push('/');
  };

  return (
    <div className="container max-w-md py-12">
      <Card className="w-full">
        <CardHeader className="text-center">
          <SparklesIcon className="h-16 w-16 text-amber-500 mx-auto mb-4" />
          <CardTitle className="text-2xl">Coming Soon</CardTitle>
          <CardDescription>
            We're working on implementing our payment system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center mb-4">
            Our premium subscription service is under development and will be available shortly. 
            Thank you for your interest!
          </p>
        </CardContent>
        <CardFooter>
          <Button onClick={handleGoHome} className="w-full">
            Return to Home
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}