"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { DashboardHistoryCard } from "./DashboardHistoryCard";
import { EmptyState } from "./EmptyState";
import styles from "./HistoryGrid.module.css";

const PAGE_SIZE = 6;

interface HistoryItem {
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
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(true);
    const [initialLoadDone, setInitialLoadDone] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const requestIdRef = useRef(0);

    const fetchPage = useCallback(async (pageNum: number, append: boolean) => {
        const thisRequest = ++requestIdRef.current;

        try {
            if (append) {
                setLoadingMore(true);
            } else {
                setLoading(true);
            }
            setError(null);

            const resp = await fetch(
                `${getApiUrl()}/api/user/history?user_id=${authUserId}&page=${pageNum}&page_size=${PAGE_SIZE}`
            );

            if (thisRequest !== requestIdRef.current) return;
            if (!resp.ok) throw new Error(`Erro ${resp.status}`);

            const data = await resp.json();
            if (thisRequest !== requestIdRef.current) return;

            const items: HistoryItem[] = data.history || [];

            if (append) {
                setHistory((prev) => [...prev, ...items]);
            } else {
                setHistory(items);
            }
            setTotal(data.total || 0);
            setHasMore(!!data.has_more);
            setPage(pageNum);
            setLoading(false);
            setLoadingMore(false);
            setInitialLoadDone(true);
        } catch (err: any) {
            if (thisRequest !== requestIdRef.current) return;
            setError(err.message || "Erro ao carregar histórico");
            setLoading(false);
            setLoadingMore(false);
            setInitialLoadDone(true);
        }
    }, [authUserId]);

    useEffect(() => {
        fetchPage(1, false);
        return () => { requestIdRef.current++; };
    }, [authUserId, fetchPage]);

    const handleLoadMore = () => {
        if (!loadingMore && hasMore) {
            fetchPage(page + 1, true);
        }
    };

    // Show spinner until initial load is fully done
    if (loading || !initialLoadDone) {
        return (
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Suas Otimizações</h2>
                </div>
                <div className={styles.loadingContainer}>
                    <div className={styles.loadingSpinner} />
                    <p className={styles.loadingText}>Carregando suas otimizações...</p>
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
                    <button className={styles.retryButton} onClick={() => fetchPage(1, false)}>
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
                    <span className={styles.count}>({total})</span>
                </h2>
            </div>
            <div className={styles.grid}>
                {history.map((item, index) => (
                    <div
                        key={item.id}
                        className={styles.fadeIn}
                        style={{ animationDelay: `${index * 120}ms` }}
                    >
                        <DashboardHistoryCard
                            item={item}
                            authUserId={authUserId}
                            onOpen={onOpenItem}
                            onDelete={(itemId) => {
                                setHistory((prev) => prev.filter((h) => h.id !== itemId));
                                setTotal((prev) => Math.max(0, prev - 1));
                            }}
                        />
                    </div>
                ))}
            </div>
            {hasMore && (
                <div className={styles.loadMoreWrapper}>
                    <button
                        className={styles.loadMoreButton}
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                    >
                        {loadingMore ? "Carregando..." : `Ver mais (${history.length} de ${total})`}
                    </button>
                </div>
            )}
        </div>
    );
}
