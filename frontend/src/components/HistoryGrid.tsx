"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { DashboardHistoryCard } from "./DashboardHistoryCard";
import { EmptyState } from "./EmptyState";
import { DashboardFilters } from "./DashboardFilters";
import styles from "./HistoryGrid.module.css";

const DISPLAY_PAGE_SIZE = 9;

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
    const [loading, setLoading] = useState(true);
    const [initialLoadDone, setInitialLoadDone] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Filter state — single source of truth
    const [selectedCategory, setSelectedCategory] = useState("Todos");
    const [searchTerm, setSearchTerm] = useState("");

    // Client-side "show more" counter
    const [visibleCount, setVisibleCount] = useState(DISPLAY_PAGE_SIZE);

    const requestIdRef = useRef(0);

    // Derive filtered list from full history
    const filteredHistory = useMemo(() => {
        let filtered = history;

        if (selectedCategory !== "Todos") {
            filtered = filtered.filter(item => item.category === selectedCategory);
        }

        if (searchTerm.trim()) {
            const q = searchTerm.toLowerCase().trim();
            filtered = filtered.filter(item =>
                item.target_role?.toLowerCase().includes(q) ||
                item.target_company?.toLowerCase().includes(q) ||
                item.job_description.toLowerCase().includes(q)
            );
        }

        return filtered;
    }, [history, selectedCategory, searchTerm]);

    // Items to actually render (paginated slice of filtered list)
    const visibleItems = useMemo(
        () => filteredHistory.slice(0, visibleCount),
        [filteredHistory, visibleCount]
    );

    const hasMore = visibleCount < filteredHistory.length;

    // Reset visible count when filters change
    useEffect(() => {
        setVisibleCount(DISPLAY_PAGE_SIZE);
    }, [selectedCategory, searchTerm]);

    // Fetch ALL history once
    const fetchAll = useCallback(async () => {
        const thisRequest = ++requestIdRef.current;

        try {
            setLoading(true);
            setError(null);

            const resp = await fetch(
                `${getApiUrl()}/api/user/history?user_id=${authUserId}&page=1&page_size=200`
            );

            if (thisRequest !== requestIdRef.current) return;
            if (!resp.ok) throw new Error(`Erro ${resp.status}`);

            const data = await resp.json();
            if (thisRequest !== requestIdRef.current) return;

            setHistory(data.history || []);
            setLoading(false);
            setInitialLoadDone(true);
        } catch (err: any) {
            if (thisRequest !== requestIdRef.current) return;
            setError(err.message || "Erro ao carregar histórico");
            setLoading(false);
            setInitialLoadDone(true);
        }
    }, [authUserId]);

    useEffect(() => {
        fetchAll();
        return () => { requestIdRef.current++; };
    }, [authUserId, fetchAll]);

    const handleLoadMore = () => {
        setVisibleCount(prev => prev + DISPLAY_PAGE_SIZE);
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
                    <button className={styles.retryButton} onClick={() => fetchAll()}>
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

    // Single render path — DashboardFilters is always the same instance
    return (
        <div className={styles.section}>
            <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>
                    Suas Otimizações
                    <span className={styles.count}>({filteredHistory.length})</span>
                </h2>
            </div>

            <DashboardFilters
                history={history}
                selectedCategory={selectedCategory}
                searchTerm={searchTerm}
                onCategoryChange={setSelectedCategory}
                onSearchChange={setSearchTerm}
            />

            {filteredHistory.length === 0 ? (
                <div className={styles.emptyFilteredContainer}>
                    <div className={styles.emptyFilteredIcon}>🔍</div>
                    <h3 className={styles.emptyFilteredTitle}>Nenhuma otimização encontrada nesta categoria.</h3>
                    <p className={styles.emptyFilteredMessage}>
                        Tente ajustar os filtros ou buscar por outros termos.
                    </p>
                </div>
            ) : (
                <>
                    <div className={styles.grid}>
                        {visibleItems.map((item, index) => (
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
                            >
                                {`Ver mais (${visibleItems.length} de ${filteredHistory.length})`}
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
