"use client";

import { useState, useRef, useEffect } from "react";
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

/* ── Avatar helpers ── */

const AVATAR_COLORS = [
    { bg: "rgba(139, 92, 246, 0.15)", text: "#A78BFA", border: "rgba(139, 92, 246, 0.25)" },
    { bg: "rgba(56, 189, 248, 0.15)", text: "#38BDF8", border: "rgba(56, 189, 248, 0.25)" },
    { bg: "rgba(16, 185, 129, 0.15)", text: "#34D399", border: "rgba(16, 185, 129, 0.25)" },
    { bg: "rgba(251, 146, 60, 0.15)", text: "#FB923C", border: "rgba(251, 146, 60, 0.25)" },
    { bg: "rgba(244, 114, 182, 0.15)", text: "#F472B6", border: "rgba(244, 114, 182, 0.25)" },
    { bg: "rgba(250, 204, 21, 0.15)", text: "#FACC15", border: "rgba(250, 204, 21, 0.25)" },
];

function getAvatarColor(name: string) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

const CATEGORY_ICONS: Record<string, string> = {
    "Tecnologia": "⌨️",
    "Design": "🎨",
    "Marketing": "📣",
    "Vendas": "💼",
    "Gestão": "📊",
    "Financeiro": "💰",
    "RH": "👥",
    "Operações": "⚙️",
    "Geral": "🔍",
};

function ScoreRing({ score }: { score: number }) {
    const radius = 19;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;
    const color = getScoreColor(score);

    return (
        <div className={styles.scoreRing}>
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
    const categoryIcon = CATEGORY_ICONS[category] || "🔍";

    // Avatar: company letter if available, else category icon
    const hasCompany = !!targetCompany;
    const avatarColor = hasCompany ? getAvatarColor(targetCompany) : getAvatarColor(category);

    // Hover border color matches score
    const hoverBorderColor = score > 0 ? getScoreColor(score) : "rgba(56, 189, 248, 0.25)";

    return (
        <div
            className={styles.card}
            onClick={() => !downloading && onOpen(item)}
            style={deleting ? { opacity: 0.4, pointerEvents: "none", transform: "scale(0.97)" } : undefined}
            onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = hoverBorderColor;
            }}
            onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(255, 255, 255, 0.05)";
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
                        background: avatarColor.bg,
                        color: avatarColor.text,
                        border: `1px solid ${avatarColor.border}`,
                    }}
                >
                    {hasCompany ? targetCompany.charAt(0).toUpperCase() : categoryIcon}
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
            <div className={styles.categoryBadge}>
                <span className={styles.categoryIcon}>{categoryIcon}</span>
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
