import { createClient, type SupabaseClient } from "@supabase/supabase-js";

declare global {
    // eslint-disable-next-line no-var
    var __vantSupabaseClient: SupabaseClient | null | undefined;
}

export function getSupabaseClient(): SupabaseClient | null {
    if (typeof window === "undefined") {
        return null;
    }

    if (globalThis.__vantSupabaseClient) {
        return globalThis.__vantSupabaseClient;
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
        return null;
    }

    globalThis.__vantSupabaseClient = createClient(url, key, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            storageKey: "vant-supabase-auth",
        },
    });

    return globalThis.__vantSupabaseClient;
}
