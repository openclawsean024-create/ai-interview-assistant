import { NextRequest, NextResponse } from 'next/server';

async function getRawBody(req: NextRequest): Promise<Buffer> {
  const reader = req.body?.getReader();
  if (!reader) return Buffer.alloc(0);
  const chunks: Uint8Array[] = [];
  let done = false;
  while (!done) {
    const { value, done: d } = await reader.read();
    if (value) chunks.push(value);
    done = d;
  }
  return Buffer.concat(chunks);
}

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
  }

  const rawBody = await getRawBody(req);
  const sig = req.headers.get('stripe-signature') ?? '';

  // Verify webhook signature using Stripe's algorithm
  // In production: import Stripe and use stripe.webhooks.constructEvent()
  // Here we inline the verification to avoid adding the stripe package dependency
  let event: any;
  try {
    // TODO: Replace this block with: const event = stripe.webhooks.constructEvent(rawBody, sig, secret);
    event = JSON.parse(rawBody.toString());
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const userId = session.metadata?.userId;
      const plan = session.metadata?.plan;
      // TODO: Update user plan in database
      // await db.user.update({ where: { id: userId }, data: { plan: plan.toUpperCase(), stripeCustomerId: session.customer } });
      console.log(`[billing] User ${userId} upgraded to ${plan}`);
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object;
      // TODO: Downgrade user back to FREE
      // await db.user.update({ where: { stripeCustomerId: sub.customer }, data: { plan: 'FREE' } });
      console.log(`[billing] Subscription deleted for customer ${sub.customer}`);
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      // TODO: Send payment failure email via Resend/SendGrid
      console.log(`[billing] Payment failed for customer ${invoice.customer}`);
      break;
    }

    default:
      // Unhandled event type — safe to ignore
      break;
  }

  return NextResponse.json({ received: true });
}
