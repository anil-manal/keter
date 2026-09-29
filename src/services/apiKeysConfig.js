// API Key Configuration & Resolution Service
// Prioritizes User Custom Key (LocalStorage BYOK) -> Keter Managed Default (.env)
// Keeps Keter platform keys secure in .env without exposing them in UI inputs

export const KETER_DEFAULT_KEYS = {
  groq: (import.meta.env.VITE_GROQ_API_KEY || '').trim(),
  gemini: (import.meta.env.VITE_GEMINI_API_KEY || '').trim(),
  openai: (import.meta.env.VITE_OPENAI_API_KEY || '').trim(),
  deepgram: (import.meta.env.VITE_DEEPGRAM_API_KEY || '').trim(),
};

/**
 * Returns the effective API key for a given provider.
 * Priority:
 * 1. User's custom key entered in Settings (BYOK)
 * 2. Pre-configured Keter platform key in .env
 */
export function getEffectiveApiKey(provider, userCustomKeys = {}) {
  if (!provider) return '';
  const normalizedProvider = provider.toLowerCase();
  
  // 1. User custom key takes highest priority
  const userKey = (userCustomKeys?.[normalizedProvider] || '').trim();
  if (userKey) {
    return userKey;
  }

  // 2. Keter managed platform key from .env
  const defaultKey = KETER_DEFAULT_KEYS[normalizedProvider] || '';
  return defaultKey;
}

/**
 * Checks whether an API key is available (either custom or built-in)
 */
export function hasEffectiveApiKey(provider, userCustomKeys = {}) {
  return !!getEffectiveApiKey(provider, userCustomKeys);
}

/**
 * Checks whether Keter provides a managed default key for this provider via .env
 */
export function hasKeterManagedKey(provider) {
  if (!provider) return false;
  return !!KETER_DEFAULT_KEYS[provider.toLowerCase()];
}

/**
 * Checks whether the user has supplied their own custom key for this provider
 */
export function isUsingCustomKey(provider, userCustomKeys = {}) {
  if (!provider) return false;
  return !!(userCustomKeys?.[provider.toLowerCase()] || '').trim();
}
