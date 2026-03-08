"use client";

import { useState } from "react";
import { AlertCircle, TrendingUp, FileCheck, Mic, BookOpen, Search, RefreshCw, Zap, X, Check, Shield, LockOpen, CheckCircle2 } from 'lucide-react';
import { calculateProjectedScore } from '@/lib/helpers';
import './FreeAnalysisStage.css';

interface FreeAnalysisStageProps {
  previewData: any;
  onUpgrade: () => void;
  onTryAnother?: () => void;
}

function tokenizeForDiff(text: string) {
  return text.match(/\w+|[^\w\s]+|\s+/g) ?? [];
}

function normalizeDiffToken(token: string) {
  return token.trim().toLowerCase();
}

function renderOptimizedTextWithHighlights(currentText?: string, optimizedText?: string) {
  if (!optimizedText) {
    return "Exemplo não disponível";
  }

  const manualParts = optimizedText.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  const hasManualHighlights = manualParts.some((part) => part.startsWith("**") && part.endsWith("**"));

  if (hasManualHighlights) {
    return manualParts.map((part, index) => {
      const isHighlighted = part.startsWith("**") && part.endsWith("**");
      const content = isHighlighted ? part.slice(2, -2) : part;

      if (isHighlighted) {
        return (
          <span key={`optimized-highlight-${index}`} className="optimized-highlight">
            {content}
          </span>
        );
      }

      return <span key={`optimized-text-${index}`}>{content}</span>;
    });
  }

  const normalizedCurrent = (currentText ?? "").replace(/\*\*/g, "");
  const normalizedOptimized = optimizedText.replace(/\*\*/g, "");

  const currentTokens = tokenizeForDiff(normalizedCurrent);
  const optimizedTokens = tokenizeForDiff(normalizedOptimized);
  const currentNormalized = currentTokens.map(normalizeDiffToken);
  const optimizedNormalized = optimizedTokens.map(normalizeDiffToken);

  const lcsMatrix = Array.from({ length: currentTokens.length + 1 }, () =>
    Array(optimizedTokens.length + 1).fill(0)
  );

  for (let i = currentTokens.length - 1; i >= 0; i -= 1) {
    for (let j = optimizedTokens.length - 1; j >= 0; j -= 1) {
      if (currentNormalized[i] && currentNormalized[i] === optimizedNormalized[j]) {
        lcsMatrix[i][j] = lcsMatrix[i + 1][j + 1] + 1;
      } else {
        lcsMatrix[i][j] = Math.max(lcsMatrix[i + 1][j], lcsMatrix[i][j + 1]);
      }
    }
  }

  const segments: Array<{ text: string; highlighted: boolean }> = [];

  let i = 0;
  let j = 0;

  while (j < optimizedTokens.length) {
    const optimizedToken = optimizedTokens[j];
    const normalizedOptimizedToken = optimizedNormalized[j];

    const isWhitespace = normalizedOptimizedToken === "";
    const isMatch = i < currentTokens.length && normalizedCurrent[i] && normalizedCurrent[i] === normalizedOptimizedToken;

    if (isWhitespace || isMatch) {
      if (isMatch) {
        i += 1;
      }

      const previous = segments[segments.length - 1];
      if (previous && previous.highlighted === false) {
        previous.text += optimizedToken;
      } else {
        segments.push({ text: optimizedToken, highlighted: false });
      }

      j += 1;
      continue;
    }

    const shouldSkipCurrent = i < currentTokens.length && lcsMatrix[i + 1][j] >= lcsMatrix[i][j + 1];

    if (shouldSkipCurrent) {
      i += 1;
      continue;
    }

    const previous = segments[segments.length - 1];
    if (previous && previous.highlighted === true) {
      previous.text += optimizedToken;
    } else {
      segments.push({ text: optimizedToken, highlighted: true });
    }

    j += 1;
  }

  // Filter out highlights that are too small (less than 3 meaningful tokens)
  const MIN_HIGHLIGHT_TOKENS = 3;
  const filteredSegments = segments.map(segment => {
    if (!segment.highlighted) return segment;

    // Count meaningful tokens (non-whitespace, non-punctuation)
    const meaningfulTokens = segment.text.match(/\w+/g) || [];

    if (meaningfulTokens.length < MIN_HIGHLIGHT_TOKENS) {
      return { text: segment.text, highlighted: false };
    }

    return segment;
  });

  // Merge consecutive non-highlighted segments
  const mergedSegments: Array<{ text: string; highlighted: boolean }> = [];
  for (const segment of filteredSegments) {
    const last = mergedSegments[mergedSegments.length - 1];
    if (last && last.highlighted === segment.highlighted) {
      last.text += segment.text;
    } else {
      mergedSegments.push({ ...segment });
    }
  }

  return mergedSegments.map((segment, index) => {
    if (segment.highlighted) {
      return (
        <span key={`optimized-auto-highlight-${index}`} className="optimized-highlight">
          {segment.text}
        </span>
      );
    }

    return <span key={`optimized-auto-text-${index}`}>{segment.text}</span>;
  });
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
  // FILTRO CRÍTICO: Só mostrar problemas com exemplos completos
  const allProblems = [];
  if (previewData?.gap_1) allProblems.push(previewData.gap_1);
  if (previewData?.gap_2) allProblems.push(previewData.gap_2);

  // Filtrar apenas problemas que tenham AMBOS os exemplos preenchidos
  const problems = allProblems.filter((problem: any) => {
    const hasCurrentExample = problem.exemplo_atual &&
      typeof problem.exemplo_atual === 'string' &&
      problem.exemplo_atual.trim().length > 0;
    const hasOptimizedExample = problem.exemplo_otimizado &&
      typeof problem.exemplo_otimizado === 'string' &&
      problem.exemplo_otimizado.trim().length > 0;
    return hasCurrentExample && hasOptimizedExample;
  });

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

  // Debug: Log breakdown data
  console.log('🔍 Score Breakdown Debug:', {
    score,
    gapsCount,
    formatoAts,
    keywords,
    impacto,
    projected,
    breakdownLength: projected.breakdown?.length || 0
  });

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

  const explanationTone = score < 50
    ? {
      label: 'Crítico',
      color: '#f87171',
      background: 'rgba(239,68,68,0.12)',
      border: '1px solid rgba(239,68,68,0.22)',
      text: 'Seu CV está sendo rejeitado automaticamente pela maioria dos sistemas ATS. Com a versão PRO, você recebe o CV otimizado pronto que pode aumentar suas chances em até 3x.'
    }
    : score < 70
      ? {
        label: 'Atenção',
        color: '#60a5fa',
        background: 'rgba(96,165,250,0.12)',
        border: '1px solid rgba(96,165,250,0.22)',
        text: `Seu CV passa em alguns filtros ATS, mas perde oportunidades. A versão PRO entrega o CV reformulado para alcançar o ${projected.percentile}.`
      }
      : score < 80
        ? {
          label: 'Em evolução',
          color: '#fbbf24',
          background: 'rgba(251,191,36,0.12)',
          border: '1px solid rgba(251,191,36,0.22)',
          text: `Seu CV está no caminho certo. A versão PRO aplica ajustes estratégicos para alcançar o ${projected.percentile} e se destacar da concorrência.`
        }
        : score < 90
          ? {
            label: 'Competitivo',
            color: '#34d399',
            background: 'rgba(52,211,153,0.12)',
            border: '1px solid rgba(52,211,153,0.22)',
            text: `Seu CV está competitivo. A versão PRO faz pequenas otimizações que te colocam no ${projected.percentile} e maximizam suas oportunidades.`
          }
          : {
            label: 'Destaque',
            color: '#c4b5fd',
            background: 'rgba(196,181,253,0.12)',
            border: '1px solid rgba(196,181,253,0.22)',
            text: `Excelente. A versão PRO aplica ajustes finais para te levar ao ${projected.percentile} e garantir destaque máximo.`
          };

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
            <div className="free-badge" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Zap size={13} color="#f8fafc" />
              ANÁLISE GRATUITA
            </div>
          </div>
        </div>

        {/* Cards de Evolução de Score - Lado a Lado com Seta */}
        <div className="vant-mb-12 vant-animate-fade" style={{ animationDelay: '0.1s' }}>
          <div className="vant-glass-dark" style={{ padding: '2.5rem' }}>
            <h2 className="vant-h2 vant-mb-8" style={{ textAlign: 'center' }}>Evolução do Seu Score</h2>

            <div className="vant-flex vant-items-center vant-gap-6" style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
              {/* Score Atual */}
              <div style={{ textAlign: 'center', minWidth: '160px' }}>
                <div className="vant-text-sm vant-text-support" style={{ textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>Score Atual</div>
                <div style={{ fontSize: '4.5rem', fontWeight: 700, color: currentScoreColors.primary, lineHeight: 1, marginBottom: '0.4rem', letterSpacing: '-0.02em' }}>{score}</div>
                <div className="vant-text-xs vant-text-support">de 100 pontos</div>
                <div style={{ marginTop: '0.6rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.25rem 0.6rem', background: currentScoreColors.primary + '22', border: '1px solid ' + currentScoreColors.primary + '44', borderRadius: '99px' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: currentScoreColors.primary, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{currentScoreColors.label}</span>
                </div>
              </div>

              {/* Seta SVG Animada */}
              <div className="arrow-animated" style={{ display: 'flex', alignItems: 'center' }}>
                <svg width="48" height="24" viewBox="0 0 48 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="arrowGrad" x1="0" y1="0" x2="48" y2="0" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                  </defs>
                  <path d="M0 12 H38 M30 4 L38 12 L30 20" stroke="url(#arrowGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              {/* Score Projetado */}
              <div style={{ textAlign: 'center', minWidth: '160px' }}>
                <div className="vant-text-sm vant-text-support" style={{ textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>Com PRO</div>
                <div style={{ fontSize: '4.5rem', fontWeight: 700, background: 'linear-gradient(to right, #34d399, #2dd4bf)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1, marginBottom: '0.4rem', letterSpacing: '-0.02em' }}>
                  {projected.score}
                </div>
                <div className="vant-text-xs vant-text-support">+{projected.improvement} pontos</div>
                <div style={{ marginTop: '0.6rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.25rem 0.6rem', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.35)', borderRadius: '99px' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Projetado</span>
                </div>
              </div>
            </div>

            {/* Breakdown de Pontos - Como chegamos no score projetado */}
            {projected.breakdown && projected.breakdown.length > 0 && (
              <div style={{ textAlign: 'center', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '1rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Como calculamos +{projected.improvement} pontos
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center', maxWidth: '700px', margin: '0 auto' }}>
                  {projected.breakdown.map((item, index) => (
                    <div
                      key={index}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 1rem',
                        background: 'rgba(16, 185, 129, 0.08)',
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        color: '#cbd5e1'
                      }}
                    >
                      <span style={{ fontWeight: 700, color: '#34d399', fontSize: '1rem' }}>+{item.points}</span>
                      <span style={{ color: '#e2e8f0' }}>{item.label}</span>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', marginLeft: '0.25rem' }}>({item.description})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Badge de Percentil */}
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', background: 'rgba(16, 185, 129, 0.15)', borderRadius: '99px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                <TrendingUp size={20} color="#34d399" />
                <span style={{ color: '#86efac', fontSize: '1rem', fontWeight: 600 }}>Alcance o {projected.percentile} dos candidatos</span>
              </div>
            </div>

            {/* Explicação */}
            <div style={{ margin: '1.5rem auto 0', maxWidth: '640px', textAlign: 'center' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', padding: '0.45rem 0.8rem', borderRadius: '99px', background: explanationTone.background, border: explanationTone.border, marginBottom: '0.85rem' }}>
                <span style={{ width: '0.45rem', height: '0.45rem', borderRadius: '99px', background: explanationTone.color, boxShadow: `0 0 0 4px ${explanationTone.background}` }} />
                <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: explanationTone.color }}>
                  {explanationTone.label}
                </span>
              </div>

              <p className="vant-text-sm vant-text-support" style={{ lineHeight: 1.7, margin: 0 }}>
                {explanationTone.text}
              </p>
            </div>
          </div>
        </div>

        {/* Grid de Diagnóstico e Problemas */}
        <div className="vant-diagnostic-wrapper vant-mb-12 vant-animate-fade" style={{ animationDelay: '0.2s' }}>
          <div style={{ marginBottom: '1.75rem' }}>
            <h3 className="vant-h3" style={{ fontSize: '1.35rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.5rem', letterSpacing: '-0.01em' }}>Diagnóstico Detalhado</h3>
            <p style={{ fontSize: '0.95rem', color: '#cbd5e1', margin: 0, lineHeight: 1.6 }}>Veja onde seu currículo perde força hoje</p>
          </div>

          <div className={`vant-grid-${problems.length > 0 ? '2' : '1'}`}>
            {/* Barras de Progresso dos Pilares */}
            <div>

              {[{ label: 'Impacto', value: impacto }, { label: 'Palavras-chave', value: keywords }, { label: 'Formato ATS', value: formatoAts }].map(({ label, value }) => {
                const barColor = value >= 70 ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)' : value >= 50 ? 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)' : 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)';
                const textColor = value >= 70 ? '#34d399' : value >= 50 ? '#fbbf24' : '#f87171';
                const statusLabel = value >= 70 ? 'Bom' : value >= 50 ? 'Atenção' : 'Crítico';
                return (
                  <div key={label} style={{ marginBottom: '1.1rem' }}>
                    <div className="vant-flex vant-items-center" style={{ alignItems: 'center', gap: '1rem' }}>
                      <span className="vant-text-sm vant-font-medium" style={{ color: '#e2e8f0', fontSize: '0.9rem', minWidth: '135px' }}>{label}</span>
                      <div style={{ flex: 1, height: '0.5rem', background: 'rgba(255,255,255,0.08)', borderRadius: '99px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${value}%`, background: barColor, borderRadius: '99px', transition: 'width 0.8s ease' }} />
                      </div>
                      <span className="vant-text-sm vant-font-medium" style={{ color: textColor, fontWeight: 700, fontSize: '0.95rem', minWidth: '45px', textAlign: 'right' }}>{value}%</span>
                      <span className="bar-status-label" style={{ color: textColor, fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', minWidth: '70px', textAlign: 'center' }}>{statusLabel}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Card Problemas - Só mostrar se houver problemas */}
            {problems.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {problems.map((p: any, i: number) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.85rem 1rem', background: 'rgba(127, 29, 29, 0.25)', borderRadius: '10px', border: '1px solid rgba(239, 68, 68, 0.3)', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f87171', background: 'rgba(239,68,68,0.15)', borderRadius: '99px', width: '1.4rem', height: '1.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '0.1rem' }}>{i + 1}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.9rem', color: '#fecaca', lineHeight: 1.5, fontWeight: 600 }}>{p.titulo || `Problema ${i + 1}`}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Análise Detalhada dos Problemas */}
        <div className="vant-glass-darker vant-mb-8 vant-animate-fade" style={{ animationDelay: '0.4s' }}>
          <h2 className="vant-h2 vant-mb-6">Análise Detalhada dos Problemas</h2>

          <div className="vant-text-slate-400" style={{ marginBottom: '1.5rem', fontSize: '0.95rem', lineHeight: 1.7 }}>
            Nossa IA identificou <strong style={{ color: '#38bdf8' }}>alguns pontos de melhoria</strong> que, corrigidos, aumentam suas chances de passar pelos filtros ATS e chamar a atenção de recrutadores. Abaixo você vê <strong style={{ color: '#38bdf8' }}>uma amostra</strong> de como seu CV está agora e como ficaria após a otimização. Na versão PRO, você recebe a análise completa com todas as correções prontas para aplicar.
          </div>

          {problems.length > 0 ? (
            <>
              {visibleProblems.map((problem: any, idx: number) => (
                <div key={idx} className="problem-analysis vant-mb-6">
                  {/* Header do problema com número e título */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem' }}>
                    <span className="problem-number-badge">{idx + 1}</span>
                    <div>
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Problema</div>
                      {problem.titulo && (
                        <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f1f5f9', lineHeight: 1.3 }}>{problem.titulo}</div>
                      )}
                    </div>
                  </div>

                  <div className="vant-grid-2 vant-mb-4">
                    <div className="version-card-bad">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.6rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '1.1rem', height: '1.1rem', borderRadius: '99px', background: 'rgba(239,68,68,0.2)', flexShrink: 0 }}><X size={9} color="#f87171" strokeWidth={3} /></span>
                        <h4 style={{ fontSize: '0.72rem', fontWeight: 700, color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>Versão Atual</h4>
                      </div>
                      <div className="vant-text-white" style={{ fontSize: '0.9rem', lineHeight: 1.6, color: '#e2e8f0' }}>
                        {problem.exemplo_atual || "Exemplo não disponível"}
                      </div>
                    </div>
                    <div className="version-card-good">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.6rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '1.1rem', height: '1.1rem', borderRadius: '99px', background: 'rgba(16,185,129,0.2)', flexShrink: 0 }}><Check size={9} color="#34d399" strokeWidth={3} /></span>
                        <h4 style={{ fontSize: '0.72rem', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>Versão Otimizada</h4>
                      </div>
                      <div className="optimized-text">
                        {renderOptimizedTextWithHighlights(problem.exemplo_atual, problem.exemplo_otimizado)}
                      </div>
                    </div>
                  </div>

                  {/* Termos faltando como chips com fonte */}
                  {problem.termos_faltando && Array.isArray(problem.termos_faltando) && problem.termos_faltando.length > 0 && (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Termos ausentes no seu CV</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {problem.termos_faltando.map((item: any, termIdx: number) => {
                          // Suporta tanto formato antigo (string) quanto novo (objeto)
                          const termo = typeof item === 'string' ? item : item.termo;
                          const frequencia = typeof item === 'object' && item.frequencia ? item.frequencia : null;

                          return (
                            <div key={termIdx} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                              <span className="term-chip" style={{ alignSelf: 'flex-start' }}>{termo}</span>
                              {frequencia && (
                                <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontStyle: 'italic', paddingLeft: '0.5rem' }}>
                                  {frequencia}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.6, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.75rem' }}>
                    {problem.impacto || "Impacto não especificado"}
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="vant-text-slate-400" style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                <CheckCircle2 size={48} color="#10b981" strokeWidth={1.5} />
              </div>
              <div>Nenhum problema crítico detectado em seu currículo!</div>
            </div>
          )}
        </div>

        {/* Benefícios Detalhados - Focado em Resultados */}
        <div className="vant-glass-dark vant-mb-8 vant-animate-fade" style={{ animationDelay: '0.6s' }}>
          <h2 className="vant-h2" style={{ marginBottom: '0.4rem' }}>O que você desbloqueia com o PRO</h2>
          <p style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: '1.5rem' }}>Um sistema completo do CV à entrevista.</p>

          <div className="benefits-grid">
            {([
              { icon: <FileCheck size={20} color="#38bdf8" />, bg: 'rgba(56,189,248,0.15)', title: 'CV otimizado pronto para usar', desc: 'Currículo reescrito com palavras-chave, estrutura ATS e linguagem de impacto. Download em PDF e Word.' },
              { icon: <Mic size={20} color="#a78bfa" />, bg: 'rgba(167,139,250,0.15)', title: 'Simulador de entrevistas com IA', desc: 'Pratica perguntas comportamentais e técnicas. Recebe feedback detalhado e chegue preparado.' },
              { icon: <BookOpen size={20} color="#fb923c" />, bg: 'rgba(251,146,60,0.15)', title: 'Biblioteca personalizada', desc: 'Cursos, livros e recursos recomendados especificamente para sua área e nível.' },
              { icon: <Search size={20} color="#f87171" />, bg: 'rgba(248,113,113,0.15)', title: 'Análise completa de todos os problemas', desc: 'Veja todos os gaps identificados com exemplos reais de como corrigir cada um.' },
              { icon: <RefreshCw size={20} color="#34d399" />, bg: 'rgba(52,211,153,0.15)', title: 'Múltiplas otimizações', desc: 'Adapte seu CV para diferentes vagas e acompanhe a evolução do score ao longo do tempo.' }
            ] as Array<{ icon: React.ReactNode; bg: string; title: string; desc: string }>).map((benefit, idx) => (
              <div key={idx} className="benefit-card">
                <div className="vant-flex vant-gap-4" style={{ alignItems: 'flex-start' }}>
                  <div className="benefit-icon-box" style={{ background: benefit.bg }}>
                    {benefit.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 className="vant-text-white" style={{ marginBottom: '0.5rem', fontSize: '1rem', fontWeight: 600, lineHeight: 1.3 }}>
                      {benefit.title}
                    </h3>
                    <p className="vant-text-support" style={{ fontSize: '0.875rem', lineHeight: 1.6, margin: 0 }}>
                      {benefit.desc}
                    </p>
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
              <div style={{ marginBottom: '0.75rem', display: 'flex', justifyContent: 'center' }}>
                <div style={{ width: '3rem', height: '3rem', borderRadius: '99px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <LockOpen size={22} color="#34d399" />
                </div>
              </div>
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
              Análise gratuita utilizada
            </div>
            <div className="vant-text-support vant-text-sm">
              Faça upgrade para continuar otimizando
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
            <div className="vant-text-support vant-text-sm">
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
          <h2 className="vant-h2" style={{ marginBottom: '0.4rem' }}>
            Alcance o Score {projected.score}/100 e entre no {projected.percentile}
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1.5rem' }}>Baseado nos problemas identificados no seu currículo</p>

          {/* Preço */}
          <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '12px', padding: '1.25rem 1.5rem', maxWidth: '420px', margin: '0 auto 1.5rem' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f8fafc', lineHeight: 1 }}>R$ 1,99</div>
            <div style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600, marginTop: '0.2rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Trial de 7 dias</div>
            <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Depois, apenas <strong style={{ color: '#cbd5e1' }}>R$ 19,90/mês</strong> • Cancele quando quiser</div>
          </div>

          {/* Checklist left-aligned */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <div className="cta-checklist">
              {[
                'Análise completa de todos os problemas',
                'CV otimizado para download (PDF + Word)',
                'Simulador de entrevistas com IA',
                'Biblioteca de recursos personalizados'
              ].map((item) => (
                <div key={item} className="cta-checklist-item">
                  <span className="cta-check-icon">✓</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <button className="vant-btn-primary vant-cta-button" onClick={onUpgrade} style={{ margin: '0 auto', display: 'flex', fontSize: '1rem', padding: '0.9rem 2.5rem' }}>
            Começar teste por R$ 1,99
          </button>

          <div style={{ textAlign: 'center', marginTop: '0.6rem', fontSize: '0.82rem', color: '#475569' }}>
            ou escolha o plano mensal/anual
          </div>

          {/* Garantia em destaque */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.25rem', padding: '0.6rem 1.25rem', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '99px' }}>
            <Shield size={15} color="#34d399" />
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#34d399' }}>Garantia de 7 dias — dinheiro de volta sem burocracia</span>
          </div>
        </div>
      </div>

    </div >
  );
}
