"use client";

import { useState, useRef, useEffect } from "react";

// Estilos CSS para animações melhoradas
const enhancedStyles = `
@keyframes pulse {
    0%, 100% { 
        transform: scale(1.08);
        opacity: 1;
    }
    50% { 
        transform: scale(1.12);
        opacity: 0.8;
    }
}

@keyframes bounce {
    0%, 20%, 53%, 80%, 100% {
        transform: translateY(0);
    }
    40%, 43% {
        transform: translateY(-8px);
    }
    70% {
        transform: translateY(-4px);
    }
    90% {
        transform: translateY(-2px);
    }
}

@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}
`;

// Adicionar ao documento
if (typeof window !== "undefined") {
    const styleElement = document.createElement("style");
    styleElement.textContent = enhancedStyles;
    document.head.appendChild(styleElement);
}

interface AudioRecorderProps {
    onRecordingComplete: (audioBlob: Blob) => void;
    maxDuration?: number; // segundos
    isRecording?: boolean;
    onRecordingStateChange?: (isRecording: boolean) => void;
    onStreamReady?: (stream: MediaStream) => void; // NOVO
}

export function AudioRecorder({
    onRecordingComplete,
    maxDuration = 120,
    isRecording: externalIsRecording = false,
    onRecordingStateChange,
    onStreamReady // NOVO
}: AudioRecorderProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioLevel, setAudioLevel] = useState(0);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const streamRef = useRef<MediaStream | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);

    // Sincronizar estado externo com interno
    useEffect(() => {
        if (externalIsRecording !== isRecording) {
            setIsRecording(externalIsRecording);
        }
    }, [externalIsRecording]);

    // Função para formatar tempo
    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Função para detectar nível de áudio melhorada
    const detectAudioLevel = () => {
        if (!analyserRef.current) return;

        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);

        // Calcular nível médio com melhor precisão
        const relevantFrequencies = dataArray.slice(0, dataArray.length / 2); // Focar em frequências relevantes
        const average = relevantFrequencies.reduce((sum, value) => sum + value, 0) / relevantFrequencies.length;

        // Aplicar curva logarítmica mais natural
        const normalizedLevel = Math.min(100, Math.pow(average / 128, 1.5) * 100);

        // Suavizar transições
        setAudioLevel(prev => {
            const smoothed = prev * 0.7 + normalizedLevel * 0.3; // Média ponderada para suavização
            return Math.max(0, Math.min(100, smoothed));
        });

        animationFrameRef.current = requestAnimationFrame(detectAudioLevel);
    };

    // Iniciar gravação
    const startRecording = async () => {
        try {
            // Solicitar permissão de microfone
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });

            streamRef.current = stream;

            // NOVO: Callback com stream para uso futuro (webcam)
            onStreamReady?.(stream);

            // Configurar analisador de áudio para visualização
            const audioContext = new AudioContext();
            const source = audioContext.createMediaStreamSource(stream);
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);
            analyserRef.current = analyser;

            // Criar MediaRecorder
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus'
            });

            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, {
                    type: 'audio/webm;codecs=opus'
                });

                // Limpar recursos
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach(track => track.stop());
                }
                if (animationFrameRef.current) {
                    cancelAnimationFrame(animationFrameRef.current);
                }

                setAudioLevel(0);
                onRecordingComplete(audioBlob);
            };

            // Iniciar gravação
            mediaRecorder.start();
            setIsRecording(true);
            onRecordingStateChange?.(true);

            // Iniciar detecção de áudio
            detectAudioLevel();

            // Iniciar timer
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => {
                    const newTime = prev + 1;
                    if (newTime >= maxDuration) {
                        stopRecording();
                        return maxDuration;
                    }
                    return newTime;
                });
            }, 1000);

        } catch (error) {
            console.error("Erro ao iniciar gravação:", error);
            alert("Não foi possível acessar o microfone. Verifique as permissões.");
        }
    };

    // Parar gravação
    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            onRecordingStateChange?.(false);

            // Limpar timer
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }

            setRecordingTime(0);
        }
    };

    // Toggle gravação
    const toggleRecording = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    // Cleanup ao desmontar
    useEffect(() => {
        return () => {
            if (isRecording) {
                stopRecording();
            }
        };
    }, []);

    return (
        <div style={{ textAlign: "center", padding: "20px" }}>
            {/* Botão de Gravação */}
            <div style={{ position: "relative", display: "inline-block", marginBottom: 24 }}>
                <button
                    onClick={toggleRecording}
                    style={{
                        width: "80px",
                        height: "80px",
                        borderRadius: "50%",
                        border: "none",
                        background: isRecording
                            ? "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)"
                            : "linear-gradient(135deg, #38BDF8 0%, #0EA5E9 100%)",
                        color: "white",
                        fontSize: "2rem",
                        cursor: "pointer",
                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        boxShadow: isRecording
                            ? "0 0 40px rgba(239, 68, 68, 0.6), 0 8px 25px rgba(239, 68, 68, 0.3)"
                            : "0 8px 25px rgba(56, 189, 248, 0.3)",
                        animation: isRecording ? "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" : "none",
                        transform: isRecording ? "scale(1.08)" : "scale(1)",
                        position: "relative"
                    }}
                >
                    <span style={{
                        display: "block",
                        animation: isRecording ? "none" : "bounce 2s infinite"
                    }}>
                        {isRecording ? "⏸️" : "🎙️"}
                    </span>

                    {/* Efeito de brilho */}
                    {isRecording && (
                        <div style={{
                            position: "absolute",
                            inset: "-4px",
                            borderRadius: "50%",
                            background: "conic-gradient(from 0deg, transparent, rgba(239, 68, 68, 0.4), transparent)",
                            animation: "spin 3s linear infinite",
                            zIndex: -1
                        }} />
                    )}
                </button>

                {/* Timer Melhorado */}
                {isRecording && (
                    <div style={{
                        position: "absolute",
                        top: "-35px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        background: "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)",
                        color: "white",
                        padding: "6px 16px",
                        borderRadius: 25,
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                        boxShadow: "0 4px 15px rgba(239, 68, 68, 0.4)",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                        backdropFilter: "blur(10px)"
                    }}>
                        <span style={{ marginRight: "6px" }}>⏱️</span>
                        {formatTime(recordingTime)}
                    </div>
                )}

                {/* Visualizador de Ondas Fluidas */}
                {isRecording && (
                    <div style={{
                        position: "absolute",
                        bottom: "-40px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: "200px",
                        height: "30px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "1px"
                    }}>
                        {[...Array(40)].map((_, i) => {
                            // Criar efeito de onda suave
                            const waveHeight = Math.sin((i / 40) * Math.PI * 2 + Date.now() / 200) * 0.3 + 0.7;
                            const dynamicHeight = Math.max(2, (audioLevel / 100) * 25 * waveHeight);

                            // Cores dinâmicas baseadas no volume
                            const getBarColor = (level: number) => {
                                if (level > 70) return "#10B981"; // Verde para alto volume
                                if (level > 40) return "#38BDF8"; // Azul para médio
                                return "#64748B"; // Cinza para baixo
                            };

                            return (
                                <div
                                    key={i}
                                    style={{
                                        width: "2px",
                                        height: `${dynamicHeight}px`,
                                        background: `linear-gradient(to top, ${getBarColor(audioLevel)}, ${getBarColor(audioLevel * 0.6)})`,
                                        borderRadius: "2px",
                                        transition: "height 0.15s ease-out, background 0.3s ease",
                                        opacity: 0.8 + (audioLevel / 100) * 0.2,
                                        transform: `scaleY(${0.8 + (audioLevel / 100) * 0.2})`
                                    }}
                                />
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Texto de instrução */}
            <p style={{
                color: "#94A3B8",
                marginTop: 16,
                fontSize: "0.9rem"
            }}>
                {isRecording
                    ? "Gravando... Clique para parar"
                    : "Clique para começar a gravar"
                }
            </p>

            {/* Indicador de duração máxima */}
            {!isRecording && (
                <p style={{
                    color: "#64748B",
                    fontSize: "0.8rem",
                    marginTop: 8
                }}>
                    Duração máxima: {maxDuration} segundos
                </p>
            )}
        </div>
    );
}
