// Razorpay Payment Service for Keter Copilot
// Per-Project ₹99 Pass Checkout

export function isValidRazorpayKey(key) {
  if (!key || typeof key !== 'string') return false;
  const trimmed = key.trim();
  return (
    (trimmed.startsWith('rzp_test_') || trimmed.startsWith('rzp_live_')) &&
    trimmed.length >= 18 &&
    trimmed !== 'rzp_test_keter99pass'
  );
}

// Official Keter Merchant Key ID (Set in .env or defaults to live key)
// Every user purchase of ₹99 routes straight to your Razorpay account
export const DEFAULT_MERCHANT_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_RtzXT2hcWgLWFp';

// Official Voucher / Promo Code configuration (Configured in .env, defaults to ANIL with 100% discount)
export const OFFICIAL_VOUCHER_CODE = (import.meta.env.VITE_VOUCHER_CODE || 'ANIL').trim().toUpperCase();
export const OFFICIAL_VOUCHER_DISCOUNT = parseInt(import.meta.env.VITE_VOUCHER_DISCOUNT || '100', 10);

export function validateVoucher(inputCode) {
  if (!inputCode || typeof inputCode !== 'string') return null;
  const normalized = inputCode.trim().toUpperCase();
  if (normalized === OFFICIAL_VOUCHER_CODE) {
    return {
      code: OFFICIAL_VOUCHER_CODE,
      discountPercent: OFFICIAL_VOUCHER_DISCOUNT,
      isUnlimited: true,
      description: `${OFFICIAL_VOUCHER_DISCOUNT}% OFF Unlimited VIP Pass`,
    };
  }
  return null;
}

export function getRazorpayKey() {
  if (isValidRazorpayKey(DEFAULT_MERCHANT_KEY_ID)) {
    return DEFAULT_MERCHANT_KEY_ID.trim();
  }
  const custom = localStorage.getItem('keter_razorpay_key');
  if (isValidRazorpayKey(custom)) return custom.trim();
  return null;
}

export function saveRazorpayKey(key) {
  if (!key) {
    localStorage.removeItem('keter_razorpay_key');
    return;
  }
  localStorage.setItem('keter_razorpay_key', key.trim());
}

export function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/**
 * Initiates Razorpay checkout if valid merchant key exists, or returns simulation flag
 */
export async function initiateRazorpayCheckout({
  amount = 99,
  projectTitle = 'Interview Session',
  userProfile = null,
  onSuccess,
  onFailure,
  onDismiss,
}) {
  const key = getRazorpayKey();

  if (!key) {
    if (onFailure) onFailure('No Razorpay merchant key configured.');
    return { success: false, error: 'NO_KEY' };
  }

  const loaded = await loadRazorpayScript();
  if (!loaded || !window.Razorpay) {
    if (onFailure) onFailure('Razorpay SDK failed to load. Please check your internet connection.');
    return { success: false, error: 'SDK_NOT_LOADED' };
  }

  try {
    const options = {
      key: key,
      amount: amount * 100, // paise (₹1 = 100 paise)
      currency: 'INR',
      name: 'Keter Copilot',
      description: `24-Hour Interview Project Pass (₹${amount})`,
      image: 'https://cdn-icons-png.flaticon.com/512/4712/4712035.png',
      prefill: {
        name: userProfile?.name || 'Candidate',
        email: userProfile?.email || 'candidate@gmail.com',
        contact: '9999999999',
      },
      notes: {
        item: '24h_interview_project_pass',
        project: projectTitle,
      },
      theme: {
        color: '#00f2fe',
      },
      handler: function (response) {
        if (response && response.razorpay_payment_id) {
          if (onSuccess) {
            onSuccess({
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              signature: response.razorpay_signature,
              amount,
            });
          }
        } else {
          if (onFailure) onFailure('Payment response did not include a valid payment ID.');
        }
      },
      modal: {
        ondismiss: function () {
          if (onDismiss) {
            onDismiss();
          } else if (onFailure) {
            onFailure('Payment dismissed by user.');
          }
        },
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', function (response) {
      console.warn('[Razorpay Payment Failed]', response.error);
      const errDetail = response.error?.description || response.error?.reason || 'Payment transaction failed.';
      if (onFailure) onFailure(errDetail);
    });

    rzp.open();
    return { success: true };
  } catch (err) {
    console.warn('[Razorpay Execution Error]', err);
    if (onFailure) onFailure(err.message || 'Razorpay checkout encountered an issue.');
    return { success: false, error: err.message };
  }
}
