"use client";

import React, { useState, useRef, useEffect } from "react";
import styles from "./HistoryCard.module.css";

interface HistoryCardItem {
    id: string;
    created_at: string;
    job_description: string;
    target_role?: string;
    target_company?: string;
    category?: string;
    result_preview: {
        veredito: string;
        score_ats: number;
        gaps_count: number;
    };
}

interface DashboardHistoryCardProps {
    item: HistoryCardItem;
    authUserId: string;
    onOpen: (item: HistoryCardItem) => void;
    onDelete: (itemId: string) => void;
}

function getApiUrl(): string {
    if (typeof window !== "undefined") {
        const isLocalhost =
            window.location.hostname === "localhost" ||
            window.location.hostname === "127.0.0.1";
        if (isLocalhost) return "http://127.0.0.1:8000";
    }
    return process.env.NEXT_PUBLIC_API_URL || "https://vant-vlgn.onrender.com";
}

function formatRelativeDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);

    if (diffMins < 1) return "agora";
    if (diffMins < 60) return `há ${diffMins} min`;
    if (diffHours < 24) return `há ${diffHours}h`;
    if (diffDays === 1) return "ontem";
    if (diffDays < 7) return `há ${diffDays} dias`;
    if (diffWeeks === 1) return "há 1 semana";
    if (diffWeeks < 5) return `há ${diffWeeks} semanas`;

    return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}

/* ── Score Ring helpers ── */

function getScoreColor(score: number): string {
    if (score > 75) return "#22D3EE";
    if (score > 50) return "#FBBF24";
    return "#F97316";
}

function getScoreGlow(score: number): string {
    if (score > 75) return "drop-shadow(0 0 4px rgba(34, 211, 238, 0.5))";
    if (score > 50) return "drop-shadow(0 0 4px rgba(251, 191, 36, 0.3))";
    return "drop-shadow(0 0 4px rgba(249, 115, 22, 0.3))";
}

/* ── Category Theme System ── */

interface CategoryTheme {
    color: string;       // Primary neon color
    bg: string;          // Background with opacity
    border: string;      // Border with opacity
    glow: string;        // Box-shadow glow for hover
    borderHover: string; // Border color on hover
    icon: React.ReactNode; // Inline SVG icon (16×16)
}

const iconProps = { width: 14, height: 14, strokeWidth: 2, fill: "none", stroke: "currentColor", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

const CATEGORY_THEMES: Record<string, CategoryTheme> = {
    "Tecnologia": {
        color: "#22D3EE", bg: "rgba(34, 211, 238, 0.12)", border: "rgba(34, 211, 238, 0.2)",
        glow: "0 0 20px rgba(34, 211, 238, 0.15)", borderHover: "rgba(34, 211, 238, 0.45)",
        icon: <svg {...iconProps} viewBox="0 0 24 24"><polyline points="4 17 10 11 4 5" /><line x1="12" y1="19" x2="20" y2="19" /></svg>,
    },
    "Design": {
        color: "#E879F9", bg: "rgba(232, 121, 249, 0.12)", border: "rgba(232, 121, 249, 0.2)",
        glow: "0 0 20px rgba(232, 121, 249, 0.15)", borderHover: "rgba(232, 121, 249, 0.45)",
        icon: <svg {...iconProps} viewBox="0 0 24 24"><path d="M12 2a10 10 0 0 0 0 20 2 2 0 0 0 2-2v-1a2 2 0 0 1 2-2h1a2 2 0 0 0 2-2 10 10 0 0 0-7-13Z" /><circle cx="8" cy="10" r="1.5" fill="currentColor" /><circle cx="12" cy="7" r="1.5" fill="currentColor" /><circle cx="16" cy="10" r="1.5" fill="currentColor" /></svg>,
    },
    "Marketing": {
        color: "#FB923C", bg: "rgba(251, 146, 60, 0.12)", border: "rgba(251, 146, 60, 0.2)",
        glow: "0 0 20px rgba(251, 146, 60, 0.15)", borderHover: "rgba(251, 146, 60, 0.45)",
        icon: <svg {...iconProps} viewBox="0 0 24 24"><path d="m3 11 18-5v12L3 13v-2z" /><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" /></svg>,
    },
    "Vendas": {
        color: "#FBBF24", bg: "rgba(251, 191, 36, 0.12)", border: "rgba(251, 191, 36, 0.2)",
        glow: "0 0 20px rgba(251, 191, 36, 0.15)", borderHover: "rgba(251, 191, 36, 0.45)",
        icon: <svg {...iconProps} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" /></svg>,
    },
    "Gestão": {
        color: "#818CF8", bg: "rgba(129, 140, 248, 0.12)", border: "rgba(129, 140, 248, 0.2)",
        glow: "0 0 20px rgba(129, 140, 248, 0.15)", borderHover: "rgba(129, 140, 248, 0.45)",
        icon: <svg {...iconProps} viewBox="0 0 24 24"><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></svg>,
    },
    "Financeiro": {
        color: "#34D399", bg: "rgba(52, 211, 153, 0.12)", border: "rgba(52, 211, 153, 0.2)",
        glow: "0 0 20px rgba(52, 211, 153, 0.15)", borderHover: "rgba(52, 211, 153, 0.45)",
        icon: <svg {...iconProps} viewBox="0 0 24 24"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></svg>,
    },
    "RH": {
        color: "#A78BFA", bg: "rgba(167, 139, 250, 0.12)", border: "rgba(167, 139, 250, 0.2)",
        glow: "0 0 20px rgba(167, 139, 250, 0.15)", borderHover: "rgba(167, 139, 250, 0.45)",
        icon: <svg {...iconProps} viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
    },
    "Operações": {
        color: "#F472B6", bg: "rgba(244, 114, 182, 0.12)", border: "rgba(244, 114, 182, 0.2)",
        glow: "0 0 20px rgba(244, 114, 182, 0.15)", borderHover: "rgba(244, 114, 182, 0.45)",
        icon: <svg {...iconProps} viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>,
    },
    "Geral": {
        color: "#94A3B8", bg: "rgba(148, 163, 184, 0.12)", border: "rgba(148, 163, 184, 0.2)",
        glow: "0 0 20px rgba(148, 163, 184, 0.1)", borderHover: "rgba(148, 163, 184, 0.35)",
        icon: <svg {...iconProps} viewBox="0 0 24 24"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /><path d="M10 9H8" /><path d="M16 13H8" /><path d="M16 17H8" /></svg>,
    },
};

const DEFAULT_THEME = CATEGORY_THEMES["Geral"];

function getCategoryTheme(category: string): CategoryTheme {
    return CATEGORY_THEMES[category] || DEFAULT_THEME;
}

function ScoreRing({ score }: { score: number }) {
    const radius = 19;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;
    const color = getScoreColor(score);
    const isHighScore = score > 90;
    const [shouldPulse, setShouldPulse] = useState(isHighScore);

    useEffect(() => {
        if (isHighScore) {
            setShouldPulse(true);
            const timer = setTimeout(() => setShouldPulse(false), 1200);
            return () => clearTimeout(timer);
        }
    }, [isHighScore]);

    return (
        <div className={`${styles.scoreRing} ${shouldPulse ? styles.scoreRingHighScore : ''}`}>
            <svg width="48" height="48" className={styles.scoreRingSvg} style={{ filter: getScoreGlow(score) }}>
                <circle cx="24" cy="24" r={radius} className={styles.scoreRingBg} />
                <circle
                    cx="24" cy="24" r={radius}
                    className={styles.scoreRingFg}
                    stroke={color}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                />
            </svg>
            <div className={styles.scoreRingLabel} style={{ color }}>{score}</div>
        </div>
    );
}

export function DashboardHistoryCard({ item, authUserId, onOpen, onDelete }: DashboardHistoryCardProps) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        }
        if (menuOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [menuOpen]);

    const handleDownloadPdf = async () => {
        setDownloading(true);
        setMenuOpen(false);
        try {
            const detailResp = await fetch(
                `${getApiUrl()}/api/user/history/detail?id=${item.id}`
            );
            if (!detailResp.ok) throw new Error("Erro ao buscar dados da análise");
            const detailData = await detailResp.json();

            const pdfResp = await fetch(`${getApiUrl()}/api/generate-pdf`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    data: detailData.data,
                    user_id: authUserId,
                }),
            });

            if (!pdfResp.ok) {
                const err = await pdfResp.json().catch(() => ({}));
                throw new Error(err.error || "Erro ao gerar PDF");
            }

            const blob = await pdfResp.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `Curriculo_VANT_${new Date().toISOString().slice(0, 10)}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (err: any) {
            console.error("[HistoryCard] Erro ao baixar PDF:", err);
            alert(err.message || "Erro ao baixar PDF");
        } finally {
            setDownloading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Tem certeza que deseja excluir esta análise? Esta ação não pode ser desfeita.")) {
            return;
        }
        setDeleting(true);
        setMenuOpen(false);
        try {
            const resp = await fetch(
                `${getApiUrl()}/api/user/history/${item.id}?user_id=${authUserId}`,
                { method: "DELETE" }
            );
            if (!resp.ok) {
                const err = await resp.json().catch(() => ({}));
                throw new Error(err.error || "Erro ao excluir");
            }
            onDelete(item.id);
        } catch (err: any) {
            console.error("[HistoryCard] Erro ao excluir:", err);
            alert(err.message || "Erro ao excluir análise");
        } finally {
            setDeleting(false);
        }
    };

    const score = item.result_preview.score_ats;
    const targetRole = item.target_role || "Otimização Geral";
    const targetCompany = item.target_company || "";
    const category = item.category || "Geral";
    const theme = getCategoryTheme(category);

    const hasCompany = !!targetCompany;

    return (
        <div
            className={styles.card}
            onClick={() => !downloading && onOpen(item)}
            style={{
                borderColor: theme.border,
                ...(deleting ? { opacity: 0.4, pointerEvents: "none" as const, transform: "scale(0.97)" } : {}),
            }}
            onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = theme.borderHover;
                el.style.boxShadow = `0 8px 32px rgba(0,0,0,0.3), ${theme.glow}`;
            }}
            onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = theme.border;
                el.style.boxShadow = "";
            }}
        >
            {/* Loading overlay for PDF download */}
            {downloading && (
                <>
                    <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
                    <div style={{
                        position: "absolute",
                        inset: 0,
                        background: "rgba(15, 23, 42, 0.9)",
                        borderRadius: "inherit",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 12,
                        zIndex: 10,
                        backdropFilter: "blur(6px)",
                    }}>
                        <div style={{
                            width: 32,
                            height: 32,
                            border: "3px solid rgba(56, 189, 248, 0.2)",
                            borderTop: "3px solid #38BDF8",
                            borderRadius: "50%",
                            animation: "spin 0.8s linear infinite",
                        }} />
                        <span style={{
                            color: "#38BDF8",
                            fontSize: "0.82rem",
                            fontWeight: 700,
                            letterSpacing: "0.5px",
                        }}>
                            Gerando PDF...
                        </span>
                    </div>
                </>
            )}

            {/* ── Header: Avatar + Title + Score Ring ── */}
            <div className={styles.header}>
                <div
                    className={styles.avatar}
                    style={{
                        background: theme.bg,
                        color: theme.color,
                        border: `1px solid ${theme.border}`,
                    }}
                >
                    {hasCompany ? targetCompany.charAt(0).toUpperCase() : theme.icon}
                </div>

                <div className={styles.titleBlock}>
                    <h3 className={styles.targetRole}>{targetRole}</h3>
                    {hasCompany && (
                        <p className={styles.targetCompany}>at {targetCompany}</p>
                    )}
                </div>

                {/* Score Ring — Regra de Ouro: esconder se 0 ou null */}
                {score > 0 && (
                    <div className={styles.scoreRingWrapper}>
                        <ScoreRing score={score} />
                    </div>
                )}
            </div>

            {/* ── Category Badge ── */}
            <div
                className={styles.categoryBadge}
                style={{
                    color: theme.color,
                    background: theme.bg,
                    borderColor: theme.border,
                }}
            >
                <span className={styles.categoryIcon}>{theme.icon}</span>
                {category}
            </div>

            {/* ── Footer: Date + Menu ── */}
            <div className={styles.footer}>
                <span className={styles.date}>{formatRelativeDate(item.created_at)}</span>

                <div className={styles.menuWrapper} ref={menuRef}>
                    <button
                        className={styles.menuButton}
                        onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpen(!menuOpen);
                        }}
                    >
                        ⋯
                    </button>
                    {menuOpen && (
                        <div className={styles.menuDropdown}>
                            <button
                                className={styles.menuItem}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownloadPdf();
                                }}
                                disabled={downloading}
                            >
                                {downloading ? "⏳ Gerando..." : "📥 Baixar PDF"}
                            </button>
                            <button
                                className={styles.menuItemDanger}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete();
                                }}
                                disabled={deleting}
                            >
                                {deleting ? "⏳ Excluindo..." : "🗑️ Excluir"}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
