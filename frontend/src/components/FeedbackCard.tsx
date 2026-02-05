"use client";

import type { FeedbackEntrevista } from "@/types";

interface FeedbackCardProps {
    feedback: FeedbackEntrevista;
    question: string;
    onRetry: () => void;
    onNext: () => void;
    isLastQuestion?: boolean;
}

interface EnhancedFeedback extends FeedbackEntrevista {
    sentiment_analysis?: {
        confidence: number;
        clarity: number;
        engagement: number;
    };
    benchmark_comparison?: {
        user_score: number;
        average_approved: number;
        top_10_percent: number;
        percentile: number;
        ranking: string;
    };
    cultural_fit?: {
        company_match: number;
        team_fit: number;
        leadership_potential: number;
    };
    next_level_insights?: {
        what_worked_well: string[];
        critical_improvements: string[];
        industry_trends: string[];
    };
}

export function FeedbackCard({ feedback, question, onRetry, onNext, isLastQuestion = false }: FeedbackCardProps) {
    const enhancedFeedback = feedback as EnhancedFeedback;

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

            {/* NOVO: Análise de Sentimento */}
            {enhancedFeedback.sentiment_analysis && (
                <div style={{ marginTop: "24px" }}>
                    <h4 style={{ marginBottom: "12px", color: "#F8FAFC" }}>🎭 Análise de Sentimento</h4>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
                        <div style={{ textAlign: "center", padding: "12px", background: "rgba(255,255,255,0.05)", borderRadius: "8px" }}>
                            <div style={{ fontSize: "1.2rem", fontWeight: "700", color: "#10B981", marginBottom: "4px" }}>
                                {enhancedFeedback.sentiment_analysis.confidence}%
                            </div>
                            <div style={{ color: "#94A3B8", fontSize: "0.8rem" }}>Confiança</div>
                        </div>
                        <div style={{ textAlign: "center", padding: "12px", background: "rgba(255,255,255,0.05)", borderRadius: "8px" }}>
                            <div style={{ fontSize: "1.2rem", fontWeight: "700", color: "#38BDF8", marginBottom: "4px" }}>
                                {enhancedFeedback.sentiment_analysis.clarity}%
                            </div>
                            <div style={{ color: "#94A3B8", fontSize: "0.8rem" }}>Clareza</div>
                        </div>
                        <div style={{ textAlign: "center", padding: "12px", background: "rgba(255,255,255,0.05)", borderRadius: "8px" }}>
                            <div style={{ fontSize: "1.2rem", fontWeight: "700", color: "#F59E0B", marginBottom: "4px" }}>
                                {enhancedFeedback.sentiment_analysis.engagement}%
                            </div>
                            <div style={{ color: "#94A3B8", fontSize: "0.8rem" }}>Engajamento</div>
                        </div>
                    </div>
                </div>
            )}

            {/* NOVO: Benchmark Comparison */}
            {enhancedFeedback.benchmark_comparison && (
                <div style={{ marginTop: "24px" }}>
                    <h4 style={{ marginBottom: "12px", color: "#F8FAFC" }}>📊 Comparação com Mercado</h4>
                    <div style={{
                        background: "linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(56, 189, 248, 0.1) 100%)",
                        border: "1px solid rgba(16, 185, 129, 0.3)",
                        borderRadius: "12px",
                        padding: "16px",
                        textAlign: "center"
                    }}>
                        <div style={{ marginBottom: "12px" }}>
                            <div style={{ fontSize: "2rem", fontWeight: "800", color: "#10B981", marginBottom: "4px" }}>
                                Top {enhancedFeedback.benchmark_comparison.percentile}%
                            </div>
                            <div style={{ color: "#94A3B8", fontSize: "0.9rem" }}>
                                Você está no {enhancedFeedback.benchmark_comparison.ranking} dos candidatos
                            </div>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-around", fontSize: "0.85rem" }}>
                            <div>
                                <div style={{ color: "#94A3B8" }}>Sua pontuação</div>
                                <div style={{ color: "#F8FAFC", fontWeight: "600" }}>{enhancedFeedback.benchmark_comparison.user_score}</div>
                            </div>
                            <div>
                                <div style={{ color: "#94A3B8" }}>Média aprovados</div>
                                <div style={{ color: "#10B981", fontWeight: "600" }}>{enhancedFeedback.benchmark_comparison.average_approved}</div>
                            </div>
                            <div>
                                <div style={{ color: "#94A3B8" }}>Top 10%</div>
                                <div style={{ color: "#DC2626", fontWeight: "600" }}>{enhancedFeedback.benchmark_comparison.top_10_percent}</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* NOVO: Cultural Fit */}
            {enhancedFeedback.cultural_fit && (
                <div style={{ marginTop: "24px" }}>
                    <h4 style={{ marginBottom: "12px", color: "#F8FAFC" }}>🏢 Fit Cultural</h4>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
                        <div style={{ textAlign: "center", padding: "12px", background: "rgba(255,255,255,0.05)", borderRadius: "8px" }}>
                            <div style={{ fontSize: "1.2rem", fontWeight: "700", color: "#8B5CF6", marginBottom: "4px" }}>
                                {enhancedFeedback.cultural_fit.company_match}%
                            </div>
                            <div style={{ color: "#94A3B8", fontSize: "0.8rem" }}>Empresa</div>
                        </div>
                        <div style={{ textAlign: "center", padding: "12px", background: "rgba(255,255,255,0.05)", borderRadius: "8px" }}>
                            <div style={{ fontSize: "1.2rem", fontWeight: "700", color: "#3B82F6", marginBottom: "4px" }}>
                                {enhancedFeedback.cultural_fit.team_fit}%
                            </div>
                            <div style={{ color: "#94A3B8", fontSize: "0.8rem" }}>Equipe</div>
                        </div>
                        <div style={{ textAlign: "center", padding: "12px", background: "rgba(255,255,255,0.05)", borderRadius: "8px" }}>
                            <div style={{ fontSize: "1.2rem", fontWeight: "700", color: "#F59E0B", marginBottom: "4px" }}>
                                {enhancedFeedback.cultural_fit.leadership_potential}%
                            </div>
                            <div style={{ color: "#94A3B8", fontSize: "0.8rem" }}>Liderança</div>
                        </div>
                    </div>
                </div>
            )}

            {/* NOVO: Next Level Insights */}
            {enhancedFeedback.next_level_insights && (
                <div style={{ marginTop: "24px" }}>
                    <h4 style={{ marginBottom: "12px", color: "#F8FAFC" }}>🚀 Insights para Próximo Nível</h4>

                    {enhancedFeedback.next_level_insights.what_worked_well.length > 0 && (
                        <div style={{ marginBottom: "16px" }}>
                            <div style={{ color: "#10B981", fontWeight: "600", marginBottom: "8px" }}>✅ O que funcionou bem:</div>
                            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                                {enhancedFeedback.next_level_insights.what_worked_well.map((item, idx) => (
                                    <li key={idx} style={{
                                        color: "#CBD5E1",
                                        marginBottom: "4px",
                                        paddingLeft: "20px",
                                        position: "relative"
                                    }}>
                                        <span style={{ position: "absolute", left: 0 }}>•</span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {enhancedFeedback.next_level_insights.critical_improvements.length > 0 && (
                        <div style={{ marginBottom: "16px" }}>
                            <div style={{ color: "#F59E0B", fontWeight: "600", marginBottom: "8px" }}>🎯 Melhorias críticas:</div>
                            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                                {enhancedFeedback.next_level_insights.critical_improvements.map((item, idx) => (
                                    <li key={idx} style={{
                                        color: "#CBD5E1",
                                        marginBottom: "4px",
                                        paddingLeft: "20px",
                                        position: "relative"
                                    }}>
                                        <span style={{ position: "absolute", left: 0 }}>•</span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {enhancedFeedback.next_level_insights.industry_trends.length > 0 && (
                        <div>
                            <div style={{ color: "#8B5CF6", fontWeight: "600", marginBottom: "8px" }}>📈 Trends do setor:</div>
                            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                                {enhancedFeedback.next_level_insights.industry_trends.map((item, idx) => (
                                    <li key={idx} style={{
                                        color: "#CBD5E1",
                                        marginBottom: "4px",
                                        paddingLeft: "20px",
                                        position: "relative"
                                    }}>
                                        <span style={{ position: "absolute", left: 0 }}>•</span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
