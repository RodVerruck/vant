"use client";

import { useState, useEffect } from "react";
import type { ReportData } from "@/types";

interface InterviewPrepStageProps {
    reportData: ReportData;
    targetJob: string;
    interviewDate?: Date;
    onStartSimulation: (mode: string) => void;
    userId?: string;
}

interface ReadinessAnalysis {
    readiness_score: number;
    critical_gaps: string[];
    recommended_focus: string[];
    estimated_difficulty: string;
    prep_time_minutes: number;
    sector: string;
    total_gaps: number;
    experience_indicators: {
        has_leadership: boolean;
        is_senior: boolean;
        has_projects: boolean;
        tech_breadth: number;
    };
}

export function InterviewPrepStage({ 
    reportData, 
    targetJob, 
    interviewDate, 
    onStartSimulation,
    userId 
}: InterviewPrepStageProps) {
    const [readiness, setReadiness] = useState<ReadinessAnalysis | null>(null);
    const [loading, setLoading] = useState(true);
    const [timeUntilInterview, setTimeUntilInterview] = useState<string>("");
    const [countdown, setCountdown] = useState<number>(0);

    // Countdown para entrevista
    useEffect(() => {
        if (!interviewDate) return;

        const timer = setInterval(() => {
            const now = new Date().getTime();
            const interview = new Date(interviewDate).getTime();
            const difference = interview - now;

            if (difference > 0) {
                const days = Math.floor(difference / (1000 * 60 * 60 * 24));
                const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
                
                setTimeUntilInterview(
                    days > 0 ? `${days}d ${hours}h ${minutes}m` :
                    hours > 0 ? `${hours}h ${minutes}m` :
                    `${minutes}m`
                );
                setCountdown(Math.floor(difference / 1000));
            } else {
                setTimeUntilInterview("Agora!");
                setCountdown(0);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [interviewDate]);

    // Carregar análise de prontificação
    useEffect(() => {
        loadReadinessAnalysis();
    }, [reportData, targetJob]);

    const loadReadinessAnalysis = async () => {
        if (!reportData || !userId) return;

        setLoading(true);
        try {
            // Buscar ID da análise do CV
            const cvId = localStorage.getItem('vant_cv_analysis_id');
            if (!cvId) {
                setLoading(false);
                return;
            }

            const formData = new FormData();
            formData.append("cv_analysis_id", cvId);
            formData.append("target_job", targetJob || "");
            if (interviewDate) {
                formData.append("interview_date", interviewDate.toISOString());
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/interview/pre-analysis`, {
                method: "POST",
                body: formData,
            });

            if (response.ok) {
                const analysis = await response.json();
                setReadiness(analysis);
            }
        } catch (error) {
            console.error("Erro ao carregar análise:", error);
        } finally {
            setLoading(false);
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return "#10B981";
        if (score >= 60) return "#F59E0B";
        return "#EF4444";
    };

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case "avançado": return "#DC2626";
            case "intermediário": return "#F59E0B";
            case "básico": return "#10B981";
            default: return "#64748B";
        }
    };

    const getRankByLevel = (level: number) => {
        if (level >= 10) return "Mestre";
        if (level >= 7) return "Especialista";
        if (level >= 5) return "Avançado";
        if (level >= 3) return "Intermediário";
        return "Iniciante";
    };

    if (loading) {
        return (
            <div style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: "400px",
                flexDirection: "column",
                gap: "20px"
            }}>
                <div style={{
                    width: "60px",
                    height: "60px",
                    border: "4px solid #38BDF8",
                    borderTop: "4px solid transparent",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite"
                }} />
                <p style={{ color: "#94A3B8" }}>Analisando sua prontificação...</p>
            </div>
        );
    }

    if (!readiness) {
        return (
            <div style={{
                textAlign: "center",
                padding: "40px",
                color: "#94A3B8"
            }}>
                <p>Não foi possível carregar a análise de prontificação.</p>
                <button
                    onClick={loadReadinessAnalysis}
                    style={{
                        marginTop: "20px",
                        padding: "12px 24px",
                        background: "#38BDF8",
                        color: "#0F172A",
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer"
                    }}
                >
                    Tentar novamente
                </button>
            </div>
        );
    }

    return (
        <div style={{
            maxWidth: "900px",
            margin: "0 auto",
            padding: "40px 20px"
        }}>
            {/* Header Cinematográfico */}
            <div style={{
                textAlign: "center",
                marginBottom: "40px"
            }}>
                <h1 style={{
                    fontSize: "3rem",
                    fontWeight: "800",
                    marginBottom: "16px",
                    background: "linear-gradient(135deg, #38BDF8 0%, #8B5CF6 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text"
                }}>
                    Sua Entrevista em {timeUntilInterview}
                </h1>
                <p style={{
                    fontSize: "1.2rem",
                    color: "#CBD5E1",
                    marginBottom: "32px"
                }}>
                    Análise completa de prontificação e plano de ação personalizado
                </p>

                {/* Countdown Visual */}
                {countdown > 0 && (
                    <div style={{
                        display: "inline-block",
                        padding: "16px 32px",
                        background: "linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(245, 158, 11, 0.1) 100%)",
                        border: "1px solid rgba(245, 158, 11, 0.3)",
                        borderRadius: "12px",
                        marginBottom: "32px"
                    }}>
                        <div style={{
                            fontSize: "2rem",
                            fontWeight: "700",
                            color: "#F59E0B",
                            marginBottom: "8px"
                        }}>
                            {Math.floor(countdown / 86400)}d {Math.floor((countdown % 86400) / 3600)}h {Math.floor((countdown % 3600) / 60)}m
                        </div>
                        <div style={{ color: "#94A3B8", fontSize: "0.9rem" }}>
                            Tempo restante para sua entrevista
                        </div>
                    </div>
                )}
            </div>

            {/* Score de Prontificação */}
            <div style={{
                background: "linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(56, 189, 248, 0.1) 100%)",
                border: "1px solid rgba(16, 185, 129, 0.3)",
                borderRadius: "16px",
                padding: "32px",
                textAlign: "center",
                marginBottom: "32px"
            }}>
                <div style={{
                    fontSize: "5rem",
                    fontWeight: "800",
                    color: getScoreColor(readiness.readiness_score),
                    marginBottom: "16px",
                    lineHeight: 1
                }}>
                    {readiness.readiness_score}
                </div>
                <div style={{
                    fontSize: "1.5rem",
                    color: "#CBD5E1",
                    marginBottom: "8px"
                }}>
                    Score de Prontificação
                </div>
                <div style={{
                    fontSize: "1rem",
                    color: getScoreColor(readiness.readiness_score),
                    fontWeight: "600"
                }}>
                    {readiness.readiness_score >= 80 ? "Excelente! Você está pronto." :
                     readiness.readiness_score >= 60 ? "Bom! Com alguns ajustes ficará ótimo." :
                     "Precisa de preparação. Vamos trabalhar nisso!"}
                </div>
            </div>

            {/* Análise Detalhada */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: "24px",
                marginBottom: "32px"
            }}>
                {/* Gaps Críticos */}
                <div style={{
                    background: "rgba(239, 68, 68, 0.1)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    borderRadius: "12px",
                    padding: "24px"
                }}>
                    <h3 style={{
                        color: "#EF4444",
                        marginBottom: "16px",
                        fontSize: "1.2rem"
                    }}>
                        ⚠️ Gaps Críticos ({readiness.critical_gaps.length})
                    </h3>
                    {readiness.critical_gaps.length > 0 ? (
                        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                            {readiness.critical_gaps.map((gap, idx) => (
                                <li key={idx} style={{
                                    color: "#F87171",
                                    marginBottom: "8px",
                                    paddingLeft: "20px",
                                    position: "relative"
                                }}>
                                    <span style={{ position: "absolute", left: 0 }}>•</span>
                                    {gap}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p style={{ color: "#10B981" }}>✅ Nenhum gap crítico detectado!</p>
                    )}
                </div>

                {/* Foco Recomendado */}
                <div style={{
                    background: "rgba(245, 158, 11, 0.1)",
                    border: "1px solid rgba(245, 158, 11, 0.3)",
                    borderRadius: "12px",
                    padding: "24px"
                }}>
                    <h3 style={{
                        color: "#F59E0B",
                        marginBottom: "16px",
                        fontSize: "1.2rem"
                    }}>
                        🎯 Foco Recomendado
                    </h3>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                        {readiness.recommended_focus.map((focus, idx) => (
                            <span key={idx} style={{
                                background: "#F59E0B",
                                color: "#0F172A",
                                padding: "6px 12px",
                                borderRadius: "20px",
                                fontSize: "0.9rem",
                                fontWeight: "600"
                            }}>
                                {focus}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Dificuldade Estimada */}
                <div style={{
                    background: "rgba(139, 92, 246, 0.1)",
                    border: "1px solid rgba(139, 92, 246, 0.3)",
                    borderRadius: "12px",
                    padding: "24px"
                }}>
                    <h3 style={{
                        color: "#8B5CF6",
                        marginBottom: "16px",
                        fontSize: "1.2rem"
                    }}>
                        📊 Dificuldade Estimada
                    </h3>
                    <div style={{
                        fontSize: "1.5rem",
                        fontWeight: "700",
                        color: getDifficultyColor(readiness.estimated_difficulty),
                        marginBottom: "8px"
                    }}>
                        {readiness.estimated_difficulty.toUpperCase()}
                    </div>
                    <p style={{ color: "#94A3B8", fontSize: "0.9rem" }}>
                        Baseado no seu perfil e na vaga
                    </p>
                </div>

                {/* Tempo de Preparação */}
                <div style={{
                    background: "rgba(56, 189, 248, 0.1)",
                    border: "1px solid rgba(56, 189, 248, 0.3)",
                    borderRadius: "12px",
                    padding: "24px"
                }}>
                    <h3 style={{
                        color: "#38BDF8",
                        marginBottom: "16px",
                        fontSize: "1.2rem"
                    }}>
                        ⏱️ Tempo de Preparação
                    </h3>
                    <div style={{
                        fontSize: "1.5rem",
                        fontWeight: "700",
                        color: "#38BDF8",
                        marginBottom: "8px"
                    }}>
                        {readiness.prep_time_minutes} min
                    </div>
                    <p style={{ color: "#94A3B8", fontSize: "0.9rem" }}>
                        Tempo recomendado para preparação focada
                    </p>
                </div>
            </div>

            {/* Indicadores de Experiência */}
            <div style={{
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "12px",
                padding: "24px",
                marginBottom: "32px"
            }}>
                <h3 style={{
                    color: "#F8FAFC",
                    marginBottom: "20px",
                    fontSize: "1.2rem"
                }}>
                    📈 Seu Perfil
                </h3>
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "16px"
                }}>
                    <div style={{ textAlign: "center" }}>
                        <div style={{
                            fontSize: "2rem",
                            marginBottom: "8px"
                        }}>
                            {readiness.experience_indicators.has_leadership ? "👑" : "👤"}
                        </div>
                        <div style={{ color: "#CBD5E1", fontWeight: "600" }}>
                            {readiness.experience_indicators.has_leadership ? "Liderança" : "Individual"}
                        </div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                        <div style={{
                            fontSize: "2rem",
                            marginBottom: "8px"
                        }}>
                            {readiness.experience_indicators.is_senior ? "🏆" : "🌱"}
                        </div>
                        <div style={{ color: "#CBD5E1", fontWeight: "600" }}>
                            {readiness.experience_indicators.is_senior ? "Sênior" : "Júnior/Pleno"}
                        </div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                        <div style={{
                            fontSize: "2rem",
                            marginBottom: "8px"
                        }}>
                            {readiness.experience_indicators.has_projects ? "🚀" : "📝"}
                        </div>
                        <div style={{ color: "#CBD5E1", fontWeight: "600" }}>
                            {readiness.experience_indicators.has_projects ? "Projetos" : "Teórico"}
                        </div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                        <div style={{
                            fontSize: "2rem",
                            marginBottom: "8px"
                        }}>
                            📚
                        </div>
                        <div style={{ color: "#CBD5E1", fontWeight: "600" }}>
                            {readiness.experience_indicators.tech_breadth} livros
                        </div>
                    </div>
                </div>
            </div>

            {/* Plano de Ação Emergencial */}
            <div style={{
                background: "linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%)",
                border: "1px solid rgba(34, 197, 94, 0.3)",
                borderRadius: "16px",
                padding: "32px",
                marginBottom: "32px"
            }}>
                <h3 style={{
                    color: "#22C55E",
                    marginBottom: "20px",
                    fontSize: "1.4rem",
                    textAlign: "center"
                }}>
                    🎯 Plano de Ação Emergencial
                </h3>
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                    gap: "20px"
                }}>
                    <div>
                        <h4 style={{ color: "#F8FAFC", marginBottom: "12px" }}>📖 Estudo Imediato</h4>
                        <ul style={{ color: "#CBD5E1", paddingLeft: "20px" }}>
                            <li>Revisar gaps críticos ({readiness.critical_gaps.length})</li>
                            <li>Praticar STAR method</li>
                            <li>Preparar 3 exemplos de projetos</li>
                        </ul>
                    </div>
                    <div>
                        <h4 style={{ color: "#F8FAFC", marginBottom: "12px" }}>🎭 Simulação Prática</h4>
                        <ul style={{ color: "#CBD5E1", paddingLeft: "20px" }}>
                            <li>Modo aquecimento (5 min)</li>
                            <li>Modo foco recomendado</li>
                            <li>Gravar e analisar respostas</li>
                        </ul>
                    </div>
                    <div>
                        <h4 style={{ color: "#F8FAFC", marginBottom: "12px" }}>🔥 Últimos Ajustes</h4>
                        <ul style={{ color: "#CBD5E1", paddingLeft: "20px" }}>
                            <li>Pesquisar empresa/vaga</li>
                            <li>Preparar perguntas para o entrevistador</li>
                            <li>Testar equipamento (câmera/mic)</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Call to Action */}
            <div style={{ textAlign: "center" }}>
                <button
                    onClick={() => onStartSimulation("warmup")}
                    style={{
                        background: "linear-gradient(135deg, #38BDF8 0%, #8B5CF6 100%)",
                        color: "#0F172A",
                        padding: "20px 40px",
                        borderRadius: "12px",
                        border: "none",
                        fontWeight: "700",
                        fontSize: "1.2rem",
                        cursor: "pointer",
                        transition: "transform 0.2s",
                        boxShadow: "0 10px 30px rgba(56, 189, 248, 0.3)"
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.transform = "scale(1.05)";
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.transform = "scale(1)";
                    }}
                >
                    🚀 COMEÇAR SIMULAÇÃO AGORA
                </button>
                <p style={{ color: "#94A3B8", marginTop: "16px" }}>
                    Comece com modo aquecimento para testar sua confiança
                </p>
            </div>
        </div>
    );
}
