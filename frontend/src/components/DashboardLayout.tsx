"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";
import styles from "./DashboardLayout.module.css";

interface DashboardLayoutProps {
    authEmail: string;
    creditsRemaining: number;
    isPremium: boolean;
    isSyncingCredits?: boolean;
    onLogout: () => void;
    onUpgrade: () => void;
    children: ReactNode;
}

export function DashboardLayout({
    authEmail,
    creditsRemaining,
    isPremium,
    isSyncingCredits = false,
    onLogout,
    onUpgrade,
    children,
}: DashboardLayoutProps) {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        }
        if (dropdownOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownOpen]);

    const initials = authEmail
        ? authEmail.slice(0, 2).toUpperCase()
        : "??";

    return (
        <div className={styles.layout}>
            <header className={styles.header}>
                <div className={styles.headerInner}>
                    <div className={styles.logoBlock}>
                        <h1 className={styles.logo}>VANT</h1>
                        {isPremium ? (
                            <span className={styles.proBadge}>PRO</span>
                        ) : (
                            <span className={styles.freeBadge}>FREE</span>
                        )}
                    </div>

                    <div className={styles.headerRight}>
                        {/* Credits pill */}
                        <div className={styles.creditsBlock}>
                            {creditsRemaining > 0 ? (
                                <div className={styles.creditsPill}>
                                    ⚡ {creditsRemaining} crédito{creditsRemaining !== 1 ? "s" : ""}
                                </div>
                            ) : (
                                <div className={styles.creditsPillZero}>
                                    0 créditos
                                </div>
                            )}
                            {isSyncingCredits && (
                                <div className={styles.syncingHint}>
                                    <span className={styles.syncDot} aria-hidden="true" />
                                    Sincronizando créditos...
                                </div>
                            )}
                        </div>

                        {/* Upgrade CTA for free users */}
                        {!isPremium && (
                            <button className={styles.upgradeButton} onClick={onUpgrade}>
                                Seja PRO
                            </button>
                        )}

                        {/* Profile dropdown */}
                        <div className={styles.profileWrapper} ref={dropdownRef}>
                            <button
                                className={styles.profileButton}
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                            >
                                <div className={styles.profileAvatar}>{initials}</div>
                                <span>▾</span>
                            </button>

                            {dropdownOpen && (
                                <div className={styles.profileDropdown}>
                                    <div className={styles.profileEmail}>{authEmail}</div>
                                    {isPremium && (
                                        <button
                                            className={styles.profileMenuItem}
                                            onClick={() => {
                                                setDropdownOpen(false);
                                                // TODO: open Stripe portal
                                                alert("Em breve: Gerenciar assinatura");
                                            }}
                                        >
                                            ⚙️ Gerenciar Plano
                                        </button>
                                    )}
                                    <button
                                        className={styles.profileMenuItemDanger}
                                        onClick={() => {
                                            setDropdownOpen(false);
                                            onLogout();
                                        }}
                                    >
                                        🚪 Sair
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <main className={styles.body}>
                {children}
            </main>
        </div>
    );
}
