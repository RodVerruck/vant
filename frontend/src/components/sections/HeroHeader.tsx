import { memo } from "react";
import type { CSSProperties } from "react";

const badgeTooltipStyle: CSSProperties = {
    borderBottom: "none",
    cursor: "help",
    fontSize: "0.82rem",
    color: "#E2E8F0",
    letterSpacing: "0.3px",
};

const highlightStyle: CSSProperties = {
    color: "#CBD5E1",
    fontWeight: 600,
};

const subheadlineStyle: CSSProperties = {
    maxWidth: "420px",
    marginBottom: "32px",
};

const headlineStyle: CSSProperties = {
    marginBottom: "24px",
};

const badgeStyle: CSSProperties = {
    marginBottom: "24px",
};

const checkmarkStyle: CSSProperties = {
    color: "#4ADE80",
};

export const HeroHeader = memo(function HeroHeader() {
    return (
        <div className="hero-section">
            <div className="badge-live" data-cy="main-heading" style={badgeStyle}>
                <span
                    className="vant-tooltip"
                    tabIndex={0}
                    style={badgeTooltipStyle}
                    data-tooltip="Mais de 50.000 CVs otimizados. Taxa de sucesso comprovada em seleções de grandes empresas."
                >
                    <span style={checkmarkStyle}>✓</span>
                    &nbsp; Mais de <strong style={highlightStyle}>50.000</strong> currículos otimizados
                </span>
            </div>

            <div className="headline" style={headlineStyle}>
                Vença o algoritmo ATS.
                <br />
                <span className="highlight">Chegue na mão do recrutador.</span>
            </div>

            <div className="subheadline" style={subheadlineStyle}>
                IA que otimiza seu CV para passar nos filtros automáticos e chegar no recrutador.
            </div>
        </div>
    );
});

HeroHeader.displayName = "HeroHeader";
