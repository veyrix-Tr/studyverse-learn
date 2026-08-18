// utils/cashfree.js
// Frontend helper that loads the Cashfree Web SDK and opens the checkout for a
// given payment_session_id. Handles the sandbox/production switch automatically:
// the SDK serves both modes from the same script — you point it at the session
// your backend created (the backend chose TEST vs PROD via CASHFREE_MODE).

let sdkPromise = null;

// Lazily inject the Cashfree Web SDK script (idempotent).
const loadCashfreeSdk = () => {
  if (window.Cashfree) return Promise.resolve(window.Cashfree);
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
    script.async = true;
    script.onload = () => resolve(window.Cashfree);
    script.onerror = () => reject(new Error('Failed to load Cashfree SDK'));
    document.head.appendChild(script);
  });

  return sdkPromise;
};

// Opens the Cashfree checkout for a payment_session_id.
// options: { paymentSessionId, mode, onSuccess, onFailure }
// mode is the backend's 'TEST' | 'PROD'; the SDK uses 'sandbox' | 'production'.
// The checkout() promise resolves with { error } | { redirect } | { paymentDetails };
// we only treat paymentDetails (a completed payment) as success — the caller then
// verifies the order against our backend before applying anything.
const openCheckout = async ({
  paymentSessionId,
  mode,
  onSuccess,
  onFailure,
}) => {
  if (!paymentSessionId) throw new Error('Missing payment session id');
  const Cashfree = await loadCashfreeSdk();

  const sdkMode = mode === 'TEST' ? 'sandbox' : 'production';
  const cashfree = Cashfree({ mode: sdkMode });

  try {
    const result = await cashfree.checkout({
      paymentSessionId,
      redirectTarget: '_self', // full-page redirect to Cashfree's hosted checkout
    });
    if (result && result.paymentDetails) {
      onSuccess && onSuccess(result);
    } else if (result && result.redirect) {
      // The tab is navigating out to the hosted checkout — this is not a failure.
      // Success/failure is reported when the user returns (via return_url → verify).
    } else {
      onFailure && onFailure(result);
    }
  } catch (err) {
    onFailure && onFailure(err);
  }
};

export { openCheckout, loadCashfreeSdk };
