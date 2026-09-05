import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export function getSupabaseConfig(): SupabaseConfig | null {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (
    !url ||
    !anonKey ||
    typeof url !== 'string' ||
    typeof anonKey !== 'string'
  ) {
    return null;
  }

  const trimmedUrl = url.trim();
  const trimmedKey = anonKey.trim();

  if (!trimmedUrl || !trimmedKey) {
    return null;
  }

  return { url: trimmedUrl, anonKey: trimmedKey };
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseConfig() !== null;
}

let clientInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (clientInstance) {
    return clientInstance;
  }

  const config = getSupabaseConfig();
  if (!config) {
    throw new Error(
      'Supabase client is not configured. Missing public URL or anon key.',
    );
  }

  clientInstance = createClient(config.url, config.anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  return clientInstance;
}

export function resetSupabaseClient(): void {
  clientInstance = null;
}

export function setMockSupabaseClient(mock: SupabaseClient | null): void {
  clientInstance = mock;
}
