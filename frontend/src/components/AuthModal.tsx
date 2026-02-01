"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

interface AuthModalProps {
    isOpen: boolean;
    onSuccess: (userId: string, email: string) => void;
    onClose: () => void;
    selectedPlan?: string;
}

export function AuthModal({ isOpen, onSuccess, onClose, selectedPlan }: AuthModalProps) {
    const [showEmailForm, setShowEmailForm] = useState(false);
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [authEmail, setAuthEmail] = useState("");
    const [authPassword, setAuthPassword] = useState("");
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [error, setError] = useState("");

    const supabase = typeof window !== "undefined"
        ? createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || "",
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
        )
        : null;

    if (!isOpen) return null;

    const handleGoogleAuth = async () => {
        setError("");
        if (!supabase) {
            setError("Supabase não configurado.");
            return;
        }

        setIsAuthenticating(true);

        try {
            // Salvar plano selecionado para restaurar após login
            if (typeof window !== "undefined" && selectedPlan) {
                localStorage.setItem("vant_auth_return_plan", selectedPlan);
                localStorage.setItem("vant_auth_return_stage", "checkout");
                console.log("[DEBUG] AuthModal Google - Salvando plano:", selectedPlan, "stage: checkout");
            }

            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: typeof window !== "undefined"
                        ? `${window.location.origin}/app`
                        : undefined,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    },
                },
            });

            if (error) throw error;
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : "Erro ao fazer login com Google";
            setError(message);
            setIsAuthenticating(false);
        }
    };

    const handleEmailPasswordAuth = async () => {
        setError("");

        if (!supabase) {
            setError("Supabase não configurado.");
            return;
        }

        if (!authEmail || !authEmail.includes("@")) {
            setError("Digite um e-mail válido.");
            return;
        }

        if (!authPassword || authPassword.length < 6) {
            setError("A senha deve ter no mínimo 6 caracteres.");
            return;
        }

        setIsAuthenticating(true);

        try {
            if (isLoginMode) {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email: authEmail,
                    password: authPassword,
                });

                if (error) throw error;

                if (data.user) {
                    onSuccess(data.user.id, data.user.email || "");
                }
            } else {
                const { data, error } = await supabase.auth.signUp({
                    email: authEmail,
                    password: authPassword,
                });

                if (error) throw error;

                if (data.user) {
                    onSuccess(data.user.id, data.user.email || "");
                }
            }
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : (isLoginMode ? "Erro ao fazer login" : "Erro ao criar conta");
            setError(message);
        } finally {
            setIsAuthenticating(false);
        }
    };

    return (
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "rgba(0, 0, 0, 0.8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 9999,
                padding: "20px",
            }}
            onClick={onClose}
        >
            <div
                style={{
                    background: "rgba(15, 23, 42, 0.95)",
                    border: "1px solid rgba(56, 189, 248, 0.3)",
                    borderRadius: 16,
                    padding: "32px",
                    maxWidth: 440,
                    width: "100%",
                    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div style={{ textAlign: "center", marginBottom: 24 }}>
                    <h2 style={{ color: "#F8FAFC", fontSize: "1.5rem", fontWeight: 800, marginBottom: 8 }}>
                        Criar conta para continuar
                    </h2>
                    <p style={{ color: "#94A3B8", fontSize: "0.9rem" }}>
                        Desbloqueie seu dossiê profissional completo
                    </p>
                </div>

                {!showEmailForm ? (
                    <>
                        <button
                            type="button"
                            onClick={handleGoogleAuth}
                            disabled={isAuthenticating}
                            style={{
                                width: "100%",
                                height: 52,
                                background: "#fff",
                                color: "#1f2937",
                                border: "1px solid rgba(255,255,255,0.2)",
                                borderRadius: 8,
                                fontSize: "1rem",
                                fontWeight: 600,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 12,
                                cursor: isAuthenticating ? "not-allowed" : "pointer",
                                opacity: isAuthenticating ? 0.6 : 1,
                                marginBottom: 16,
                            }}
                        >
                            <svg width="20" height="20" viewBox="0 0 18 18">
                                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" />
                                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" />
                                <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z" />
                                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" />
                            </svg>
                            {isAuthenticating ? "Autenticando..." : "Continuar com Google"}
                        </button>

                        <button
                            type="button"
                            onClick={() => setShowEmailForm(true)}
                            style={{
                                width: "100%",
                                background: "none",
                                border: "none",
                                color: "#64748B",
                                fontSize: "0.85rem",
                                cursor: "pointer",
                                textDecoration: "underline",
                                padding: "8px",
                            }}
                        >
                            Usar email
                        </button>
                    </>
                ) : (
                    <>
                        <div style={{ marginBottom: 12 }}>
                            <div style={{ color: "#94A3B8", fontSize: "0.85rem", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
                                E-mail
                            </div>
                            <input
                                type="email"
                                value={authEmail}
                                onChange={(e) => setAuthEmail(e.target.value)}
                                placeholder="voce@exemplo.com"
                                style={{
                                    width: "100%",
                                    boxSizing: "border-box",
                                    height: 44,
                                    padding: "10px 12px",
                                    background: "rgba(15, 23, 42, 0.6)",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    borderRadius: 6,
                                    color: "#F8FAFC",
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: 16 }}>
                            <div style={{ color: "#94A3B8", fontSize: "0.85rem", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
                                Senha
                            </div>
                            <input
                                type="password"
                                value={authPassword}
                                onChange={(e) => setAuthPassword(e.target.value)}
                                placeholder="Mínimo 6 caracteres"
                                style={{
                                    width: "100%",
                                    boxSizing: "border-box",
                                    height: 44,
                                    padding: "10px 12px",
                                    background: "rgba(15, 23, 42, 0.6)",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    borderRadius: 6,
                                    color: "#F8FAFC",
                                }}
                            />
                        </div>

                        <button
                            type="button"
                            onClick={handleEmailPasswordAuth}
                            disabled={isAuthenticating}
                            style={{
                                width: "100%",
                                height: 48,
                                background: "linear-gradient(135deg, #10B981, #38BDF8)",
                                color: "#fff",
                                border: "none",
                                borderRadius: 8,
                                fontSize: "1rem",
                                fontWeight: 600,
                                cursor: isAuthenticating ? "not-allowed" : "pointer",
                                opacity: isAuthenticating ? 0.6 : 1,
                                marginBottom: 12,
                            }}
                        >
                            {isAuthenticating ? "Autenticando..." : (isLoginMode ? "ENTRAR" : "CRIAR CONTA")}
                        </button>

                        <div style={{ textAlign: "center", marginBottom: 12 }}>
                            <button
                                type="button"
                                onClick={() => setIsLoginMode(!isLoginMode)}
                                style={{
                                    background: "none",
                                    border: "none",
                                    color: "#38BDF8",
                                    fontSize: "0.85rem",
                                    cursor: "pointer",
                                    textDecoration: "underline",
                                }}
                            >
                                {isLoginMode ? "Não tem conta? Criar agora" : "Já tem conta? Fazer login"}
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={() => setShowEmailForm(false)}
                            style={{
                                width: "100%",
                                background: "none",
                                border: "none",
                                color: "#64748B",
                                fontSize: "0.85rem",
                                cursor: "pointer",
                                textDecoration: "underline",
                                padding: "8px",
                            }}
                        >
                            ← Voltar para Google
                        </button>
                    </>
                )}

                {error && (
                    <div
                        style={{
                            marginTop: 12,
                            padding: 12,
                            background: "rgba(239, 68, 68, 0.1)",
                            border: "1px solid rgba(239, 68, 68, 0.3)",
                            borderRadius: 6,
                            color: "#EF4444",
                            fontSize: "0.85rem",
                        }}
                    >
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
}
