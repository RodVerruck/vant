"use client";

import { useState, useEffect } from "react";

interface SimpleHUDProps {
    stream: MediaStream | null;
    isActive: boolean;
    audioLevel: number;
    timeRemaining: number;
    coachingTip?: string;
    questionNumber: number;
    totalQuestions: number;
}

export function SimpleHUD({ stream, isActive, audioLevel, timeRemaining, coachingTip, questionNumber, totalQuestions }: SimpleHUDProps) {
    const [showTip, setShowTip] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);

    // Timer para elapsed time
    useEffect(() => {
        if (!isActive) {
            setElapsedTime(0);
            return;
        }

        const timer = setInterval(() => {
            setElapsedTime(prev => prev + 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [isActive]);

    // Mostrar dica após um tempo
    useEffect(() => {
        if (coachingTip && isActive) {
            const timeout = setTimeout(() => setShowTip(true), 3000);
            return () => clearTimeout(timeout);
        }
    }, [coachingTip, isActive]);

    // Formatar tempo
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (!isActive || !stream) return null;

    return (
        <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: "none", // Não interfere com cliques
            zIndex: 1000
        }}>
            {/* Top HUD */}
            <div style={{
                position: "absolute",
                top: "20px",
                left: "50%",
                transform: "translateX(-50%)",
                display: "flex",
                alignItems: "center",
                gap: "16px",
                background: "rgba(0, 0, 0, 0.8)",
                backdropFilter: "blur(10px)",
                padding: "12px 20px",
                borderRadius: "25px",
                border: "1px solid rgba(56, 189, 248, 0.3)",
                pointerEvents: "auto"
            }}>
                {/* Progress Indicator */}
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                }}>
                    <span style={{ color: "#38BDF8", fontSize: "0.85rem", fontWeight: 600 }}>
                        Pergunta {questionNumber}/{totalQuestions}
                    </span>
                    <div style={{
                        display: "flex",
                        gap: "4px"
                    }}>
                        {[...Array(totalQuestions)].map((_, i) => (
                            <div
                                key={i}
                                style={{
                                    width: "6px",
                                    height: "6px",
                                    borderRadius: "50%",
                                    background: i < questionNumber - 1 
                                        ? "#10B981" 
                                        : i === questionNumber - 1 
                                            ? "#38BDF8" 
                                            : "#374151",
                                    transition: "all 0.3s"
                                }}
                            />
                        ))}
                    </div>
                </div>

                {/* Timer */}
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    color: "#F8FAFC",
                    fontSize: "0.9rem",
                    fontWeight: 500
                }}>
                    <span>⏱️</span>
                    <span>{formatTime(elapsedTime)}</span>
                    {timeRemaining > 0 && (
                        <span style={{ color: "#94A3B8", fontSize: "0.8rem" }}>
                            / {formatTime(timeRemaining)}
                        </span>
                    )}
                </div>

                {/* Audio Level Indicator */}
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                }}>
                    <span style={{ color: "#64748B", fontSize: "0.8rem" }}>🎤</span>
                    <div style={{
                        display: "flex",
                        gap: "2px",
                        alignItems: "flex-end"
                    }}>
                        {[...Array(8)].map((_, i) => {
                            const height = Math.max(2, (audioLevel / 100) * 12);
                            const color = audioLevel > 60 ? "#10B981" : audioLevel > 30 ? "#38BDF8" : "#64748B";
                            
                            return (
                                <div
                                    key={i}
                                    style={{
                                        width: "2px",
                                        height: `${height}px`,
                                        background: color,
                                        borderRadius: "1px",
                                        transition: "height 0.1s ease-out"
                                    }}
                                />
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Coaching Tip */}
            {coachingTip && showTip && (
                <div style={{
                    position: "absolute",
                    bottom: "30px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "rgba(16, 185, 129, 0.9)",
                    color: "white",
                    padding: "12px 20px",
                    borderRadius: "20px",
                    fontSize: "0.9rem",
                    fontWeight: 500,
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    pointerEvents: "auto",
                    animation: "slideInUp 0.5s ease-out",
                    maxWidth: "90%",
                    textAlign: "center"
                }}>
                    <span style={{ marginRight: "8px" }}>💡</span>
                    {coachingTip}
                </div>
            )}

            {/* Corner Indicators */}
            <div style={{
                position: "absolute",
                top: "20px",
                right: "20px",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: "8px"
            }}>
                {/* Recording Indicator */}
                <div style={{
                    background: "rgba(239, 68, 68, 0.9)",
                    color: "white",
                    padding: "6px 12px",
                    borderRadius: "15px",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    animation: "pulse 2s infinite"
                }}>
                    <div style={{
                        width: "8px",
                        height: "8px",
                        background: "white",
                        borderRadius: "50%"
                    }} />
                    GRAVANDO
                </div>

                {/* Audio Status */}
                <div style={{
                    background: "rgba(0, 0, 0, 0.7)",
                    color: "#94A3B8",
                    padding: "4px 8px",
                    borderRadius: "8px",
                    fontSize: "0.7rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px"
                }}>
                    <div style={{
                        width: "6px",
                        height: "6px",
                        background: audioLevel > 30 ? "#10B981" : "#64748B",
                        borderRadius: "50%"
                    }} />
                    ÁUDIO ATIVO
                </div>
            </div>

            {/* CSS Animations */}
            <style jsx>{`
                @keyframes slideInUp {
                    from {
                        opacity: 0;
                        transform: translateX(-50%) translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0);
                    }
                }
                
                @keyframes pulse {
                    0%, 100% {
                        opacity: 1;
                    }
                    50% {
                        opacity: 0.7;
                    }
                }
            `}</style>
        </div>
    );
}
