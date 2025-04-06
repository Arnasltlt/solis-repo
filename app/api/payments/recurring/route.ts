import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  return NextResponse.json(
    { 
      error: 'Recurring payment system coming soon', 
      message: 'The recurring payment system is currently under development and will be available shortly.' 
    },
    { status: 503 }
  );
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const userId = url.searchParams.get('userId');
  
  if (!userId) {
    return NextResponse.json(
      { error: 'User ID is required' },
      { status: 400 }
    );
  }
  
  return NextResponse.json({
    has_subscription: false,
    is_recurring: false,
    message: 'Payment system coming soon'
  });
}