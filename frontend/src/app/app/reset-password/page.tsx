"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from 'next/navigation';
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/lib/supabaseClient";

export default function ResetPasswordPage() {
    const searchParams = useSearchParams();
    const [supabase] = useState<SupabaseClient | null>(() => getSupabaseClient());

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

        console.log("[ResetPassword] Tokens detectados na URL");
    }, [supabase]);

    // Calcular força da senha
    useEffect(() => {
        let strength = 0;
        if (newPassword.length >= 6) strength += 33;
        if (newPassword.length >= 8) strength += 33;
        if (/[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword)) strength += 17;
        if (/[0-9]/.test(newPassword)) strength += 8.5;
        if (/[^a-zA-Z0-9]/.test(newPassword)) strength += 8.5;
        setPasswordStrength(Math.min(strength, 100));
    }, [newPassword]);

    // Determinar categoria de força
    const getPasswordCategory = () => {
        if (newPassword.length < 6) return { label: "Fraca", color: "#EF4444", width: "33%" };
        if (passwordStrength < 50) return { label: "Fraca", color: "#EF4444", width: "33%" };
        if (passwordStrength < 75) return { label: "Média", color: "#F59E0B", width: "66%" };
        return { label: "Forte", color: "#10B981", width: "100%" };
    };

    const passwordCategory = getPasswordCategory();
    const isPasswordValid = newPassword.length >= 6 && passwordStrength >= 50;
    const isFormValid = isPasswordValid && newPassword === confirmPassword && newPassword && confirmPassword;

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

            setTimeout(() => {
                const returnTo = localStorage.getItem("vant_reset_return_to");
                const returnPlan = localStorage.getItem("vant_reset_return_plan");

                if (returnTo === "checkout") {
                    window.location.href = `/app?stage=checkout${returnPlan ? `&plan=${returnPlan}` : ""}`;
                } else {
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
                    <div style={{
                        width: 64,
                        height: 64,
                        background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto 24px",
                        fontSize: "1.5rem",
                        boxShadow: "0 4px 12px rgba(16, 185, 129, 0.4)"
                    }}>
                        ✓
                    </div>
                    <h2 style={{
                        color: "#F8FAFC",
                        fontSize: "1.5rem",
                        fontWeight: 600,
                        marginBottom: 8
                    }}>
                        Senha Atualizada!
                    </h2>
                    <p style={{
                        color: "#94A3B8",
                        fontSize: "0.95rem",
                        lineHeight: 1.5,
                        marginBottom: 24
                    }}>
                        Sua senha foi atualizada com sucesso.<br />
                        Você será redirecionado em instantes.
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
                width: "100%",
                boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)"
            }}>
                {/* Icon */}
                <div style={{
                    width: 64,
                    height: 64,
                    background: "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 32px",
                    fontSize: "1.5rem",
                    boxShadow: "0 4px 12px rgba(59, 130, 246, 0.4)"
                }}>
                    🔐
                </div>

                {/* Header */}
                <div style={{ textAlign: "center", marginBottom: 32 }}>
                    <h1 style={{
                        color: "#F8FAFC",
                        fontSize: "1.75rem",
                        fontWeight: 600,
                        marginBottom: 8
                    }}>
                        Nova Senha
                    </h1>
                    <p style={{
                        color: "#94A3B8",
                        fontSize: "0.95rem",
                        lineHeight: 1.5
                    }}>
                        Crie uma senha segura para sua conta
                    </p>
                </div>

                <form onSubmit={handleResetPassword} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    {/* Nova Senha */}
                    <div>
                        <label style={{
                            color: "#E2E8F0",
                            fontSize: "0.9rem",
                            fontWeight: 500,
                            marginBottom: 8,
                            display: "block"
                        }}>
                            Nova Senha
                        </label>
                        <div style={{ position: "relative", width: "100%" }}>
                            <input
                                type={showNewPassword ? "text" : "password"}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Mínimo 6 caracteres"
                                autoComplete="new-password"
                                required
                                style={{
                                    width: "100%",
                                    padding: "14px 48px 14px 16px",
                                    background: "rgba(15, 23, 42, 0.8)",
                                    border: "1px solid rgba(148, 163, 184, 0.3)",
                                    borderRadius: 8,
                                    color: "#F8FAFC",
                                    fontSize: "1rem",
                                    outline: "none",
                                    boxSizing: "border-box",
                                    transition: "all 0.2s"
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = "#3B82F6";
                                    e.target.style.background = "rgba(15, 23, 42, 0.9)";
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = "rgba(148, 163, 184, 0.3)";
                                    e.target.style.background = "rgba(15, 23, 42, 0.8)";
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                style={{
                                    position: "absolute",
                                    right: "12px",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    background: "none",
                                    border: "none",
                                    color: "#94A3B8",
                                    cursor: "pointer",
                                    padding: "4px",
                                    borderRadius: "4px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    transition: "all 0.2s ease"
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.color = "#F8FAFC";
                                    e.currentTarget.style.background = "rgba(148, 163, 184, 0.1)";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.color = "#94A3B8";
                                    e.currentTarget.style.background = "none";
                                }}
                            >
                                {showNewPassword ? (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                        <line x1="1" y1="1" x2="23" y2="23"></line>
                                    </svg>
                                ) : (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                        <circle cx="12" cy="12" r="3"></circle>
                                    </svg>
                                )}
                            </button>
                        </div>

                        {/* Password strength indicator */}
                        {newPassword && (
                            <div style={{ marginTop: 8 }}>
                                <div style={{
                                    height: 4,
                                    background: "rgba(148, 163, 184, 0.2)",
                                    borderRadius: 2,
                                    overflow: "hidden"
                                }}>
                                    <div style={{
                                        height: "100%",
                                        width: passwordCategory.width,
                                        background: passwordCategory.color,
                                        transition: "all 0.3s ease"
                                    }} />
                                </div>
                                <div style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    marginTop: 4
                                }}>
                                    <div></div>
                                    <p style={{
                                        color: passwordCategory.color,
                                        fontSize: "0.75rem",
                                        margin: 0,
                                        fontWeight: 500
                                    }}>
                                        {passwordCategory.label}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Confirmar Senha */}
                    <div>
                        <label style={{
                            color: "#E2E8F0",
                            fontSize: "0.9rem",
                            fontWeight: 500,
                            marginBottom: 8,
                            display: "block"
                        }}>
                            Confirmar Nova Senha
                        </label>
                        <div style={{ position: "relative", width: "100%" }}>
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Digite novamente"
                                autoComplete="new-password"
                                required
                                style={{
                                    width: "100%",
                                    padding: "14px 48px 14px 16px",
                                    background: "rgba(15, 23, 42, 0.8)",
                                    border: confirmPassword && confirmPassword !== newPassword
                                        ? "1px solid #EF4444"
                                        : "1px solid rgba(148, 163, 184, 0.3)",
                                    borderRadius: 8,
                                    color: "#F8FAFC",
                                    fontSize: "1rem",
                                    outline: "none",
                                    boxSizing: "border-box",
                                    transition: "all 0.2s"
                                }}
                                onFocus={(e) => {
                                    if (confirmPassword !== newPassword) {
                                        e.target.style.borderColor = "#EF4444";
                                    } else {
                                        e.target.style.borderColor = "#3B82F6";
                                    }
                                    e.target.style.background = "rgba(15, 23, 42, 0.9)";
                                }}
                                onBlur={(e) => {
                                    if (confirmPassword !== newPassword) {
                                        e.target.style.borderColor = "rgba(239, 68, 68, 0.5)";
                                    } else {
                                        e.target.style.borderColor = "rgba(148, 163, 184, 0.3)";
                                    }
                                    e.target.style.background = "rgba(15, 23, 42, 0.8)";
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                style={{
                                    position: "absolute",
                                    right: "12px",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    background: "none",
                                    border: "none",
                                    color: "#94A3B8",
                                    cursor: "pointer",
                                    padding: "4px",
                                    borderRadius: "4px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    transition: "all 0.2s ease"
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.color = "#F8FAFC";
                                    e.currentTarget.style.background = "rgba(148, 163, 184, 0.1)";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.color = "#94A3B8";
                                    e.currentTarget.style.background = "none";
                                }}
                            >
                                {showConfirmPassword ? (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                        <line x1="1" y1="1" x2="23" y2="23"></line>
                                    </svg>
                                ) : (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                        <circle cx="12" cy="12" r="3"></circle>
                                    </svg>
                                )}
                            </button>
                        </div>
                        {confirmPassword && confirmPassword !== newPassword && (
                            <p style={{
                                color: "#EF4444",
                                fontSize: "0.75rem",
                                marginTop: 4
                            }}>
                                As senhas não coincidem
                            </p>
                        )}
                    </div>

                    {/* Message */}
                    {message && (
                        <div style={{
                            padding: 12,
                            background: message.startsWith("✅")
                                ? "rgba(16, 185, 129, 0.1)"
                                : "rgba(239, 68, 68, 0.1)",
                            border: `1px solid ${message.startsWith("✅")
                                ? "#10B981"
                                : "#EF4444"}`,
                            borderRadius: 8,
                            color: message.startsWith("✅") ? "#10B981" : "#EF4444",
                            fontSize: "0.9rem",
                            textAlign: "center"
                        }}>
                            {message}
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading || !isFormValid}
                        style={{
                            width: "100%",
                            height: 56,
                            fontSize: "1.1rem",
                            background: isLoading || !isFormValid
                                ? "#64748B"
                                : "#10B981",
                            color: "#fff",
                            border: "none",
                            borderRadius: 10,
                            fontWeight: 700,
                            cursor: isLoading || !isFormValid
                                ? "not-allowed"
                                : "pointer",
                            opacity: isLoading || !isFormValid ? 0.5 : 1,
                            boxShadow: !isLoading && isFormValid
                                ? "0 4px 12px rgba(16, 185, 129, 0.4)"
                                : "none",
                            transition: "all 0.2s"
                        }}
                    >
                        {isLoading ? "Processando..." : "Atualizar Senha"}
                    </button>
                </form>

                {/* Back Link */}
                <div style={{ textAlign: "center", marginTop: 24 }}>
                    <a
                        href="/app"
                        style={{
                            color: "#94A3B8",
                            fontSize: "0.85rem",
                            textDecoration: "none",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            transition: "color 0.2s"
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.color = "#CBD5E1";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.color = "#94A3B8";
                        }}
                    >
                        ← Voltar para o app
                    </a>
                </div>
            </div>
        </div>
    );
}
