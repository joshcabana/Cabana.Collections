'use strict';

// Feature-flagged Stripe Checkout session creator for Vercel Functions
// Safe defaults: returns 503 when disabled or misconfigured

const Stripe = require('stripe');

function getBaseUrl(req) {
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
  return `${proto}://${host}`;
}

function parseJson(body) {
  if (!body) return {};
  if (typeof body === 'object') return body;
  try {
    return JSON.parse(body);
  } catch (_) {
    return {};
  }
}

function sanitizeLineItems(inputLineItems, baseUrl) {
  if (!Array.isArray(inputLineItems)) return [];
  return inputLineItems
    .slice(0, 50) // Stripe hard limit safeguard
    .map((it) => {
      const quantity = Math.max(1, Math.min(99, parseInt(it.quantity || 1, 10)));
      const unitAmount = Math.max(50, Math.min(99999999, parseInt(it.unit_amount || 0, 10))); // cents
      const name = String(it.name || 'CABANA Item').slice(0, 120);
      const image = it.image ? String(it.image) : null;
      const absoluteImage = image && image.startsWith('http') ? image : image ? `${baseUrl}${image}` : undefined;

      return {
        price_data: {
          currency: 'aud',
          unit_amount: unitAmount,
          product_data: {
            name,
            images: absoluteImage ? [absoluteImage] : [],
          },
        },
        quantity,
      };
    })
    .filter((li) => li.price_data.unit_amount > 0);
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Allow', 'POST');
    return res.end('Method Not Allowed');
  }

  // Server-side feature flag (separate from client flag)
  const serverCheckoutEnabled = String(process.env.CHECKOUT_ENABLED || 'false') === 'true';
  if (!serverCheckoutEnabled) {
    res.statusCode = 503;
    return res.json({ error: 'Checkout is currently disabled' });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    res.statusCode = 503;
    return res.json({ error: 'Stripe is not configured' });
  }

  const stripe = new Stripe(secretKey, { apiVersion: '2023-10-16' });

  const baseUrl = getBaseUrl(req);
  const successUrl = process.env.CHECKOUT_SUCCESS_URL || `${baseUrl}/cart.html?success=true`;
  const cancelUrl = process.env.CHECKOUT_CANCEL_URL || `${baseUrl}/cart.html?cancel=true`;

  const body = parseJson(req.body);
  const lineItems = sanitizeLineItems(body.lineItems || [], baseUrl);

  if (!lineItems.length) {
    res.statusCode = 400;
    return res.json({ error: 'No valid line items provided' });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      shipping_address_collection: { allowed_countries: ['AU', 'NZ', 'US', 'GB', 'CA'] },
      success_url: successUrl,
      cancel_url: cancelUrl,
      // Add minimal metadata for reconciliation (non-PII)
      metadata: {
        site: 'CABANA Collections',
        region: process.env.NEXT_PUBLIC_REGION || 'AU',
      },
    });

    // Prefer redirect via session.url to avoid needing Stripe.js on the client
    res.statusCode = 200;
    return res.json({ url: session.url, id: session.id });
  } catch (error) {
    console.error('Stripe session error:', error);
    res.statusCode = 500;
    return res.json({ error: 'Unable to create checkout session' });
  }
};


