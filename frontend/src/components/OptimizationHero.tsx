"use client";

import styles from "./OptimizationHero.module.css";

interface OptimizationHeroProps {
    onNewOptimization: () => void;
    creditsRemaining: number;
}

export function OptimizationHero({ onNewOptimization, creditsRemaining }: OptimizationHeroProps) {
    return (
        <div className={styles.card}>
            <div className={styles.glowOrb} />
            <div className={styles.content}>
                <div className={styles.textBlock}>
                    <div className={styles.badge}>
                        ⚡ Ação Principal
                    </div>
                    <h1 className={styles.title}>Otimizar novo currículo</h1>
                    <p className={styles.subtitle}>
                        Vença o ATS da sua próxima vaga.
                        {creditsRemaining > 0 && (
                            <> Você tem <strong style={{ color: "#10B981" }}>{creditsRemaining} crédito(s)</strong> disponível(is).</>
                        )}
                    </p>
                </div>
                <button className={styles.button} onClick={onNewOptimization}>
                    + Nova Otimização
                </button>
            </div>
        </div>
    );
}
