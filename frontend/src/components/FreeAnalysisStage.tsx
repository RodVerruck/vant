"use client";

import { useState } from "react";
import { AlertCircle, TrendingUp, Loader, CheckCircle2, Zap, Info, Search } from 'lucide-react';

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

  const score = previewData?.nota_ats || 0;
  const problems = previewData?.gaps_fatais || [];
  const visibleProblems = showAllProblems ? problems : problems.slice(0, 2);
  const hiddenCount = problems.length - 2;

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

        {/* Cards Principais em Grid - Layout dinâmico baseado na quantidade de problemas */}
        <div className={`vant-grid-3 vant-mb-12 vant-animate-fade ${problems.length === 0 ? 'vant-grid-2' : ''}`} style={{ animationDelay: '0.1s' }}>

          {/* Card Score ATS */}
          <div className="vant-glass-dark">
            <div className="vant-flex vant-items-center vant-gap-3 vant-mb-6">
              <div className="vant-icon-circle" style={{ background: 'linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)' }}>
                <CheckCircle2 size={20} color="white" />
              </div>
              <div>
                <span className="vant-text-sm vant-font-medium" style={{ color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Score ATS</span>
                <div className="vant-text-xs vant-text-slate-400">Compatibilidade com robôs</div>
              </div>
            </div>
            <div>
              <div style={{ fontSize: '3.5rem', fontWeight: 300, color: '#38bdf8', lineHeight: 1 }}>{score}%</div>
              <div className="vant-text-sm" style={{ color: '#7dd3fc' }}>de 100 pontos</div>
            </div>
            <div className="vant-score-bar-bg">
              <div className="vant-score-bar-fill" style={{ width: `${score}%`, background: 'linear-gradient(90deg, #38bdf8 0%, #0ea5e9 100%)' }} />
            </div>
            <p className="vant-text-xs vant-text-slate-400" style={{ marginTop: '0.75rem', lineHeight: 1.4 }}>
              {score < 50 && "Seu CV precisa de melhorias urgentes"}
              {score >= 50 && score < 70 && "Seu CV tem potencial, mas pode melhorar"}
              {score >= 70 && score < 85 && "Seu CV está bom, mas não ótimo"}
              {score >= 85 && "Seu CV está muito bem otimizado!"}
            </p>
          </div>

          {/* Card Potencial */}
          <div className="vant-glass-dark">
            <div className="vant-flex vant-items-center vant-gap-3 vant-mb-6">
              <div className="vant-icon-circle" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                <Zap size={20} color="white" />
              </div>
              <div>
                <span className="vant-text-sm vant-font-medium" style={{ color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Potencial</span>
                <div className="vant-text-xs vant-text-slate-400">Após otimização completa</div>
              </div>
            </div>
            <div>
              <div style={{ fontSize: '3.5rem', fontWeight: 300, background: 'linear-gradient(to right, #34d399, #2dd4bf)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1 }}>
                94
              </div>
              <div className="vant-text-sm vant-text-slate-400">+{94 - score} pontos possíveis</div>
            </div>
            <div className="vant-mt-4" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '99px', color: '#34d399', fontSize: '0.875rem', fontWeight: 500 }}>
              <TrendingUp size={16} /> Top 15% dos candidatos
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

        {/* Seção de Problemas - Só mostrar se houver problemas */}
        {problems.length > 0 && (
          <div className="vant-glass-darker vant-mb-8 vant-animate-fade" style={{ animationDelay: '0.2s' }}>
            <div className="vant-flex vant-justify-between vant-items-center vant-mb-6">
              <h2 className="vant-h2">🚨 Problemas Identificados</h2>
              <span className="vant-text-sm vant-text-slate-400" style={{ background: 'rgba(255,255,255,0.1)', padding: '0.25rem 0.75rem', borderRadius: 99 }}>
                {problems.length} pontos críticos
              </span>
            </div>

            {visibleProblems.map((problem: any, idx: number) => (
              <div key={idx} className="problem-card vant-mb-4">
                <h3 className="vant-h3 vant-text-white" style={{ fontWeight: 600, marginBottom: '0.5rem' }}>
                  {problem.titulo || "Problema Detectado"}
                </h3>
                <p className="vant-text-slate-400 vant-text-sm" style={{ lineHeight: 1.6 }}>
                  {problem.descricao || "Descrição não disponível"}
                </p>
              </div>
            ))}

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
        )}

        {/* Meta de Pontuação */}
        <div className="vant-glass-dark vant-mb-8 vant-animate-fade" style={{ animationDelay: '0.3s' }}>
          <h2 className="vant-h2 vant-mb-6">🎯 Meta de Pontuação</h2>
          <div className="vant-flex vant-items-center vant-gap-6">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', fontWeight: 300, color: '#10b981', lineHeight: 1 }}>94</div>
              <div className="vant-text-sm vant-text-slate-400">Score Alvo</div>
            </div>
            <div style={{ flex: 1 }}>
              <div className="vant-text-slate-400" style={{ marginBottom: '1rem' }}>
                Para atingir o <strong style={{ color: '#10b981' }}>Top 15% dos candidatos</strong> e aumentar suas chances em <strong style={{ color: '#38bdf8' }}>+300%</strong>
              </div>
              <div className="vant-score-bar-bg">
                <div className="vant-score-bar-fill" style={{ width: '94%', background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Radar de Recrutadores */}
        <div className="vant-glass-dark vant-mb-8 vant-animate-fade" style={{ animationDelay: '0.4s' }}>
          <h2 className="vant-h2 vant-mb-6">📡 Radar de Recrutadores Ativo</h2>
          <div className="vant-flex vant-items-center vant-gap-4">
            <div className="vant-icon-circle" style={{ background: 'linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)' }}>
              <Search size={20} color="white" />
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
        </div>

        {/* Análise Básica Completa */}
        <div className="vant-glass-darker vant-mb-8 vant-animate-fade" style={{ animationDelay: '0.5s' }}>
          <h2 className="vant-h2 vant-mb-6">📊 Análise Básica Completa</h2>

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

        {/* Benefícios Detalhados */}
        <div className="vant-glass-dark vant-mb-8 vant-animate-fade" style={{ animationDelay: '0.6s' }}>
          <h2 className="vant-h2 vant-mb-6">🚀 O que você ganha com o Plano PRO</h2>

          <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
            {[
              { icon: '📄', title: 'CV Otimizado', desc: 'Download em PDF + Word com formatação ATS-proof' },
              { icon: '🎯', title: 'X-Ray Search', desc: 'Encontre recrutadores que estão contratando na sua área' },
              { icon: '📚', title: 'Biblioteca Premium', desc: 'Acesso a cursos, livros e recursos exclusivos' },
              { icon: '🎙️', title: 'Simulador de Entrevista', desc: 'Pratique com IA e receba feedback detalhado' },
              { icon: '📊', title: 'Análise Completa', desc: 'Diagnóstico profundo com gaps e soluções' },
              { icon: '♾️', title: 'Otimizações Ilimitadas', desc: 'Ajuste seu CV quantas vezes precisar' }
            ].map((benefit, idx) => (
              <div key={idx} className="benefit-item vant-flex vant-items-center vant-gap-3">
                <div className="benefit-icon">{benefit.icon}</div>
                <div className="vant-flex-1">
                  <div className="vant-text-white vant-font-medium" style={{ marginBottom: '0.25rem' }}>
                    {benefit.title}
                  </div>
                  <div className="vant-text-slate-400 vant-text-sm">
                    {benefit.desc}
                  </div>
                </div>
                <div className="tooltip-icon">ℹ️</div>
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
            🚀 Desbloqueie Tudo com o Plano PRO
          </h2>
          <p className="vant-text-slate-400" style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>
            A partir de <strong style={{ color: '#38bdf8' }}>R$ 27,90/mês</strong> ou <strong style={{ color: '#10b981' }}>R$ 239/ano</strong> (economize 29%)
          </p>

          <div style={{ display: 'grid', gap: '0.75rem', margin: '1.5rem 0', maxWidth: '500px', marginLeft: 'auto', marginRight: 'auto' }}>
            <div className="vant-flex vant-items-center vant-gap-3 vant-text-slate-400" style={{ justifyContent: 'center' }}>
              <span style={{ color: '#10b981', fontWeight: 700, fontSize: '1.3rem' }}>✓</span>
              <span>Otimizações ILIMITADAS</span>
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
            COMEÇAR TRIAL R$ 1,99 POR 7 DIAS
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
