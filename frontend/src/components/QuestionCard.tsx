"use client";

import { useState, useEffect } from "react";
import SpeechService from "@/services/SpeechService";

// Estilos CSS para animações do card
const cardStyles = `
@keyframes slideInRight {
    from {
        opacity: 0;
        transform: translateX(20px);
    }
    to {
        opacity: 1;
        transform: translateX(0);
    }
}

@keyframes slideInLeft {
    from {
        opacity: 0;
        transform: translateX(-20px);
    }
    to {
        opacity: 1;
        transform: translateX(0);
    }
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes pulse {
    0%, 100% {
        opacity: 1;
    }
    50% {
        opacity: 0.6;
    }
}

@media (max-width: 768px) {
    .question-card {
        padding: 24px !important;
        margin: 0 16px 24px !important;
    }
    
    .question-text {
        font-size: 1.1rem !important;
        padding-left: 60px !important;
        padding-right: 80px !important;
    }
    
    .tts-button {
        width: 36px !important;
        height: 36px !important;
        font-size: 14px !important;
    }
    
    .progress-dots {
        gap: 6px !important;
    }
}
`;

// Adicionar ao documento
if (typeof window !== "undefined") {
    const styleElement = document.createElement("style");
    styleElement.textContent = cardStyles;
    document.head.appendChild(styleElement);
}

interface QuestionCardProps {
    question: {
        id: number;
        text: string;
        type: "comportamental" | "tecnica" | "situacional";
        context: string;
        max_duration: number;
    };
    questionNumber: number;
    totalQuestions: number;
}

export function QuestionCard({ question, questionNumber, totalQuestions }: QuestionCardProps) {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [speechSupported, setSpeechSupported] = useState(false);
    const [showTip, setShowTip] = useState(false);
    const speechService = SpeechService.getInstance();

    useEffect(() => {
        setSpeechSupported(speechService.isSupported());
        // Animar entrada da dica
        setTimeout(() => setShowTip(true), 500);
    }, []);

    const handleSpeakQuestion = async () => {
        if (!speechSupported || isSpeaking) return;

        try {
            setIsSpeaking(true);
            await speechService.speak(question.text);
        } catch (error) {
            console.error('Erro ao falar pergunta:', error);
            // Fallback silencioso - não mostrar erro para usuário
        } finally {
            setIsSpeaking(false);
        }
    };
    const getTypeColor = (type: string) => {
        switch (type) {
            case "comportamental": return "#10B981";
            case "tecnica": return "#F59E0B";
            case "situacional": return "#8B5CF6";
            default: return "#64748B";
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case "comportamental": return "Comportamental";
            case "tecnica": return "Técnica";
            case "situacional": return "Situacional";
            default: return "Geral";
        }
    };

    return (
        <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <div style={{ marginBottom: 32 }}>
                <h3 style={{
                    fontSize: "1.4rem",
                    marginBottom: 16,
                    color: "#F8FAFC",
                    fontWeight: 600,
                    animation: "fadeIn 0.5s ease-out"
                }}>
                    Pergunta {questionNumber} de {totalQuestions}
                </h3>

                {/* Progress Indicator Melhorado */}
                <div style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: 10,
                    marginBottom: 24,
                    alignItems: "center"
                }}>
                    {[...Array(totalQuestions)].map((_, index) => {
                        const isActive = index === questionNumber - 1;
                        const isCompleted = index < questionNumber - 1;

                        return (
                            <div
                                key={index}
                                className="progress-dots"
                                style={{
                                    width: isActive ? "16px" : "12px",
                                    height: isActive ? "16px" : "12px",
                                    borderRadius: "50%",
                                    background: isCompleted
                                        ? "linear-gradient(135deg, #10B981 0%, #059669 100%)"
                                        : isActive
                                            ? "linear-gradient(135deg, #38BDF8 0%, #0EA5E9 100%)"
                                            : "#374151",
                                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                    transform: isActive ? "scale(1.2)" : "scale(1)",
                                    boxShadow: isActive
                                        ? "0 0 20px rgba(56, 189, 248, 0.5)"
                                        : isCompleted
                                            ? "0 0 10px rgba(16, 185, 129, 0.3)"
                                            : "none",
                                    animation: isActive ? "pulse 2s infinite" : "none"
                                }}
                            />
                        );
                    })}
                </div>

                {/* Indicador de progresso textual */}
                <div style={{
                    textAlign: "center",
                    color: "#94A3B8",
                    fontSize: "0.85rem",
                    fontWeight: 500
                }}>
                    Progresso: {Math.round((questionNumber / totalQuestions) * 100)}% completo
                </div>
            </div>

            {/* Card da Pergunta Melhorado */}
            <div
                className="question-card"
                style={{
                    background: "linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(56, 189, 248, 0.15) 100%)",
                    border: "1px solid rgba(56, 189, 248, 0.4)",
                    borderRadius: 20,
                    padding: 36,
                    marginBottom: 24,
                    position: "relative",
                    overflow: "hidden",
                    backdropFilter: "blur(10px)",
                    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
                    transition: "all 0.3s ease"
                }}>
                {/* Badge do tipo melhorado */}
                <div style={{
                    position: "absolute",
                    top: 20,
                    right: 20,
                    background: getTypeColor(question.type),
                    color: "white",
                    padding: "6px 16px",
                    borderRadius: 25,
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    boxShadow: `0 4px 15px ${getTypeColor(question.type)}40`,
                    animation: "slideInRight 0.5s ease-out"
                }}>
                    {getTypeLabel(question.type)}
                </div>

                {/* Botão TTS */}
                {speechSupported && (
                    <button
                        className="tts-button"
                        onClick={handleSpeakQuestion}
                        disabled={isSpeaking}
                        style={{
                            position: "absolute",
                            top: 20,
                            left: 20,
                            background: isSpeaking
                                ? "linear-gradient(135deg, #10B981 0%, #059669 100%)"
                                : "linear-gradient(135deg, #38BDF8 0%, #0EA5E9 100%)",
                            color: "white",
                            border: "none",
                            borderRadius: "50%",
                            width: "40px",
                            height: "40px",
                            fontSize: "16px",
                            cursor: isSpeaking ? "default" : "pointer",
                            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            opacity: isSpeaking ? 0.9 : 1,
                            transform: isSpeaking ? "scale(0.95)" : "scale(1)",
                            boxShadow: isSpeaking
                                ? "0 0 20px rgba(16, 185, 129, 0.4)"
                                : "0 6px 20px rgba(56, 189, 248, 0.3)",
                            animation: "slideInLeft 0.5s ease-out"
                        }}
                        title={isSpeaking ? "Falando..." : "Ouvir pergunta em voz alta"}
                    >
                        <span style={{
                            display: "inline-block",
                            animation: isSpeaking ? "pulse 1.5s infinite" : "none"
                        }}>
                            {isSpeaking ? "🔊" : "🔇"}
                        </span>
                    </button>
                )}

                {/* Texto da pergunta com melhor espaçamento */}
                <p
                    className="question-text"
                    style={{
                        fontSize: "1.3rem",
                        lineHeight: 1.7,
                        marginBottom: 20,
                        paddingRight: speechSupported ? "120px" : "100px", // Espaço para elementos
                        paddingLeft: speechSupported ? "70px" : "0px", // Espaço para botão TTS
                        paddingTop: "8px",
                        color: "#F8FAFC",
                        fontWeight: 400,
                        animation: "fadeIn 0.8s ease-out"
                    }}>
                    {question.text}
                </p>

                {/* Dica contextual melhorada */}
                {question.context && (
                    <div style={{
                        background: "linear-gradient(135deg, rgba(56, 189, 248, 0.15) 0%, rgba(56, 189, 248, 0.05) 100%)",
                        border: "1px solid rgba(56, 189, 248, 0.3)",
                        borderRadius: 12,
                        padding: 16,
                        marginTop: 20,
                        backdropFilter: "blur(5px)",
                        opacity: showTip ? 1 : 0,
                        transform: showTip ? "translateY(0)" : "translateY(10px)",
                        transition: "all 0.5s ease-out"
                    }}>
                        <p style={{
                            color: "#38BDF8",
                            fontSize: "0.95rem",
                            margin: 0,
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 12,
                            lineHeight: 1.5
                        }}>
                            <span style={{
                                fontSize: "1.2rem",
                                flexShrink: 0,
                                marginTop: "2px"
                            }}>💡</span>
                            <span>
                                <strong style={{ color: "#CBD5E1", fontWeight: 600 }}>Dica:</strong> {question.context}
                            </span>
                        </p>
                    </div>
                )}
            </div>

            {/* Indicador de duração melhorado */}
            <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                marginTop: 16,
                padding: "8px 16px",
                background: "rgba(55, 65, 81, 0.3)",
                borderRadius: 20,
                border: "1px solid rgba(55, 65, 81, 0.5)",
                width: "fit-content",
                margin: "16px auto 0"
            }}>
                <span style={{ color: "#64748B", fontSize: "0.9rem" }}>⏱️</span>
                <span style={{
                    color: "#94A3B8",
                    fontSize: "0.8rem",
                    fontWeight: 500
                }}>
                    Tempo máximo: {question.max_duration}s
                </span>
            </div>
        </div>
    );
}
