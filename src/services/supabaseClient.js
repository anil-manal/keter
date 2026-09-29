import { createClient } from '@supabase/supabase-js';

let supabaseInstance = null;

export function isSupabaseConfigured() {
  const url = localStorage.getItem('keter_supabase_url') || import.meta.env.VITE_SUPABASE_URL || '';
  const key = localStorage.getItem('keter_supabase_key') || import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  return !!(url && key && !url.includes('dummy') && !key.includes('dummy') && url.startsWith('https://'));
}

export function getSupabase() {
  if (supabaseInstance) return supabaseInstance;

  try {
    if (!isSupabaseConfigured()) {
      return null;
    }

    const url = localStorage.getItem('keter_supabase_url') || import.meta.env.VITE_SUPABASE_URL;
    const key = localStorage.getItem('keter_supabase_key') || import.meta.env.VITE_SUPABASE_ANON_KEY;

    supabaseInstance = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
    return supabaseInstance;
  } catch (err) {
    console.warn('[Supabase] Failed to initialize client:', err.message);
  }
  return null;
}

// 1-Click OAuth Sign-In (Google)
export async function signInWithGoogle() {
  const client = getSupabase();
  if (!client) throw new Error('Supabase client is not initialized.');

  const redirectUrl = window.location.origin;
  const { data, error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
    },
  });

  if (error) throw error;
  return data;
}

// 1-Click OAuth Sign-In (GitHub)
export async function signInWithGitHub() {
  const client = getSupabase();
  if (!client) throw new Error('Supabase client is not initialized.');

  const redirectUrl = window.location.origin;
  const { data, error } = await client.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: redirectUrl,
    },
  });

  if (error) throw error;
  return data;
}

// Magic Link Sign-In (Email)
export async function signInWithMagicLink(email) {
  const client = getSupabase();
  if (!client) throw new Error('Supabase client is not initialized.');

  const redirectUrl = window.location.origin;
  const { data, error } = await client.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectUrl,
    },
  });

  if (error) throw error;
  return data;
}

// Sign Out
export async function signOutUser() {
  const client = getSupabase();
  if (!client) return;
  await client.auth.signOut();
  localStorage.removeItem('keter_user_profile');
}

// Get Active Session / User
export async function getActiveUser() {
  const client = getSupabase();
  if (!client) return null;

  try {
    const { data: { session }, error } = await client.auth.getSession();
    if (error || !session) return null;
    return session.user;
  } catch (err) {
    console.warn('[Supabase Auth] Session fetch error:', err.message);
    return null;
  }
}

// Get or Initialize User Profile with License State
export async function getUserProfile(user) {
  if (!user) return null;

  // Local cache fallback
  const cached = localStorage.getItem('keter_user_profile');
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (parsed.id === user.id) return parsed;
    } catch (e) {}
  }

  const client = getSupabase();
  if (client) {
    try {
      const { data, error } = await client
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data && !error) {
        localStorage.setItem('keter_user_profile', JSON.stringify(data));
        return data;
      }
    } catch (err) {
      console.warn('[Supabase Profile] Error reading profile table:', err.message);
    }
  }

  // Default initial profile for new/offline users
  const defaultProfile = {
    id: user.id,
    email: user.email,
    plan: 'free_trial',
    plan_status: 'active',
    free_credits_left: 10,
    expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14-day trial
    is_pro: false,
  };

  localStorage.setItem('keter_user_profile', JSON.stringify(defaultProfile));
  return defaultProfile;
}

// Realtime Channel Manager for Cellular/Cloud Companion Pairing
export function subscribeToRoomChannel(roomId, onMessage) {
  const client = getSupabase();
  if (!client || !roomId) return null;

  try {
    const channel = client.channel(`room:${roomId}`, {
      config: { broadcast: { self: false } },
    });

    channel
      .on('broadcast', { event: 'keter_event' }, (payload) => {
        if (payload?.payload && onMessage) {
          onMessage(payload.payload);
        }
      })
      .subscribe((status) => {
        console.log(`[Supabase Realtime] Room ${roomId} status:`, status);
      });

    return channel;
  } catch (err) {
    console.warn('[Supabase Realtime] Channel subscription failed:', err.message);
    return null;
  }
}

export function broadcastToRoomChannel(channel, message) {
  if (!channel) return;
  try {
    channel.send({
      type: 'broadcast',
      event: 'keter_event',
      payload: message,
    });
  } catch (err) {
    console.warn('[Supabase Realtime] Broadcast failed:', err.message);
  }
}
