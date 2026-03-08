"use client";

import { useState, useEffect } from "react";
import { AlertCircle, TrendingUp, FileCheck, Mic, BookOpen, Search, RefreshCw, Zap, X, Check, Shield, LockOpen, CheckCircle2 } from 'lucide-react';
import { calculateProjectedScore } from '@/lib/helpers';
import { renderOptimizedTextWithHighlights } from '@/lib/diffHighlight';
import { PreviewData } from '@/types';
import './FreeAnalysisStage.css';

type Gap = NonNullable<PreviewData['gap_1']>;

interface FreeAnalysisStageProps {
  previewData: PreviewData;
  onUpgrade: () => void;
  onTryAnother?: () => void;
}

// Função helper para gerar preview de pergunta do simulador baseado no setor e gaps
function generateInterviewQuestionPreview(gap1?: Gap, setor?: string): { pergunta: string; dica: string } | null {
  const setorLower = (setor || '').toLowerCase();
  const gap1Titulo = (gap1?.titulo || '').toLowerCase();
  const gap1Exemplo = (gap1?.exemplo_atual || '').toLowerCase();

  // Extrair contexto específico do gap para personalizar pergunta
  let contextoEspecifico = '';

  // Perguntas para Tecnologia/TI/Dev
  if (setorLower.includes('tecnologia') || setorLower.includes('ti') || setorLower.includes('dev') || setorLower.includes('software')) {
    // Se gap menciona falta de métricas/quantificação
    if (gap1Titulo.includes('métrica') || gap1Titulo.includes('quantif') || gap1Titulo.includes('resultado')) {
      return {
        pergunta: `Vejo que você trabalhou com ${gap1Exemplo.includes('desenvolvimento') ? 'desenvolvimento de software' : gap1Exemplo.includes('suporte') ? 'suporte técnico' : 'projetos de tecnologia'}. Como você mede o sucesso das suas entregas? Pode dar um exemplo específico com números?`,
        dica: 'Sua resposta deve incluir métricas concretas (ex: "reduzi tempo de resposta em 40%" ou "aumentei cobertura de testes para 85%"). Recrutadores querem ver impacto quantificável.'
      };
    }
    // Se gap menciona falta de tecnologias/ferramentas
    if (gap1Titulo.includes('tecnologia') || gap1Titulo.includes('ferramenta') || gap1Titulo.includes('stack')) {
      return {
        pergunta: `Notei que sua experiência menciona ${gap1Exemplo.substring(0, 50)}... Quais tecnologias você domina e como as aplicou para resolver problemas reais? Dê um exemplo técnico específico.`,
        dica: 'Seja específico sobre tecnologias e mostre profundidade. Não liste apenas ferramentas - explique COMO e POR QUE as usou em situações reais.'
      };
    }
    // Pergunta técnica genérica mas contextualizada
    return {
      pergunta: `Baseado na sua experiência em ${setor}, conte sobre um bug crítico ou problema técnico complexo que você resolveu. Qual foi sua abordagem e o resultado?`,
      dica: 'Estruture usando: Contexto → Desafio técnico → Sua solução → Impacto. Recrutadores técnicos avaliam seu raciocínio, não só o resultado.'
    };
  }

  // Perguntas para Dados/Analytics
  if (setorLower.includes('dados') || setorLower.includes('data') || setorLower.includes('analytics')) {
    if (gap1Titulo.includes('métrica') || gap1Titulo.includes('resultado')) {
      return {
        pergunta: `Vi que você trabalha com análise de dados. Conte sobre uma vez que seus insights levaram a uma decisão de negócio importante. Qual foi o impacto mensurável?`,
        dica: 'Recrutadores querem ver: Problema de negócio → Sua análise → Recomendação → Resultado (com números). Mostre que você traduz dados em valor.'
      };
    }
    return {
      pergunta: `Na sua experiência com ${setor}, como você lida quando seus dados contradizem a intuição dos stakeholders? Dê um exemplo real.`,
      dica: 'Demonstre habilidade de comunicação e influência baseada em dados. Mostre que você sabe navegar política organizacional com evidências.'
    };
  }

  // Perguntas para Marketing/Vendas
  if (setorLower.includes('marketing') || setorLower.includes('vendas') || setorLower.includes('comercial')) {
    if (gap1Titulo.includes('métrica') || gap1Titulo.includes('resultado') || gap1Titulo.includes('número')) {
      return {
        pergunta: `Vejo sua experiência em ${setor}. Qual foi sua melhor campanha/estratégia? Quais foram os números antes e depois da sua atuação?`,
        dica: 'Seja específico: "Aumentei conversão de X% para Y%, gerando R$ Z em receita". Recrutadores querem ver ROI claro, não apenas atividades.'
      };
    }
    return {
      pergunta: `Na sua trajetória em ${setor}, conte sobre uma meta agressiva que você bateu (ou não bateu). O que você fez diferente?`,
      dica: 'Honestidade sobre desafios + aprendizados impressiona mais que histórias perfeitas. Mostre resiliência e adaptação.'
    };
  }

  // Perguntas para Produto/UX
  if (setorLower.includes('produto') || setorLower.includes('ux') || setorLower.includes('design')) {
    return {
      pergunta: `Baseado na sua experiência, conte sobre uma feature que você priorizou contra a opinião de stakeholders importantes. Como você decidiu e qual foi o resultado?`,
      dica: 'Mostre que você toma decisões baseadas em dados e usuários, não em opinião. Recrutadores querem ver liderança e pensamento estratégico.'
    };
  }

  // Pergunta contextualizada (fallback) - usa o gap detectado
  if (gap1Titulo) {
    return {
      pergunta: `Notei que seu CV menciona ${gap1Exemplo.substring(0, 60)}... Como você lidou com o desafio mais difícil nessa experiência? Qual foi o resultado concreto?`,
      dica: 'Use o método STAR: Situação específica → Tarefa/desafio → Ações que VOCÊ tomou → Resultados mensuráveis. Seja específico e honesto.'
    };
  }

  // Fallback final
  return {
    pergunta: `Baseado na sua experiência em ${setor || 'sua área'}, conte sobre uma situação onde você teve que tomar uma decisão difícil com informações incompletas. Como você abordou?`,
    dica: 'Recrutadores avaliam seu processo de tomada de decisão e capacidade de lidar com ambiguidade. Mostre raciocínio estruturado.'
  };
}

// Função helper para gerar preview de livros da biblioteca baseado nos gaps e setor
function generateLibraryPreview(gap1?: Gap, gap2?: Gap, setor?: string): Array<{ titulo: string; autor: string; motivo: string }> {
  const livros: Array<{ titulo: string; autor: string; motivo: string }> = [];

  // Determinar setor para escolher livros relevantes
  const setorLower = (setor || '').toLowerCase();

  // Livros para Tecnologia/TI/Dev
  if (setorLower.includes('tecnologia') || setorLower.includes('ti') || setorLower.includes('dev') || setorLower.includes('software')) {
    livros.push({
      titulo: 'Clean Code',
      autor: 'Robert C. Martin',
      motivo: 'Essencial para qualidade de código e boas práticas'
    });
    if (gap1?.titulo && gap1.titulo.toLowerCase().includes('arquitetura')) {
      livros.push({
        titulo: 'Design Patterns',
        autor: 'Gang of Four',
        motivo: `Baseado no gap: ${gap1.titulo}`
      });
    } else {
      livros.push({
        titulo: 'The Pragmatic Programmer',
        autor: 'Andrew Hunt & David Thomas',
        motivo: 'Fundamentos para desenvolvedores profissionais'
      });
    }
  }
  // Livros para Dados/Analytics
  else if (setorLower.includes('dados') || setorLower.includes('data') || setorLower.includes('analytics')) {
    livros.push({
      titulo: 'Storytelling com Dados',
      autor: 'Cole Nussbaumer Knaflic',
      motivo: 'Comunicação eficaz de insights e análises'
    });
    livros.push({
      titulo: 'Python for Data Analysis',
      autor: 'Wes McKinney',
      motivo: 'Ferramentas essenciais para análise de dados'
    });
  }
  // Livros para Marketing/Vendas
  else if (setorLower.includes('marketing') || setorLower.includes('growth') || setorLower.includes('vendas') || setorLower.includes('comercial')) {
    livros.push({
      titulo: 'Hacking Growth',
      autor: 'Sean Ellis',
      motivo: 'Metodologia de crescimento usada por startups unicórnio'
    });
    livros.push({
      titulo: 'Influence: The Psychology of Persuasion',
      autor: 'Robert Cialdini',
      motivo: 'Fundamentos de persuasão e influência'
    });
  }
  // Livros para Financeiro/Corporativo
  else if (setorLower.includes('financeiro') || setorLower.includes('finance') || setorLower.includes('contab') || setorLower.includes('corp')) {
    livros.push({
      titulo: 'Valuation',
      autor: 'McKinsey & Company',
      motivo: 'Referência mundial em avaliação de empresas'
    });
    livros.push({
      titulo: 'Financial Intelligence',
      autor: 'Karen Berman',
      motivo: 'Essencial para entender demonstrativos financeiros'
    });
  }
  // Livros para RH/Liderança
  else if (setorLower.includes('rh') || setorLower.includes('recursos humanos') || setorLower.includes('liderança') || setorLower.includes('people')) {
    livros.push({
      titulo: 'Radical Candor',
      autor: 'Kim Scott',
      motivo: 'Feedback eficaz e gestão de pessoas'
    });
    livros.push({
      titulo: 'The Five Dysfunctions of a Team',
      autor: 'Patrick Lencioni',
      motivo: 'Construção de equipes de alto desempenho'
    });
  }
  // Livros para Produto/UX
  else if (setorLower.includes('produto') || setorLower.includes('ux') || setorLower.includes('design')) {
    livros.push({
      titulo: 'The Lean Startup',
      autor: 'Eric Ries',
      motivo: 'Metodologia essencial para desenvolvimento de produtos'
    });
    livros.push({
      titulo: "Don't Make Me Think",
      autor: 'Steve Krug',
      motivo: 'Princípios fundamentais de usabilidade'
    });
  }
  // Livros genéricos/profissionais (fallback)
  else {
    livros.push({
      titulo: 'Deep Work',
      autor: 'Cal Newport',
      motivo: 'Produtividade e foco em trabalho de alto valor'
    });
    livros.push({
      titulo: 'Atomic Habits',
      autor: 'James Clear',
      motivo: 'Construção de hábitos profissionais eficazes'
    });
  }

  return livros.slice(0, 2); // Máximo 2 livros
}

export function FreeAnalysisStage({ previewData, onUpgrade, onTryAnother }: FreeAnalysisStageProps) {
  const [showAllProblems, setShowAllProblems] = useState(false);
  const [scrollTrigger, setScrollTrigger] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detectar mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Edge Case 1: Skeleton loader se previewData null/undefined
  if (!previewData) {
    return (
      <div className="vant-premium-wrapper">
        <div className="vant-container">
          <div className="vant-skeleton-loader">
            <div className="vant-skeleton-header" />
            <div className="vant-skeleton-card" />
            <div className="vant-skeleton-card" />
            <div className="vant-skeleton-card" />
          </div>
        </div>
      </div>
    );
  }

  const benefits = [
    { icon: <FileCheck size={isMobile ? 18 : 20} color="#38bdf8" />, bg: 'rgba(56,189,248,0.15)', title: 'CV otimizado pronto para usar', desc: 'Currículo reescrito com palavras-chave, estrutura ATS e linguagem de impacto. Download em PDF e Word.' },
    { icon: <Mic size={isMobile ? 18 : 20} color="#a78bfa" />, bg: 'rgba(167,139,250,0.15)', title: 'Simulador de entrevistas com IA', desc: 'Pratica perguntas comportamentais e técnicas. Recebe feedback detalhado e chegue preparado.' },
    { icon: <BookOpen size={isMobile ? 18 : 20} color="#fb923c" />, bg: 'rgba(251,146,60,0.15)', title: 'Biblioteca personalizada', desc: 'Cursos, livros e recursos recomendados especificamente para sua área e nível.' },
    { icon: <Search size={isMobile ? 18 : 20} color="#f87171" />, bg: 'rgba(248,113,113,0.15)', title: 'Análise completa de todos os problemas', desc: 'Veja todos os gaps identificados com exemplos reais de como corrigir cada um.' },
    { icon: <RefreshCw size={isMobile ? 18 : 20} color="#34d399" />, bg: 'rgba(52,211,153,0.15)', title: 'Múltiplas otimizações', desc: 'Adapte seu CV para diferentes vagas e acompanhe a evolução do score ao longo do tempo.' }
  ];

  // Hook para detectar scroll em 60% da página
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + window.innerHeight;
      const pageHeight = document.documentElement.scrollHeight;
      const scrollPercentage = (scrollPosition / pageHeight) * 100;

      setScrollTrigger(scrollPercentage >= 30);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Verificar posição inicial

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
  const problems = allProblems.filter((problem: Gap) => {
    const hasCurrentExample = problem.exemplo_atual &&
      typeof problem.exemplo_atual === 'string' &&
      problem.exemplo_atual.trim().length > 0;
    const hasOptimizedExample = problem.exemplo_otimizado &&
      typeof problem.exemplo_otimizado === 'string' &&
      problem.exemplo_otimizado.trim().length > 0;
    return hasCurrentExample && hasOptimizedExample;
  });

  const visibleProblems = showAllProblems ? problems : problems.slice(0, 2);
  const hiddenCount = Math.max(0, problems.length - 2);

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


  // Edge Cases 2 e 3: Flags de controle
  const isPerfectScore = problems.length === 0 && score >= 85;
  const hasNoImprovement = projected.score === score;

  // Usar biblioteca do backend (vazia no preview gratuito, mas preparado para futuro)
  // Por enquanto, gerar localmente mas isso será substituído por dados do backend
  const libraryPreview = generateLibraryPreview(
    previewData?.gap_1,
    previewData?.gap_2,
    previewData?.analise_por_pilares?.setor_detectado as string | undefined
  );

  // Usar pergunta do backend (gerada com IA)
  const interviewQuestion = previewData?.pergunta_preview;

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
        <div className="vant-flex vant-justify-between vant-items-center vant-mb-12 vant-animate-fade" style={isMobile ? { flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem' } : undefined}>
          <div style={isMobile ? { width: '100%', minWidth: 0 } : undefined}>
            <h1 className="vant-title-xl" style={isMobile ? { fontSize: '1.35rem', lineHeight: '1.04', letterSpacing: '-0.02em' } : undefined}>Seu Diagnóstico</h1>
            <div style={isMobile ? { display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' } : undefined}>
              <p className="vant-subtitle" style={isMobile ? { margin: 0 } : undefined}>Análise gratuita do seu currículo</p>
              {isMobile && (
                <div className="free-badge" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Zap size={12} color="#d1fae5" />
                  ANÁLISE GRATUITA
                </div>
              )}
            </div>
          </div>
          {!isMobile && (
            <div className="vant-badge-credits">
              <div className="free-badge" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Zap size={13} color="#f8fafc" />
                ANÁLISE GRATUITA
              </div>
            </div>
          )}
        </div>

        {/* Cards de Evolução de Score - Lado a Lado com Seta */}
        <div className="vant-mb-12 vant-animate-fade" style={{ animationDelay: '0.1s' }}>
          <div className={`vant-glass-dark ${isMobile ? 'vant-score-mobile-compact' : ''}`} style={{ padding: isMobile ? '1.25rem' : '2.5rem' }}>
            <h2 className="vant-h2 vant-mb-8" style={{ textAlign: 'center', fontSize: isMobile ? '1.15rem' : undefined, marginBottom: isMobile ? '1rem' : undefined }}>Evolução do Seu Score</h2>

            <div className="vant-flex vant-items-center vant-gap-6" style={isMobile ? { justifyContent: 'center', flexWrap: 'nowrap', flexDirection: 'column', gap: '1rem' } : { justifyContent: 'center', flexWrap: 'wrap' }}>
              {/* Score Atual */}
              <div style={{ textAlign: 'center', minWidth: isMobile ? 'auto' : '160px', width: isMobile ? '100%' : undefined }}>
                <div className="vant-text-sm vant-text-support" style={{ textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: isMobile ? '0.3rem' : '0.75rem', fontSize: isMobile ? '0.7rem' : undefined }}>Score Atual</div>
                <div className={isMobile ? 'vant-score-number-mobile' : ''} style={{ fontSize: isMobile ? '2.25rem' : '4.5rem', fontWeight: 700, color: currentScoreColors.primary, lineHeight: 1, marginBottom: isMobile ? '0.25rem' : '0.4rem', letterSpacing: '-0.02em' }}>{score}</div>
                <div className="vant-text-xs vant-text-support" style={{ fontSize: isMobile ? '0.7rem' : undefined }}>de 100 pontos</div>
                <div style={{ marginTop: isMobile ? '0.4rem' : '0.6rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: isMobile ? '0.2rem 0.5rem' : '0.25rem 0.6rem', background: currentScoreColors.primary + '22', border: '1px solid ' + currentScoreColors.primary + '44', borderRadius: '99px' }}>
                  <span style={{ fontSize: isMobile ? '0.65rem' : '0.72rem', fontWeight: 700, color: currentScoreColors.primary, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{currentScoreColors.label}</span>
                </div>
              </div>

              {/* Seta SVG Animada - Só mostrar se houver melhoria E scores diferentes */}
              {projected.improvement > 0 && !hasNoImprovement && (
                <div className="arrow-animated" style={{ display: 'flex', alignItems: 'center' }}>
                  <svg width={isMobile ? 28 : 48} height={isMobile ? 14 : 24} viewBox="0 0 48 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <linearGradient id="arrowGrad" x1="0" y1="0" x2="48" y2="0" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#10b981" />
                      </linearGradient>
                    </defs>
                    <path d="M0 12 H38 M30 4 L38 12 L30 20" stroke="url(#arrowGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}

              {/* Score Projetado - Só mostrar se houver melhoria E scores diferentes */}
              {projected.improvement > 0 && !hasNoImprovement && (
                <div style={{ textAlign: 'center', minWidth: isMobile ? 'auto' : '160px', width: isMobile ? '100%' : undefined }}>
                  <div className="vant-text-sm vant-text-support" style={{ textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: isMobile ? '0.3rem' : '0.75rem', fontSize: isMobile ? '0.7rem' : undefined }}>Com PRO</div>
                  <div style={{ fontSize: isMobile ? '2.25rem' : '4.5rem', fontWeight: 700, background: 'linear-gradient(to right, #34d399, #2dd4bf)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1, marginBottom: isMobile ? '0.25rem' : '0.4rem', letterSpacing: '-0.02em' }}>
                    {projected.score}
                  </div>
                  <div className="vant-text-xs vant-text-support" style={{ fontSize: isMobile ? '0.7rem' : undefined }}>+{projected.improvement} pontos</div>
                  <div style={{ marginTop: isMobile ? '0.4rem' : '0.6rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: isMobile ? '0.2rem 0.5rem' : '0.25rem 0.6rem', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.35)', borderRadius: '99px' }}>
                    <span style={{ fontSize: isMobile ? '0.65rem' : '0.72rem', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Projetado</span>
                  </div>
                </div>
              )}
            </div>

            {/* Breakdown de Pontos - Escondido no mobile para economizar espaço */}
            {!isMobile && !hasNoImprovement && projected.improvement > 0 && projected.breakdown && projected.breakdown.length > 0 && (
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
            <div style={{ textAlign: 'center', marginTop: isMobile ? '0.75rem' : '2rem' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: isMobile ? '0.3rem' : '0.4rem', padding: isMobile ? '0.4rem 0.75rem' : '0.75rem 1.5rem', background: 'rgba(16, 185, 129, 0.15)', borderRadius: '99px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                <TrendingUp size={isMobile ? 14 : 20} color="#34d399" />
                <span style={{ color: '#86efac', fontSize: isMobile ? '0.75rem' : '1rem', fontWeight: 600 }}>Alcance o {projected.percentile} dos candidatos</span>
              </div>
            </div>

            {/* Explicação */}
            <div style={{ margin: isMobile ? '0.6rem auto 0' : '1.5rem auto 0', maxWidth: '640px', textAlign: 'center' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: isMobile ? '0.3rem' : '0.45rem', padding: isMobile ? '0.35rem 0.65rem' : '0.45rem 0.8rem', borderRadius: '99px', background: explanationTone.background, border: explanationTone.border, marginBottom: isMobile ? '0.5rem' : '0.85rem' }}>
                <span style={{ width: isMobile ? '0.35rem' : '0.45rem', height: isMobile ? '0.35rem' : '0.45rem', borderRadius: '99px', background: explanationTone.color, boxShadow: `0 0 0 4px ${explanationTone.background}` }} />
                <span style={{ fontSize: isMobile ? '0.65rem' : '0.72rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: explanationTone.color }}>
                  {explanationTone.label}
                </span>
              </div>

              <p className="vant-text-sm vant-text-support" style={{ lineHeight: isMobile ? 1.5 : 1.7, margin: 0, fontSize: isMobile ? '0.8rem' : undefined }}>
                {explanationTone.text}
              </p>
            </div>
          </div>
        </div>

        {/* Grid de Diagnóstico e Problemas */}
        <div className="vant-diagnostic-wrapper vant-mb-12 vant-animate-fade" style={{ animationDelay: '0.2s' }}>
          <div style={{ marginBottom: isMobile ? '1rem' : '1.75rem' }}>
            <h3 className="vant-h3" style={{ fontSize: isMobile ? '1.1rem' : '1.35rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.5rem', letterSpacing: '-0.01em' }}>Diagnóstico Detalhado</h3>
            <p style={{ fontSize: isMobile ? '0.8rem' : '0.95rem', color: '#cbd5e1', margin: 0, lineHeight: 1.6 }}>Veja onde seu currículo perde força hoje</p>
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
                      <span className="vant-text-sm vant-font-medium" style={{ color: '#e2e8f0', fontSize: isMobile ? '0.8rem' : '0.9rem', minWidth: isMobile ? '90px' : '135px' }}>{label}</span>
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
                  {problems.map((p: Gap, i: number) => (
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

          <div className="vant-text-slate-400" style={{ marginBottom: isMobile ? '1rem' : '1.5rem', fontSize: isMobile ? '0.82rem' : '0.95rem', lineHeight: 1.7 }}>
            {isMobile ? (
              <>Nossa IA identificou <strong style={{ color: '#38bdf8' }}>pontos de melhoria</strong>. Veja uma amostra de como ficaria após a otimização. No PRO, você recebe tudo pronto.</>
            ) : (
              <>Nossa IA identificou <strong style={{ color: '#38bdf8' }}>alguns pontos de melhoria</strong> que, corrigidos, aumentam suas chances de passar pelos filtros ATS e chamar a atenção de recrutadores. Abaixo você vê <strong style={{ color: '#38bdf8' }}>uma amostra</strong> de como seu CV está agora e como ficaria após a otimização. Na versão PRO, você recebe a análise completa com todas as correções prontas para aplicar.</>
            )}
          </div>

          {problems.length > 0 ? (
            <>
              {visibleProblems.map((problem: Gap, idx: number) => (
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

                  {/* Termos faltando como chips - Layout otimizado para mobile */}
                  {problem.termos_faltando && Array.isArray(problem.termos_faltando) && problem.termos_faltando.length > 0 && (
                    <div style={{ marginBottom: isMobile ? '1rem' : '1.5rem' }}>
                      <div style={{ fontSize: isMobile ? '0.7rem' : '0.75rem', fontWeight: 600, color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Termos ausentes no seu CV</div>
                      <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: isMobile ? '0.4rem' : '0.75rem' }}>
                        {problem.termos_faltando.map((item: string | { termo: string; frequencia: string }, termIdx: number) => {
                          // Suporta tanto formato antigo (string) quanto novo (objeto)
                          const termo = typeof item === 'string' ? item : item.termo;
                          const frequencia = typeof item === 'object' && item.frequencia ? item.frequencia : null;

                          return (
                            <div key={termIdx} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <span className="term-chip" style={{ fontSize: isMobile ? '0.7rem' : '0.78rem' }}>
                                {termo}
                                {frequencia && isMobile && <span style={{ opacity: 0.7, marginLeft: '0.25rem' }}>({frequencia})</span>}
                              </span>
                              {frequencia && !isMobile && (
                                <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontStyle: 'italic' }}>
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
        <div className="vant-glass-dark vant-mb-8 vant-animate-fade" style={{ animationDelay: '0.6s', marginBottom: isMobile ? '0' : undefined }}>
          <h2 className="vant-h2" style={{ marginBottom: isMobile ? '0.75rem' : '0.4rem' }}>O que você desbloqueia com o PRO</h2>
          {!isMobile && <p style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: '1.5rem' }}>Um sistema completo do CV à entrevista.</p>}

          {isMobile ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.6rem' }}>
              {benefits.map((benefit, idx) => (
                <div key={idx} className="cta-checklist-item" style={{
                  background: 'rgba(255,255,255,0.03)',
                  padding: '0.6rem 0.875rem',
                  borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.05)',
                  width: '100%',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  <div className="cta-check-icon" style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: 'none',
                    color: '#fff',
                    width: '1.4rem',
                    height: '1.4rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {benefit.icon}
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#f1f5f9' }}>{benefit.title}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="benefits-grid">
              {benefits.map((benefit, idx) => (
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
          )}
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

      {/* Barra Sticky CTA Mobile - Apenas para mobile */}
      <div
        className={`vant-sticky-cta ${scrollTrigger ? 'vant-sticky-cta-visible' : ''}`}
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '1rem',
          zIndex: 50
        }}
      >
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

      {/* CTA Premium - Alternativo para score perfeito */}
      {isPerfectScore ? (
        <div className="vant-glass-dark vant-animate-fade" style={{ animationDelay: '0.3s' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: '4rem', height: '4rem', borderRadius: '99px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={32} color="#34d399" />
              </div>
            </div>
            <h2 className="vant-h2" style={{ marginBottom: '0.75rem', color: '#34d399' }}>
              Parabéns! Seu CV está excelente
            </h2>
            <p style={{ fontSize: '1rem', color: '#cbd5e1', marginBottom: '1.5rem', lineHeight: 1.7 }}>
              Seu currículo já está otimizado e pronto para conquistar oportunidades. Com score {score}/100, você está no topo!
            </p>
            <p style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: '1.5rem' }}>
              Quer ir além? Com o PRO você desbloqueia:
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
              <div className="cta-checklist">
                {[
                  'Simulador de entrevistas com IA',
                  'Biblioteca de recursos personalizados',
                  'Múltiplas otimizações para diferentes vagas'
                ].map((item) => (
                  <div key={item} className="cta-checklist-item">
                    <span className="cta-check-icon">✓</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <button className="vant-btn-primary vant-cta-button" onClick={onUpgrade} style={{ margin: '0 auto', display: 'flex', fontSize: '1rem', padding: '0.9rem 2.5rem' }}>
              Explorar recursos PRO
            </button>
          </div>
        </div>
      ) : (
        <div className="vant-glass-dark vant-animate-fade" style={{ animationDelay: '0.3s', paddingTop: isMobile ? '0rem' : undefined }}>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{
              fontSize: isMobile ? '1.25rem' : '1.75rem',
              fontWeight: 800,
              color: '#ffffff',
              marginBottom: '0.5rem',
              textShadow: '0 2px 4px rgba(0,0,0,0.3)',
              lineHeight: 1.2
            }}>
              Alcance o Score <span style={{ color: '#10b981' }}>{projected.score}/100</span> e entre no {projected.percentile}
            </h2>
            <p style={{ fontSize: isMobile ? '0.8rem' : '0.95rem', color: '#94a3b8', marginBottom: isMobile ? '1rem' : '1.5rem', lineHeight: 1.6 }}>Baseado nos problemas identificados no seu currículo</p>

            {/* Preview de Recursos da Biblioteca */}
            {libraryPreview.length > 0 && (
              <div style={{
                maxWidth: '700px',
                margin: isMobile ? '0 auto 1.5rem' : '0 auto 3rem',
                background: 'rgba(30,41,59,0.4)',
                border: '1px solid rgba(148,163,184,0.2)',
                borderRadius: isMobile ? '12px' : '16px',
                padding: isMobile ? '1rem' : '1.5rem',
                backdropFilter: 'blur(10px)'
              }}>
                <div style={{
                  fontSize: '0.9rem',
                  color: '#fb923c',
                  fontWeight: 600,
                  marginBottom: '1rem',
                  textAlign: 'center',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Preview: Recursos personalizados para você
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  {libraryPreview.map((livro, idx) => (
                    <div key={idx} style={{
                      background: 'rgba(251,146,60,0.08)',
                      border: '1px solid rgba(251,146,60,0.2)',
                      padding: isMobile ? '0.75rem' : '1rem',
                      borderRadius: isMobile ? '8px' : '12px',
                      display: 'flex',
                      gap: isMobile ? '0.75rem' : '1rem',
                      alignItems: 'start'
                    }}>
                      <div style={{
                        display: isMobile ? 'none' : 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '48px',
                        height: '48px',
                        borderRadius: '10px',
                        background: 'rgba(251,146,60,0.15)',
                        flexShrink: 0,
                        alignSelf: 'center'
                      }}>
                        <BookOpen size={24} color="#fb923c" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          color: '#e2e8f0',
                          fontSize: '0.9rem',
                          fontWeight: 600,
                          marginBottom: '0.25rem'
                        }}>
                          {livro.titulo}
                        </div>
                        <div style={{
                          fontSize: '0.75rem',
                          color: '#fb923c',
                          fontWeight: 500,
                          marginBottom: '0.5rem'
                        }}>
                          {livro.autor}
                        </div>
                        <div style={{
                          fontSize: '0.75rem',
                          color: '#94a3b8',
                          fontStyle: 'italic'
                        }}>
                          {livro.motivo}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <div style={{
                  fontSize: '0.75rem',
                  color: '#64748b',
                  textAlign: 'center',
                  fontStyle: 'italic',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}>
                  <LockOpen size={14} color="#fb923c" />
                  <span>Acesse biblioteca completa com o PRO</span>
                </div>
              </div>
            )}

            {/* Preview de Pergunta do Simulador */}
            {interviewQuestion && (
              <div style={{
                maxWidth: '700px',
                margin: isMobile ? '0 auto 1.5rem' : '0 auto 3rem',
                background: 'rgba(30,41,59,0.4)',
                border: '1px solid rgba(148,163,184,0.2)',
                borderRadius: isMobile ? '12px' : '16px',
                padding: isMobile ? '1rem' : '1.5rem',
                backdropFilter: 'blur(10px)'
              }}>
                <div style={{
                  fontSize: '0.9rem',
                  color: '#a78bfa',
                  fontWeight: 600,
                  marginBottom: '1rem',
                  textAlign: 'center',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Preview: Simulador de Entrevista
                </div>

                {/* Pergunta */}
                <div style={{
                  background: 'rgba(167,139,250,0.08)',
                  border: '1px solid rgba(167,139,250,0.2)',
                  padding: isMobile ? '0.875rem' : '1.25rem',
                  borderRadius: isMobile ? '8px' : '12px',
                  marginBottom: isMobile ? '0.5rem' : '1rem'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'start',
                    gap: isMobile ? '0.75rem' : '1rem',
                    marginBottom: '0.75rem'
                  }}>
                    <div style={{
                      display: isMobile ? 'none' : 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '48px',
                      height: '48px',
                      borderRadius: '10px',
                      background: 'rgba(167,139,250,0.15)',
                      flexShrink: 0,
                      alignSelf: 'center'
                    }}>
                      <Mic size={24} color="#a78bfa" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '0.75rem',
                        color: '#a78bfa',
                        fontWeight: 600,
                        marginBottom: '0.5rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        Pergunta personalizada:
                      </div>
                      <div style={{
                        color: '#e2e8f0',
                        fontSize: '0.95rem',
                        lineHeight: 1.6,
                        fontWeight: 500
                      }}>
                        "{interviewQuestion.pergunta}"
                      </div>
                    </div>
                  </div>

                  {/* Dica */}
                  <div style={{
                    background: 'rgba(167,139,250,0.05)',
                    border: '1px solid rgba(167,139,250,0.15)',
                    padding: '0.875rem',
                    borderRadius: '8px',
                    marginTop: '0.75rem'
                  }}>
                    <div style={{
                      fontSize: '0.7rem',
                      color: '#c4b5fd',
                      fontWeight: 600,
                      marginBottom: '0.35rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      💡 Dica do recrutador:
                    </div>
                    <div style={{
                      fontSize: '0.8rem',
                      color: '#cbd5e1',
                      lineHeight: 1.5,
                      fontStyle: 'italic'
                    }}>
                      {interviewQuestion.dica}
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <div style={{
                  fontSize: '0.75rem',
                  color: '#64748b',
                  textAlign: 'center',
                  fontStyle: 'italic',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}>
                  <LockOpen size={14} color="#a78bfa" />
                  <span>Pratique com perguntas personalizadas no PRO</span>
                </div>
              </div>
            )}

            {/* Opções de Planos */}
            <div style={{ display: 'flex', gap: isMobile ? '0.75rem' : '1rem', justifyContent: 'center', marginBottom: '2rem', flexDirection: 'row', flexWrap: 'wrap', maxWidth: '900px', margin: isMobile ? '0 auto 1rem' : '0 auto 2rem' }}>

              {/* Crédito Avulso */}
              <div style={{
                background: 'rgba(30,41,59,0.6)',
                border: '1px solid rgba(148,163,184,0.3)',
                borderRadius: isMobile ? '12px' : '16px',
                padding: isMobile ? '1.25rem' : '2rem',
                flex: '1 1 280px',
                minWidth: isMobile ? '100%' : '280px',
                maxWidth: '420px',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column'
              }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.borderColor = 'rgba(148,163,184,0.5)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'rgba(148,163,184,0.3)';
                  e.currentTarget.style.boxShadow = 'none';
                }}>
                <div style={{ textAlign: 'center', marginBottom: isMobile ? '0.75rem' : '1.5rem' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.35rem' }}>Crédito Avulso</div>
                  <div style={{ fontSize: isMobile ? '1.75rem' : '2.5rem', fontWeight: 800, color: '#f8fafc', lineHeight: 1, marginBottom: '0.25rem' }}>R$ 12,90</div>
                  <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Pagamento único</div>
                </div>
                <div style={{ fontSize: '0.875rem', color: '#cbd5e1', marginBottom: 'auto', textAlign: 'center', lineHeight: 1.6 }}>
                  1 otimização completa do seu CV
                </div>
                <button className="vant-btn-primary" onClick={onUpgrade} style={{
                  width: '100%',
                  fontSize: isMobile ? '0.85rem' : '0.95rem',
                  padding: isMobile ? '0.7rem 1rem' : '0.875rem 1.5rem',
                  background: 'rgba(148,163,184,0.15)',
                  border: '1px solid rgba(148,163,184,0.5)',
                  fontWeight: 600,
                  transition: 'all 0.2s',
                  marginTop: isMobile ? '0.75rem' : '1.5rem'
                }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(148,163,184,0.25)';
                    e.currentTarget.style.borderColor = 'rgba(203,213,225,0.6)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(148,163,184,0.15)';
                    e.currentTarget.style.borderColor = 'rgba(148,163,184,0.5)';
                  }}>
                  Comprar Crédito
                </button>
              </div>

              {/* Trial PRO */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(5,150,105,0.08) 100%)',
                border: '2px solid rgba(16,185,129,0.4)',
                borderRadius: isMobile ? '12px' : '16px',
                padding: isMobile ? '1.25rem' : '2rem',
                flex: '1 1 280px',
                minWidth: isMobile ? '100%' : '280px',
                maxWidth: '420px',
                position: 'relative',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 0 30px rgba(16,185,129,0.15)',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column'
              }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.borderColor = 'rgba(16,185,129,0.6)';
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(16,185,129,0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'rgba(16,185,129,0.4)';
                  e.currentTarget.style.boxShadow = '0 0 30px rgba(16,185,129,0.15)';
                }}>
                <div style={{
                  position: 'absolute',
                  top: '-12px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#fff',
                  padding: '6px 16px',
                  borderRadius: '20px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  boxShadow: '0 4px 12px rgba(16,185,129,0.4)',
                  textTransform: 'uppercase'
                }}>
                  ⭐ Recomendado
                </div>
                <div style={{ textAlign: 'center', marginBottom: isMobile ? '0.75rem' : '1.5rem', marginTop: '0.5rem' }}>
                  <div style={{ fontSize: '0.75rem', color: '#6ee7b7', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.35rem' }}>Trial de 7 dias</div>
                  <div style={{ fontSize: isMobile ? '1.75rem' : '2.5rem', fontWeight: 800, color: '#f8fafc', lineHeight: 1, marginBottom: '0.25rem' }}>R$ 1,99</div>
                  <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Depois, <strong style={{ color: '#cbd5e1' }}>R$ 19,90/mês</strong></div>
                </div>
                <div style={{ fontSize: '0.875rem', color: '#cbd5e1', marginBottom: 'auto', textAlign: 'center', lineHeight: 1.6 }}>
                  <strong style={{ color: '#10b981' }}>30 otimizações/mês</strong> • Cancele quando quiser
                </div>
                <button className="vant-btn-primary vant-cta-button" onClick={onUpgrade} style={{
                  width: '100%',
                  fontSize: isMobile ? '0.85rem' : '0.95rem',
                  padding: isMobile ? '0.7rem 1rem' : '0.875rem 1.5rem',
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: 'none',
                  boxShadow: '0 4px 16px rgba(16,185,129,0.3)',
                  transition: 'all 0.2s',
                  marginTop: isMobile ? '0.75rem' : '1.5rem'
                }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(16,185,129,0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(16,185,129,0.3)';
                  }}>
                  Começar Trial
                </button>
              </div>

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

            {/* Garantia em destaque */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginTop: isMobile ? '0.75rem' : '1.25rem', padding: isMobile ? '0.5rem 0.875rem' : '0.6rem 1.25rem', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '99px' }}>
              <Shield size={isMobile ? 13 : 15} color="#34d399" />
              <span style={{ fontSize: isMobile ? '0.75rem' : '0.85rem', fontWeight: 600, color: '#34d399' }}>{isMobile ? 'Garantia de 7 dias' : 'Garantia de 7 dias — dinheiro de volta sem burocracia'}</span>
            </div>
          </div>
        </div>
      )}

    </div >
  );
}
