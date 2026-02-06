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
    onOpen: (item: HistoryCardItem) => void;
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

export function DashboardHistoryCard({ item, onOpen }: DashboardHistoryCardProps) {
    const [menuOpen, setMenuOpen] = useState(false);
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

    const score = item.result_preview.score_ats;
    const veredito = item.result_preview.veredito;

    return (
        <div className={styles.card} onClick={() => onOpen(item)}>
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
                                    setMenuOpen(false);
                                    // TODO: implement PDF download
                                    alert("Em breve: Download PDF");
                                }}
                            >
                                📥 Baixar PDF
                            </button>
                            <button
                                className={styles.menuItemDanger}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setMenuOpen(false);
                                    // TODO: implement delete
                                    alert("Em breve: Excluir análise");
                                }}
                            >
                                🗑️ Excluir
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
