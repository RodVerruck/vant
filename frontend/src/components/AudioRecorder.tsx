"use client";

import { useState, useRef, useEffect } from "react";

interface AudioRecorderProps {
    onRecordingComplete: (audioBlob: Blob) => void;
    maxDuration?: number; // segundos
    isRecording?: boolean;
    onRecordingStateChange?: (isRecording: boolean) => void;
}

export function AudioRecorder({ 
    onRecordingComplete, 
    maxDuration = 120, 
    isRecording: externalIsRecording = false,
    onRecordingStateChange
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

    // Função para detectar nível de áudio
    const detectAudioLevel = () => {
        if (!analyserRef.current) return;

        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);

        // Calcular nível médio
        const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
        const normalizedLevel = Math.min(100, (average / 128) * 100);
        
        setAudioLevel(normalizedLevel);
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
                        background: isRecording ? "#EF4444" : "#38BDF8",
                        color: "white",
                        fontSize: "2rem",
                        cursor: "pointer",
                        transition: "all 0.3s",
                        boxShadow: isRecording 
                            ? "0 0 30px rgba(239, 68, 68, 0.5)" 
                            : "0 4px 15px rgba(56, 189, 248, 0.3)",
                        animation: isRecording ? "pulse 1.5s infinite" : "none",
                        transform: isRecording ? "scale(1.05)" : "scale(1)"
                    }}
                >
                    {isRecording ? "⏸️" : "🎙️"}
                </button>
                
                {/* Timer */}
                {isRecording && (
                    <div style={{
                        position: "absolute",
                        top: "-30px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        background: "#EF4444",
                        color: "white",
                        padding: "4px 12px",
                        borderRadius: 20,
                        fontSize: "0.9rem",
                        fontWeight: 600,
                        whiteSpace: "nowrap"
                    }}>
                        {formatTime(recordingTime)}
                    </div>
                )}
                
                {/* Indicador de nível de áudio */}
                {isRecording && (
                    <div style={{
                        position: "absolute",
                        bottom: "-30px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        display: "flex",
                        gap: "2px",
                        alignItems: "flex-end"
                    }}>
                        {[...Array(20)].map((_, i) => (
                            <div
                                key={i}
                                style={{
                                    width: "3px",
                                    height: `${Math.max(2, (audioLevel / 100) * 20)}px`,
                                    background: audioLevel > 50 ? "#10B981" : "#38BDF8",
                                    borderRadius: "2px",
                                    transition: "height 0.1s"
                                }}
                            />
                        ))}
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
