import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let singletonClient: SupabaseClient | null | undefined;

export function getSupabaseClient(): SupabaseClient | null {
    if (typeof window === "undefined") return null;

    if (singletonClient !== undefined) {
        return singletonClient;
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
        singletonClient = null;
        return singletonClient;
    }

    singletonClient = createClient(url, key, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            storageKey: "vant-supabase-auth",
        },
    });

    return singletonClient;
}
