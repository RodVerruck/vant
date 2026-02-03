"use client";

import { useState, useEffect, useRef } from "react";
import type { HistoryItem, ReportData } from "@/types";

interface HistoryStageProps {
    authUserId: string | null;
    onSelectHistory: (item: HistoryItem) => void;
    onBack: () => void;
}

export function HistoryStage({ authUserId, onSelectHistory, onBack }: HistoryStageProps) {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    useEffect(() => {
        if (!authUserId) {
            setError("Usuário não autenticado");
            setLoading(false);
            return;
        }

        loadHistory();

        // Cleanup ao desmontar componente
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [authUserId]);

    const loadHistory = async () => {
        // Cancelar requisição anterior se existir
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // Criar novo AbortController
        abortControllerRef.current = new AbortController();

        try {
            setLoading(true);
            setError(null);

            // Detecta se está em desenvolvimento
            const isLocalhost = typeof window !== "undefined" &&
                (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
            const apiUrl = isLocalhost ? "http://127.0.0.1:8000" : "https://vant-vlgn.onrender.com";

            const response = await fetch(`${apiUrl}/api/user/history?user_id=${authUserId}`, {
                signal: abortControllerRef.current.signal
            });

            // Verificar se foi abortado
            if (abortControllerRef.current.signal.aborted) {
                return;
            }

            if (!response.ok) {
                throw new Error(`Erro ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            setHistory(data.history || []);
        } catch (err: any) {
            // Ignorar erro se foi abortado
            if (err.name === 'AbortError') {
                console.log('Requisição cancelada ao navegar entre abas');
                return;
            }

            console.error("Erro ao carregar histórico:", err);
            setError(err instanceof Error ? err.message : "Erro ao carregar histórico");
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return "#10b981"; // verde
        if (score >= 60) return "#f59e0b"; // amarelo
        return "#ef4444"; // vermelho
    };

    const getVereditoColor = (veredito: string) => {
        if (veredito.toLowerCase().includes("aprov")) return "#10b981";
        if (veredito.toLowerCase().includes("reprov")) return "#ef4444";
        return "#6b7280";
    };

    if (loading) {
        return (
            <div className="hero-container">
                <style>{`
                    .loading-container {
                        text-align: center;
                        padding: 60px 20px;
                        color: #6b7280;
                    }
                    .loading-spinner {
                        width: 40px;
                        height: 40px;
                        border: 4px solid #f3f4f6;
                        border-top: 4px solid #3b82f6;
                        border-radius: 50%;
                        animation: spin 1s linear infinite;
                        margin: 0 auto 20px;
                    }
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}</style>
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <h3>Carregando histórico...</h3>
                    <p>Buscando suas análises anteriores</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="hero-container">
                <style>{`
                    .error-container {
                        text-align: center;
                        padding: 60px 20px;
                        color: #6b7280;
                    }
                    .error-icon {
                        font-size: 48px;
                        color: #ef4444;
                        margin-bottom: 20px;
                    }
                    .retry-button {
                        background: #3b82f6;
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 8px;
                        cursor: pointer;
                        margin-top: 20px;
                        font-size: 16px;
                    }
                    .retry-button:hover {
                        background: #2563eb;
                    }
                `}</style>
                <div className="error-container">
                    <div className="error-icon">⚠️</div>
                    <h3>Erro ao carregar histórico</h3>
                    <p>{error}</p>
                    <button className="retry-button" onClick={loadHistory}>
                        Tentar novamente
                    </button>
                </div>
            </div>
        );
    }

    if (history.length === 0) {
        return (
            <div className="hero-container">
                <style>{`
                    .empty-container {
                        text-align: center;
                        padding: 60px 20px;
                        color: #6b7280;
                    }
                    .empty-icon {
                        font-size: 48px;
                        margin-bottom: 20px;
                    }
                    .back-button {
                        background: #6b7280;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 8px;
                        cursor: pointer;
                        margin-top: 20px;
                        font-size: 14px;
                    }
                    .back-button:hover {
                        background: #4b5563;
                    }
                `}</style>
                <div className="empty-container">
                    <div className="empty-icon">📋</div>
                    <h3>Nenhuma análise encontrada</h3>
                    <p>Você ainda não otimizou nenhum currículo</p>
                    <button className="back-button" onClick={onBack}>
                        Voltar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="hero-container">
            <style>{`
                .history-container {
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 40px 20px;
                }
                .history-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 30px;
                }
                .history-title {
                    font-size: 28px;
                    font-weight: bold;
                    color: #1f2937;
                    margin: 0;
                }
                .back-button {
                    background: #6b7280;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 14px;
                }
                .back-button:hover {
                    background: #4b5563;
                }
                .history-list {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }
                .history-item {
                    background: white;
                    border: 1px solid #e5e7eb;
                    border-radius: 12px;
                    padding: 20px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .history-item:hover {
                    border-color: #3b82f6;
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
                    transform: translateY(-2px);
                }
                .history-item-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 12px;
                }
                .history-job-title {
                    font-size: 16px;
                    font-weight: 600;
                    color: #1f2937;
                    margin: 0;
                    line-height: 1.4;
                }
                .history-date {
                    font-size: 12px;
                    color: #6b7280;
                    white-space: nowrap;
                }
                .history-stats {
                    display: flex;
                    gap: 20px;
                    align-items: center;
                }
                .history-stat {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }
                .history-stat-value {
                    font-size: 18px;
                    font-weight: bold;
                    margin-bottom: 4px;
                }
                .history-stat-label {
                    font-size: 11px;
                    color: #6b7280;
                    text-transform: uppercase;
                }
                .history-verdict {
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 600;
                    text-transform: uppercase;
                }
            `}</style>

            <div className="history-container">
                <div className="history-header">
                    <h1 className="history-title">📋 Suas Análises</h1>
                    <button className="back-button" onClick={onBack}>
                        ← Voltar
                    </button>
                </div>

                <div className="history-list">
                    {history.map((item) => (
                        <div
                            key={item.id}
                            className="history-item"
                            onClick={() => onSelectHistory(item)}
                        >
                            <div className="history-item-header">
                                <h3 className="history-job-title">{item.job_description}</h3>
                                <span className="history-date">{formatDate(item.created_at)}</span>
                            </div>

                            <div className="history-stats">
                                <div className="history-stat">
                                    <div
                                        className="history-stat-value"
                                        style={{ color: getScoreColor(item.result_preview.score_ats) }}
                                    >
                                        {item.result_preview.score_ats}
                                    </div>
                                    <div className="history-stat-label">Score ATS</div>
                                </div>

                                <div className="history-verdict" style={{
                                    backgroundColor: getVereditoColor(item.result_preview.veredito) + '20',
                                    color: getVereditoColor(item.result_preview.veredito)
                                }}>
                                    {item.result_preview.veredito}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
