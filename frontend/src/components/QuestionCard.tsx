"use client";

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
                <h3 style={{ fontSize: "1.4rem", marginBottom: 16 }}>
                    Pergunta {questionNumber} de {totalQuestions}
                </h3>
                
                {/* Progress Indicator */}
                <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 24 }}>
                    {[...Array(totalQuestions)].map((_, index) => (
                        <div
                            key={index}
                            style={{
                                width: "12px",
                                height: "12px",
                                borderRadius: "50%",
                                background: index < questionNumber 
                                    ? "#10B981" 
                                    : index === questionNumber - 1 
                                        ? "#38BDF8" 
                                        : "#374151",
                                transition: "background 0.3s"
                            }}
                        />
                    ))}
                </div>
            </div>
            
            {/* Card da Pergunta */}
            <div style={{
                background: "linear-gradient(135deg, rgba(15, 23, 42, 0.6) 0%, rgba(56, 189, 248, 0.1) 100%)",
                border: "1px solid rgba(56, 189, 248, 0.3)",
                borderRadius: 16,
                padding: 32,
                marginBottom: 24,
                position: "relative",
                overflow: "hidden"
            }}>
                {/* Badge do tipo */}
                <div style={{
                    position: "absolute",
                    top: 16,
                    right: 16,
                    background: getTypeColor(question.type),
                    color: "white",
                    padding: "4px 12px",
                    borderRadius: 20,
                    fontSize: "0.8rem",
                    fontWeight: 600
                }}>
                    {getTypeLabel(question.type)}
                </div>
                
                <p style={{ 
                    fontSize: "1.2rem", 
                    lineHeight: 1.6, 
                    marginBottom: 16,
                    paddingRight: "100px" // Espaço para o badge
                }}>
                    {question.text}
                </p>
                
                {question.context && (
                    <div style={{
                        background: "rgba(56, 189, 248, 0.1)",
                        border: "1px solid rgba(56, 189, 248, 0.3)",
                        borderRadius: 8,
                        padding: 12,
                        marginTop: 16
                    }}>
                        <p style={{ 
                            color: "#38BDF8", 
                            fontSize: "0.9rem",
                            margin: 0,
                            display: "flex",
                            alignItems: "center",
                            gap: 8
                        }}>
                            <span>💡</span>
                            <span>Dica: {question.context}</span>
                        </p>
                    </div>
                )}
            </div>
            
            {/* Indicador de duração */}
            <p style={{ 
                color: "#64748B", 
                fontSize: "0.8rem",
                marginTop: 8
            }}>
                ⏱️ Tempo máximo: {question.max_duration} segundos
            </p>
        </div>
    );
}
