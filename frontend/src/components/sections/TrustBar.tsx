import { memo } from "react";
import type { CSSProperties } from "react";

const sectionStyle: CSSProperties = {
    marginTop: "24px",
};

const statsGridStyle: CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "10px",
    margin: "0",
    maxWidth: "100%",
};

const statCardStyle: CSSProperties = {
    padding: "10px 12px",
    background: "rgba(255, 255, 255, 0.03)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "12px",
    textAlign: "left",
    transition: "transform 0.3s ease",
};

const statCardHoverStyle: CSSProperties = {
    transform: "translateY(-2px)",
    borderColor: "rgba(255, 255, 255, 0.15)",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
};

const statContentStyle: CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "10px",
};

const statIconStyle: CSSProperties = {
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
};

const statNumberStyle: CSSProperties = {
    fontSize: "1.2rem",
    fontWeight: 900,
    marginBottom: "1px",
    background: "linear-gradient(135deg, #38BDF8 0%, #0EA5E9 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
};

const statLabelStyle: CSSProperties = {
    fontSize: "0.65rem",
    color: "#E2E8F0",
    fontWeight: 500,
};

const tooltipStyle: CSSProperties = {
    marginLeft: "4px",
    opacity: 0.6,
    borderBottom: "1px dotted #CBD5E1",
    cursor: "help",
};

export const TrustBar = memo(function TrustBar() {
    return (
        <div style={sectionStyle}>
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "10px",
                margin: "0",
                maxWidth: "100%",
            }}>
                {/* Stat 1: +34% aprovação ATS */}
                <div style={{
                    ...statCardStyle,
                }}>
                    <div style={statContentStyle}>
                        <div style={{ ...statIconStyle, background: "rgba(56, 189, 248, 0.1)", color: "#38BDF8" }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                                <polyline points="16 7 22 7 22 13" />
                            </svg>
                        </div>
                        <div>
                            <div style={statNumberStyle}>+34%</div>
                            <div style={statLabelStyle}>
                                aprovação ATS
                                <span
                                    tabIndex={0}
                                    data-tooltip="Aumento médio comparado ao original (Base: 50k+ processamentos)."
                                    style={tooltipStyle}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stat 2: 3x mais entrevistas */}
                <div style={{
                    ...statCardStyle,
                }}>
                    <div style={statContentStyle}>
                        <div style={{ ...statIconStyle, background: "rgba(16, 185, 129, 0.1)", color: "#10B981" }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                        </div>
                        <div>
                            <div style={statNumberStyle}>3x</div>
                            <div style={statLabelStyle}>
                                mais entrevistas
                                <span
                                    tabIndex={0}
                                    data-tooltip="Média de conversão dos últimos 3 meses."
                                    style={tooltipStyle}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stat 3: 100% Privado e Seguro */}
                <div style={{
                    ...statCardStyle,
                }}>
                    <div style={statContentStyle}>
                        <div style={{ ...statIconStyle, background: "rgba(139, 92, 246, 0.1)", color: "#8B5CF6" }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                        </div>
                        <div>
                            <div style={statNumberStyle}>100%</div>
                            <div style={statLabelStyle}>
                                Privado e Seguro
                                <span
                                    tabIndex={0}
                                    data-tooltip="Seus dados são criptografados e nunca compartilhados."
                                    style={tooltipStyle}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

TrustBar.displayName = "TrustBar";
