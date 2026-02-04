"use client";

import type { FeedbackEntrevista } from "@/types";

interface FeedbackCardProps {
    feedback: FeedbackEntrevista;
    question: string;
    onRetry: () => void;
    onNext: () => void;
    isLastQuestion?: boolean;
}

export function FeedbackCard({ feedback, question, onRetry, onNext, isLastQuestion = false }: FeedbackCardProps) {
    const getScoreColor = (score: number) => {
        if (score >= 80) return "#10B981";
        if (score >= 60) return "#F59E0B";
        if (score >= 40) return "#F59E0B";
        return "#EF4444";
    };

    const formatPillarName = (key: string) => {
        const names: Record<string, string> = {
            "clareza": "Clareza",
            "estrutura": "Estrutura",
            "impacto": "Impacto",
            "conteudo_tecnico": "Conteúdo Técnico"
        };
        return names[key] || key;
    };

    return (
        <div style={{
            background: "linear-gradient(135deg, rgba(15, 23, 42, 0.6) 0%, rgba(56, 189, 248, 0.1) 100%)",
            border: "1px solid rgba(56, 189, 248, 0.2)",
            borderRadius: 16,
            padding: 32,
            marginTop: 24
        }}>
            {/* Header com nota */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <div>
                    <h3 style={{ fontSize: "1.4rem", marginBottom: 8 }}>Sua Avaliação</h3>
                    <p style={{ color: "#94A3B8" }}>Análise detalhada da sua resposta</p>
                </div>
                <div style={{ textAlign: "center" }}>
                    <div style={{ 
                        fontSize: "3rem", 
                        fontWeight: 800, 
                        color: getScoreColor(feedback.nota_final),
                        lineHeight: 1 
                    }}>
                        {feedback.nota_final}
                    </div>
                    <div style={{ color: "#64748B", fontSize: "0.9rem" }}>PONTUAÇÃO</div>
                </div>
            </div>
            
            {/* Feedback Curto */}
            <div style={{
                background: "rgba(56, 189, 248, 0.1)",
                border: "1px solid rgba(56, 189, 248, 0.3)",
                borderRadius: 12,
                padding: 16,
                marginBottom: 24,
                textAlign: "center"
            }}>
                <p style={{ fontSize: "1.1rem", fontWeight: 600, color: "#38BDF8", margin: 0 }}>
                    {feedback.feedback_curto}
                </p>
            </div>
            
            {/* Análise por Pilares */}
            <div style={{ marginBottom: 24 }}>
                <h4 style={{ marginBottom: 16, color: "#F8FAFC" }}>Análise Detalhada</h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
                    {Object.entries(feedback.analise_fina).map(([key, value]) => (
                        <div key={key} style={{
                            background: "rgba(255,255,255,0.05)",
                            padding: 12,
                            borderRadius: 8
                        }}>
                            <div style={{ fontWeight: 600, marginBottom: 8, color: "#F8FAFC" }}>
                                {formatPillarName(key)}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <div style={{ 
                                    flex: 1, 
                                    height: 6, 
                                    background: "rgba(255,255,255,0.1)", 
                                    borderRadius: 3,
                                    overflow: "hidden"
                                }}>
                                    <div style={{ 
                                        height: "100%", 
                                        width: `${value}%`, 
                                        background: getScoreColor(value),
                                        borderRadius: 3,
                                        transition: "width 0.5s ease"
                                    }} />
                                </div>
                                <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "#F8FAFC" }}>
                                    {value}%
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
            {/* Pontos de Melhoria */}
            {feedback.pontos_melhoria && feedback.pontos_melhoria.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                    <h4 style={{ marginBottom: 12, color: "#F8FAFC" }}>Pontos para Melhorar</h4>
                    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                        {feedback.pontos_melhoria.map((point, idx) => (
                            <li key={idx} style={{ 
                                background: "rgba(245, 158, 11, 0.1)", 
                                border: "1px solid rgba(245, 158, 11, 0.3)",
                                borderRadius: 8,
                                padding: 12,
                                marginBottom: 8,
                                display: "flex",
                                alignItems: "center",
                                gap: 8
                            }}>
                                <span style={{ color: "#F59E0B" }}>💡</span>
                                <span style={{ color: "#F8FAFC" }}>{point}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            
            {/* Exemplo Ideal (Accordion) */}
            {feedback.exemplo_resposta_star && (
                <details style={{ marginBottom: 24 }}>
                    <summary style={{ 
                        cursor: "pointer", 
                        fontWeight: 600, 
                        padding: 12,
                        background: "rgba(139, 92, 246, 0.1)",
                        border: "1px solid rgba(139, 92, 246, 0.3)",
                        borderRadius: 8,
                        color: "#F8FAFC"
                    }}>
                        🎯 Ver Resposta Ideal (Método STAR)
                    </summary>
                    <div style={{ 
                        marginTop: 12, 
                        padding: 16,
                        background: "rgba(139, 92, 246, 0.05)",
                        borderRadius: 8,
                        lineHeight: 1.6,
                        color: "#CBD5E1"
                    }}>
                        <div dangerouslySetInnerHTML={{ __html: feedback.exemplo_resposta_star }} />
                    </div>
                </details>
            )}
            
            {/* Botões de Ação */}
            <div style={{ display: "flex", gap: 12 }}>
                <button
                    onClick={onRetry}
                    style={{
                        background: "transparent",
                        border: "2px solid #F59E0B",
                        color: "#F59E0B",
                        padding: "12px 24px",
                        borderRadius: 8,
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "all 0.2s"
                    }}
                >
                    🔄 Tentar Novamente
                </button>
                <button
                    onClick={onNext}
                    style={{
                        background: "#38BDF8",
                        color: "#0F172A",
                        border: "none",
                        padding: "12px 24px",
                        borderRadius: 8,
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "all 0.2s"
                    }}
                >
                    {isLastQuestion ? "Ver Resultados Finais 🏁" : "Próxima Pergunta →"}
                </button>
            </div>
        </div>
    );
}
