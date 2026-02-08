"use client";

import { useMemo } from "react";
import styles from "./DashboardFilters.module.css";

interface HistoryItem {
    id: string;
    created_at: string;
    job_description: string;
    target_role?: string;
    target_company?: string;
    category?: string;
    company_domain?: string;
    result_preview: {
        veredito: string;
        score_ats: number;
        gaps_count: number;
    };
}

interface DashboardFiltersProps {
    history: HistoryItem[];
    selectedCategory: string;
    searchTerm: string;
    onCategoryChange: (category: string) => void;
    onSearchChange: (searchTerm: string) => void;
}

export function DashboardFilters({
    history,
    selectedCategory,
    searchTerm,
    onCategoryChange,
    onSearchChange,
}: DashboardFiltersProps) {
    // Extract unique categories from history
    const categories = useMemo(() => {
        const uniqueCategories = new Set<string>();
        history.forEach(item => {
            if (item.category) {
                uniqueCategories.add(item.category);
            }
        });
        const sortedCategories = Array.from(uniqueCategories).sort();
        return ["Todos", ...sortedCategories];
    }, [history]);

    const hasActiveFilters = selectedCategory !== "Todos" || searchTerm.trim() !== "";

    return (
        <div className={styles.filtersContainer}>
            {/* Category Pills */}
            <div className={styles.categoryPills}>
                {categories.map(category => (
                    <button
                        key={category}
                        className={`${styles.pill} ${selectedCategory === category
                                ? styles.pillActive
                                : styles.pillInactive
                            }`}
                        onClick={() => onCategoryChange(category)}
                    >
                        {category}
                    </button>
                ))}
            </div>

            {/* Search Input */}
            <div className={styles.searchContainer}>
                <svg
                    className={styles.searchIcon}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                </svg>
                <input
                    type="text"
                    placeholder="Buscar vaga ou empresa..."
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className={styles.searchInput}
                />
            </div>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
                <button
                    className={styles.clearButton}
                    onClick={() => { onCategoryChange("Todos"); onSearchChange(""); }}
                >
                    Limpar Filtros
                </button>
            )}
        </div>
    );
}
