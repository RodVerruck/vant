"use client";

import { useState, useEffect, useRef } from "react";
import { DashboardHistoryCard } from "./DashboardHistoryCard";
import { EmptyState } from "./EmptyState";
import styles from "./HistoryGrid.module.css";

interface HistoryItem {
    id: string;
    created_at: string;
    job_description: string;
    result_preview: {
        veredito: string;
        score_ats: number;
        gaps_count: number;
    };
}

interface HistoryGridProps {
    authUserId: string;
    onOpenItem: (item: HistoryItem) => void;
    onNewOptimization: () => void;
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

export function HistoryGrid({ authUserId, onOpenItem, onNewOptimization }: HistoryGridProps) {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    const loadHistory = async () => {
        if (abortRef.current) abortRef.current.abort();
        abortRef.current = new AbortController();

        try {
            setLoading(true);
            setError(null);

            const resp = await fetch(
                `${getApiUrl()}/api/user/history?user_id=${authUserId}`,
                { signal: abortRef.current.signal }
            );

            if (!resp.ok) throw new Error(`Erro ${resp.status}`);

            const data = await resp.json();
            setHistory(data.history || []);
        } catch (err: any) {
            if (err.name === "AbortError") return;
            setError(err.message || "Erro ao carregar histórico");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadHistory();
        return () => { abortRef.current?.abort(); };
    }, [authUserId]);

    if (loading) {
        return (
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Suas Otimizações</h2>
                </div>
                <div className={styles.grid}>
                    {[1, 2, 3].map((i) => (
                        <div key={i} className={styles.skeletonCard}>
                            <div>
                                <div className={`${styles.skeletonLine} ${styles.skeletonLineLong}`} />
                                <div className={`${styles.skeletonLine} ${styles.skeletonLineShort}`} style={{ marginTop: 8 }} />
                            </div>
                            <div className={styles.skeletonBadge} />
                            <div className={styles.skeletonFooter} />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.section}>
                <div className={styles.errorContainer}>
                    <div className={styles.errorIcon}>⚠️</div>
                    <h3 className={styles.errorTitle}>Erro ao carregar histórico</h3>
                    <p className={styles.errorMessage}>{error}</p>
                    <button className={styles.retryButton} onClick={loadHistory}>
                        Tentar novamente
                    </button>
                </div>
            </div>
        );
    }

    if (history.length === 0) {
        return (
            <div className={styles.section}>
                <EmptyState onAction={onNewOptimization} />
            </div>
        );
    }

    return (
        <div className={styles.section}>
            <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>
                    Suas Otimizações
                    <span className={styles.count}>({history.length})</span>
                </h2>
            </div>
            <div className={styles.grid}>
                {history.map((item) => (
                    <DashboardHistoryCard
                        key={item.id}
                        item={item}
                        onOpen={onOpenItem}
                    />
                ))}
            </div>
        </div>
    );
}
