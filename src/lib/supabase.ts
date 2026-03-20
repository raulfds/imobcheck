import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();

// Client-side Supabase client (anon key)
if (typeof window !== 'undefined' && supabaseUrl) {
    console.log('[Supabase Connect]', {
        endpoint: supabaseUrl.split('//')[1]?.split('.')[0],
        hasKey: !!supabaseAnonKey,
        mode: process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true' ? 'MOCK' : 'DB'
    });
}

export const supabase = createClient(
    supabaseUrl,
    supabaseAnonKey || 'placeholder',
    {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            storageKey: 'imobcheck-auth-session'
        },
        global: {
            headers: {
                'x-application-name': 'imobcheck'
            }
        }
    }
);

// Helper to check if Supabase is configured
export const isSupabaseConfigured =
    process.env.NEXT_PUBLIC_USE_MOCK_DATA !== 'true' &&
    supabaseUrl &&
    supabaseUrl.includes('supabase.co') &&
    supabaseAnonKey &&
    supabaseAnonKey.length > 20; // Basic check for a valid-looking JWT
