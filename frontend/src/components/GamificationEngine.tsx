"use client";

import { useState, useEffect } from "react";

interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string;
    rarity: "common" | "rare" | "epic" | "legendary";
    unlocked_at: Date;
}

interface UserProfile {
    level: number;
    xp: number;
    streak: number;
    badges: Badge[];
    rank: string;
    total_interviews: number;
    success_rate: number;
    highest_score: number;
    average_score: number;
}

interface GamificationEngineProps {
    userId?: string;
    onLevelUp?: (newLevel: number) => void;
    onBadgeUnlocked?: (badge: Badge) => void;
}

export function GamificationEngine({ 
    userId, 
    onLevelUp, 
    onBadgeUnlocked 
}: GamificationEngineProps) {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [showLevelUpAnimation, setShowLevelUpAnimation] = useState(false);
    const [newBadge, setNewBadge] = useState<Badge | null>(null);

    // Carregar perfil do usuário
    useEffect(() => {
        if (!userId) return;
        loadUserProfile();
    }, [userId]);

    const loadUserProfile = async () => {
        if (!userId) return;

        setLoading(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/interview/profile/${userId}`);
            
            if (response.ok) {
                const data = await response.json();
                setProfile(data);
            }
        } catch (error) {
            console.error("Erro ao carregar perfil:", error);
        } finally {
            setLoading(false);
        }
    };

    const getRankByLevel = (level: number) => {
        if (level >= 10) return "Mestre";
        if (level >= 7) return "Especialista";
        if (level >= 5) return "Avançado";
        if (level >= 3) return "Intermediário";
        return "Iniciante";
    };

    const getRankColor = (rank: string) => {
        switch (rank) {
            case "Mestre": return "#DC2626";
            case "Especialista": return "#8B5CF6";
            case "Avançado": return "#3B82F6";
            case "Intermediário": return "#10B981";
            default: return "#64748B";
        }
    };

    const getXPForNextLevel = (currentLevel: number) => {
        return Math.pow(currentLevel + 1, 2) * 100;
    };

    const getXPProgress = (xp: number, level: number) => {
        const currentLevelXP = Math.pow(level, 2) * 100;
        const nextLevelXP = getXPForNextLevel(level);
        const xpNeeded = nextLevelXP - currentLevelXP;
        const xpProgress = xp - currentLevelXP;
        return Math.min(100, (xpProgress / xpNeeded) * 100);
    };

    const getRarityColor = (rarity: string) => {
        switch (rarity) {
            case "legendary": return "#DC2626";
            case "epic": return "#8B5CF6";
            case "rare": return "#3B82F6";
            default: return "#64748B";
        }
    };

    const getRarityLabel = (rarity: string) => {
        switch (rarity) {
            case "legendary": return "Lendário";
            case "epic": return "Épico";
            case "rare": return "Raro";
            default: return "Comum";
        }
    };

    if (loading) {
        return (
            <div style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: "200px",
                flexDirection: "column",
                gap: "16px"
            }}>
                <div style={{
                    width: "40px",
                    height: "40px",
                    border: "3px solid #38BDF8",
                    borderTop: "3px solid transparent",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite"
                }} />
                <p style={{ color: "#94A3B8" }}>Carregando seu perfil...</p>
            </div>
        );
    }

    if (!profile) {
        return (
            <div style={{
                textAlign: "center",
                padding: "40px",
                color: "#94A3B8"
            }}>
                <p>Perfil não encontrado. Comece sua primeira simulação!</p>
            </div>
        );
    }

    return (
        <div style={{
            background: "linear-gradient(135deg, rgba(15, 23, 42, 0.6) 0%, rgba(56, 189, 248, 0.1) 100%)",
                border: "1px solid rgba(56, 189, 248, 0.2)",
                borderRadius: "16px",
                padding: "32px",
                margin: "20px 0"
            }}>
            {/* Header do Perfil */}
            <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "32px",
                flexWrap: "wrap",
                gap: "16px"
            }}>
                <div>
                    <h2 style={{
                        fontSize: "2rem",
                        fontWeight: "800",
                        marginBottom: "8px",
                        color: "#F8FAFC"
                    }}>
                        Seu Progresso
                    </h2>
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px"
                    }}>
                        <span style={{
                            background: getRankColor(profile.rank),
                            color: "white",
                            padding: "6px 16px",
                            borderRadius: "20px",
                            fontSize: "0.9rem",
                            fontWeight: "700"
                        }}>
                            {profile.rank}
                        </span>
                        <span style={{ color: "#CBD5E1" }}>
                            Nível {profile.level}
                        </span>
                    </div>
                </div>

                <div style={{
                    textAlign: "center"
                }}>
                    <div style={{
                        fontSize: "3rem",
                        fontWeight: "800",
                        color: "#F59E0B",
                        marginBottom: "4px"
                    }}>
                        {profile.xp}
                    </div>
                    <div style={{ color: "#94A3B8", fontSize: "0.9rem" }}>
                        XP Total
                    </div>
                </div>
            </div>

            {/* Barra de Progresso de Nível */}
            <div style={{ marginBottom: "32px" }}>
                <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "8px"
                }}>
                    <span style={{ color: "#CBD5E1", fontSize: "0.9rem" }}>
                        Progresso para Nível {profile.level + 1}
                    </span>
                    <span style={{ color: "#F59E0B", fontSize: "0.9rem", fontWeight: "600" }}>
                        {getXPForNextLevel(profile.level) - profile.xp} XP restantes
                    </span>
                </div>
                <div style={{
                    height: "12px",
                    background: "rgba(255, 255, 255, 0.1)",
                    borderRadius: "6px",
                    overflow: "hidden"
                }}>
                    <div style={{
                        height: "100%",
                        width: `${getXPProgress(profile.xp, profile.level)}%`,
                        background: "linear-gradient(90deg, #F59E0B 0%, #EF4444 100%)",
                        borderRadius: "6px",
                        transition: "width 0.5s ease"
                    }} />
                </div>
            </div>

            {/* Stats Grid */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "20px",
                marginBottom: "32px"
            }}>
                <div style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    padding: "20px",
                    borderRadius: "12px",
                    textAlign: "center"
                }}>
                    <div style={{
                        fontSize: "2rem",
                        fontWeight: "700",
                        color: "#38BDF8",
                        marginBottom: "8px"
                    }}>
                        {profile.total_interviews}
                    </div>
                    <div style={{ color: "#94A3B8", fontSize: "0.9rem" }}>
                        Entrevistas
                    </div>
                </div>

                <div style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    padding: "20px",
                    borderRadius: "12px",
                    textAlign: "center"
                }}>
                    <div style={{
                        fontSize: "2rem",
                        fontWeight: "700",
                        color: "#10B981",
                        marginBottom: "8px"
                    }}>
                        {profile.success_rate.toFixed(1)}%
                    </div>
                    <div style={{ color: "#94A3B8", fontSize: "0.9rem" }}>
                        Taxa de Sucesso
                    </div>
                </div>

                <div style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    padding: "20px",
                    borderRadius: "12px",
                    textAlign: "center"
                }}>
                    <div style={{
                        fontSize: "2rem",
                        fontWeight: "700",
                        color: "#EF4444",
                        marginBottom: "8px"
                    }}>
                        🔥 {profile.streak}
                    </div>
                    <div style={{ color: "#94A3B8", fontSize: "0.9rem" }}>
                        Streak Atual
                    </div>
                </div>

                <div style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    padding: "20px",
                    borderRadius: "12px",
                    textAlign: "center"
                }}>
                    <div style={{
                        fontSize: "2rem",
                        fontWeight: "700",
                        color: "#8B5CF6",
                        marginBottom: "8px"
                    }}>
                        {profile.highest_score}
                    </div>
                    <div style={{ color: "#94A3B8", fontSize: "0.9rem" }}>
                        Maior Pontuação
                    </div>
                </div>
            </div>

            {/* Badges */}
            <div>
                <h3 style={{
                    color: "#F8FAFC",
                    marginBottom: "20px",
                    fontSize: "1.3rem"
                }}>
                    🏆 Conquistas Desbloqueadas ({profile.badges.length})
                </h3>
                
                {profile.badges.length > 0 ? (
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                        gap: "16px"
                    }}>
                        {profile.badges.map((badge) => (
                            <div
                                key={badge.id}
                                style={{
                                    background: "rgba(255, 255, 255, 0.05)",
                                    border: `1px solid ${getRarityColor(badge.rarity)}`,
                                    borderRadius: "12px",
                                    padding: "16px",
                                    textAlign: "center",
                                    position: "relative"
                                }}
                            >
                                {/* Rarity Badge */}
                                <div style={{
                                    position: "absolute",
                                    top: "-8px",
                                    right: "-8px",
                                    background: getRarityColor(badge.rarity),
                                    color: "white",
                                    padding: "2px 8px",
                                    borderRadius: "8px",
                                    fontSize: "0.7rem",
                                    fontWeight: "700"
                                }}>
                                    {getRarityLabel(badge.rarity)}
                                </div>

                                <div style={{
                                    fontSize: "2rem",
                                    marginBottom: "8px"
                                }}>
                                    {badge.icon}
                                </div>
                                <div style={{
                                    color: "#F8FAFC",
                                    fontWeight: "600",
                                    fontSize: "0.9rem",
                                    marginBottom: "4px"
                                }}>
                                    {badge.name}
                                </div>
                                <div style={{
                                    color: "#94A3B8",
                                    fontSize: "0.8rem"
                                }}>
                                    {badge.description}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{
                        textAlign: "center",
                        padding: "40px",
                        color: "#94A3B8"
                    }}>
                        <div style={{ fontSize: "3rem", marginBottom: "16px" }}>🎯</div>
                        <p>Complete simulações para desbloquear conquistas!</p>
                    </div>
                )}
            </div>

            {/* Próximos Objetivos */}
            <div style={{
                marginTop: "32px",
                padding: "24px",
                background: "rgba(34, 197, 94, 0.1)",
                border: "1px solid rgba(34, 197, 94, 0.3)",
                borderRadius: "12px"
            }}>
                <h3 style={{
                    color: "#22C55E",
                    marginBottom: "16px",
                    fontSize: "1.2rem"
                }}>
                    🎯 Próximos Objetivos
                </h3>
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "16px"
                }}>
                    <div>
                        <div style={{ color: "#F8FAFC", fontWeight: "600", marginBottom: "8px" }}>
                            Nível {profile.level + 1}
                        </div>
                        <div style={{ color: "#94A3B8", fontSize: "0.9rem" }}>
                            {getXPForNextLevel(profile.level) - profile.xp} XP necessários
                        </div>
                    </div>
                    <div>
                        <div style={{ color: "#F8FAFC", fontWeight: "600", marginBottom: "8px" }}>
                            Streak +{5}
                        </div>
                        <div style={{ color: "#94A3B8", fontSize: "0.9rem" }}>
                            Pratique por 5 dias seguidos
                        </div>
                    </div>
                    <div>
                        <div style={{ color: "#F8FAFC", fontWeight: "600", marginBottom: "8px" }}>
                            Pontuação Perfeita
                        </div>
                        <div style={{ color: "#94A3B8", fontSize: "0.9rem" }}>
                            Alcance 100 pontos em uma entrevista
                        </div>
                    </div>
                </div>
            </div>

            {/* Animation de Level Up */}
            {showLevelUpAnimation && (
                <div style={{
                    position: "fixed",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    background: "linear-gradient(135deg, rgba(34, 197, 94, 0.9) 0%, rgba(16, 185, 129, 0.9) 100%)",
                    padding: "40px",
                    borderRadius: "20px",
                    textAlign: "center",
                    zIndex: 1000,
                    animation: "levelUpPulse 0.6s ease"
                }}>
                    <div style={{ fontSize: "4rem", marginBottom: "16px" }}>🎉</div>
                    <h2 style={{
                        color: "white",
                        fontSize: "2rem",
                        fontWeight: "800",
                        marginBottom: "8px"
                    }}>
                        LEVEL UP!
                    </h2>
                    <p style={{ color: "white", fontSize: "1.2rem" }}>
                        Você alcançou o nível {profile.level}!
                    </p>
                </div>
            )}

            {/* Animation de Badge */}
            {newBadge && (
                <div style={{
                    position: "fixed",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    background: "linear-gradient(135deg, rgba(139, 92, 246, 0.9) 0%, rgba(124, 58, 237, 0.9) 100%)",
                    padding: "40px",
                    borderRadius: "20px",
                    textAlign: "center",
                    zIndex: 1000,
                    animation: "badgeUnlock 0.6s ease"
                }}>
                    <div style={{ fontSize: "4rem", marginBottom: "16px" }}>
                        {newBadge.icon}
                    </div>
                    <h2 style={{
                        color: "white",
                        fontSize: "2rem",
                        fontWeight: "800",
                        marginBottom: "8px"
                    }}>
                        CONQUISTA DESBLOQUEADA!
                    </h2>
                    <p style={{ color: "white", fontSize: "1.2rem", marginBottom: "8px" }}>
                        {newBadge.name}
                    </p>
                    <p style={{ color: "rgba(255, 255, 255, 0.8)", fontSize: "1rem" }}>
                        {newBadge.description}
                    </p>
                </div>
            )}

            <style jsx>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                
                @keyframes levelUpPulse {
                    0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
                    50% { transform: translate(-50%, -50%) scale(1.1); }
                    100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                }
                
                @keyframes badgeUnlock {
                    0% { transform: translate(-50%, -50%) rotateY(90deg); opacity: 0; }
                    50% { transform: translate(-50%, -50%) rotateY(0deg) scale(1.1); }
                    100% { transform: translate(-50%, -50%) rotateY(0deg) scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
