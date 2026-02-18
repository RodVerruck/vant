import { memo } from "react";
import type { CSSProperties } from "react";

const sectionStyle: CSSProperties = {
    marginTop: "48px",
};

const cardContainerStyle: CSSProperties = {
    background: "linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(74, 158, 255, 0.05))",
    border: "1px solid rgba(16, 185, 129, 0.3)",
    borderRadius: "16px",
    padding: "32px",
    textAlign: "center",
    maxWidth: "700px",
    margin: "0 auto",
};

const iconContainerStyle: CSSProperties = {
    width: "48px",
    height: "48px",
    borderRadius: "14px",
    background: "rgba(16, 185, 129, 0.12)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 16px",
};

const iconStyle: CSSProperties = {
    color: "#10B981",
};

const titleStyle: CSSProperties = {
    color: "#F8FAFC",
    fontSize: "1.3rem",
    fontWeight: 700,
    margin: "0 0 16px 0",
};

const descriptionStyle: CSSProperties = {
    color: "#F8FAFC",
    fontSize: "1rem",
    lineHeight: "1.2",
    margin: "10px 0 4px 0",
};

const commitmentStyle: CSSProperties = {
    textAlign: "center",
    marginBottom: "24px",
};

const commitmentTextStyle: CSSProperties = {
    color: "#F8FAFC",
    fontSize: "1rem",
    fontWeight: 700,
};

const featuresContainerStyle: CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
};

const featureItemStyle: CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
};

const featureIconStyle: CSSProperties = {
    width: "16px",
    height: "16px",
};

const featureTextStyle: CSSProperties = {
    color: "#CBD5E1",
    fontSize: "0.85rem",
};

export const AnalysisCard = memo(function AnalysisCard() {
    return (
        <div className="hero-section" style={sectionStyle}>
            <div style={cardContainerStyle}>
                <div style={iconContainerStyle}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={iconStyle}>
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                    </svg>
                </div>

                <h3 style={titleStyle}>Análise Instantânea</h3>
                <p style={descriptionStyle}>
                    Descubra seu score ATS e os erros que estão te eliminando.
                </p>

                <div style={commitmentStyle}>
                    <span style={commitmentTextStyle}>Sem compromisso. Sem cartão.</span>
                </div>

                <div style={featuresContainerStyle}>
                    <div style={featureItemStyle}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 6L9 17l-5-5" />
                        </svg>
                        <span style={featureTextStyle}>Score ATS em segundos</span>
                    </div>
                    <div style={featureItemStyle}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 6L9 17l-5-5" />
                        </svg>
                        <span style={featureTextStyle}>Erros críticos detectados</span>
                    </div>
                    <div style={featureItemStyle}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 6L9 17l-5-5" />
                        </svg>
                        <span style={featureTextStyle}>Dados destruídos após análise</span>
                    </div>
                </div>
            </div>
        </div>
    );
});

AnalysisCard.displayName = "AnalysisCard";
