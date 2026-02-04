"use client";

import { useState, useEffect } from "react";
import type { ReportData, FeedbackEntrevista, InterviewQuestion, InterviewSession, SimuladorStage } from "@/types";
import { AudioRecorder } from "@/components/AudioRecorder";
import { QuestionCard } from "@/components/QuestionCard";
import { FeedbackCard } from "@/components/FeedbackCard";

interface InterviewSimulatorProps {
    reportData: ReportData;
    onProgress?: (questionIndex: number, total: number) => void;
}

export function InterviewSimulator({ reportData, onProgress }: InterviewSimulatorProps) {
    const [stage, setStage] = useState<SimuladorStage>("welcome");
    const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [currentFeedback, setCurrentFeedback] = useState<FeedbackEntrevista | null>(null);
    const [sessionHistory, setSessionHistory] = useState<InterviewSession[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Carregar perguntas ao montar
    useEffect(() => {
        loadQuestions();
    }, []);

    const loadQuestions = async () => {
        try {
            // Gerar perguntas baseadas no CV (mock por enquanto)
            const mockQuestions: InterviewQuestion[] = [
                {
                    id: 1,
                    text: "Fale sobre um projeto desafiador que você desenvolveu e qual foi sua maior aprendizagem.",
                    type: "comportamental",
                    context: "Use o método STAR para estruturar sua resposta.",
                    max_duration: 120
                },
                {
                    id: 2,
                    text: "Como você mantém suas habilidades técnicas atualizadas?",
                    type: "comportamental",
                    context: "Mencione cursos, projetos pessoais ou comunidades.",
                    max_duration: 120
                },
                {
                    id: 3,
                    text: "Descreva uma situação em que você teve que lidar com um bug crítico em produção.",
                    type: "comportamental",
                    context: "Foque em resolução de problemas e comunicação.",
                    max_duration: 120
                },
                {
                    id: 4,
                    text: "Como você equilibra qualidade de código e prazos apertados?",
                    type: "situacional",
                    context: "Mostre seu processo de tomada de decisão.",
                    max_duration: 120
                },
                {
                    id: 5,
                    text: "Por que você está interessado nesta vaga e nesta empresa?",
                    type: "comportamental",
                    context: "Mostre que você pesquisou sobre a empresa.",
                    max_duration: 120
                }
            ];

            setQuestions(mockQuestions);
        } catch (error) {
            console.error("Erro ao carregar perguntas:", error);
            setError("Não foi possível carregar as perguntas.");
        }
    };

    const startSimulation = () => {
        setStage("question");
        setCurrentQuestionIndex(0);
        setError(null);
    };

    const handleRecordingComplete = async (audioBlob: Blob) => {
        setStage("processing");
        setIsProcessing(true);
        setError(null);

        try {
            // Enviar áudio para análise
            const formData = new FormData();
            formData.append("audio_file", audioBlob, "recording.webm");
            formData.append("question", questions[currentQuestionIndex].text);
            formData.append("job_context", reportData.setor_detectado || "Tecnologia");

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/interview/analyze`, {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error("Falha na análise da resposta");
            }

            const feedback: FeedbackEntrevista = await response.json();
            setCurrentFeedback(feedback);

            // Adicionar ao histórico
            const session: InterviewSession = {
                question: questions[currentQuestionIndex],
                audioBlob,
                feedback,
                timestamp: new Date()
            };
            setSessionHistory(prev => [...prev, session]);

            setStage("feedback");
            onProgress?.(currentQuestionIndex + 1, questions.length);

        } catch (error) {
            console.error("Erro ao processar áudio:", error);
            setError("Ocorreu um erro ao processar sua resposta. Tente novamente.");
            setStage("question");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleNextQuestion = () => {
        const nextIndex = currentQuestionIndex + 1;

        if (nextIndex >= questions.length) {
            // Todas as perguntas respondidas
            setStage("results");
        } else {
            setCurrentQuestionIndex(nextIndex);
            setStage("question");
            setCurrentFeedback(null);
        }
    };

    const handleRetryQuestion = () => {
        setStage("question");
        setCurrentFeedback(null);
        setError(null);
    };

    const restartSimulation = () => {
        setStage("welcome");
        setCurrentQuestionIndex(0);
        setCurrentFeedback(null);
        setSessionHistory([]);
        setError(null);
    };

    const calculateAverageScore = (): number => {
        if (sessionHistory.length === 0) return 0;
        const total = sessionHistory.reduce((sum, session) => sum + session.feedback.nota_final, 0);
        return Math.round(total / sessionHistory.length);
    };

    const getPerformanceMessage = (score: number) => {
        if (score >= 80) {
            return { text: "Excelente desempenho! Você está muito bem preparado.", color: "#10B981" };
        } else if (score >= 60) {
            return { text: "Bom desempenho! Com alguns ajustes você ficará ótimo.", color: "#F59E0B" };
        } else {
            return { text: "Continue praticando! A experiência trará melhoria.", color: "#EF4444" };
        }
    };

    // Renderizar tela de boas-vindas
    if (stage === "welcome") {
        return (
            <div style={{
                background: "linear-gradient(135deg, rgba(15, 23, 42, 0.6) 0%, rgba(56, 189, 248, 0.1) 100%)",
                border: "1px solid rgba(56, 189, 248, 0.2)",
                borderRadius: 16,
                padding: 32,
                textAlign: "center"
            }}>
                <h2 style={{ fontSize: "1.8rem", marginBottom: 16 }}>
                    🎙️ Simulador de Entrevista IA
                </h2>
                <p style={{ color: "#94A3B8", marginBottom: 24 }}>
                    Teste suas habilidades com perguntas personalizadas baseadas no seu CV e vaga alvo.
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
                    <div>
                        <div style={{ fontSize: "2rem", marginBottom: 8 }}>📋</div>
                        <div style={{ fontWeight: 600 }}>5 Perguntas</div>
                        <div style={{ color: "#94A3B8", fontSize: "0.9rem" }}>Comportamentais e técnicas</div>
                    </div>
                    <div>
                        <div style={{ fontSize: "2rem", marginBottom: 8 }}>🤖</div>
                        <div style={{ fontWeight: 600 }}>IA Avançada</div>
                        <div style={{ color: "#94A3B8", fontSize: "0.9rem" }}>Análise em tempo real</div>
                    </div>
                    <div>
                        <div style={{ fontSize: "2rem", marginBottom: 8 }}>📈</div>
                        <div style={{ fontWeight: 600 }}>Feedback Detalhado</div>
                        <div style={{ color: "#94A3B8", fontSize: "0.9rem" }}>Nota e exemplos STAR</div>
                    </div>
                </div>

                {error && (
                    <div style={{
                        background: "rgba(239, 68, 68, 0.1)",
                        border: "1px solid rgba(239, 68, 68, 0.3)",
                        borderRadius: 8,
                        padding: 12,
                        marginBottom: 16,
                        color: "#EF4444"
                    }}>
                        {error}
                    </div>
                )}

                <button
                    onClick={startSimulation}
                    style={{
                        background: "#38BDF8",
                        color: "#0F172A",
                        padding: "16px 32px",
                        borderRadius: 12,
                        border: "none",
                        fontWeight: 700,
                        fontSize: "1.1rem",
                        cursor: "pointer",
                        transition: "transform 0.2s"
                    }}
                >
                    🚀 COMEÇAR SIMULAÇÃO
                </button>
            </div>
        );
    }

    // Renderizar tela de pergunta
    if (stage === "question") {
        const currentQuestion = questions[currentQuestionIndex];
        if (!currentQuestion) return null;

        return (
            <div>
                <QuestionCard
                    question={currentQuestion}
                    questionNumber={currentQuestionIndex + 1}
                    totalQuestions={questions.length}
                />

                <div style={{ marginTop: 32 }}>
                    <AudioRecorder
                        onRecordingComplete={handleRecordingComplete}
                        maxDuration={currentQuestion.max_duration}
                        onRecordingStateChange={(isRecording) => {
                            if (isRecording) {
                                setStage("recording");
                            }
                        }}
                    />
                </div>

                {error && (
                    <div style={{
                        background: "rgba(239, 68, 68, 0.1)",
                        border: "1px solid rgba(239, 68, 68, 0.3)",
                        borderRadius: 8,
                        padding: 12,
                        marginTop: 16,
                        color: "#EF4444"
                    }}>
                        {error}
                    </div>
                )}
            </div>
        );
    }

    // Renderizar tela de gravação
    if (stage === "recording") {
        const currentQuestion = questions[currentQuestionIndex];
        if (!currentQuestion) return null;

        return (
            <div>
                <QuestionCard
                    question={currentQuestion}
                    questionNumber={currentQuestionIndex + 1}
                    totalQuestions={questions.length}
                />

                <div style={{ marginTop: 32 }}>
                    <AudioRecorder
                        onRecordingComplete={handleRecordingComplete}
                        maxDuration={currentQuestion.max_duration}
                        isRecording={true}
                    />
                </div>
            </div>
        );
    }

    // Renderizar tela de processamento
    if (stage === "processing") {
        return (
            <div style={{
                background: "linear-gradient(135deg, rgba(15, 23, 42, 0.6) 0%, rgba(56, 189, 248, 0.1) 100%)",
                border: "1px solid rgba(56, 189, 248, 0.2)",
                borderRadius: 16,
                padding: 32,
                textAlign: "center"
            }}>
                <div style={{
                    width: "40px",
                    height: "40px",
                    border: "4px solid #38BDF8",
                    borderTop: "4px solid transparent",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                    margin: "0 auto 16px"
                }} />
                <h3 style={{ fontSize: "1.4rem", marginBottom: 8 }}>
                    🤖 Analisando sua resposta...
                </h3>
                <p style={{ color: "#94A3B8" }}>
                    Nossa IA está avaliando sua resposta e gerando feedback personalizado.
                </p>
            </div>
        );
    }

    // Renderizar tela de feedback
    if (stage === "feedback" && currentFeedback) {
        const currentQuestion = questions[currentQuestionIndex];
        return (
            <div>
                <FeedbackCard
                    feedback={currentFeedback}
                    question={currentQuestion.text}
                    onRetry={handleRetryQuestion}
                    onNext={handleNextQuestion}
                    isLastQuestion={currentQuestionIndex === questions.length - 1}
                />
            </div>
        );
    }

    // Renderizar tela de resultados finais
    if (stage === "results") {
        const averageScore = calculateAverageScore();
        const performanceMessage = getPerformanceMessage(averageScore);

        return (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <h2 style={{ fontSize: "2rem", marginBottom: 16 }}>
                    🎉 Simulação Concluída!
                </h2>

                {/* Score Geral */}
                <div style={{
                    background: "linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(56, 189, 248, 0.1) 100%)",
                    border: "1px solid rgba(16, 185, 129, 0.3)",
                    borderRadius: 16,
                    padding: 32,
                    marginBottom: 32
                }}>
                    <div style={{ fontSize: "4rem", fontWeight: 800, color: "#10B981", marginBottom: 8 }}>
                        {averageScore}
                    </div>
                    <div style={{ fontSize: "1.2rem", color: "#94A3B8", marginBottom: 16 }}>
                        Sua Pontuação Média
                    </div>
                    <div style={{ fontSize: "1rem", color: performanceMessage.color }}>
                        {performanceMessage.text}
                    </div>
                </div>

                {/* Histórico de Tentativas */}
                <div style={{ textAlign: "left", marginBottom: 32 }}>
                    <h3 style={{ marginBottom: 16 }}>Suas Respostas</h3>
                    {sessionHistory.map((session, idx) => (
                        <div key={idx} style={{
                            background: "rgba(255,255,255,0.05)",
                            borderRadius: 8,
                            padding: 16,
                            marginBottom: 12
                        }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                                <span style={{ fontWeight: 600 }}>Pergunta {idx + 1}</span>
                                <span style={{
                                    color: session.feedback.nota_final >= 70 ? "#10B981" : session.feedback.nota_final >= 50 ? "#F59E0B" : "#EF4444",
                                    fontWeight: 600
                                }}>
                                    {session.feedback.nota_final} pts
                                </span>
                            </div>
                            <p style={{ color: "#94A3B8", fontSize: "0.9rem", marginBottom: 8 }}>
                                {session.question.text}
                            </p>
                            <p style={{ color: "#38BDF8", fontSize: "0.9rem" }}>
                                {session.feedback.feedback_curto}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Botões Finais */}
                <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                    <button
                        onClick={restartSimulation}
                        style={{
                            background: "transparent",
                            border: "2px solid #38BDF8",
                            color: "#38BDF8",
                            padding: "12px 24px",
                            borderRadius: 8,
                            fontWeight: 600,
                            cursor: "pointer"
                        }}
                    >
                        🔄 Refazer Simulação
                    </button>
                </div>
            </div>
        );
    }

    return null;
}
