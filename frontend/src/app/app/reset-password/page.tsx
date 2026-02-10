"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from 'next/navigation';
import { createClient, SupabaseClient } from "@supabase/supabase-js";

export default function ResetPasswordPage() {
    const searchParams = useSearchParams();
    const [supabase] = useState<SupabaseClient | null>(() => {
        if (typeof window === "undefined") return null;
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (!url || !key) return null;
        return createClient(url, key, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
            }
        });
    });

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);

    // Efeito para capturar o contexto da URL e salvar na sessão atual
    useEffect(() => {
        const returnTo = searchParams.get("return_to");
        const returnPlan = searchParams.get("return_plan");

        if (returnTo) {
            console.log("🔗 [ResetPage] Contexto detectado na URL:", returnTo);
            localStorage.setItem("vant_reset_return_to", returnTo);
            if (returnPlan) {
                localStorage.setItem("vant_reset_return_plan", returnPlan);
                console.log("🔗 [ResetPage] Plano detectado na URL:", returnPlan);
            }
        }
    }, [searchParams]);

    useEffect(() => {
        // Extrair tokens da URL quando a página carrega
        if (typeof window === "undefined" || !supabase) return;

        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");

        if (!accessToken || !refreshToken) {
            setMessage("❌ Link de recuperação inválido ou expirado.");
            return;
        }

        // Sessão já é restaurada automaticamente pelo Supabase com os tokens na URL
        console.log("[ResetPassword] Tokens detectados na URL");
    }, [supabase]);

    async function handleResetPassword(e: React.FormEvent) {
        e.preventDefault();

        if (!supabase) {
            setMessage("❌ Erro de configuração.");
            return;
        }

        if (newPassword.length < 6) {
            setMessage("❌ A senha deve ter no mínimo 6 caracteres.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setMessage("❌ As senhas não coincidem.");
            return;
        }

        setIsLoading(true);
        setMessage("");

        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;

            setIsSuccess(true);
            setMessage("✅ Senha atualizada com sucesso! Redirecionando...");

            // Verificar se deve retornar para o checkout
            setTimeout(() => {
                const returnTo = localStorage.getItem("vant_reset_return_to");
                const returnPlan = localStorage.getItem("vant_reset_return_plan");

                // Não limpar flags aqui - deixar a página principal limpar após restaurar

                if (returnTo === "checkout") {
                    // Retornar para o checkout com o plano selecionado
                    window.location.href = `/app?stage=checkout${returnPlan ? `&plan=${returnPlan}` : ""}`;
                } else {
                    // Redirecionamento padrão para o app
                    window.location.href = "/app";
                }
            }, 2000);

        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : "Erro ao atualizar senha";
            setMessage(`❌ ${msg}`);
        } finally {
            setIsLoading(false);
        }
    }

    if (isSuccess) {
        return (
            <div style={{
                minHeight: "100vh",
                background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 20,
                fontFamily: "system-ui, -apple-system, sans-serif"
            }}>
                <div style={{
                    background: "rgba(30, 41, 59, 0.8)",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(148, 163, 184, 0.2)",
                    borderRadius: 16,
                    padding: 40,
                    maxWidth: 400,
                    width: "100%",
                    textAlign: "center"
                }}>
                    <div style={{ fontSize: "3rem", marginBottom: 16 }}>🔐</div>
                    <h2 style={{ color: "#F8FAFC", fontSize: "1.5rem", marginBottom: 8 }}>
                        Senha Atualizada!
                    </h2>
                    <p style={{ color: "#94A3B8", marginBottom: 24 }}>
                        Sua senha foi atualizada com sucesso.
                    </p>
                    <div style={{
                        background: "rgba(16, 185, 129, 0.1)",
                        border: "1px solid #10B981",
                        borderRadius: 8,
                        padding: 12,
                        color: "#10B981",
                        fontSize: "0.9rem"
                    }}>
                        {message}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: "100vh",
            background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            fontFamily: "system-ui, -apple-system, sans-serif"
        }}>
            <div style={{
                background: "rgba(30, 41, 59, 0.8)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(148, 163, 184, 0.2)",
                borderRadius: 16,
                padding: 40,
                maxWidth: 400,
                width: "100%"
            }}>
                <div style={{ textAlign: "center", marginBottom: 32 }}>
                    <div style={{ fontSize: "3rem", marginBottom: 16 }}>🔐</div>
                    <h1 style={{ color: "#F8FAFC", fontSize: "1.8rem", marginBottom: 8 }}>
                        Nova Senha
                    </h1>
                    <p style={{ color: "#94A3B8", fontSize: "0.95rem" }}>
                        Digite sua nova senha abaixo
                    </p>
                </div>

                <form onSubmit={handleResetPassword} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    <div>
                        <label style={{ color: "#E2E8F0", fontSize: "0.9rem", marginBottom: 8, display: "block" }}>
                            Nova Senha
                        </label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Mínimo 6 caracteres"
                            autoComplete="new-password"
                            required
                            style={{
                                width: "100%",
                                padding: "14px 16px",
                                background: "rgba(15, 23, 42, 0.8)",
                                border: "1px solid rgba(148, 163, 184, 0.3)",
                                borderRadius: 8,
                                color: "#F8FAFC",
                                fontSize: "1rem",
                                outline: "none",
                                boxSizing: "border-box"
                            }}
                        />
                    </div>

                    <div>
                        <label style={{ color: "#E2E8F0", fontSize: "0.9rem", marginBottom: 8, display: "block" }}>
                            Confirmar Nova Senha
                        </label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Digite novamente"
                            autoComplete="new-password"
                            required
                            style={{
                                width: "100%",
                                padding: "14px 16px",
                                background: "rgba(15, 23, 42, 0.8)",
                                border: "1px solid rgba(148, 163, 184, 0.3)",
                                borderRadius: 8,
                                color: "#F8FAFC",
                                fontSize: "1rem",
                                outline: "none",
                                boxSizing: "border-box"
                            }}
                        />
                    </div>

                    {message && (
                        <div style={{
                            padding: 12,
                            background: message.startsWith("✅") ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                            border: `1px solid ${message.startsWith("✅") ? "#10B981" : "#EF4444"}`,
                            borderRadius: 8,
                            color: message.startsWith("✅") ? "#10B981" : "#EF4444",
                            fontSize: "0.9rem",
                            textAlign: "center"
                        }}>
                            {message}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        style={{
                            width: "100%",
                            height: 56,
                            fontSize: "1.1rem",
                            background: isLoading ? "#64748B" : "#10B981",
                            color: "#fff",
                            border: "none",
                            borderRadius: 10,
                            fontWeight: 700,
                            cursor: isLoading ? "wait" : "pointer",
                            boxShadow: "0 4px 12px rgba(16, 185, 129, 0.4)",
                            transition: "all 0.2s"
                        }}
                    >
                        {isLoading ? "Processando..." : "Atualizar Senha"}
                    </button>
                </form>

                <div style={{ textAlign: "center", marginTop: 24 }}>
                    <a
                        href="/app"
                        style={{
                            color: "#94A3B8",
                            fontSize: "0.85rem",
                            textDecoration: "none",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6
                        }}
                    >
                        ← Voltar para o app
                    </a>
                </div>
            </div>
        </div>
    );
}
