(function(){
  // CABANA launch flags with safe defaults and environment-like overrides.
  // Sources (highest priority first): URL params (?checkout=1&auth=1),
  // localStorage (CABANA_FLAG_*), window globals (e.g. NEXT_PUBLIC_*), then defaults=false.

  function toBoolean(value) {
    if (value === true) return true;
    if (value === false) return false;
    if (value == null) return false;
    var normalized = String(value).toLowerCase().trim();
    return normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'on';
  }

  var urlParams = null;
  try {
    urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  } catch (_) {}

  var urlCheckout = urlParams ? urlParams.get('checkout') : null;
  var urlAuth = urlParams ? urlParams.get('auth') : null;

  var lsCheckout = null;
  var lsAuth = null;
  try {
    lsCheckout = localStorage.getItem('CABANA_FLAG_checkoutEnabled');
    lsAuth = localStorage.getItem('CABANA_FLAG_authEnabled');
  } catch (_) {}

  var win = typeof window !== 'undefined' ? window : {};
  var winCheckout = win.NEXT_PUBLIC_CHECKOUT_ENABLED || win.__CHECKOUT_ENABLED__;
  var winAuth = win.NEXT_PUBLIC_AUTH_ENABLED || win.__AUTH_ENABLED__;

  var checkoutEnabled = toBoolean(urlCheckout != null ? urlCheckout : (lsCheckout != null ? lsCheckout : winCheckout));
  var authEnabled = toBoolean(urlAuth != null ? urlAuth : (lsAuth != null ? lsAuth : winAuth));

  // Safe defaults for launch
  if (checkoutEnabled === false && urlCheckout == null && lsCheckout == null && winCheckout == null) {
    checkoutEnabled = false;
  }
  if (authEnabled === false && urlAuth == null && lsAuth == null && winAuth == null) {
    authEnabled = false;
  }

  win.CABANA_FLAGS = {
    checkoutEnabled: checkoutEnabled,
    authEnabled: authEnabled
  };

  // Optional: simple dev helper to persist overrides
  win.CABANA_SET_FLAGS = function(next) {
    try {
      if (next && typeof next.checkoutEnabled !== 'undefined') {
        localStorage.setItem('CABANA_FLAG_checkoutEnabled', next.checkoutEnabled ? 'true' : 'false');
      }
      if (next && typeof next.authEnabled !== 'undefined') {
        localStorage.setItem('CABANA_FLAG_authEnabled', next.authEnabled ? 'true' : 'false');
      }
    } catch (_) {}
    // Reload to apply
    try { win.location && win.location.reload && win.location.reload(); } catch (_) {}
  };
})();


