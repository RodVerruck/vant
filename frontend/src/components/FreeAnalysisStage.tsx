"use client";

import { useState } from "react";

interface FreeAnalysisStageProps {
  previewData: any;
  onUpgrade: () => void;
  onTryAnother?: () => void;
}

export function FreeAnalysisStage({ previewData, onUpgrade, onTryAnother }: FreeAnalysisStageProps) {
  const [showAllProblems, setShowAllProblems] = useState(false);

  const score = previewData?.nota_ats || 0;
  const problems = previewData?.gaps_fatais || [];
  const visibleProblems = showAllProblems ? problems : problems.slice(0, 2);
  const hiddenCount = problems.length - 2;

  return (
    <div className="free-analysis-container">
      <style jsx>{`
        .free-analysis-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 40px 20px;
        }

        .analysis-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .free-badge {
          display: inline-block;
          background: linear-gradient(135deg, #10B981 0%, #059669 100%);
          color: white;
          font-size: 0.85rem;
          font-weight: 700;
          padding: 6px 16px;
          border-radius: 20px;
          margin-bottom: 16px;
          letter-spacing: 0.5px;
        }

        .analysis-title {
          font-size: 2rem;
          font-weight: 700;
          color: #F8FAFC;
          margin-bottom: 12px;
        }

        .analysis-subtitle {
          font-size: 1.1rem;
          color: #94A3B8;
        }

        .score-card {
          background: rgba(30, 41, 59, 0.5);
          border: 2px solid rgba(148, 163, 184, 0.2);
          border-radius: 16px;
          padding: 32px;
          margin-bottom: 32px;
          text-align: center;
        }

        .score-label {
          font-size: 0.9rem;
          color: #94A3B8;
          margin-bottom: 16px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .score-value {
          font-size: 4rem;
          font-weight: 700;
          color: #4A9EFF;
          margin-bottom: 8px;
        }

        .score-description {
          font-size: 1rem;
          color: #CBD5E1;
        }

        .problems-section {
          margin-bottom: 32px;
        }

        .section-title {
          font-size: 1.3rem;
          font-weight: 700;
          color: #F8FAFC;
          margin-bottom: 20px;
        }

        .problem-card {
          background: rgba(239, 68, 68, 0.1);
          border-left: 4px solid #EF4444;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 16px;
        }

        .problem-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: #F8FAFC;
          margin-bottom: 8px;
        }

        .problem-description {
          font-size: 0.95rem;
          color: #CBD5E1;
          line-height: 1.6;
        }

        .blur-overlay {
          position: relative;
          margin-top: 16px;
        }

        .blur-content {
          filter: blur(8px);
          opacity: 0.4;
          pointer-events: none;
          user-select: none;
        }

        .unlock-banner {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(30, 41, 59, 0.95);
          border: 2px solid #4A9EFF;
          border-radius: 12px;
          padding: 24px 32px;
          text-align: center;
          z-index: 10;
          min-width: 300px;
        }

        .unlock-icon {
          font-size: 2.5rem;
          margin-bottom: 12px;
        }

        .unlock-text {
          font-size: 1.1rem;
          font-weight: 600;
          color: #F8FAFC;
          margin-bottom: 8px;
        }

        .unlock-subtext {
          font-size: 0.9rem;
          color: #94A3B8;
          margin-bottom: 20px;
        }

        .unlock-button {
          width: 100%;
          padding: 12px 24px;
          background: linear-gradient(135deg, #4A9EFF 0%, #3B82F6 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .unlock-button:hover {
          background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(74, 158, 255, 0.4);
        }

        .cta-section {
          background: linear-gradient(135deg, rgba(74, 158, 255, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%);
          border: 2px solid rgba(74, 158, 255, 0.3);
          border-radius: 16px;
          padding: 40px;
          text-align: center;
          margin-top: 40px;
        }

        .cta-title {
          font-size: 1.8rem;
          font-weight: 700;
          color: #F8FAFC;
          margin-bottom: 16px;
        }

        .cta-benefits {
          list-style: none;
          padding: 0;
          margin: 24px 0;
          display: grid;
          gap: 12px;
        }

        .cta-benefits li {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          color: #CBD5E1;
          font-size: 1rem;
        }

        .cta-benefits li::before {
          content: "✓";
          color: #10B981;
          font-weight: 700;
          font-size: 1.3rem;
        }

        .cta-button {
          padding: 16px 48px;
          background: linear-gradient(135deg, #4A9EFF 0%, #3B82F6 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-top: 24px;
        }

        .cta-button:hover {
          background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(74, 158, 255, 0.4);
        }

        .guarantee-text {
          margin-top: 16px;
          font-size: 0.9rem;
          color: #94A3B8;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        @media (max-width: 768px) {
          .analysis-title {
            font-size: 1.5rem;
          }

          .score-value {
            font-size: 3rem;
          }

          .cta-section {
            padding: 24px;
          }

          .cta-title {
            font-size: 1.4rem;
          }
        }
      `}</style>

      <div className="analysis-header">
        <div className="free-badge">✨ ANÁLISE GRATUITA</div>
        <h1 className="analysis-title">Seu Diagnóstico Está Pronto!</h1>
        <p className="analysis-subtitle">
          Identificamos os principais problemas do seu currículo
        </p>
      </div>

      <div className="score-card">
        <div className="score-label">Score ATS</div>
        <div className="score-value">{score}%</div>
        <div className="score-description">
          {score < 50 && "Seu CV precisa de melhorias urgentes"}
          {score >= 50 && score < 70 && "Seu CV tem potencial, mas pode melhorar"}
          {score >= 70 && score < 85 && "Seu CV está bom, mas não ótimo"}
          {score >= 85 && "Seu CV está muito bem otimizado!"}
        </div>
      </div>

      <div className="problems-section">
        <h2 className="section-title">
          🚨 Problemas Identificados ({problems.length})
        </h2>

        {visibleProblems.map((problem: any, idx: number) => (
          <div key={idx} className="problem-card">
            <div className="problem-title">{problem.titulo || "Problema Detectado"}</div>
            <div className="problem-description">
              {problem.descricao || "Descrição não disponível"}
            </div>
          </div>
        ))}

        {hiddenCount > 0 && (
          <div className="blur-overlay">
            <div className="blur-content">
              <div className="problem-card">
                <div className="problem-title">Mais {hiddenCount} problemas detectados</div>
                <div className="problem-description">
                  Faça upgrade para ver todos os problemas e receber sugestões completas de otimização...
                </div>
              </div>
            </div>
            <div className="unlock-banner">
              <div className="unlock-icon">🔓</div>
              <div className="unlock-text">Desbloqueie a Análise Completa</div>
              <div className="unlock-subtext">
                Veja todos os {hiddenCount} problemas restantes + sugestões de correção
              </div>
              <button className="unlock-button" onClick={onUpgrade}>
                Ver Planos PRO
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="cta-section">
        <h2 className="cta-title">
          🚀 Desbloqueie Tudo com o Plano PRO
        </h2>
        <p style={{ color: "#94A3B8", fontSize: "1.1rem", marginBottom: "24px" }}>
          A partir de <strong style={{ color: "#4A9EFF" }}>R$ 27,90/mês</strong> ou <strong style={{ color: "#10B981" }}>R$ 239/ano</strong> (economize 29%)
        </p>
        <ul className="cta-benefits">
          <li>Otimizações ILIMITADAS</li>
          <li>Download de CV Otimizado (PDF + Word)</li>
          <li>Simulador de Entrevista com IA</li>
          <li>X-Ray Search - Encontre Recrutadores</li>
          <li>Biblioteca Recomendada</li>
        </ul>
        <button className="cta-button" onClick={onUpgrade}>
          COMEÇAR TRIAL R$ 1,99 POR 7 DIAS
        </button>
        <div style={{ textAlign: "center", marginTop: "12px", fontSize: "0.85rem", color: "#64748B" }}>
          Ou escolha o plano mensal/anual
        </div>
        <div className="guarantee-text">
          <span>🛡️</span>
          <span>Garantia de 7 dias ou seu dinheiro de volta</span>
        </div>
      </div>
    </div>
  );
}
