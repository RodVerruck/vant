"use client";

import styles from "./EmptyState.module.css";

interface EmptyStateProps {
    onAction: () => void;
}

export function EmptyState({ onAction }: EmptyStateProps) {
    return (
        <div className={styles.container}>
            <div className={styles.icon}>📋</div>
            <h2 className={styles.title}>
                Seu histórico de vitórias começa aqui.
            </h2>
            <p className={styles.subtitle}>
                Otimize seu primeiro CV e veja como a IA transforma seu currículo
                para passar nos filtros ATS.
            </p>
            <button className={styles.button} onClick={onAction}>
                + Nova Otimização
            </button>
        </div>
    );
}
