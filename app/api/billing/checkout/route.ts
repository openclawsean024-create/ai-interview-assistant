import { NextRequest, NextResponse } from 'next/server';

// Price IDs — set these in your Stripe dashboard and add to env vars
const PRICE_IDS: Record<string, string> = {
  pro: process.env.STRIPE_PRICE_PRO ?? '',
  business: process.env.STRIPE_PRICE_BUSINESS ?? '',
};

export async function POST(req: NextRequest) {
  try {
    const { plan, userId, email, successUrl, cancelUrl } = await req.json();

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Stripe not configured. Add STRIPE_SECRET_KEY to env vars.' },
        { status: 503 }
      );
    }

    const priceId = PRICE_IDS[plan];
    if (!priceId) {
      return NextResponse.json({ error: `Unknown plan: ${plan}` }, { status: 400 });
    }

    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'line_items[0][price]': priceId,
        'line_items[0][quantity]': '1',
        mode: 'subscription',
        success_url: successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgraded=1`,
        cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
        'customer_email': email,
        'metadata[userId]': userId,
        'metadata[plan]': plan,
      }),
    });

    if (!stripeRes.ok) {
      const err = await stripeRes.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.error?.message || 'Stripe error' },
        { status: stripeRes.status }
      );
    }

    const session = await stripeRes.json();
    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
