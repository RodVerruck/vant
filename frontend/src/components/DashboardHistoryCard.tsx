"use client";

import { useState, useRef, useEffect } from "react";
import styles from "./HistoryCard.module.css";

interface HistoryCardItem {
    id: string;
    created_at: string;
    job_description: string;
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

function getScoreBadgeClass(score: number): string {
    if (score >= 71) return styles.scoreBadgeGood;
    if (score >= 41) return styles.scoreBadgeWarning;
    return styles.scoreBadgeCritical;
}

function getVerdictStyle(veredito: string): React.CSSProperties {
    const lower = veredito.toLowerCase();
    if (lower.includes("aprov")) {
        return { background: "rgba(16, 185, 129, 0.15)", color: "#10B981" };
    }
    if (lower.includes("reprov")) {
        return { background: "rgba(239, 68, 68, 0.15)", color: "#EF4444" };
    }
    return { background: "rgba(148, 163, 184, 0.15)", color: "#94A3B8" };
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
            // 1. Fetch full report data
            const detailResp = await fetch(
                `${getApiUrl()}/api/user/history/detail?id=${item.id}`
            );
            if (!detailResp.ok) throw new Error("Erro ao buscar dados da análise");
            const detailData = await detailResp.json();

            // 2. Generate PDF
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

            // 3. Download the blob
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
    const veredito = item.result_preview.veredito;

    return (
        <div className={styles.card} onClick={() => !downloading && onOpen(item)} style={deleting ? { opacity: 0.5, pointerEvents: "none" } : undefined}>
            {downloading && (
                <>
                    <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
                    <div style={{
                        position: "absolute",
                        inset: 0,
                        background: "rgba(15, 23, 42, 0.85)",
                        borderRadius: "inherit",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 12,
                        zIndex: 10,
                        backdropFilter: "blur(4px)",
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
                            fontSize: "0.85rem",
                            fontWeight: 700,
                            letterSpacing: "0.5px",
                        }}>
                            Gerando PDF...
                        </span>
                    </div>
                </>
            )}
            <div className={styles.header}>
                <div className={styles.iconWrapper}>📄</div>
                <div className={styles.titleBlock}>
                    <h3 className={styles.jobTitle}>{item.job_description}</h3>
                    <div className={styles.date}>{formatRelativeDate(item.created_at)}</div>
                </div>
            </div>

            <div className={styles.body}>
                <div className={getScoreBadgeClass(score)}>
                    {score}
                    <span className={styles.scoreLabel}>ATS</span>
                </div>
                {veredito && veredito !== "N/A" && (
                    <span className={styles.verdictBadge} style={getVerdictStyle(veredito)}>
                        {veredito}
                    </span>
                )}
            </div>

            <div className={styles.footer}>
                <button
                    className={styles.openButton}
                    onClick={(e) => {
                        e.stopPropagation();
                        onOpen(item);
                    }}
                >
                    Abrir
                </button>

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
