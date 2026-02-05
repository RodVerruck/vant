"use client";

import { useState, useEffect } from "react";

interface CoachTip {
    id: string;
    message: string;
    type: 'breathing' | 'method' | 'encouragement' | 'timing';
    priority: number;
}

interface SmartTipsProps {
    elapsedTime: number;
    isSpeaking: boolean;
    audioLevel: number;
}

export class SmartTipsEngine {
    private tips: CoachTip[] = [
        // Breathing tips (high priority)
        {
            id: 'breathing-1',
            message: 'Respire fundo e continue...',
            type: 'breathing',
            priority: 1
        },
        {
            id: 'breathing-2',
            message: 'Calma, organize seus pensamentos...',
            type: 'breathing',
            priority: 1
        },

        // Method tips (medium priority)
        {
            id: 'method-star',
            message: 'Use o método STAR (Situação, Tarefa, Ação, Resultado)',
            type: 'method',
            priority: 2
        },
        {
            id: 'method-structure',
            message: 'Estruture sua resposta com exemplos concretos',
            type: 'method',
            priority: 2
        },
        {
            id: 'method-metrics',
            message: 'Mencione métricas e resultados quantificáveis',
            type: 'method',
            priority: 2
        },

        // Encouragement tips (low priority)
        {
            id: 'encourage-1',
            message: 'Excelente ponto! Continue desenvolvendo...',
            type: 'encouragement',
            priority: 3
        },
        {
            id: 'encourage-2',
            message: 'Ótima resposta! Você está indo bem...',
            type: 'encouragement',
            priority: 3
        },
        {
            id: 'encourage-3',
            message: 'Perfeito! Continue com esse ritmo...',
            type: 'encouragement',
            priority: 3
        },

        // Timing tips
        {
            id: 'timing-10s',
            message: 'Ótimo começo! Desenvolva sua resposta...',
            type: 'timing',
            priority: 2
        },
        {
            id: 'timing-30s',
            message: 'Bom progresso! Adicione mais detalhes...',
            type: 'timing',
            priority: 2
        },
        {
            id: 'timing-60s',
            message: 'Excelente! Conclua com o resultado...',
            type: 'timing',
            priority: 2
        }
    ];

    getTip(context: SmartTipsProps): CoachTip | null {
        const { elapsedTime, isSpeaking, audioLevel } = context;

        // Se está falando, não mostrar dicas
        if (isSpeaking) {
            return null;
        }

        // Se está em silêncio por mais de 5 segundos
        if (audioLevel < 10 && elapsedTime > 5) {
            const breathingTips = this.tips.filter(tip => tip.type === 'breathing');
            return breathingTips[Math.floor(Math.random() * breathingTips.length)];
        }

        // Dicas baseadas no tempo
        if (elapsedTime >= 10 && elapsedTime < 15) {
            return this.tips.find(tip => tip.id === 'timing-10s') || null;
        }

        if (elapsedTime >= 30 && elapsedTime < 35) {
            return this.tips.find(tip => tip.id === 'timing-30s') || null;
        }

        if (elapsedTime >= 60 && elapsedTime < 65) {
            return this.tips.find(tip => tip.id === 'timing-60s') || null;
        }

        // Dicas de método em momentos apropriados
        if (elapsedTime >= 20 && elapsedTime < 25) {
            const methodTips = this.tips.filter(tip => tip.type === 'method');
            return methodTips[Math.floor(Math.random() * methodTips.length)];
        }

        // Dicas de encorajamento aleatórias em momentos neutros
        if (elapsedTime > 15 && elapsedTime % 20 === 0) {
            const encourageTips = this.tips.filter(tip => tip.type === 'encouragement');
            return encourageTips[Math.floor(Math.random() * encourageTips.length)];
        }

        return null;
    }

    // Método para obter dicas específicas por tipo
    getTipsByType(type: CoachTip['type']): CoachTip[] {
        return this.tips.filter(tip => tip.type === type);
    }

    // Método para obter todas as dicas
    getAllTips(): CoachTip[] {
        return [...this.tips];
    }
}

// Hook React para usar SmartTips
export function useSmartTips(context: SmartTipsProps) {
    const [currentTip, setCurrentTip] = useState<CoachTip | null>(null);
    const [tipHistory, setTipHistory] = useState<string[]>([]);
    const tipsEngine = new SmartTipsEngine();

    useEffect(() => {
        const tip = tipsEngine.getTip(context);

        if (tip && !tipHistory.includes(tip.id)) {
            setCurrentTip(tip);
            setTipHistory((prev: string[]) => [...prev, tip.id]);

            // Limpar histórico após um tempo
            const timeout = setTimeout(() => {
                setTipHistory((prev: string[]) => prev.filter((id: string) => id !== tip.id));
            }, 30000);

            return () => clearTimeout(timeout);
        }
    }, [context]);

    return { currentTip, clearTip: () => setCurrentTip(null) };
}

// Componente para exibir dicas
interface SmartTipsComponentProps {
    context: SmartTipsProps;
}

export function SmartTipsComponent({ context }: SmartTipsComponentProps) {
    const { currentTip, clearTip } = useSmartTips(context);

    if (!currentTip) return null;

    const getTipIcon = (type: CoachTip['type']) => {
        switch (type) {
            case 'breathing': return '🌬️';
            case 'method': return '💡';
            case 'encouragement': return '👏';
            case 'timing': return '⏰';
            default: return '💡';
        }
    };

    const getTipColor = (type: CoachTip['type']) => {
        switch (type) {
            case 'breathing': return 'rgba(59, 130, 246, 0.9)'; // Blue
            case 'method': return 'rgba(16, 185, 129, 0.9)'; // Green
            case 'encouragement': return 'rgba(245, 158, 11, 0.9)'; // Yellow
            case 'timing': return 'rgba(139, 92, 246, 0.9)'; // Purple
            default: return 'rgba(56, 189, 248, 0.9)'; // Sky
        }
    };

    return (
        <div style={{
            position: "fixed",
            bottom: "30px",
            left: "50%",
            transform: "translateX(-50%)",
            background: getTipColor(currentTip.type),
            color: "white",
            padding: "12px 20px",
            borderRadius: "20px",
            fontSize: "0.9rem",
            fontWeight: 500,
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
            zIndex: 1001,
            animation: "slideInUp 0.5s ease-out",
            maxWidth: "90%",
            textAlign: "center",
            cursor: "pointer"
        }}
            onClick={clearTip}
            title="Clique para fechar"
        >
            <span style={{ marginRight: "8px", fontSize: "1.1rem" }}>
                {getTipIcon(currentTip.type)}
            </span>
            {currentTip.message}

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
            `}</style>
        </div>
    );
}
