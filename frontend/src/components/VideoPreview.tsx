"use client";

import { useState, useRef, useEffect } from "react";

interface VideoPreviewProps {
    isActive: boolean;
    onToggle: () => void;
    onError: (error: string) => void;
    onStreamReady?: (stream: MediaStream) => void;
}

export function VideoPreview({ isActive, onToggle, onError, onStreamReady }: VideoPreviewProps) {
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    // Limpar stream quando desativar
    useEffect(() => {
        if (!isActive && stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    }, [isActive, stream]);

    // Iniciar webcam
    const startWebcam = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: "user"
                },
                audio: false // Áudio já é tratado pelo AudioRecorder
            });

            setStream(mediaStream);

            // Configurar video element
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                console.log('[VideoPreview] Stream atribuído ao vídeo');
            } else {
                console.log('[VideoPreview] Video ref ainda não disponível');
            }

            // Callback com stream para uso futuro
            onStreamReady?.(mediaStream);

            setIsLoading(false);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
            setError(errorMessage);
            onError("Não foi possível acessar a câmera. Continue com áudio apenas.");
            setIsLoading(false);
        }
    };

    // Parar webcam
    const stopWebcam = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        onToggle();
    };

    // Auto-iniciar quando ativo
    useEffect(() => {
        if (isActive && !stream && !isLoading) {
            startWebcam();
        }
    }, [isActive]);

    // Garantir que o vídeo receba o stream quando estiver disponível
    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    if (!isActive) {
        return (
            <div style={{
                textAlign: "center",
                padding: "20px",
                background: "rgba(15, 23, 42, 0.6)",
                border: "1px solid rgba(56, 189, 248, 0.2)",
                borderRadius: 12,
                marginBottom: 20
            }}>
                <p style={{
                    color: "#94A3B8",
                    marginBottom: 16,
                    fontSize: "0.9rem"
                }}>
                    Deseja uma experiência imersiva com vídeo?
                </p>
                <button
                    onClick={onToggle}
                    style={{
                        background: "linear-gradient(135deg, #38BDF8 0%, #0EA5E9 100%)",
                        color: "white",
                        border: "none",
                        padding: "12px 24px",
                        borderRadius: 8,
                        fontSize: "0.9rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "all 0.3s",
                        boxShadow: "0 4px 15px rgba(56, 189, 248, 0.3)",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        margin: "0 auto"
                    }}
                >
                    📷 Ativar câmera (opcional)
                </button>
                <p style={{
                    color: "#64748B",
                    fontSize: "0.75rem",
                    marginTop: 12,
                    fontStyle: "italic"
                }}>
                    Seu vídeo NÃO será gravado, apenas para experiência visual
                </p>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div style={{
                textAlign: "center",
                padding: "40px",
                background: "rgba(15, 23, 42, 0.8)",
                border: "1px solid rgba(56, 189, 248, 0.3)",
                borderRadius: 12,
                marginBottom: 20
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
                <p style={{ color: "#38BDF8", fontSize: "0.9rem" }}>
                    Preparando câmera...
                </p>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{
                textAlign: "center",
                padding: "20px",
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                borderRadius: 12,
                marginBottom: 20
            }}>
                <p style={{ color: "#EF4444", marginBottom: 12 }}>
                    ⚠️ {error}
                </p>
                <button
                    onClick={onToggle}
                    style={{
                        background: "transparent",
                        color: "#38BDF8",
                        border: "1px solid #38BDF8",
                        padding: "8px 16px",
                        borderRadius: 6,
                        fontSize: "0.85rem",
                        cursor: "pointer"
                    }}
                >
                    Continuar com áudio apenas
                </button>
            </div>
        );
    }

    return (
        <div style={{
            position: "relative",
            width: "100%",
            maxWidth: "600px",
            margin: "0 auto 20px",
            borderRadius: 12,
            overflow: "hidden",
            background: "rgba(15, 23, 42, 0.8)",
            border: "1px solid rgba(56, 189, 248, 0.3)"
        }}>
            {/* Video Preview */}
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                    width: "100%",
                    height: "400px",
                    display: "block",
                    transform: "scaleX(-1)", // Espelho para experiência natural
                    borderRadius: "12px",
                    objectFit: "cover",
                    backgroundColor: "#000"
                }}
                onLoad={() => console.log('[VideoPreview] Vídeo carregado')}
                onError={(e) => console.error('[VideoPreview] Erro no vídeo:', e)}
            />

            {/* Controles e Info */}
            <div style={{
                position: "absolute",
                top: "10px",
                right: "10px",
                display: "flex",
                gap: "8px"
            }}>
                {/* Indicador de gravação (se houver) */}
                <div style={{
                    background: "rgba(239, 68, 68, 0.9)",
                    color: "white",
                    padding: "4px 8px",
                    borderRadius: 4,
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: "4px"
                }}>
                    <div style={{
                        width: "8px",
                        height: "8px",
                        background: "white",
                        borderRadius: "50%",
                        animation: "pulse 1.5s infinite"
                    }} />
                    PREVIEW
                </div>

                {/* Botão para fechar */}
                <button
                    onClick={stopWebcam}
                    style={{
                        background: "rgba(0, 0, 0, 0.7)",
                        color: "white",
                        border: "none",
                        borderRadius: "50%",
                        width: "32px",
                        height: "32px",
                        fontSize: "16px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.2s"
                    }}
                    title="Fechar câmera"
                >
                    ✕
                </button>
            </div>

            {/* Mensagem informativa */}
            <div style={{
                position: "absolute",
                bottom: "10px",
                left: "10px",
                background: "rgba(0, 0, 0, 0.7)",
                color: "white",
                padding: "6px 10px",
                borderRadius: 6,
                fontSize: "0.75rem",
                backdropFilter: "blur(5px)"
            }}>
                📹 Espelho digital • Vídeo não gravado
            </div>

            {/* Estilos CSS */}
            <style jsx>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
