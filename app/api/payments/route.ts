import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  return NextResponse.json(
    { 
      error: 'Payment system coming soon', 
      message: 'The payment system is currently under development and will be available shortly.' 
    },
    { status: 503 }
  );
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const orderId = url.searchParams.get('orderId') || 'unknown';
  
  return NextResponse.json({
    success: true,
    order: {
      id: orderId,
      status: 'pending',
      message: 'Payment system coming soon'
    }
  });
}