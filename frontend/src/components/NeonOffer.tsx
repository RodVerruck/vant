"use client";

import type { PlanType } from "@/types";

interface NeonOfferProps {
    onSelectPlan: (planId: PlanType) => void;
    onCheckout: (planId: PlanType) => void;
    authUserId: string | null;
    creditsRemaining: number;
    timeRemaining: { hours: number; minutes: number; seconds: number };
    onUseCredit?: () => void;
    showHeader?: boolean;
}

function CheckCircle2Icon({ color = "#9CA3AF" }: { color?: string }) {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 12l2 2 4-4" />
            <circle cx="12" cy="12" r="9" />
        </svg>
    );
}

function LockIcon({ color = "#9CA3AF" }: { color?: string }) {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="11" width="18" height="10" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
    );
}

function AlertCircleIcon({ color = "#9CA3AF" }: { color?: string }) {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <line x1="12" y1="8" x2="12" y2="13" />
            <circle cx="12" cy="16" r="1" />
        </svg>
    );
}

export function NeonOffer({
    onSelectPlan,
    onCheckout,
    authUserId,
    creditsRemaining,
    timeRemaining,
    onUseCredit,
    showHeader = true,
}: NeonOfferProps) {

    const handlePlanAction = (planId: PlanType) => {
        onSelectPlan(planId);
        onCheckout(planId);
    };

    const hasActivePlan = !!authUserId && creditsRemaining > 0;

    return (
        <div>
            {showHeader && (
                <>
                    <div style={{ color: "#E2E8F0", fontSize: "1.2rem", fontWeight: 600, marginBottom: 14, textAlign: "center" }}>
                        Escolha seu plano
                    </div>
                    <div style={{ color: "#CBD5E1", fontSize: "0.9rem", marginBottom: 24, textAlign: "center" }}>
                        Desbloqueie análises completas e otimize múltiplos CVs
                    </div>
                </>
            )}

            {/* ARQUITETURA SAAS - "COMPARATIVO DESLEAL" (Growth Hacking Version) */}
            <div style={{ display: "flex", flexDirection: "column", gap: "24px", marginTop: showHeader ? 24 : 0 }}>

                {/* 1. HEADLINE DE CONVERSÃO */}
                <div style={{ textAlign: "center", marginBottom: 8 }}>
                    <h3 style={{ color: "#E2E8F0", fontSize: "1.2rem", fontWeight: 700, margin: "0 0 8px 0" }}>
                        Não aposte seu futuro em uma única vaga.
                    </h3>
                    <p style={{ color: "#CBD5E1", fontSize: "0.9rem", margin: 0, lineHeight: 1.5 }}>
                        Candidatos que aplicam para <strong>10+ vagas</strong> aumentam em 5x as chances de entrevista.<br />
                        Jogue o jogo dos números.
                    </p>
                </div>

                {/* CONTAINER DOS CARDS - Grid Responsivo */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "stretch" }}>

                    {/* CARD 1: SOLUÇÃO RÁPIDA (Âncora & Tripwire) - SECUNDÁRIO MAS ATIVO */}
                    <div style={{
                        flex: "1 1 300px",
                        background: "rgba(255, 255, 255, 0.08)",
                        border: "1px solid rgba(255, 255, 255, 0.18)",
                        borderRadius: 12,
                        padding: "28px",
                        backdropFilter: "blur(20px)",
                        WebkitBackdropFilter: "blur(20px)",
                        boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.08), 0 25px 50px -12px rgba(0, 0, 0, 0.5)",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        minHeight: 760
                    }}>
                        <div>
                            <div style={{ color: "#CBD5E1", fontSize: "0.8rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 6 }}>
                                CRÉDITOS AVULSOS
                            </div>
                            <div style={{ color: "#FFFFFF", fontSize: "1.2rem", fontWeight: 600, marginBottom: 8 }}>
                                <div style={{ fontSize: "0.75rem", color: "#CBD5E1", marginBottom: 2 }}>Pagamento Único</div>
                                R$ 12,90
                            </div>

                            <p style={{ color: "#CBD5E1", fontSize: "0.8rem", lineHeight: 1.4, marginBottom: 20 }}>
                                Ideal para ajustes pontuais ou se você já tem uma vaga específica em mente.
                            </p>

                            <div style={{ marginBottom: 14, paddingBottom: 14, borderBottom: "1px dashed rgba(148, 163, 184, 0.2)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                                    <span style={{ color: "#CBD5E1", fontWeight: 500 }}>1 Otimização</span>
                                    <span style={{ color: "#FFFFFF", fontWeight: 600 }}>R$ 12,90</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handlePlanAction("credit_1")}
                                    style={{
                                        width: "100%",
                                        background: "transparent",
                                        border: "1px solid #CBD5E1",
                                        color: "#CBD5E1",
                                        padding: "8px",
                                        borderRadius: 6,
                                        fontSize: "0.8rem",
                                        fontWeight: 500,
                                        cursor: "pointer",
                                        transition: "all 0.2s"
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = "rgba(203, 213, 225, 0.1)";
                                        e.currentTarget.style.borderColor = "#FFFFFF";
                                        e.currentTarget.style.color = "#FFFFFF";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = "transparent";
                                        e.currentTarget.style.borderColor = "#CBD5E1";
                                        e.currentTarget.style.color = "#CBD5E1";
                                    }}
                                >
                                    Comprar 1 Crédito
                                </button>
                            </div>

                            <div style={{ marginTop: 16, marginBottom: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                                <div style={{ display: "flex", gap: 10, alignItems: "center", color: "#E2E8F0", fontSize: "0.85rem" }}>
                                    <CheckCircle2Icon color="#9CA3AF" />
                                    <span>Análise básica de compatibilidade ATS</span>
                                </div>
                                <div style={{ display: "flex", gap: 10, alignItems: "center", color: "#E2E8F0", fontSize: "0.85rem" }}>
                                    <CheckCircle2Icon color="#9CA3AF" />
                                    <span>Download em PDF do currículo otimizado</span>
                                </div>
                                <div style={{ display: "flex", gap: 10, alignItems: "center", color: "#E2E8F0", fontSize: "0.85rem" }}>
                                    <CheckCircle2Icon color="#9CA3AF" />
                                    <span>Ideal para 1 candidatura imediata</span>
                                </div>
                            </div>

                            <div style={{ marginTop: 12, padding: 10, background: "rgba(16, 185, 129, 0.08)", borderRadius: 8, border: "1px solid rgba(16, 185, 129, 0.15)" }}>
                                <div style={{ color: "#E2E8F0", fontSize: "0.75rem", fontWeight: 600, marginBottom: 3 }}>Quer otimizar mais de 3 CVs?</div>
                                <div style={{ color: "#CBD5E1", fontSize: "0.74rem", fontWeight: 500 }}>O trial por R$ 1,99 é o melhor custo-benefício.</div>
                            </div>
                        </div>
                    </div>

                    {/* CARD 2: HERO SAAS (O Foco da Venda) - DESTACADO COM GLOW */}
                    <div style={{
                        flex: "1 1 300px",
                        background: "rgba(255, 255, 255, 0.06)",
                        border: "1px solid rgba(255, 255, 255, 0.12)",
                        borderRadius: 16,
                        padding: "28px",
                        position: "relative",
                        backdropFilter: "blur(20px)",
                        WebkitBackdropFilter: "blur(20px)",
                        boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.06), 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 60px rgba(16, 185, 129, 0.22)",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        minHeight: 760
                    }}>
                        <div style={{ position: "absolute", top: "12px", right: "12px", background: "rgba(16, 185, 129, 0.12)", color: "#6EE7B7", padding: "4px 10px", borderRadius: 999, border: "1px solid rgba(16, 185, 129, 0.25)", fontSize: "0.68rem", fontWeight: 500, letterSpacing: "0.25px", whiteSpace: "nowrap", textTransform: "uppercase" }}>
                            RECOMENDADO PELA IA
                        </div>

                        <div>
                            <div style={{ color: "#FFFFFF", fontWeight: 600, fontSize: "1.2rem", marginBottom: 20, textAlign: "center" }}>VANT PRO MENSAL</div>

                            <div style={{
                                background: "rgba(255, 255, 255, 0.06)",
                                border: "1px solid rgba(16, 185, 129, 0.18)",
                                borderRadius: 12,
                                padding: "20px",
                                marginBottom: 20,
                                textAlign: "center",
                                backdropFilter: "blur(20px)",
                                WebkitBackdropFilter: "blur(20px)",
                                boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.06), 0 0 35px -6px rgba(16, 185, 129, 0.22)"
                            }}>
                                <div style={{ color: "#6EE7B7", fontSize: "0.74rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 8 }}>
                                    Oferta por tempo limitado
                                </div>
                                <div style={{ color: "#CBD5E1", fontSize: "0.85rem", marginBottom: 6 }}>
                                    7 dias por
                                </div>
                                <div style={{ fontSize: "2.6rem", fontWeight: 700, color: "#FFFFFF", lineHeight: 1, marginBottom: 8, letterSpacing: "-0.02em", textShadow: "0 0 40px rgba(16, 185, 129, 0.45), 0 0 80px rgba(16, 185, 129, 0.15)" }}>
                                    R$ 1,99
                                </div>
                                <div style={{ color: "#F1F5F9", fontSize: "0.85rem", lineHeight: 1.4, marginBottom: 14 }}>
                                    Renova por apenas R$ 19,90/mês
                                </div>

                                <div style={{
                                    background: "rgba(255, 255, 255, 0.06)",
                                    border: "1px solid rgba(255, 255, 255, 0.12)",
                                    borderRadius: 8,
                                    padding: "10px",
                                    marginBottom: 12,
                                    backdropFilter: "blur(20px)",
                                    WebkitBackdropFilter: "blur(20px)",
                                    boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.06)"
                                }}>
                                    <div style={{ color: "#CBD5E1", fontSize: "0.74rem", fontWeight: 600, marginBottom: 4 }}>
                                        Mais de <strong style={{ color: "#FFFFFF" }}>50.000 profissionais</strong> já utilizaram a plataforma.
                                    </div>
                                    <div style={{ color: "#fff", fontSize: "0.88rem", fontWeight: 600 }}>
                                        Preço Travado para Sempre: R$ 19,90/mês
                                    </div>
                                    <div style={{ color: "#CBD5E1", fontSize: "0.7rem", marginTop: 2 }}>
                                        Assinou hoje, esse valor mensal nunca aumenta para sua conta.
                                    </div>
                                </div>

                                <div style={{ display: "flex", justifyContent: "center", marginTop: 12 }}>
                                    <div>
                                        <div style={{ color: "#CBD5E1", fontSize: "0.7rem", fontWeight: 600, marginBottom: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                                            ESSA CONDIÇÃO EXPIRA EM
                                        </div>
                                        <div style={{
                                            color: timeRemaining.hours === 0 && timeRemaining.minutes < 60 ? "#EF4444" : "#fff",
                                            fontSize: "1.3rem",
                                            fontWeight: 900,
                                            fontFamily: "monospace",
                                            animation: timeRemaining.hours === 0 && timeRemaining.minutes < 10 ? "pulse 1.5s infinite" : "none"
                                        }}>
                                            {String(timeRemaining.hours).padStart(2, '0')}:{String(timeRemaining.minutes).padStart(2, '0')}:{String(timeRemaining.seconds).padStart(2, '0')}
                                        </div>
                                    </div>
                                </div>
                                <style dangerouslySetInnerHTML={{
                                    __html: `
                                    @keyframes pulse {
                                        0%, 100% { opacity: 1; transform: scale(1); }
                                        50% { opacity: 0.8; transform: scale(1.05); }
                                    }
                                ` }} />
                            </div>

                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 16 }}>
                                <div style={{ height: 1, flex: 1, background: "linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.7))" }} />
                                <span style={{ color: "#6EE7B7", fontSize: "0.78rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1.5px", whiteSpace: "nowrap" }}>O que você ganha</span>
                                <div style={{ height: 1, flex: 1, background: "linear-gradient(90deg, rgba(16, 185, 129, 0.7), transparent)" }} />
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: 24 }}>
                                {[
                                    "30 Otimizações/mês",
                                    "Simulador de Entrevista IA",
                                    "Radar de Vagas Inteligente",
                                    "Custo por CV: R$ 0,93",
                                ].map((text, i) => (
                                    <div key={i} style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 10,
                                        padding: "10px 12px",
                                        background: "rgba(255, 255, 255, 0.03)",
                                        border: "1px solid rgba(16, 185, 129, 0.3)",
                                        borderRadius: 12,
                                        backdropFilter: "blur(10px)",
                                        WebkitBackdropFilter: "blur(10px)",
                                    }}>
                                        <div style={{
                                            width: 32,
                                            height: 32,
                                            borderRadius: "50%",
                                            background: "rgba(16, 185, 129, 0.15)",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            flexShrink: 0,
                                            boxShadow: "0 0 18px -2px rgba(16, 185, 129, 0.5)",
                                        }}>
                                            <CheckCircle2Icon color="#34D399" />
                                        </div>
                                        <span style={{ color: "#E2E8F0", fontSize: "0.82rem", fontWeight: 600, lineHeight: 1.3 }}>
                                            {text}
                                        </span>
                                    </div>
                                ))}
                                <div style={{
                                    gridColumn: "1 / -1",
                                    textAlign: "center",
                                    color: "#94A3B8",
                                    fontSize: "0.72rem",
                                    marginTop: 2
                                }}>
                                    (93% mais barato que créditos avulsos)
                                </div>
                            </div>

                            {/* CTA PRINCIPAL */}
                            <div style={{ marginBottom: 28, marginTop: 32 }}>
                                {hasActivePlan ? (
                                    <div style={{
                                        width: "100%",
                                        background: "rgba(15, 23, 42, 0.7)",
                                        border: "1px solid rgba(255, 255, 255, 0.1)",
                                        padding: "16px 20px",
                                        borderRadius: 12,
                                        textAlign: "center"
                                    }}>
                                        <div style={{ color: "#E2E8F0", fontSize: "0.9rem", fontWeight: 600, marginBottom: 6, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                                            <CheckCircle2Icon color="#10B981" />
                                            Você já é assinante PRO
                                        </div>
                                        <div style={{ color: "#CBD5E1", fontSize: "0.8rem", lineHeight: 1.5 }}>
                                            Você já tem {creditsRemaining} créditos disponíveis.<br />
                                            Precisa de mais? Compre créditos avulsos ao lado.
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => handlePlanAction("trial")}
                                        style={{ width: "100%", background: "linear-gradient(135deg, #10B981, #14B8A6)", color: "#fff", border: "none", padding: "18px", borderRadius: 12, fontSize: "1.05rem", fontWeight: 600, cursor: "pointer", boxShadow: "0 10px 28px -10px rgba(16, 185, 129, 0.55), 0 0 40px rgba(16, 185, 129, 0.28), 0 0 15px rgba(16, 185, 129, 0.5)", transition: "all 0.2s", textTransform: "uppercase", letterSpacing: "0.35px" }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = "translateY(-2px)";
                                            e.currentTarget.style.boxShadow = "0 14px 30px -12px rgba(16, 185, 129, 0.55), 0 0 34px rgba(16, 185, 129, 0.24)";
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = "translateY(0)";
                                            e.currentTarget.style.boxShadow = "0 10px 28px -12px rgba(16, 185, 129, 0.45), 0 0 28px rgba(16, 185, 129, 0.2)";
                                        }}
                                        onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.98)"}
                                        onMouseUp={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
                                    >
                                        Desbloquear Meu Novo Currículo - R$ 1,99
                                    </button>
                                )}
                            </div>

                            <div style={{
                                background: "rgba(255, 255, 255, 0.06)",
                                border: "1px solid rgba(255, 255, 255, 0.12)",
                                borderLeft: "2px solid #10B981",
                                borderRadius: 8,
                                padding: "14px",
                                marginTop: 16,
                                backdropFilter: "blur(20px)",
                                WebkitBackdropFilter: "blur(20px)",
                                boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.06), 0 25px 50px -12px rgba(0, 0, 0, 0.5)"
                            }}>
                                <div style={{ display: "flex", alignItems: "start", gap: 10, marginBottom: 10 }}>
                                    <LockIcon />
                                    <div>
                                        <div style={{ color: "#FFFFFF", fontSize: "0.9rem", fontWeight: 600, marginBottom: 4 }}>
                                            GARANTIA TOTAL DE 7 DIAS
                                        </div>
                                        <div style={{ color: "#CBD5E1", fontSize: "0.8rem", lineHeight: 1.5 }}>
                                            Teste sem risco. Não gostou? Devolvemos 100%<br />
                                            Sem perguntas, sem burocracia.
                                        </div>
                                    </div>
                                </div>
                                <div style={{ borderTop: "1px dashed rgba(148, 163, 184, 0.25)", paddingTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
                                    <AlertCircleIcon />
                                    <div style={{ color: "#CBD5E1", fontSize: "0.86rem", lineHeight: 1.45 }}>
                                        <strong style={{ color: "#FFFFFF" }}>Cancele online em 1 clique</strong> • Sem renovação automática forçada • Sem taxas escondidas
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
