"use client";

import { useState } from "react";

interface InterviewMode {
    id: string;
    name: string;
    description: string;
    duration: number;
    difficulty: string;
    focus: string[];
    icon: string;
    color: string;
    questions: number;
    xp_bonus: number;
}

interface InterviewModeSelectorProps {
    onModeSelect: (mode: string) => void;
    readinessScore?: number;
    recommendedFocus?: string[];
}

export function InterviewModeSelector({ 
    onModeSelect, 
    readinessScore = 50,
    recommendedFocus = [] 
}: InterviewModeSelectorProps) {
    const [selectedMode, setSelectedMode] = useState<string | null>(null);
    const [hoveredMode, setHoveredMode] = useState<string | null>(null);

    const INTERVIEW_MODES: InterviewMode[] = [
        {
            id: "warmup",
            name: "Aquecimento",
            description: "3 perguntas rápidas para aquecer e ganhar confiança",
            duration: 5,
            difficulty: "fácil",
            focus: ["confiança", "clareza"],
            icon: "🔥",
            color: "#F59E0B",
            questions: 3,
            xp_bonus: 5
        },
        {
            id: "technical",
            name: "Desafio Técnico",
            description: "Foco em hard skills e domínio técnico da vaga",
            duration: 15,
            difficulty: "médio",
            focus: ["domínio técnico", "profundidade"],
            icon: "⚡",
            color: "#3B82F6",
            questions: 5,
            xp_bonus: 15
        },
        {
            id: "behavioral",
            name: "Método STAR",
            description: "Domine o método STAR com perguntas comportamentais",
            duration: 20,
            difficulty: "médio",
            focus: ["estrutura", "exemplos"],
            icon: "🌟",
            color: "#10B981",
            questions: 5,
            xp_bonus: 12
        },
        {
            id: "pressure",
            name: "Sob Pressão",
            description: "Perguntas difíceis com timer reduzido. Teste sua resiliência",
            duration: 10,
            difficulty: "difícil",
            focus: ["resiliência", "rapidez"],
            icon: "🔥",
            color: "#EF4444",
            questions: 4,
            xp_bonus: 20
        },
        {
            id: "company",
            name: "Cultura da Empresa",
            description: "Baseado no fit cultural e valores da empresa",
            duration: 15,
            difficulty: "médio",
            focus: ["fit cultural", "valores"],
            icon: "🏢",
            color: "#8B5CF6",
            questions: 5,
            xp_bonus: 10
        }
    ];

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case "fácil": return "#10B981";
            case "médio": return "#F59E0B";
            case "difícil": return "#EF4444";
            default: return "#64748B";
        }
    };

    const getDifficultyLabel = (difficulty: string) => {
        switch (difficulty) {
            case "fácil": return "Iniciante";
            case "médio": return "Intermediário";
            case "difícil": return "Avançado";
            default: return "Misto";
        }
    };

    const isRecommended = (mode: InterviewMode) => {
        return recommendedFocus.some(focus => 
            mode.focus.some(modeFocus => 
                modeFocus.toLowerCase().includes(focus.toLowerCase())
            )
        );
    };

    const getReadinessRecommendation = (mode: InterviewMode) => {
        if (readinessScore >= 80) {
            // Usuário pronto - pode tentar qualquer modo
            return mode.difficulty === "difícil" ? "Excelente desafio!" : "Boa escolha!";
        } else if (readinessScore >= 60) {
            // Usuário intermediário
            if (mode.difficulty === "difícil") {
                return "Desafie-se com cuidado!";
            } else if (mode.difficulty === "fácil") {
                return "Ótimo para aquecer!";
            }
            return "Perfeito para você!";
        } else {
            // Usuário iniciante
            if (mode.difficulty === "fácil") {
                return "Recomendado para começar!";
            } else if (mode.difficulty === "difícil") {
                return "Tente depois de praticar.";
            }
            return "Pode ser um desafio.";
        }
    };

    const handleModeSelect = (modeId: string) => {
        setSelectedMode(modeId);
        setTimeout(() => {
            onModeSelect(modeId);
        }, 300);
    };

    return (
        <div style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "40px 20px"
        }}>
            {/* Header */}
            <div style={{
                textAlign: "center",
                marginBottom: "48px"
            }}>
                <h2 style={{
                    fontSize: "2.5rem",
                    fontWeight: "800",
                    marginBottom: "16px",
                    background: "linear-gradient(135deg, #38BDF8 0%, #8B5CF6 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text"
                }}>
                    Escolha seu Modo de Simulação
                </h2>
                <p style={{
                    fontSize: "1.2rem",
                    color: "#CBD5E1",
                    marginBottom: "24px"
                }}>
                    Diferentes modos para diferentes objetivos. Escolha o seu!
                </p>
                
                {/* Score de prontificação */}
                <div style={{
                    display: "inline-block",
                    padding: "12px 24px",
                    background: "rgba(56, 189, 248, 0.1)",
                    border: "1px solid rgba(56, 189, 248, 0.3)",
                    borderRadius: "20px",
                    marginBottom: "16px"
                }}>
                    <span style={{ color: "#38BDF8", fontWeight: "600" }}>
                        Seu score: {readinessScore}/100
                    </span>
                </div>

                {/* Foco recomendado */}
                {recommendedFocus.length > 0 && (
                    <div style={{ marginTop: "16px" }}>
                        <span style={{ color: "#94A3B8", marginRight: "8px" }}>
                            Foco recomendado:
                        </span>
                        {recommendedFocus.map((focus, idx) => (
                            <span
                                key={idx}
                                style={{
                                    background: "#F59E0B",
                                    color: "#0F172A",
                                    padding: "4px 12px",
                                    borderRadius: "12px",
                                    fontSize: "0.85rem",
                                    fontWeight: "600",
                                    marginRight: "8px"
                                }}
                            >
                                {focus}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Grid de Modos */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: "24px",
                marginBottom: "48px"
            }}>
                {INTERVIEW_MODES.map((mode) => {
                    const isHovered = hoveredMode === mode.id;
                    const isSelected = selectedMode === mode.id;
                    const recommended = isRecommended(mode);

                    return (
                        <div
                            key={mode.id}
                            onMouseEnter={() => setHoveredMode(mode.id)}
                            onMouseLeave={() => setHoveredMode(null)}
                            onClick={() => handleModeSelect(mode.id)}
                            style={{
                                background: isSelected 
                                    ? "linear-gradient(135deg, rgba(56, 189, 248, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)"
                                    : isHovered 
                                        ? "rgba(255, 255, 255, 0.08)"
                                        : "rgba(255, 255, 255, 0.05)",
                                border: isSelected 
                                    ? "2px solid #38BDF8"
                                    : recommended 
                                        ? "1px solid rgba(245, 158, 11, 0.5)"
                                        : "1px solid rgba(255, 255, 255, 0.1)",
                                borderRadius: "16px",
                                padding: "32px",
                                cursor: "pointer",
                                transition: "all 0.3s ease",
                                transform: isHovered ? "translateY(-4px)" : "translateY(0)",
                                position: "relative",
                                overflow: "hidden"
                            }}
                        >
                            {/* Badge de recomendação */}
                            {recommended && (
                                <div style={{
                                    position: "absolute",
                                    top: "16px",
                                    right: "16px",
                                    background: "#F59E0B",
                                    color: "#0F172A",
                                    padding: "4px 12px",
                                    borderRadius: "12px",
                                    fontSize: "0.75rem",
                                    fontWeight: "700",
                                    zIndex: 1
                                }}>
                                    RECOMENDADO
                                </div>
                            )}

                            {/* Header do Card */}
                            <div style={{
                                display: "flex",
                                alignItems: "center",
                                marginBottom: "20px"
                            }}>
                                <div style={{
                                    fontSize: "3rem",
                                    marginRight: "16px",
                                    transform: isHovered ? "scale(1.1)" : "scale(1)",
                                    transition: "transform 0.3s"
                                }}>
                                    {mode.icon}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{
                                        fontSize: "1.4rem",
                                        fontWeight: "700",
                                        color: "#F8FAFC",
                                        marginBottom: "4px",
                                        margin: 0
                                    }}>
                                        {mode.name}
                                    </h3>
                                    <div style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px"
                                    }}>
                                        <span style={{
                                            background: getDifficultyColor(mode.difficulty),
                                            color: "white",
                                            padding: "2px 8px",
                                            borderRadius: "8px",
                                            fontSize: "0.75rem",
                                            fontWeight: "600"
                                        }}>
                                            {getDifficultyLabel(mode.difficulty)}
                                        </span>
                                        <span style={{
                                            color: "#94A3B8",
                                            fontSize: "0.85rem"
                                        }}>
                                            {mode.questions} perguntas
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Descrição */}
                            <p style={{
                                color: "#CBD5E1",
                                lineHeight: 1.6,
                                marginBottom: "20px",
                                fontSize: "0.95rem"
                            }}>
                                {mode.description}
                            </p>

                            {/* Detalhes */}
                            <div style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(2, 1fr)",
                                gap: "16px",
                                marginBottom: "20px"
                            }}>
                                <div style={{
                                    textAlign: "center",
                                    padding: "12px",
                                    background: "rgba(255, 255, 255, 0.05)",
                                    borderRadius: "8px"
                                }}>
                                    <div style={{
                                        fontSize: "1.5rem",
                                        fontWeight: "700",
                                        color: mode.color,
                                        marginBottom: "4px"
                                    }}>
                                        {mode.duration}min
                                    </div>
                                    <div style={{ color: "#94A3B8", fontSize: "0.8rem" }}>
                                        Duração
                                    </div>
                                </div>
                                <div style={{
                                    textAlign: "center",
                                    padding: "12px",
                                    background: "rgba(255, 255, 255, 0.05)",
                                    borderRadius: "8px"
                                }}>
                                    <div style={{
                                        fontSize: "1.5rem",
                                        fontWeight: "700",
                                        color: "#F59E0B",
                                        marginBottom: "4px"
                                    }}>
                                        +{mode.xp_bonus}
                                    </div>
                                    <div style={{ color: "#94A3B8", fontSize: "0.8rem" }}>
                                        XP Bônus
                                    </div>
                                </div>
                            </div>

                            {/* Foco */}
                            <div style={{ marginBottom: "20px" }}>
                                <div style={{
                                    color: "#94A3B8",
                                    fontSize: "0.85rem",
                                    marginBottom: "8px"
                                }}>
                                    Foco:
                                </div>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                                    {mode.focus.map((focus, idx) => (
                                        <span
                                            key={idx}
                                            style={{
                                                background: "rgba(56, 189, 248, 0.1)",
                                                color: "#38BDF8",
                                                padding: "4px 10px",
                                                borderRadius: "12px",
                                                fontSize: "0.8rem",
                                                fontWeight: "600"
                                            }}
                                        >
                                            {focus}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Recomendação baseada no score */}
                            <div style={{
                                padding: "12px",
                                background: "rgba(56, 189, 248, 0.05)",
                                border: "1px solid rgba(56, 189, 248, 0.2)",
                                borderRadius: "8px",
                                textAlign: "center"
                            }}>
                                <div style={{
                                    color: "#38BDF8",
                                    fontSize: "0.9rem",
                                    fontWeight: "600"
                                }}>
                                    {getReadinessRecommendation(mode)}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Dicas Adicionais */}
            <div style={{
                background: "rgba(139, 92, 246, 0.1)",
                border: "1px solid rgba(139, 92, 246, 0.3)",
                borderRadius: "16px",
                padding: "32px",
                textAlign: "center"
            }}>
                <h3 style={{
                    color: "#8B5CF6",
                    marginBottom: "16px",
                    fontSize: "1.3rem"
                }}>
                    💡 Dicas para Maximizar seu XP
                </h3>
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                    gap: "20px",
                    textAlign: "left"
                }}>
                    <div>
                        <h4 style={{ color: "#F8FAFC", marginBottom: "8px" }}>🎯 Comece com Aquecimento</h4>
                        <p style={{ color: "#CBD5E1", fontSize: "0.9rem", margin: 0 }}>
                            Teste seu equipamento e ganhe confiança antes dos desafios maiores.
                        </p>
                    </div>
                    <div>
                        <h4 style={{ color: "#F8FAFC", marginBottom: "8px" }}>🔥 Mantenha sua Streak</h4>
                        <p style={{ color: "#CBD5E1", fontSize: "0.9rem", margin: 0 }}>
                            Pratique diariamente para bônus de XP e desbloquear conquistas.
                        </p>
                    </div>
                    <div>
                        <h4 style={{ color: "#F8FAFC", marginBottom: "8px" }}>⚡ Desafie-se</h4>
                        <p style={{ color: "#CBD5E1", fontSize: "0.9rem", margin: 0 }}>
                            Modos difíceis dão mais XP e aceleram sua progressão.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
