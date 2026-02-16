"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { DashboardLayout } from "@/components/DashboardLayout";
import { OptimizationHero } from "@/components/OptimizationHero";
import { HistoryGrid } from "@/components/HistoryGrid";
import { NewOptimizationModal } from "@/components/NewOptimizationModal";
import { getSupabaseClient } from "@/lib/supabaseClient";

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
    const [hasPlan, setHasPlan] = useState(false);
    const [isSyncingCredits, setIsSyncingCredits] = useState(false);

    // Modal state
    const [showOptModal, setShowOptModal] = useState(false);
    const [showContinueModal, setShowContinueModal] = useState(false);
    const [savedJobDescription, setSavedJobDescription] = useState<string | null>(null);
    const [savedFileName, setSavedFileName] = useState<string | null>(null);

    // Last CV state
    const [lastCV, setLastCV] = useState<{ has_last_cv: boolean; filename?: string; time_ago?: string; is_recent?: boolean; analysis_id?: string; job_description?: string } | null>(null);

    // Supabase client (single instance)
    const supabase = useMemo((): SupabaseClient | null => getSupabaseClient(), []);

    async function refreshUserStatus(userId: string): Promise<number> {
        try {
            const resp = await fetch(`${getApiUrl()}/api/user/status/${userId}`);
            if (resp.ok) {
                const data: UserStatus = await resp.json();
                const credits = data.credits_remaining || 0;
                const hasActivePlan = !!data.plan; // Verifica se tem plano ativo (trial, pro, etc)

                setCreditsRemaining(credits);
                setHasPlan(hasActivePlan);
                setIsPremium(hasActivePlan || credits > 0); // Pro se tem plano OU créditos
                localStorage.setItem("vant_cached_credits", String(credits));

                console.log("[Dashboard] Status atualizado:", { credits, hasPlan: hasActivePlan, plan: data.plan, isPremium: hasActivePlan || credits > 0 });

                return credits;
            }

            const entitlementResp = await fetch(`${getApiUrl()}/api/entitlements/status`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id: userId }),
            });

            if (entitlementResp.ok) {
                const entitlementData = await entitlementResp.json();
                const credits = Number(entitlementData.credits_remaining || 0);
                setCreditsRemaining(credits);
                localStorage.setItem("vant_cached_credits", String(credits));
                return credits;
            }
        } catch (error) {
            console.error("[Dashboard] Erro ao sincronizar status/créditos:", error);
        }

        return 0;
    }

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

                // 🚀 Sincronizar créditos ao entrar no dashboard
                console.log("[Dashboard] Sincronizando créditos na entrada...");
                await refreshUserStatus(user.id);
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
                await refreshUserStatus(authUserId);
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

    // Pós-pagamento: faz polling curto para evitar precisar recarregar manualmente
    useEffect(() => {
        if (!authUserId || loading) return;

        const justPaid = localStorage.getItem("vant_just_paid");
        if (!justPaid) return;

        setIsSyncingCredits(true);

        let attempts = 0;
        const maxAttempts = 10;
        const intervalMs = 1500;

        const runSync = async () => {
            attempts += 1;
            const credits = await refreshUserStatus(authUserId);
            if (credits > 0 || attempts >= maxAttempts) {
                if (attempts >= maxAttempts) {
                    localStorage.removeItem("vant_just_paid");
                }
                setIsSyncingCredits(false);
                clearInterval(timer);
            }
        };

        void runSync();
        const timer = window.setInterval(() => {
            void runSync();
        }, intervalMs);

        return () => {
            setIsSyncingCredits(false);
            clearInterval(timer);
        };
    }, [authUserId, loading]);

    // Detectar se acabou de pagar e tem CV/vaga salvos → mostrar modal "Continuar Análise?"
    useEffect(() => {
        if (!authUserId || loading) return;

        const justPaid = localStorage.getItem('vant_just_paid');
        const jobDesc = localStorage.getItem('vant_jobDescription');
        const fileName = localStorage.getItem('vant_file_name');

        if (justPaid && jobDesc && fileName) {
            console.log("[Dashboard] Pagamento recente detectado com CV/vaga salvos:", fileName);
            setSavedJobDescription(jobDesc);
            setSavedFileName(fileName);
            setShowContinueModal(true);
            localStorage.removeItem('vant_just_paid');
        } else if (justPaid) {
            localStorage.removeItem('vant_just_paid');
        }
    }, [authUserId, loading]);

    // Continuar análise com CV/vaga salvos
    const handleContinueAnalysis = () => {
        // Sinalizar para /app que deve iniciar processamento premium automaticamente
        localStorage.setItem('vant_auto_process', 'true');
        setShowContinueModal(false);
        router.push("/app");
    };

    // Modificar — ir para /app no hero para alterar CV/vaga
    const handleModifyAnalysis = () => {
        // Limpar dados salvos para que o usuário possa enviar novos
        localStorage.removeItem('vant_jobDescription');
        localStorage.removeItem('vant_file_name');
        localStorage.removeItem('vant_file_type');
        // Limpar arquivo do IndexedDB
        try {
            const req = indexedDB.open("vant_files", 1);
            req.onsuccess = () => {
                const db = req.result;
                const tx = db.transaction("files", "readwrite");
                tx.objectStore("files").delete("pending_cv");
                tx.oncomplete = () => db.close();
            };
        } catch { /* ignore */ }
        setShowContinueModal(false);
        router.push("/app");
    };

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
        // Se usuário tem plano mas sem créditos, ir direto ao checkout de crédito avulso
        if (hasPlan && creditsRemaining === 0) {
            localStorage.setItem("vant_auth_return_stage", "checkout");
            localStorage.setItem("vant_auth_return_plan", "credit_1");
            console.log("[Dashboard] Usuário Pro sem créditos, indo direto ao checkout de crédito avulso");
        } else {
            // Usuário Free: mostrar todas as opções de planos
            localStorage.setItem("vant_auth_return_stage", "pricing");
            console.log("[Dashboard] Usuário Free, mostrando opções de planos");
        }
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
                hasPlan={hasPlan}
                isSyncingCredits={isSyncingCredits}
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

            {/* Modal "Continuar Análise?" — aparece após pagamento com CV/vaga salvos */}
            {showContinueModal && (
                <div style={{
                    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                    background: "rgba(0, 0, 0, 0.75)", zIndex: 9999,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "'Outfit', sans-serif",
                }}>
                    <div style={{
                        background: "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)",
                        border: "1px solid rgba(56, 189, 248, 0.3)",
                        borderRadius: 16, padding: "32px 28px", maxWidth: 440, width: "90%",
                        boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
                    }}>
                        <div style={{ textAlign: "center", marginBottom: 24 }}>
                            <div style={{ fontSize: 40, marginBottom: 8 }}>🎉</div>
                            <h2 style={{ color: "#F8FAFC", fontSize: "1.3rem", fontWeight: 700, margin: "0 0 8px" }}>
                                Pagamento confirmado!
                            </h2>
                            <p style={{ color: "#94A3B8", fontSize: "0.9rem", margin: 0, lineHeight: 1.5 }}>
                                Seus créditos já estão disponíveis. Deseja prosseguir com a análise do seu CV?
                            </p>
                        </div>

                        <div style={{
                            background: "rgba(15, 23, 42, 0.6)", borderRadius: 10, padding: "14px 16px",
                            marginBottom: 24, border: "1px solid rgba(148, 163, 184, 0.1)",
                        }}>
                            <div style={{ color: "#CBD5E1", fontSize: "0.8rem", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                Dados salvos
                            </div>
                            <div style={{ color: "#F8FAFC", fontSize: "0.95rem", fontWeight: 600, marginBottom: 4 }}>
                                📄 {savedFileName}
                            </div>
                            {savedJobDescription && (
                                <div style={{ color: "#94A3B8", fontSize: "0.8rem", lineHeight: 1.4 }}>
                                    💼 {savedJobDescription.length > 80 ? savedJobDescription.substring(0, 80) + "..." : savedJobDescription}
                                </div>
                            )}
                        </div>

                        <div style={{ display: "flex", gap: 12 }}>
                            <button
                                onClick={handleModifyAnalysis}
                                style={{
                                    flex: 1, padding: "12px 16px", borderRadius: 10,
                                    background: "rgba(148, 163, 184, 0.1)",
                                    border: "1px solid rgba(148, 163, 184, 0.2)",
                                    color: "#CBD5E1", fontSize: "0.9rem", fontWeight: 600,
                                    cursor: "pointer", transition: "all 0.2s",
                                }}
                                onMouseOver={(e) => (e.currentTarget.style.background = "rgba(148, 163, 184, 0.2)")}
                                onMouseOut={(e) => (e.currentTarget.style.background = "rgba(148, 163, 184, 0.1)")}
                            >
                                Modificar
                            </button>
                            <button
                                onClick={handleContinueAnalysis}
                                style={{
                                    flex: 1, padding: "12px 16px", borderRadius: 10,
                                    background: "linear-gradient(135deg, #3B82F6, #2563EB)",
                                    border: "none", color: "#FFFFFF", fontSize: "0.9rem",
                                    fontWeight: 700, cursor: "pointer", transition: "all 0.2s",
                                    boxShadow: "0 4px 15px rgba(59, 130, 246, 0.3)",
                                }}
                                onMouseOver={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
                                onMouseOut={(e) => (e.currentTarget.style.transform = "translateY(0)")}
                            >
                                Prosseguir ✨
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
