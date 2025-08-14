// Cart calculation utilities - ALL VALUES IN CENTS
const CART_CONFIG = {
  CURRENCY: 'AUD',
  DONATION_RATE: 0.10, // 10%
  FREE_SHIP_THRESHOLD_CENTS: 20000, // $200 AUD
  DEFAULT_SHIPPING_CENTS: 1000, // $10 AUD
};

// Convert dollars to cents
function dollarsToCents(dollars) {
  return Math.round(dollars * 100);
}

// Convert cents to dollars
function centsToDollars(cents) {
  return cents / 100;
}

// Format as AUD currency
function formatAUD(cents) {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: CART_CONFIG.CURRENCY,
  }).format(centsToDollars(cents));
}

// Main cart calculation function
function calcCartTotals({ lineItems, discountsCents = 0, shippingCents = null }) {
  // Calculate subtotal in cents
  const subtotalCents = lineItems.reduce((sum, item) => {
    const itemCents = dollarsToCents(item.price);
    return sum + itemCents * item.quantity;
  }, 0);

  // Apply discounts
  const discountedSubtotalCents = Math.max(0, subtotalCents - discountsCents);

  // Check free shipping on DISCOUNTED subtotal
  const qualifiesFreeShip = discountedSubtotalCents >= CART_CONFIG.FREE_SHIP_THRESHOLD_CENTS;

  // Apply shipping
  const shippingAppliedCents = qualifiesFreeShip
    ? 0
    : shippingCents ?? CART_CONFIG.DEFAULT_SHIPPING_CENTS;

  // Calculate total
  const totalCents = discountedSubtotalCents + shippingAppliedCents;

  // Donation based on discounted subtotal (merchandise only, no shipping)
  const donationCents = Math.floor(discountedSubtotalCents * CART_CONFIG.DONATION_RATE);

  return {
    subtotalCents,
    discountsCents,
    discountedSubtotalCents,
    qualifiesFreeShip,
    shippingAppliedCents,
    totalCents,
    donationCents,
    remainingForFreeShipCents: Math.max(
      0,
      CART_CONFIG.FREE_SHIP_THRESHOLD_CENTS - discountedSubtotalCents
    ),
    freeShipProgressPercent: Math.min(
      100,
      Math.round((discountedSubtotalCents / CART_CONFIG.FREE_SHIP_THRESHOLD_CENTS) * 100)
    ),
  };
}

// Update free shipping UI
function updateFreeShippingUI(totals) {
  const banner = document.getElementById('free-ship-banner');
  const msg = document.querySelector('[data-free-ship-msg]');
  const bar = document.querySelector('[data-free-ship-bar]');
  const progressText = document.getElementById('shippingProgressText');
  const progressBar = document.getElementById('shippingProgressBar');

  // Update progress bar
  if (progressBar) {
    progressBar.style.width = `${totals.freeShipProgressPercent}%`;
  }

  // Update message
  const messageText =
    totals.remainingForFreeShipCents === 0
      ? "You've unlocked free shipping (Australia-wide)!"
      : `Spend ${formatAUD(totals.remainingForFreeShipCents)} more to unlock free shipping`;

  if (progressText) progressText.textContent = messageText;
  if (msg) msg.textContent = messageText;
  if (bar) bar.style.width = `${totals.freeShipProgressPercent}%`;

  // Show/hide banner
  if (banner) {
    banner.classList.remove('hidden');
  }
}


