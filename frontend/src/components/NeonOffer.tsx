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
                    <div style={{ color: "#E2E8F0", fontSize: "1.25rem", fontWeight: 800, marginBottom: 14, textAlign: "center" }}>
                        🚀 Escolha Seu Plano
                    </div>
                    <div style={{ color: "#94A3B8", fontSize: "0.9rem", marginBottom: 24, textAlign: "center" }}>
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
                    <p style={{ color: "#94A3B8", fontSize: "0.9rem", margin: 0, lineHeight: 1.5 }}>
                        Candidatos que aplicam para <strong>10+ vagas</strong> aumentam em 5x as chances de entrevista.<br />
                        Jogue o jogo dos números.
                    </p>
                </div>

                {/* CONTAINER DOS CARDS - Grid Responsivo */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "stretch" }}>

                    {/* CARD 1: SOLUÇÃO RÁPIDA (Âncora & Tripwire) - SECUNDÁRIO MAS ATIVO */}
                    <div style={{
                        flex: "1 1 300px",
                        background: "rgba(15, 23, 42, 0.4)",
                        border: "1px solid #334155",
                        borderRadius: 12,
                        padding: "20px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        minHeight: 760
                    }}>
                        <div>
                            <div style={{ color: "#CBD5E1", fontSize: "0.8rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 6 }}>
                                CRÉDITOS AVULSOS
                            </div>
                            <div style={{ color: "#FFFFFF", fontSize: "1.2rem", fontWeight: 600, marginBottom: 6 }}>
                                A partir de R$ 12,90
                            </div>

                            <p style={{ color: "#94A3B8", fontSize: "0.8rem", lineHeight: 1.4, marginBottom: 20 }}>
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
                                    <span style={{ color: "#22D3EE", fontWeight: 700 }}>✓</span>
                                    <span>Análise básica de compatibilidade ATS</span>
                                </div>
                                <div style={{ display: "flex", gap: 10, alignItems: "center", color: "#E2E8F0", fontSize: "0.85rem" }}>
                                    <span style={{ color: "#22D3EE", fontWeight: 700 }}>✓</span>
                                    <span>Download em PDF do currículo otimizado</span>
                                </div>
                                <div style={{ display: "flex", gap: 10, alignItems: "center", color: "#E2E8F0", fontSize: "0.85rem" }}>
                                    <span style={{ color: "#22D3EE", fontWeight: 700 }}>✓</span>
                                    <span>Ideal para 1 candidatura imediata</span>
                                </div>
                            </div>

                            <div style={{ marginTop: 12, padding: 10, background: "rgba(56, 189, 248, 0.1)", borderRadius: 6, border: "1px solid rgba(56, 189, 248, 0.2)" }}>
                                <div style={{ color: "#38BDF8", fontSize: "0.75rem", fontWeight: 500, marginBottom: 3 }}>💡 Quer otimizar mais de 3 CVs?</div>
                                <div style={{ color: "#94A3B8", fontSize: "0.7rem" }}>Trial por R$ 1,99 é melhor negócio!</div>
                            </div>
                        </div>
                    </div>

                    {/* CARD 2: HERO SAAS (O Foco da Venda) - DESTACADO COM GLOW */}
                    <div style={{
                        flex: "1 1 300px",
                        background: "linear-gradient(145deg, rgba(16, 185, 129, 0.1), rgba(6, 78, 59, 0.4))",
                        border: "2px solid #10B981",
                        borderRadius: 16,
                        padding: "24px",
                        position: "relative",
                        boxShadow: "0 0 40px rgba(16, 185, 129, 0.4), 0 0 80px rgba(16, 185, 129, 0.15), inset 0 0 20px rgba(16, 185, 129, 0.1)",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        minHeight: 760,
                        transform: "scale(1.02)",
                        transition: "all 0.3s ease"
                    }}>
                        <div style={{ position: "absolute", top: "-18px", left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg, #34D399, #10B981)", color: "#fff", padding: "6px 18px", borderRadius: 999, border: "1px solid rgba(236, 253, 245, 0.7)", fontSize: "0.78rem", fontWeight: 900, letterSpacing: "0.7px", boxShadow: "0 8px 20px rgba(16, 185, 129, 0.45)", whiteSpace: "nowrap", textTransform: "uppercase" }}>
                            RECOMENDADO PELA IA
                        </div>

                        <div>
                            <div style={{ color: "#10B981", fontWeight: 800, fontSize: "1.4rem", marginBottom: 20, textAlign: "center" }}>VANT PRO MENSAL</div>

                            <div style={{
                                background: "linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(245, 158, 11, 0.15))",
                                border: "2px solid #EF4444",
                                borderRadius: 12,
                                padding: "18px",
                                marginBottom: 20,
                                textAlign: "center",
                                boxShadow: "0 0 20px rgba(239, 68, 68, 0.3)"
                            }}>
                                <div style={{ color: "#EF4444", fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8 }}>
                                    🔥 OFERTA POR TEMPO LIMITADO
                                </div>
                                <div style={{ fontSize: "2.2rem", fontWeight: 900, color: "#fff", lineHeight: 1, marginBottom: 6 }}>
                                    7 DIAS POR R$ 1,99
                                </div>
                                <div style={{ color: "#CBD5E1", fontSize: "0.85rem", lineHeight: 1.4, marginBottom: 12 }}>
                                    Renova por apenas R$ 19,90/mês
                                </div>

                                <div style={{
                                    background: "rgba(245, 158, 11, 0.2)",
                                    border: "1px solid rgba(245, 158, 11, 0.4)",
                                    borderRadius: 8,
                                    padding: "10px",
                                    marginBottom: 12
                                }}>
                                    <div style={{ color: "#F59E0B", fontSize: "0.75rem", fontWeight: 700, marginBottom: 4 }}>
                                        👥 JUNTE-SE A <strong style={{ color: "#10B981" }}>50.000+</strong> PROFISSIONAIS:
                                    </div>
                                    <div style={{ color: "#fff", fontSize: "0.9rem", fontWeight: 700 }}>
                                        Preço Vitalício de R$ 19,90/mês garantido
                                    </div>
                                    <div style={{ color: "#94A3B8", fontSize: "0.7rem", marginTop: 2 }}>
                                        (Desconto de 30% aplicado automaticamente)
                                    </div>
                                </div>

                                <div style={{ display: "flex", justifyContent: "center", marginTop: 12 }}>
                                    <div>
                                        <div style={{ color: "#F59E0B", fontSize: "0.7rem", fontWeight: 600, marginBottom: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
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

                            <div style={{ color: "#E2E8F0", fontSize: "0.9rem", lineHeight: 1.6, marginBottom: 20, textAlign: "center" }}>
                                O que você ganha:
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: 24 }}>
                                <div style={{ display: "flex", gap: 10, alignItems: "center", fontSize: "0.9rem", color: "#E2E8F0" }}>
                                    <div style={{ color: "#10B981", fontSize: "1rem" }}>✓</div>
                                    <span><strong>30 Otimizações/mês</strong></span>
                                </div>
                                <div style={{ display: "flex", gap: 10, alignItems: "center", fontSize: "0.9rem", color: "#E2E8F0" }}>
                                    <div style={{ color: "#10B981", fontSize: "1rem" }}>✓</div>
                                    <span><strong>Simulador de Entrevista IA</strong></span>
                                </div>
                                <div style={{ display: "flex", gap: 10, alignItems: "center", fontSize: "0.9rem", color: "#E2E8F0" }}>
                                    <div style={{ color: "#10B981", fontSize: "1rem" }}>✓</div>
                                    <span><strong>Radar de Vagas Inteligente</strong></span>
                                </div>
                                <div style={{ display: "flex", gap: 10, alignItems: "center", fontSize: "0.9rem", color: "#E2E8F0" }}>
                                    <div style={{ color: "#10B981", fontSize: "1rem" }}>✓</div>
                                    Custo por CV: <strong>Apenas R$ 0,93</strong>
                                </div>
                                <div style={{
                                    color: "#94A3B8",
                                    fontSize: "0.75rem",
                                    marginTop: 4
                                }}>
                                    (93% mais barato que créditos avulsos)
                                </div>
                            </div>

                            {/* CTA PRINCIPAL */}
                            <div style={{ marginBottom: 28 }}>
                                {hasActivePlan ? (
                                    <div style={{
                                        width: "100%",
                                        background: "rgba(16, 185, 129, 0.1)",
                                        border: "1px solid rgba(16, 185, 129, 0.3)",
                                        padding: "16px 20px",
                                        borderRadius: 12,
                                        textAlign: "center"
                                    }}>
                                        <div style={{ color: "#10B981", fontSize: "0.9rem", fontWeight: 700, marginBottom: 6 }}>
                                            ✅ Você já é assinante PRO!
                                        </div>
                                        <div style={{ color: "#94A3B8", fontSize: "0.8rem", lineHeight: 1.5 }}>
                                            Você já tem {creditsRemaining} créditos disponíveis.<br />
                                            Precisa de mais? Compre créditos avulsos ao lado.
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => handlePlanAction("trial")}
                                        style={{ width: "100%", background: "linear-gradient(135deg, #10B981, #059669)", color: "#fff", border: "none", padding: "20px", borderRadius: 12, fontSize: "1.15rem", fontWeight: 800, cursor: "pointer", boxShadow: "0 6px 20px rgba(16, 185, 129, 0.5)", transition: "all 0.2s", textTransform: "uppercase", letterSpacing: "0.5px" }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = "translateY(-2px)";
                                            e.currentTarget.style.boxShadow = "0 8px 25px rgba(16, 185, 129, 0.6)";
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = "translateY(0)";
                                            e.currentTarget.style.boxShadow = "0 6px 20px rgba(16, 185, 129, 0.5)";
                                        }}
                                        onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.98)"}
                                        onMouseUp={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
                                    >
                                        Desbloquear Meu Novo Currículo - R$ 1,99 🚀
                                    </button>
                                )}
                            </div>

                            <div style={{
                                background: "rgba(16, 185, 129, 0.1)",
                                border: "1px solid rgba(16, 185, 129, 0.3)",
                                borderRadius: 8,
                                padding: "14px",
                                marginTop: 16
                            }}>
                                <div style={{ display: "flex", alignItems: "start", gap: 10, marginBottom: 10 }}>
                                    <span style={{ fontSize: "1.3rem" }}>🔒</span>
                                    <div>
                                        <div style={{ color: "#10B981", fontSize: "0.9rem", fontWeight: 700, marginBottom: 4 }}>
                                            GARANTIA TOTAL DE 7 DIAS
                                        </div>
                                        <div style={{ color: "#CBD5E1", fontSize: "0.8rem", lineHeight: 1.5 }}>
                                            Teste sem risco. Não gostou? Devolvemos 100%<br />
                                            Sem perguntas, sem burocracia.
                                        </div>
                                    </div>
                                </div>
                                <div style={{ borderTop: "1px dashed rgba(16, 185, 129, 0.3)", paddingTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
                                    <span style={{ fontSize: "1.05rem" }}>🔐</span>
                                    <div style={{ color: "#FDE68A", fontSize: "0.86rem", lineHeight: 1.45 }}>
                                        <strong style={{ color: "#FCD34D" }}>Cancele online em 1 clique</strong> • Sem renovação automática forçada • Sem taxas escondidas
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
