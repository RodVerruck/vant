"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { DashboardLayout } from "@/components/DashboardLayout";
import { OptimizationHero } from "@/components/OptimizationHero";
import { HistoryGrid } from "@/components/HistoryGrid";
import { NewOptimizationModal } from "@/components/NewOptimizationModal";

function getApiUrl(): string {
    if (typeof window !== "undefined") {
        const isLocalhost =
            window.location.hostname === "localhost" ||
            window.location.hostname === "127.0.0.1";
        if (isLocalhost) return "http://127.0.0.1:8000";
    }
    return process.env.NEXT_PUBLIC_API_URL || "https://vant-vlgn.onrender.com";
}

interface UserStatus {
    has_active_plan: boolean;
    credits_remaining: number;
    plan: string | null;
}

export function DashboardClient() {
    const router = useRouter();

    // Auth state
    const [authUserId, setAuthUserId] = useState<string | null>(null);
    const [authEmail, setAuthEmail] = useState("");
    const [loading, setLoading] = useState(true);

    // User status
    const [creditsRemaining, setCreditsRemaining] = useState(0);
    const [isPremium, setIsPremium] = useState(false);

    // Modal state
    const [showOptModal, setShowOptModal] = useState(false);

    // Last CV state
    const [lastCV, setLastCV] = useState<{ has_last_cv: boolean; filename?: string; time_ago?: string; is_recent?: boolean; analysis_id?: string; job_description?: string } | null>(null);

    // Supabase client (single instance)
    const supabase = useMemo((): SupabaseClient | null => {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (!url || !key) return null;

        return createClient(url, key, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                storageKey: "vant-supabase-auth",
            },
        });
    }, []);

    // Initialize auth
    useEffect(() => {
        if (!supabase) {
            setLoading(false);
            return;
        }

        const client = supabase as SupabaseClient;

        const initAuth = async () => {
            const { data } = await client.auth.getSession();
            const user = data?.session?.user;

            if (user?.id) {
                setAuthUserId(user.id);
                setAuthEmail(user.email || "");

                // Load cached credits immediately
                const cached = localStorage.getItem("vant_cached_credits");
                if (cached) {
                    const n = parseInt(cached);
                    if (!isNaN(n)) setCreditsRemaining(n);
                }
            } else {
                // Not authenticated — redirect to app (landing)
                router.replace("/app");
                return;
            }

            setLoading(false);
        };

        initAuth();

        // Listen for auth changes
        const {
            data: { subscription },
        } = client.auth.onAuthStateChange((event, session) => {
            if (event === "SIGNED_IN" && session?.user) {
                setAuthUserId(session.user.id);
                setAuthEmail(session.user.email || "");
            } else if (event === "SIGNED_OUT") {
                setAuthUserId(null);
                setAuthEmail("");
                setCreditsRemaining(0);
                setIsPremium(false);
                localStorage.removeItem("vant_cached_credits");
                router.replace("/app");
            }
        });

        return () => subscription.unsubscribe();
    }, [supabase, router]);

    // Função para buscar último CV do usuário
    const fetchLastCV = async () => {
        if (!authUserId) return;
        try {
            console.log("[LastCV] Buscando último CV para usuário:", authUserId);
            const response = await fetch(`${getApiUrl()}/api/user/last-cv/${authUserId}`);
            if (!response.ok) {
                console.log("[LastCV] Nenhum CV encontrado ou erro na busca");
                setLastCV(null);
                return;
            }
            const data = await response.json();
            console.log("[LastCV] Dados recebidos:", data);
            setLastCV(data);
            try {
                localStorage.setItem('vant_last_cv', JSON.stringify(data));
            } catch (e) {
                console.error("[LastCV] Erro ao salvar no localStorage:", e);
            }
        } catch (error) {
            console.error("[LastCV] Erro ao buscar último CV:", error);
            setLastCV(null);
        }
    };

    // Fetch user status from backend
    useEffect(() => {
        if (!authUserId) return;

        const fetchStatus = async () => {
            try {
                const resp = await fetch(
                    `${getApiUrl()}/api/user/status/${authUserId}`
                );
                if (!resp.ok) return;

                const data: UserStatus = await resp.json();
                setCreditsRemaining(data.credits_remaining);
                setIsPremium(data.has_active_plan);

                // Update cache
                localStorage.setItem(
                    "vant_cached_credits",
                    String(data.credits_remaining)
                );
            } catch (err) {
                console.error("[Dashboard] Erro ao buscar status:", err);
            }
        };

        fetchStatus();
    }, [authUserId]);

    // Carregar último CV quando usuário for autenticado
    useEffect(() => {
        if (authUserId) {
            fetchLastCV();
        }
    }, [authUserId]);

    // Handle logout
    const handleLogout = async () => {
        if (supabase) {
            const client = supabase as SupabaseClient;
            await client.auth.signOut();
        }
    };

    // Open modal for new optimization (no redirect)
    const handleNewOptimization = () => {
        setShowOptModal(true);
    };

    // Navigate to /app for pricing/upgrade
    const handleUpgrade = () => {
        // Save return intent so /app can show pricing
        localStorage.setItem("vant_auth_return_stage", "pricing");
        router.push("/app");
    };

    // Handle opening a history item — navigate to /app which will load the report
    const handleOpenHistoryItem = (item: {
        id: string;
        created_at: string;
        job_description: string;
        target_role?: string;
        target_company?: string;
        category?: string;
        result_preview: {
            veredito: string;
            score_ats: number;
            gaps_count: number;
        };
    }) => {
        // Store the item ID so /app can fetch and display it
        localStorage.setItem("vant_dashboard_open_history_id", item.id);
        router.push("/app");
    };

    // Loading state
    if (loading) {
        return (
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: "100vh",
                    background: "#0F172A",
                    color: "#94A3B8",
                    fontSize: "1rem",
                    fontFamily: "'Outfit', sans-serif",
                }}
            >
                <div style={{ textAlign: "center" }}>
                    <div
                        style={{
                            width: 32,
                            height: 32,
                            border: "3px solid rgba(56, 189, 248, 0.2)",
                            borderTop: "3px solid #38BDF8",
                            borderRadius: "50%",
                            animation: "spin 0.8s linear infinite",
                            margin: "0 auto 16px",
                        }}
                    />
                    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                    Carregando Dashboard...
                </div>
            </div>
        );
    }

    // Not authenticated (shouldn't reach here due to redirect, but safety)
    if (!authUserId) {
        return null;
    }

    return (
        <>
            <DashboardLayout
                authEmail={authEmail}
                creditsRemaining={creditsRemaining}
                isPremium={isPremium}
                onLogout={handleLogout}
                onUpgrade={handleUpgrade}
            >
                <OptimizationHero
                    onNewOptimization={handleNewOptimization}
                    creditsRemaining={creditsRemaining}
                />

                <HistoryGrid
                    authUserId={authUserId}
                    onOpenItem={handleOpenHistoryItem}
                    onNewOptimization={handleNewOptimization}
                />
            </DashboardLayout>

            <NewOptimizationModal
                isOpen={showOptModal}
                onClose={() => setShowOptModal(false)}
                creditsRemaining={creditsRemaining}
                authUserId={authUserId}
                lastCV={lastCV}
            />
        </>
    );
}
