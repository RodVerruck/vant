"use client";

import { useState, useEffect, useRef } from "react";
import type { ReportData, FeedbackEntrevista, InterviewQuestion, InterviewSession, SimuladorStage } from "@/types";
import { AudioRecorder } from "@/components/AudioRecorder";
import { QuestionCard } from "@/components/QuestionCard";
import { FeedbackCard } from "@/components/FeedbackCard";
import { VideoPreview } from "@/components/VideoPreview";
import { SimpleHUD } from "@/components/SimpleHUD";
import { SmartTipsComponent } from "@/components/SmartTips";
import { useSmartTips } from "@/components/SmartTips";

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

    // Novos estados para webcam e HUD
    const [videoEnabled, setVideoEnabled] = useState(false);
    const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
    const [audioLevel, setAudioLevel] = useState(0);
    const [recordingTime, setRecordingTime] = useState(0);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [isSpeaking, setIsSpeaking] = useState(false);

    const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Context para SmartTips
    const smartTipsContext = {
        elapsedTime,
        isSpeaking,
        audioLevel
    };

    const { currentTip, clearTip } = useSmartTips(smartTipsContext);

    // Carregar perguntas ao montar
    useEffect(() => {
        loadQuestions();
    }, []);

    // Carregar perguntas personalizadas do backend
    const loadQuestions = async () => {
        try {
            // Buscar ID da análise do CV
            const cvId = localStorage.getItem('vant_cv_analysis_id');
            if (!cvId) {
                // Fallback para perguntas mock se não tiver ID
                loadMockQuestions();
                return;
            }

            const formData = new FormData();
            formData.append("cv_analysis_id", cvId);
            formData.append("mode", "standard");
            formData.append("difficulty", "intermediate");

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/interview/generate-questions`, {
                method: "POST",
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                setQuestions(data.questions);
            } else {
                // Fallback para mock se falhar
                loadMockQuestions();
            }
        } catch (error) {
            console.error("Erro ao carregar perguntas:", error);
            // Fallback para mock
            loadMockQuestions();
        }
    };

    const loadMockQuestions = () => {
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
    };

    const startSimulation = () => {
        setStage("question");
        setCurrentQuestionIndex(0);
        setError(null);
        setElapsedTime(0);
        setRecordingTime(0);
    };

    // Handlers para webcam
    const handleVideoToggle = () => {
        setVideoEnabled(!videoEnabled);
    };

    const handleVideoError = (error: string) => {
        console.error('[VideoPreview] Error:', error);
        // Não mostrar erro ao usuário, apenas log
    };

    const handleVideoStreamReady = (stream: MediaStream) => {
        setVideoStream(stream);
    };

    const handleRecordingComplete = async (audioBlob: Blob) => {
        setStage("processing");
        setIsProcessing(true);
        setError(null);
        setRecordingTime(0);
        setIsSpeaking(false);

        try {
            // Enviar áudio para análise avançada
            const formData = new FormData();
            formData.append("audio_file", audioBlob, "recording.webm");
            formData.append("question", questions[currentQuestionIndex].text);
            formData.append("cv_context", JSON.stringify(reportData));
            formData.append("interview_mode", "standard");

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/interview/analyze-advanced`, {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error("Falha na análise avançada da resposta");
            }

            const feedback = await response.json();
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
        clearTip(); // Limpar dica ao mudar de pergunta

        if (nextIndex >= questions.length) {
            // Todas as perguntas respondidas
            setStage("results");
        } else {
            setCurrentQuestionIndex(nextIndex);
            setStage("question");
            setCurrentFeedback(null);
            setElapsedTime(0);
            setRecordingTime(0);
        }
    };

    const handleRetryQuestion = () => {
        setStage("question");
        setCurrentFeedback(null);
        setError(null);
        setElapsedTime(0);
        setRecordingTime(0);
        clearTip();
    };

    const restartSimulation = () => {
        setStage("welcome");
        setCurrentQuestionIndex(0);
        setCurrentFeedback(null);
        setSessionHistory([]);
        setError(null);
        setVideoEnabled(false);
        setVideoStream(null);
        setElapsedTime(0);
        setRecordingTime(0);
        setAudioLevel(0);
        clearTip();
    };

    // Handlers para AudioRecorder enhanced
    const handleRecordingStateChange = (isRecording: boolean) => {
        console.log('[InterviewSimulator] handleRecordingStateChange:', isRecording, 'current stage:', stage);

        if (isRecording) {
            console.log('[InterviewSimulator] Starting recording - switching to recording stage');
            setStage("recording");
            setElapsedTime(0);
            setRecordingTime(0);

            if (recordingTimerRef.current) {
                clearInterval(recordingTimerRef.current);
            }

            recordingTimerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } else {
            console.log('[InterviewSimulator] Stopping recording - checking stage:', stage);

            if (recordingTimerRef.current) {
                clearInterval(recordingTimerRef.current);
                recordingTimerRef.current = null;
            }

            setRecordingTime(0);

            // Se não estiver processando, voltar para question
            if (!isProcessing) {
                console.log('[InterviewSimulator] Not processing - switching back to question');
                setStage(prev => {
                    console.log('[InterviewSimulator] Stage transition:', prev, '->', prev === "recording" ? "question" : prev);
                    return prev === "recording" ? "question" : prev;
                });
            }
        }
    };

    useEffect(() => {
        return () => {
            if (recordingTimerRef.current) {
                clearInterval(recordingTimerRef.current);
            }
        };
    }, []);

    const handleAudioStreamReady = (stream: MediaStream) => {
        // Configurar análise de áudio para visualização
        const audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);

        // Detectar nível de áudio em tempo real
        const detectLevel = () => {
            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(dataArray);

            const relevantFrequencies = dataArray.slice(0, dataArray.length / 2);
            const average = relevantFrequencies.reduce((sum, value) => sum + value, 0) / relevantFrequencies.length;
            const normalizedLevel = Math.min(100, Math.pow(average / 128, 1.5) * 100);

            setAudioLevel(prev => {
                const smoothed = prev * 0.7 + normalizedLevel * 0.3;
                return Math.max(0, Math.min(100, smoothed));
            });

            requestAnimationFrame(detectLevel);
        };

        detectLevel();
    };

    // Timer para elapsed time
    useEffect(() => {
        let timer: NodeJS.Timeout;

        if (stage === "recording") {
            timer = setInterval(() => {
                setElapsedTime(prev => prev + 1);
            }, 1000);
        }

        return () => {
            if (timer) clearInterval(timer);
        };
    }, [stage]);

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
                <VideoPreview
                    isActive={videoEnabled}
                    onToggle={handleVideoToggle}
                    onError={handleVideoError}
                    onStreamReady={handleVideoStreamReady}
                />

                <QuestionCard
                    question={currentQuestion}
                    questionNumber={currentQuestionIndex + 1}
                    totalQuestions={questions.length}
                />

                <div style={{ marginTop: 32 }}>
                    <AudioRecorder
                        onRecordingComplete={handleRecordingComplete}
                        maxDuration={currentQuestion.max_duration}
                        onRecordingStateChange={handleRecordingStateChange}
                        onStreamReady={handleAudioStreamReady}
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
            <div style={{ position: "relative", minHeight: "100vh", background: "rgba(0, 0, 0, 0.95)" }}>
                <SimpleHUD
                    stream={videoStream}
                    isActive={true}
                    audioLevel={audioLevel}
                    timeRemaining={currentQuestion.max_duration - recordingTime}
                    coachingTip={currentTip?.message}
                    questionNumber={currentQuestionIndex + 1}
                    totalQuestions={questions.length}
                />

                <div style={{
                    position: "fixed",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    zIndex: 2,
                    width: "90%",
                    maxWidth: "600px"
                }}>
                    <QuestionCard
                        question={currentQuestion}
                        questionNumber={currentQuestionIndex + 1}
                        totalQuestions={questions.length}
                    />

                    <div style={{ marginTop: 20 }}>
                        <AudioRecorder
                            onRecordingComplete={handleRecordingComplete}
                            maxDuration={currentQuestion.max_duration}
                            isRecording={true}
                            onRecordingStateChange={handleRecordingStateChange}
                            onStreamReady={handleAudioStreamReady}
                        />
                    </div>
                </div>

                {videoEnabled && videoStream && (
                    <div style={{
                        position: "fixed",
                        bottom: "24px",
                        right: "24px",
                        width: "220px",
                        height: "160px",
                        borderRadius: "16px",
                        overflow: "hidden",
                        border: "2px solid rgba(56, 189, 248, 0.6)",
                        boxShadow: "0 20px 45px rgba(0, 0, 0, 0.45)",
                        background: "#000",
                        zIndex: 3
                    }}>
                        <video
                            autoPlay
                            playsInline
                            muted
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                transform: "scaleX(-1)"
                            }}
                            ref={(el) => {
                                if (el && videoStream) {
                                    el.srcObject = videoStream;
                                }
                            }}
                        />

                        <div style={{
                            position: "absolute",
                            top: "8px",
                            right: "8px",
                            background: "rgba(239, 68, 68, 0.9)",
                            color: "white",
                            padding: "4px 8px",
                            borderRadius: "999px",
                            fontSize: "0.7rem",
                            fontWeight: 600,
                            display: "flex",
                            alignItems: "center",
                            gap: "6px"
                        }}>
                            <span style={{
                                width: "8px",
                                height: "8px",
                                borderRadius: "50%",
                                background: "white",
                                animation: "pulse 1.5s infinite"
                            }} />
                            REC
                        </div>
                    </div>
                )}

                <SmartTipsComponent context={smartTipsContext} />
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
                <p style={{ color: "#94A3B8", marginBottom: 32 }}>
                    Parabéns! Você completou todas as perguntas da simulação.
                </p>

                <div style={{
                    background: "linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)",
                    border: "1px solid rgba(16, 185, 129, 0.3)",
                    borderRadius: 16,
                    padding: 32,
                    marginBottom: 32
                }}>
                    <div style={{ fontSize: "3rem", marginBottom: 16 }}>📊</div>
                    <div style={{ fontSize: "2.5rem", fontWeight: "700", color: performanceMessage.color, marginBottom: 8 }}>
                        {averageScore}/100
                    </div>
                    <div style={{ color: "#94A3B8", marginBottom: 24 }}>
                        {performanceMessage.text}
                    </div>

                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                        gap: 16,
                        textAlign: "left"
                    }}>
                        <div style={{
                            background: "rgba(56, 189, 248, 0.1)",
                            padding: 16,
                            borderRadius: 8
                        }}>
                            <div style={{ fontWeight: 600, marginBottom: 8 }}>📋 Perguntas Respondidas</div>
                            <div style={{ color: "#94A3B8" }}>{sessionHistory.length}</div>
                        </div>
                        <div style={{
                            background: "rgba(139, 92, 246, 0.1)",
                            padding: 16,
                            borderRadius: 8
                        }}>
                            <div style={{ fontWeight: 600, marginBottom: 8 }}>🎯 Desempenho</div>
                            <div style={{ color: "#94A3B8" }}>{averageScore}% de acerto</div>
                        </div>
                        <div style={{
                            background: "rgba(245, 158, 11, 0.1)",
                            padding: 16,
                            borderRadius: 8
                        }}>
                            <div style={{ fontWeight: 600, marginBottom: 8 }}>⏱️ Tempo Médio</div>
                            <div style={{ color: "#94A3B8" }}>2:30 por resposta</div>
                        </div>
                    </div>
                </div>

                <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
                    <button
                        onClick={restartSimulation}
                        style={{
                            background: "#38BDF8",
                            color: "#0F172A",
                            padding: "12px 24px",
                            borderRadius: 8,
                            border: "none",
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "transform 0.2s"
                        }}
                    >
                        🔄 Refazer Simulação
                    </button>
                </div>
            </div>
        );
    }

    // Fallback (não deveria chegar aqui)
    return null;
}
