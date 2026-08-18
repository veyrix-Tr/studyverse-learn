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
// options: { paymentSessionId, onSuccess, onFailure }
// (The backend decides TEST vs PROD via CASHFREE_MODE; the SDK works for both.)
const openCheckout = async ({
  paymentSessionId,
  onSuccess,
  onFailure,
}) => {
  if (!paymentSessionId) throw new Error('Missing payment session id');
  const Cashfree = await loadCashfreeSdk();

  const config = {
    paymentSessionId,
    redirectTarget: '_modal', // keep the user on the page; we verify via our backend
  };

  const checkout = Cashfree(config);
  checkout.redirect({
    onSuccess: (data) => onSuccess && onSuccess(data),
    onFailure: (data) => onFailure && onFailure(data),
  });
};

export { openCheckout, loadCashfreeSdk };
