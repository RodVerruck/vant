"use client";

import { useState } from "react";
import { AlertCircle, TrendingUp, Loader, CheckCircle2, Zap, Info, Search } from 'lucide-react';
import { calculateProjectedScore } from '@/lib/helpers';

// Importar estilos globais do PaidStage
const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

  /* Container Principal */
  .vant-premium-wrapper {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background: linear-gradient(135deg, #020617 0%, #0f172a 50%, #020617 100%);
    min-height: 100vh;
    color: #f1f5f9;
    padding: 2rem 1rem;
    line-height: 1.5;
  }

  .vant-container {
    max-width: 1150px;
    margin: 0 auto;
    width: 100%;
  }

  /* Utilitários de Layout */
  .vant-flex { display: flex; }
  .vant-flex-col { flex-direction: column; }
  .vant-items-center { align-items: center; }
  .vant-justify-between { justify-content: space-between; }
  .vant-justify-center { justify-content: center; }
  .vant-gap-2 { gap: 0.5rem; }
  .vant-gap-3 { gap: 0.75rem; }
  .vant-gap-4 { gap: 1rem; }
  .vant-gap-6 { gap: 1.5rem; }
  .vant-mb-4 { margin-bottom: 1rem; }
  .vant-mb-6 { margin-bottom: 1.5rem; }
  .vant-mb-8 { margin-bottom: 2rem; }
  .vant-mb-12 { margin-bottom: 3rem; }
  .vant-mt-4 { margin-top: 1rem; }
  .vant-w-full { width: 100%; }

  /* Grid System Responsivo */
  .vant-grid-3 {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  @media (min-width: 768px) {
    .vant-grid-3 { grid-template-columns: repeat(3, 1fr); }
  }
  
  .vant-grid-2 {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  @media (min-width: 768px) {
    .vant-grid-2 { grid-template-columns: repeat(2, 1fr); }
  }

  /* Tipografia */
  .vant-title-xl { font-size: 3rem; font-weight: 300; letter-spacing: -0.02em; color: white; margin: 0; line-height: 1.1; }
  .vant-subtitle { font-size: 1.125rem; font-weight: 300; color: #94a3b8; margin-top: 0.5rem; }
  .vant-h2 { font-size: 1.5rem; font-weight: 600; color: white; margin: 0; }
  .vant-h3 { font-size: 1.25rem; font-weight: 600; color: white; margin: 0; }
  .vant-text-sm { font-size: 0.875rem; }
  .vant-text-xs { font-size: 0.75rem; }
  .vant-font-medium { font-weight: 500; }
  .vant-text-slate-400 { color: #94a3b8; }
  .vant-text-slate-500 { color: #64748b; }
  .vant-text-white { color: white; }
  .vant-pulse-soft { animation: vantPulse 1.6s ease-in-out infinite; }
  @keyframes vantPulse {
    0% { transform: scale(1); opacity: 0.85; }
    50% { transform: scale(1.06); opacity: 1; }
    100% { transform: scale(1); opacity: 0.85; }
  }

  /* Cards e Glassmorphism */
  .vant-glass-dark {
    background: rgba(15, 23, 42, 0.6);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
    border-radius: 1.5rem;
    padding: 2rem;
    transition: transform 0.2s ease, border-color 0.2s ease;
  }
  .vant-glass-dark:hover {
    transform: translateY(-2px);
    border-color: rgba(255, 255, 255, 0.15);
  }

  .vant-glass-darker {
    background: rgba(15, 23, 42, 0.85);
    backdrop-filter: blur(24px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 1.5rem;
    padding: 2rem;
  }

  /* Botões e Interativos */
  .vant-btn-tab {
    background: transparent;
    border: none;
    color: #94a3b8;
    padding: 0.75rem 1.5rem;
    border-radius: 1rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .vant-btn-tab:hover { background: rgba(255,255,255,0.05); color: white; }
  .vant-btn-tab.active {
    background: rgba(255,255,255,0.1);
    color: white;
    border: 1px solid rgba(255,255,255,0.15);
  }

  .vant-btn-primary {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    border: none;
    padding: 1rem 2rem;
    border-radius: 1rem;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .vant-btn-primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
  }

  .vant-cta-button {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    box-shadow: 0 6px 18px rgba(16, 185, 129, 0.25);
  }
  .vant-cta-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 26px rgba(16, 185, 129, 0.35);
  }

  /* Elementos Específicos */
  .vant-badge-credits {
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(255,255,255,0.1);
    padding: 0.5rem 1rem;
    border-radius: 99px;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: #94a3b8;
  }

  .vant-score-bar-bg {
    height: 0.5rem;
    background: rgba(255,255,255,0.1);
    border-radius: 99px;
    overflow: hidden;
    margin-top: 1rem;
  }
  .vant-score-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, #94a3b8 0%, #cbd5e1 100%);
    border-radius: 99px;
  }

  .vant-icon-circle {
    width: 3rem; height: 3rem;
    border-radius: 99px;
    background: rgba(255,255,255,0.1);
    display: flex; align-items: center; justify-content: center;
  }

  /* Animações */
  @keyframes vantFadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  .vant-animate-fade { animation: vantFadeIn 0.6s ease-out forwards; }
  .vant-animate-spin { animation: spin 1s linear infinite; }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  @keyframes pulse { 
    0%, 100% { opacity: 1; transform: scale(1); } 
    50% { opacity: 0.7; transform: scale(1.1); } 
  }

  /* Estilos específicos do FreeAnalysis */
  .free-badge {
    background: linear-gradient(135deg, #10B981 0%, #059669 100%);
    color: white;
    font-size: 0.85rem;
    font-weight: 700;
    padding: 6px 16px;
    border-radius: 20px;
    letter-spacing: 0.5px;
  }

  .problem-card {
    background: rgba(239, 68, 68, 0.1);
    border-left: 4px solid #EF4444;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 16px;
  }

  .problem-analysis {
    background: rgba(15, 23, 42, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 1.5rem;
  }

  .version-card {
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 1rem;
  }

  .benefit-item {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 1rem;
    transition: all 0.2s ease;
  }

  .benefit-item:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.15);
  }

  .benefit-icon {
    font-size: 1.5rem;
    width: 2.5rem;
    height: 2.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 8px;
  }

  .tooltip-icon {
    font-size: 0.875rem;
    color: #64748b;
    cursor: help;
    padding: 0.25rem;
    border-radius: 4px;
    transition: color 0.2s ease;
  }

  .tooltip-icon:hover {
    color: #94a3b8;
  }

  .unlock-banner {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(15, 23, 42, 0.95);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 16px;
    padding: 2rem;
    text-align: center;
    min-width: 300px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
  }

  /* Mobile Responsive */
  @media (max-width: 768px) {
    .vant-sticky-cta {
      display: block !important;
    }
    
    .vant-container {
      padding-bottom: 80px;
    }
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

  @media (max-width: 768px) {
    .vant-title-xl { font-size: 2rem; }
    .vant-grid-3 { grid-template-columns: 1fr; }
  }
`;

// Injeção de estilo no head
if (typeof window !== "undefined") {
  const styleId = "vant-free-analysis-styles";
  if (!document.getElementById(styleId)) {
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = globalStyles;
    document.head.appendChild(style);
  }
}

interface FreeAnalysisStageProps {
  previewData: any;
  onUpgrade: () => void;
  onTryAnother?: () => void;
}

export function FreeAnalysisStage({ previewData, onUpgrade, onTryAnother }: FreeAnalysisStageProps) {
  const [showAllProblems, setShowAllProblems] = useState(false);

  // 🎯 Calcular score projetado de forma inteligente
  const score = previewData?.nota_ats || 0;

  // Extração correta dos pilares do backend
  const pilares = previewData?.analise_por_pilares || {};
  const formatoAts = typeof pilares.ats === "number" ? pilares.ats : Math.max(score - 10, 20);
  const keywords = typeof pilares.keywords === "number" ? pilares.keywords : Math.max(score - 15, 25);
  const impacto = typeof pilares.impacto === "number" ? pilares.impacto : Math.max(score - 20, 30);

  // Extração correta dos gaps (gap_1 e gap_2 como objetos)
  const problems = [];
  if (previewData?.gap_1) problems.push(previewData.gap_1);
  if (previewData?.gap_2) problems.push(previewData.gap_2);

  const visibleProblems = showAllProblems ? problems : problems.slice(0, 2);
  const hiddenCount = problems.length - 2;

  // Cálculo do score projetado usando dados reais
  const gapsCount = problems.length;
  const projected = calculateProjectedScore(
    score,
    gapsCount,
    0, // gaps médios
    formatoAts,
    keywords,
    impacto
  );

  // 🎨 Sistema de cores baseado no score
  const getScoreColor = (scoreValue: number) => {
    if (scoreValue < 50) {
      return {
        primary: '#ef4444',
        secondary: '#fca5a5',
        gradient: 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)',
        label: 'Crítico'
      };
    } else if (scoreValue < 80) {
      return {
        primary: '#f59e0b',
        secondary: '#fbbf24',
        gradient: 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)',
        label: 'Atenção'
      };
    } else {
      return {
        primary: '#10b981',
        secondary: '#34d399',
        gradient: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
        label: 'Excelente'
      };
    }
  };

  const currentScoreColors = getScoreColor(score);

  return (
    <div className="vant-premium-wrapper">
      <div className="vant-container">

        {/* Header Premium */}
        <div className="vant-flex vant-justify-between vant-items-center vant-mb-12 vant-animate-fade">
          <div>
            <h1 className="vant-title-xl">Seu Diagnóstico</h1>
            <p className="vant-subtitle">Análise gratuita do seu currículo</p>
          </div>
          <div className="vant-badge-credits">
            <div className="free-badge">✨ ANÁLISE GRATUITA</div>
          </div>
        </div>

        {/* Cards de Evolução de Score - Lado a Lado com Seta */}
        <div className="vant-mb-12 vant-animate-fade" style={{ animationDelay: '0.1s' }}>
          <div className="vant-glass-dark" style={{ padding: '2.5rem' }}>
            <h2 className="vant-h2 vant-mb-8" style={{ textAlign: 'center' }}>📊 Evolução do Seu Score</h2>

            <div className="vant-flex vant-items-center vant-gap-6" style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
              {/* Score Atual */}
              <div style={{ textAlign: 'center', minWidth: '200px' }}>
                <div className="vant-text-sm vant-font-medium" style={{ color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>Score Atual</div>
                <div style={{ fontSize: '4rem', fontWeight: 300, color: currentScoreColors.primary, lineHeight: 1, marginBottom: '0.5rem' }}>{score}</div>
                <div className="vant-text-sm" style={{ color: currentScoreColors.secondary, marginBottom: '1rem' }}>de 100 pontos</div>
                <div className="vant-score-bar-bg" style={{ maxWidth: '200px', margin: '0 auto' }}>
                  <div className="vant-score-bar-fill" style={{ width: `${score}%`, background: currentScoreColors.gradient }} />
                </div>
              </div>

              {/* Seta de Evolução */}
              <div style={{ fontSize: '3rem', color: '#10b981', animation: 'pulse 2s ease-in-out infinite' }}>
                →
              </div>

              {/* Score Projetado */}
              <div style={{ textAlign: 'center', minWidth: '200px' }}>
                <div className="vant-text-sm vant-font-medium" style={{ color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>Score Projetado</div>
                <div style={{ fontSize: '4rem', fontWeight: 300, background: 'linear-gradient(to right, #34d399, #2dd4bf)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1, marginBottom: '0.5rem' }}>
                  {projected.score}
                </div>
                <div className="vant-text-sm" style={{ color: '#34d399', marginBottom: '1rem' }}>+{projected.improvement} pontos</div>
                <div className="vant-score-bar-bg" style={{ maxWidth: '200px', margin: '0 auto' }}>
                  <div className="vant-score-bar-fill" style={{ width: `${projected.score}%`, background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)' }} />
                </div>
              </div>
            </div>

            {/* Badge de Percentil */}
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', background: 'rgba(16, 185, 129, 0.15)', borderRadius: '99px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                <TrendingUp size={20} color="#34d399" />
                <span style={{ color: '#34d399', fontSize: '1rem', fontWeight: 600 }}>Alcance o {projected.percentile} dos candidatos</span>
              </div>
            </div>

            {/* Explicação */}
            <p className="vant-text-sm vant-text-slate-400" style={{ marginTop: '1.5rem', lineHeight: 1.7, textAlign: 'center', maxWidth: '600px', margin: '1.5rem auto 0' }}>
              {score < 50 && "⚠️ Seu CV está sendo rejeitado automaticamente pela maioria dos sistemas ATS. Com otimização profissional, você pode aumentar suas chances em até 300%."}
              {score >= 50 && score < 70 && "📊 Seu CV passa em alguns filtros ATS, mas perde oportunidades. Com otimização, você pode dobrar suas chances e alcançar o " + projected.percentile + "."}
              {score >= 70 && score < 80 && "⚡ Seu CV está no caminho certo! Com ajustes estratégicos, você pode alcançar o " + projected.percentile + " e se destacar significativamente da concorrência."}
              {score >= 80 && score < 90 && "✅ Seu CV está competitivo e passa na maioria dos filtros ATS. Pequenas otimizações podem te colocar no " + projected.percentile + " e maximizar suas oportunidades."}
              {score >= 90 && "🌟 Excelente! Seu CV está otimizado para ATS. Ajustes finais podem te levar ao " + projected.percentile + " e garantir destaque máximo."}
            </p>
          </div>
        </div>

        {/* Grid de Diagnóstico e Problemas */}
        <div className={`vant-grid-${problems.length > 0 ? '2' : '1'} vant-mb-12 vant-animate-fade`} style={{ animationDelay: '0.2s' }}>

          {/* Barras de Progresso dos Pilares */}
          <div className="vant-glass-dark">
            <h3 className="vant-h3 vant-mb-6" style={{ fontSize: '1.1rem', fontWeight: 600 }}>Diagnóstico Detalhado</h3>

            {/* Barra Impacto */}
            <div className="vant-flex vant-items-center vant-gap-3 vant-mb-4">
              <span className="vant-text-sm vant-font-medium vant-text-slate-400" style={{ minWidth: '80px' }}>Impacto</span>
              <div className="vant-flex-1 vant-score-bar-bg">
                <div
                  className="vant-score-bar-fill"
                  style={{
                    width: `${impacto}%`,
                    background: impacto >= 70 ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)' : impacto >= 50 ? 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)' : 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)'
                  }}
                />
              </div>
              <span className="vant-text-sm vant-font-medium" style={{
                minWidth: '45px',
                textAlign: 'right',
                color: impacto >= 70 ? '#34d399' : impacto >= 50 ? '#fbbf24' : '#f87171'
              }}>
                {impacto}%
              </span>
            </div>

            {/* Barra Keywords */}
            <div className="vant-flex vant-items-center vant-gap-3 vant-mb-4">
              <span className="vant-text-sm vant-font-medium vant-text-slate-400" style={{ minWidth: '80px' }}>Palavras-chave</span>
              <div className="vant-flex-1 vant-score-bar-bg">
                <div
                  className="vant-score-bar-fill"
                  style={{
                    width: `${keywords}%`,
                    background: keywords >= 70 ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)' : keywords >= 50 ? 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)' : 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)'
                  }}
                />
              </div>
              <span className="vant-text-sm vant-font-medium" style={{
                minWidth: '45px',
                textAlign: 'right',
                color: keywords >= 70 ? '#34d399' : keywords >= 50 ? '#fbbf24' : '#f87171'
              }}>
                {keywords}%
              </span>
            </div>

            {/* Barra Formato ATS */}
            <div className="vant-flex vant-items-center vant-gap-3">
              <span className="vant-text-sm vant-font-medium vant-text-slate-400" style={{ minWidth: '80px' }}>Format. ATS</span>
              <div className="vant-flex-1 vant-score-bar-bg">
                <div
                  className="vant-score-bar-fill"
                  style={{
                    width: `${formatoAts}%`,
                    background: formatoAts >= 70 ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)' : formatoAts >= 50 ? 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)' : 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)'
                  }}
                />
              </div>
              <span className="vant-text-sm vant-font-medium" style={{
                minWidth: '45px',
                textAlign: 'right',
                color: formatoAts >= 70 ? '#34d399' : formatoAts >= 50 ? '#fbbf24' : '#f87171'
              }}>
                {formatoAts}%
              </span>
            </div>
          </div>

          {/* Card Problemas - Só mostrar se houver problemas */}
          {problems.length > 0 && (
            <div className="vant-glass-dark" style={{ borderColor: 'rgba(239, 68, 68, 0.3)' }}>
              <div className="vant-flex vant-items-center vant-gap-3 vant-mb-6">
                <div className="vant-icon-circle" style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}>
                  <AlertCircle size={20} color="white" />
                </div>
                <div>
                  <span className="vant-text-sm vant-font-medium" style={{ color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Problemas</span>
                  <div className="vant-text-xs vant-text-slate-400">Pontos críticos identificados</div>
                </div>
              </div>
              <div>
                <div style={{ fontSize: '3.5rem', fontWeight: 300, color: '#ef4444', lineHeight: 1 }}>{problems.length}</div>
                <div className="vant-text-sm" style={{ color: '#fca5a5' }}>gaps detectados</div>
              </div>
              <div className="vant-mt-4" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '99px', color: '#f87171', fontSize: '0.875rem', fontWeight: 500 }}>
                <AlertCircle size={16} /> Requer correção urgente
              </div>
            </div>
          )}

        </div>

        {/* Radar de Recrutadores - Movido para cima para criar urgência */}
        <div className="vant-glass-dark vant-mb-8 vant-animate-fade" style={{ animationDelay: '0.3s' }}>
          <h2 className="vant-h2 vant-mb-6">📡 Radar de Recrutadores Ativo</h2>
          <div className="vant-flex vant-items-center vant-gap-4 vant-mb-4">
            <div className="vant-icon-circle" style={{ background: 'linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)' }}>
              <Search size={24} color="white" />
            </div>
            <div>
              <div className="vant-text-white" style={{ fontSize: '1.1rem', fontWeight: 500, marginBottom: '0.25rem' }}>
                Seu perfil está <span style={{ color: '#38bdf8' }}>visível para 247 recrutadores</span>
              </div>
              <div className="vant-text-slate-400 vant-text-sm">
                Ative o PRO para ver quem está visualizando seu perfil e receber alertas em tempo real
              </div>
            </div>
          </div>
          <div className="vant-text-slate-400" style={{ lineHeight: 1.7, fontSize: '0.95rem' }}>
            💼 Neste momento, <strong style={{ color: '#38bdf8' }}>247 recrutadores ativos</strong> estão buscando profissionais com seu perfil. Com o plano PRO, você recebe notificações quando recrutadores visualizam seu currículo, pode ver quais empresas estão interessadas e tem acesso ao <strong style={{ color: '#34d399' }}>X-Ray Search</strong> para encontrar recrutadores específicos da sua área.
          </div>
        </div>

        {/* Análise Detalhada dos Problemas */}
        <div className="vant-glass-darker vant-mb-8 vant-animate-fade" style={{ animationDelay: '0.4s' }}>
          <h2 className="vant-h2 vant-mb-6">📊 Análise Detalhada dos Problemas</h2>

          <div className="vant-text-slate-400" style={{ marginBottom: '1.5rem', fontSize: '0.95rem', lineHeight: 1.7 }}>
            Nossa IA identificou problemas críticos que estão impedindo seu CV de passar pelos filtros ATS e chamar a atenção de recrutadores. Abaixo você vê <strong style={{ color: '#38bdf8' }}>2 exemplos práticos</strong> de como seu CV está atualmente e como ficaria após a otimização profissional. Na versão PRO, você recebe a análise completa com todos os problemas identificados e as correções prontas para aplicar.
          </div>

          {problems.length > 0 ? (
            <>
              {visibleProblems.map((problem: any, idx: number) => (
                <div key={idx} className="problem-analysis vant-mb-6">
                  <h3 className="vant-h3 vant-text-white vant-mb-4">
                    PROBLEMA #{idx + 1}
                  </h3>

                  <div className="vant-grid-2 vant-mb-4">
                    <div className="version-card">
                      <h4 className="vant-text-sm vant-font-medium vant-text-slate-400 vant-mb-2">VERSÃO ATUAL</h4>
                      <div className="vant-text-white" style={{ fontSize: '0.95rem', lineHeight: 1.6 }}>
                        {problem.exemplo_atual || "Exemplo não disponível"}
                      </div>
                    </div>
                    <div className="version-card" style={{ borderColor: 'rgba(16, 185, 129, 0.3)' }}>
                      <h4 className="vant-text-sm vant-font-medium" style={{ color: '#34d399', marginBottom: '0.5rem' }}>VERSÃO OTIMIZADA</h4>
                      <div className="vant-text-white" style={{ fontSize: '0.95rem', lineHeight: 1.6 }}>
                        {problem.exemplo_otimizado || "Exemplo não disponível"}
                      </div>
                    </div>
                  </div>

                  {/* Renderização de Termos Faltando na Análise Detalhada */}
                  {problem.termos_faltando && Array.isArray(problem.termos_faltando) && problem.termos_faltando.length > 0 && (
                    <div className="vant-mb-4">
                      <h4 className="vant-text-sm vant-font-medium" style={{ color: '#f87171', marginBottom: '0.5rem' }}>
                        🚨 Termos Faltando Identificados:
                      </h4>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {problem.termos_faltando.map((termo: string, termIdx: number) => (
                          <li key={termIdx} className="vant-text-sm" style={{ color: '#fca5a5', marginBottom: '0.25rem', paddingLeft: '1rem' }}>
                            • {termo}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="vant-text-slate-400 vant-text-sm" style={{ lineHeight: 1.6 }}>
                    {problem.impacto || "Impacto não especificado"}
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="vant-text-slate-400" style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
              <div>Nenhum problema crítico detectado em seu currículo!</div>
            </div>
          )}
        </div>

        {/* Benefícios Detalhados - Focado em Resultados */}
        <div className="vant-glass-dark vant-mb-8 vant-animate-fade" style={{ animationDelay: '0.6s' }}>
          <h2 className="vant-h2 vant-mb-6">🚀 Na versão premium você recebe:</h2>

          <div className="vant-text-slate-400" style={{ marginBottom: '1.5rem', lineHeight: 1.7 }}>
            Não é apenas um otimizador de CV. É um sistema completo que te prepara para todo o processo seletivo, desde a candidatura até a aprovação final.
          </div>

          <div style={{ display: 'grid', gap: '1.25rem', marginBottom: '1.5rem' }}>
            {[
              {
                icon: '🎯',
                title: 'Passe pelos filtros ATS e chegue aos recrutadores',
                desc: 'CV otimizado com formatação profissional, palavras-chave estratégicas e estrutura que passa em 95% dos sistemas automáticos. Download em PDF e Word prontos para enviar.',
                highlight: 'ATS-proof garantido'
              },
              {
                icon: '💼',
                title: 'Descubra quem está contratando na sua área agora',
                desc: 'Ferramenta exclusiva de X-Ray Search para encontrar recrutadores ativos, ver empresas que estão contratando e fazer networking direto com quem decide.',
                highlight: 'Acesso direto aos decisores'
              },
              {
                icon: '🎙️',
                title: 'Chegue preparado para a entrevista e impressione',
                desc: 'Simulador de entrevista com IA que pratica perguntas comportamentais e técnicas com você, dá feedback detalhado e te prepara para a entrevista real.',
                highlight: 'Confiança na hora H'
              },
              {
                icon: '📚',
                title: 'Evolua continuamente com recursos personalizados',
                desc: 'Biblioteca premium com cursos, livros e recursos recomendados especificamente para sua área e nível de experiência, atualizada mensalmente.',
                highlight: 'Desenvolvimento contínuo'
              },
              {
                icon: '🔍',
                title: 'Veja exatamente o que está impedindo você de ser chamado',
                desc: 'Análise completa e profunda de todos os problemas do seu CV, com exemplos práticos de correção e score projetado realista baseado em dados.',
                highlight: 'Diagnóstico preciso'
              },
              {
                icon: '♾️',
                title: 'Teste e otimize quantas vezes precisar',
                desc: 'Otimizações ilimitadas para ajustar seu CV para diferentes vagas, testar versões e acompanhar a evolução do seu score ao longo do tempo.',
                highlight: 'Sem limites'
              }
            ].map((benefit, idx) => (
              <div key={idx} className="benefit-item vant-flex vant-gap-4" style={{ alignItems: 'flex-start', padding: '1.5rem', background: 'rgba(255, 255, 255, 0.03)' }}>
                <div style={{ fontSize: '2.5rem', flexShrink: 0, lineHeight: 1 }}>{benefit.icon}</div>
                <div className="vant-flex-1">
                  <div className="vant-text-white vant-font-medium" style={{ marginBottom: '0.75rem', fontSize: '1.1rem', lineHeight: 1.3 }}>
                    {benefit.title}
                  </div>
                  <div className="vant-text-slate-400" style={{ fontSize: '0.95rem', lineHeight: 1.7, marginBottom: '0.75rem' }}>
                    {benefit.desc}
                  </div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.375rem 0.75rem', background: 'rgba(16, 185, 129, 0.15)', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, color: '#34d399' }}>
                    ✓ {benefit.highlight}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {hiddenCount > 0 && (
          <div className="blur-overlay">
            <div className="blur-content">
              <div className="problem-card">
                <h3 className="vant-h3 vant-text-white" style={{ fontWeight: 600, marginBottom: '0.5rem' }}>
                  Mais {hiddenCount} problemas detectados
                </h3>
                <p className="vant-text-slate-400 vant-text-sm" style={{ lineHeight: 1.6 }}>
                  Faça upgrade para ver todos os problemas e receber sugestões completas de otimização...
                </p>
              </div>
            </div>
            <div className="unlock-banner">
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🔓</div>
              <div className="vant-text-white" style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                Desbloqueie a Análise Completa
              </div>
              <div className="vant-text-slate-400" style={{ fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                Veja todos os {hiddenCount} problemas restantes + sugestões de correção
              </div>
              <button className="vant-btn-primary" onClick={onUpgrade}>
                Ver Planos PRO
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Rodapé Condicional */}
      <div className="vant-glass-darker vant-mb-8 vant-animate-fade" style={{ animationDelay: '0.7s' }}>
        <div className="vant-flex vant-justify-between vant-items-center">
          <div>
            <div className="vant-text-white vant-font-medium" style={{ marginBottom: '0.25rem' }}>
              🎉 Análise gratuita concluída!
            </div>
            <div className="vant-text-slate-400 vant-text-sm">
              Você tem 1 análise gratuita disponível
            </div>
          </div>
          <div className="vant-flex vant-gap-3">
            <button
              className="vant-btn-tab"
              onClick={onTryAnother}
              style={{ background: 'rgba(255,255,255,0.1)' }}
            >
              Voltar para edição
            </button>
            <button
              className="vant-btn-primary"
              onClick={onUpgrade}
            >
              Ver Planos PRO
            </button>
          </div>
        </div>
      </div>

      {/* Barra Sticky CTA Mobile */}
      <div className="vant-sticky-cta" style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '1rem',
        display: 'none',
        zIndex: 50
      }}>
        <div className="vant-flex vant-justify-between vant-items-center">
          <div>
            <div className="vant-text-white vant-font-medium">
              Desbloqueie análise completa
            </div>
            <div className="vant-text-slate-400 vant-text-sm">
              Apenas R$ 1,99 trial 7 dias
            </div>
          </div>
          <button
            className="vant-btn-primary"
            onClick={onUpgrade}
            style={{ padding: '0.75rem 1.5rem' }}
          >
            COMEÇAR AGORA
          </button>
        </div>
      </div>

      {/* CTA Premium */}
      <div className="vant-glass-dark vant-animate-fade" style={{ animationDelay: '0.3s' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 className="vant-h2 vant-mb-6">
            🚀 Alcance o Score {projected.score}/100 e Entre no {projected.percentile}
          </h2>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem', maxWidth: '700px', margin: '0 auto 1.5rem' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#10b981', marginBottom: '0.5rem', textAlign: 'center' }}>
              🎯 Teste por R$ 1,99 durante 7 dias
            </div>
            <div style={{ fontSize: '0.95rem', color: '#cbd5e1', textAlign: 'center', lineHeight: 1.6 }}>
              Depois, apenas <strong style={{ color: '#f8fafc' }}>R$ 19,90/mês</strong>
            </div>
            <div style={{ fontSize: '0.85rem', color: '#94a3b8', textAlign: 'center', marginTop: '0.5rem' }}>
              Cancele quando quiser • Reembolso em 48h
            </div>
          </div>

          <div style={{ display: 'grid', gap: '0.75rem', margin: '1.5rem 0', maxWidth: '500px', marginLeft: 'auto', marginRight: 'auto' }}>
            <div className="vant-flex vant-items-center vant-gap-3 vant-text-slate-400" style={{ justifyContent: 'center' }}>
              <span style={{ color: '#10b981', fontWeight: 700, fontSize: '1.3rem' }}>✓</span>
              <span>30 Otimizações para testar</span>
            </div>
            <div className="vant-flex vant-items-center vant-gap-3 vant-text-slate-400" style={{ justifyContent: 'center' }}>
              <span style={{ color: '#10b981', fontWeight: 700, fontSize: '1.3rem' }}>✓</span>
              <span>Download de CV Otimizado (PDF + Word)</span>
            </div>
            <div className="vant-flex vant-items-center vant-gap-3 vant-text-slate-400" style={{ justifyContent: 'center' }}>
              <span style={{ color: '#10b981', fontWeight: 700, fontSize: '1.3rem' }}>✓</span>
              <span>Simulador de Entrevista com IA</span>
            </div>
            <div className="vant-flex vant-items-center vant-gap-3 vant-text-slate-400" style={{ justifyContent: 'center' }}>
              <span style={{ color: '#10b981', fontWeight: 700, fontSize: '1.3rem' }}>✓</span>
              <span>X-Ray Search - Encontre Recrutadores</span>
            </div>
            <div className="vant-flex vant-items-center vant-gap-3 vant-text-slate-400" style={{ justifyContent: 'center' }}>
              <span style={{ color: '#10b981', fontWeight: 700, fontSize: '1.3rem' }}>✓</span>
              <span>Biblioteca Recomendada</span>
            </div>
          </div>

          <button className="vant-btn-primary vant-cta-button" onClick={onUpgrade} style={{ margin: '1.5rem auto 0', display: 'flex' }}>
            Começar teste por R$ 1,99
          </button>

          <div className="vant-text-slate-500" style={{ textAlign: 'center', marginTop: '0.75rem', fontSize: '0.85rem' }}>
            Ou escolha o plano mensal/anual
          </div>

          <div className="vant-flex vant-items-center vant-gap-2" style={{ justifyContent: 'center', marginTop: '1rem' }}>
            <span>🛡️</span>
            <span className="vant-text-slate-400" style={{ fontSize: '0.9rem' }}>
              Garantia de 7 dias ou seu dinheiro de volta
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}
