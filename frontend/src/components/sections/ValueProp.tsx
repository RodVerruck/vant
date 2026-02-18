import { memo } from "react";
import type { CSSProperties } from "react";

const sectionStyle: CSSProperties = {
    marginTop: "60px",
};

const headerContainerStyle: CSSProperties = {
    textAlign: "center",
    marginBottom: "32px",
};

const titleStyle: CSSProperties = {
    color: "#F8FAFC",
    fontSize: "1.5rem",
    fontWeight: 700,
    margin: "0 0 8px 0",
};

const subtitleStyle: CSSProperties = {
    color: "#CBD5E1",
    fontSize: "0.9rem",
    margin: 0,
};

const gridContainerStyle: CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "20px",
    width: "100%",
    maxWidth: "1200px",
    margin: "0 auto",
};

const cardStyle = (bgColor: string, borderColor: string): CSSProperties => ({
    background: bgColor,
    border: `1px solid ${borderColor}`,
    borderRadius: "16px",
    padding: "28px",
    textAlign: "left",
});

const iconContainerStyle = (bgColor: string): CSSProperties => ({
    width: "44px",
    height: "44px",
    borderRadius: "12px",
    background: bgColor,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "16px",
});

const titleTextStyle: CSSProperties = {
    color: "#F8FAFC",
    fontSize: "1.1rem",
    fontWeight: 800,
    marginBottom: "8px",
    lineHeight: "1.3",
};

const descriptionTextStyle: CSSProperties = {
    color: "#CBD5E1",
    fontSize: "0.9rem",
    lineHeight: "1.6",
};

const footerStyle: CSSProperties = {
    textAlign: "center",
    marginTop: "20px",
    color: "#E2E8F0",
    fontSize: "0.8rem",
    fontStyle: "italic",
};

export const ValueProp = memo(function ValueProp() {
    return (
        <div className="hero-section" style={sectionStyle}>
            <div style={headerContainerStyle}>
                <h3 style={titleStyle}>Por que funciona</h3>
                <p style={subtitleStyle}>Tecnologia baseada em dados reais de mercado</p>
            </div>

            <div style={gridContainerStyle}>
                <div style={cardStyle("rgba(74, 158, 255, 0.06)", "rgba(74, 158, 255, 0.15)")}>
                    <div style={iconContainerStyle("rgba(74, 158, 255, 0.12)")}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4A9EFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="4" y="4" width="16" height="16" rx="2" />
                            <rect x="9" y="9" width="6" height="6" />
                            <path d="M15 2v2" />
                            <path d="M15 20v2" />
                            <path d="M2 15h2" />
                            <path d="M2 9h2" />
                            <path d="M20 15h2" />
                            <path d="M20 9h2" />
                            <path d="M9 2v2" />
                            <path d="M9 20v2" />
                        </svg>
                    </div>
                    <div style={titleTextStyle}>
                        IA Treinada com <span style={{ color: "#4A9EFF", fontSize: "1.3rem" }}>50K+</span> Vagas
                    </div>
                    <div style={descriptionTextStyle}>
                        Analisamos milhares de descrições de vagas reais para identificar padrões de sucesso
                    </div>
                </div>

                <div style={cardStyle("rgba(16, 185, 129, 0.06)", "rgba(16, 185, 129, 0.15)")}>
                    <div style={iconContainerStyle("rgba(16, 185, 129, 0.12)")}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <circle cx="12" cy="12" r="6" />
                            <circle cx="12" cy="12" r="2" />
                        </svg>
                    </div>
                    <div style={titleTextStyle}>
                        <span style={{ color: "#10B981", fontSize: "1.4rem" }}>43</span> Critérios ATS
                    </div>
                    <div style={descriptionTextStyle}>
                        Verificamos os critérios que os robôs usam para aprovar seu currículo
                    </div>
                </div>

                <div style={cardStyle("rgba(245, 158, 11, 0.06)", "rgba(245, 158, 11, 0.15)")}>
                    <div style={iconContainerStyle("rgba(245, 158, 11, 0.12)")}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="20" x2="18" y2="10" />
                            <line x1="12" y1="20" x2="12" y2="4" />
                            <line x1="6" y1="20" x2="6" y2="14" />
                        </svg>
                    </div>
                    <div style={titleTextStyle}>
                        Padrões de <span style={{ color: "#F59E0B" }}>Mercado</span>
                    </div>
                    <div style={descriptionTextStyle}>
                        Otimização baseada em CVs aprovados em processos seletivos reais
                    </div>
                </div>
            </div>
            <div style={footerStyle}>
                Baseado em 50.000+ processamentos reais
            </div>
        </div>
    );
});

ValueProp.displayName = "ValueProp";
