"use client";

import { useState, useEffect } from "react";
import type { ReportData } from "@/types";
import { BookCard } from "./BookCard";
import { InterviewSimulator } from "./InterviewSimulator";
import { calculateProjectedScore } from "@/lib/helpers";
import {
    Zap, TrendingUp, AlertCircle, FileText, BookOpen, MessageSquare,
    Loader, ChevronDown, ChevronUp, Linkedin, User, Search, Copy,
    CheckCircle, ArrowLeft, Star, Clock, Target
} from 'lucide-react';

// --- CSS PURO (Substituindo Tailwind) ---
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
    gap: 1rem;
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
  .vant-text-white { color: white; }

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

  .vant-btn-outline {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.15);
    color: white;
    padding: 1rem 2rem;
    border-radius: 1rem;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: background 0.2s;
  }
  .vant-btn-outline:hover { background: rgba(255,255,255,0.1); }

  .vant-btn-copy {
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.15);
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 0.75rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: background 0.2s;
  }
  .vant-btn-copy:hover { background: rgba(255,255,255,0.15); }

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

  /* Scrollbar Customizada */
  .vant-scroll-area {
    overflow-y: visible;
    padding-right: 0.5rem;
  }
  .vant-scroll-area::-webkit-scrollbar { width: 6px; }
  .vant-scroll-area::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); }
  .vant-scroll-area::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }

  /* Utilitários de Texto Rico (HTML Render) */
  .vant-rich-text strong { color: #34d399; font-weight: 600; }

  /* Estilo do CV em texto plano (visual antigo) */
  .vant-cv-wrapper {
    background: radial-gradient(circle at top, rgba(59,130,246,0.08), rgba(10,16,32,0.95));
    color: #e2e8f0;
    padding: 2.25rem 2rem;
    border-radius: 1.1rem;
    border: 1px solid rgba(148, 163, 184, 0.25);
    box-shadow: 0 25px 55px rgba(2, 6, 23, 0.75);
  }

  .vant-cv-plain {
    margin: 0;
    font-family: 'JetBrains Mono', 'IBM Plex Mono', 'SFMono-Regular', 'Fira Code', 'Menlo', 'Monaco', monospace;
    font-size: 0.95rem;
    letter-spacing: 0.01em;
    line-height: 1.7;
    color: #f8fafc;
    white-space: pre-wrap;
    word-break: break-word;
    text-shadow: 0 0 9px rgba(2, 6, 23, 0.8);
  }

  /* Estilos do CV HTML (espelhando backend/styles.py) */
  .vant-cv-html-container {
    background: radial-gradient(circle at top, rgba(15,23,42,0.03), rgba(15,23,42,0.06));
    padding: 2rem;
    border-radius: 1.25rem;
    border: 1px solid rgba(148,163,184,0.3);
    display: flex;
    justify-content: center;
    overflow: hidden;
  }

  .cv-paper-sheet {
    background-color: #ffffff;
    width: 100%;
    max-width: 210mm;
    margin: 0 auto;
    padding: 18mm;
    box-shadow: 0 18px 40px rgba(15, 23, 42, 0.15);
    color: #334155;
    font-family: 'Inter', 'Segoe UI', sans-serif;
    border-top: 6px solid #10b981;
    line-height: 1.5;
    box-sizing: border-box;
  }

  .cv-paper-sheet .vant-cv-name {
    font-size: 24pt;
    font-weight: 800;
    text-align: center;
    margin-bottom: 4px;
    text-transform: uppercase;
    color: #0f172a;
    letter-spacing: -0.5px;
  }

  .cv-paper-sheet .vant-cv-contact-line {
    font-size: 10pt;
    color: #64748b;
    text-align: center;
    margin-bottom: 10mm;
    font-weight: 500;
    line-height: 1.4;
  }

  .cv-paper-sheet .vant-cv-section {
    font-size: 10pt;
    font-weight: 800;
    color: #0f172a;
    text-transform: uppercase;
    letter-spacing: 1px;
    border-bottom: 1px solid #e2e8f0;
    margin-top: 6mm;
    margin-bottom: 4mm;
    padding-bottom: 1mm;
    display: flex;
    align-items: center;
  }

  .cv-paper-sheet .vant-cv-section::before {
    content: '';
    display: inline-block;
    width: 20px;
    height: 4px;
    background-color: #10b981;
    margin-right: 10px;
    border-radius: 2px;
  }

  .cv-paper-sheet p {
    font-size: 10pt;
    line-height: 1.55;
    margin-bottom: 4mm;
    color: #334155;
  }

  .cv-paper-sheet .vant-cv-job-container {
    margin-bottom: 5mm;
  }

  .cv-paper-sheet .vant-job-title {
    font-size: 12pt;
    font-weight: 700;
    color: #0f172a;
    margin: 0;
  }

  .cv-paper-sheet .vant-job-company {
    color: #059669;
    font-weight: 600;
  }

  .cv-paper-sheet .vant-job-date {
    font-size: 9pt;
    color: #94a3b8;
    margin-bottom: 2mm;
    display: block;
  }

  .cv-paper-sheet .vant-cv-grid-row {
    display: flex;
    align-items: flex-start;
    margin-bottom: 2mm;
  }

  .cv-paper-sheet .vant-cv-bullet-col {
    color: #10b981;
    font-size: 14px;
    line-height: 1.3;
    flex: 0 0 12px;
    margin-right: 6px;
  }

  .cv-paper-sheet .vant-cv-text-col {
    flex: 1;
    font-size: 10pt;
    line-height: 1.4;
    margin: 0;
  }

  .cv-paper-sheet .vant-skills-container {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 4mm;
  }

  .cv-paper-sheet .vant-skill-chip {
    font-size: 8pt;
    background-color: #f1f5f9;
    padding: 3px 8px;
    border-radius: 4px;
    border: 1px solid #cbd5e1;
    color: #475569;
    font-weight: 600;
  }
`;

// Injeção de estilo no head
if (typeof window !== "undefined") {
    const styleId = "vant-no-tailwind-styles";
    if (!document.getElementById(styleId)) {
        const style = document.createElement("style");
        style.id = styleId;
        style.textContent = globalStyles;
        document.head.appendChild(style);
    }
}

interface PaidStageProps {
    reportData: ReportData | null;
    authUserId: string | null;
    creditsRemaining?: number;
    onNewOptimization: () => void;
    onUpdateReport: (updated: ReportData) => void;
    onViewHistory?: () => void;
}

export function PaidStage({
    reportData,
    creditsRemaining = 0,
    onNewOptimization,
    onUpdateReport
}: PaidStageProps) {
    const [activeTab, setActiveTab] = useState<"diagnostico" | "cv" | "biblioteca" | "simulador">("diagnostico");
    const [copiedField, setCopiedField] = useState<"headline" | "summary" | "xray" | null>(null);
    const [expandedGaps, setExpandedGaps] = useState<Record<number, boolean>>({});
    const [cvProgress, setCvProgress] = useState(35);

    const loadingTabs = reportData ? {
        diagnostico: !reportData.gaps_fatais || !reportData.linkedin_headline,
        cv: !reportData.cv_otimizado_completo,
        biblioteca: !reportData.biblioteca_tecnica || (Array.isArray(reportData.biblioteca_tecnica) && reportData.biblioteca_tecnica.length === 0),
        simulador: false,
    } : {
        diagnostico: false, cv: false, biblioteca: false, simulador: false,
    };

    const cvStatus: "processing" | "ready" = loadingTabs.cv ? "processing" : "ready";

    useEffect(() => {
        if (cvStatus !== "processing") return;
        const interval = setInterval(() => {
            setCvProgress(prev => {
                const next = prev + 5;
                return next >= 95 ? 95 : next;
            });
        }, 800);
        return () => clearInterval(interval);
    }, [cvStatus]);

    if (!reportData) {
        return (
            <div className="vant-premium-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <Loader className="vant-animate-spin" style={{ margin: '0 auto', marginBottom: '1rem', color: '#f59e0b' }} size={32} />
                    <p className="vant-text-slate-400">Carregando dados...</p>
                </div>
            </div>
        );
    }

    // Cálculos
    const xpAtual = Math.min(100, typeof reportData.nota_ats_estrutura === "number" ? reportData.nota_ats_estrutura : (reportData.nota_ats ?? 0));
    const reportContentGapCount = Math.min(2, reportData.gaps_fatais ? reportData.gaps_fatais.length : 0);
    const impacto = reportData.analise_por_pilares?.impacto || 0;
    const keywords = reportData.analise_por_pilares?.keywords || 0;
    const ats = reportData.analise_por_pilares?.ats || 0;
    const projected = calculateProjectedScore(xpAtual, reportContentGapCount, 0, ats, keywords, impacto);

    const gapTotal = Math.max(1, (reportData.gaps_fatais || []).length);
    const totalCorrectionMinutes = (gapTotal * 15) + 10;

    const diagnosticGaps = (reportData.gaps_fatais || []).map((gap, idx) => ({
        id: idx + 1,
        titulo: gap.erro,
        severidade: idx <= 1 ? "alta" : "media",
        impacto: "+4%",
        evidencia: (gap.evidencia || "").replace(/\*\*/g, ""),
        exemploAtual: gap.evidencia || "Descrição genérica...",
        exemploOtimizado: gap.correcao_sugerida || "Sugestão otimizada...",
    }));

    const xraySearchString = reportData.kit_hacker?.boolean_string || `site: linkedin.com /in ("${reportData.setor_detectado || ""}")`;

    const cvContent = reportData.cv_otimizado_completo || "";
    const isHtmlCv = /<(?:html|body|section|div|p|ul|ol|li|span|table|h[1-6]|style|head)/i.test(cvContent.trim());

    const copyToClipboard = async (text: string, field: "headline" | "summary" | "xray") => {
        await navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const getSeveridadeStyles = (sev: string) => {
        switch (sev) {
            case "alta": return { bg: "rgba(239, 68, 68, 0.1)", border: "rgba(239, 68, 68, 0.3)", text: "#FCA5A5", badgeBg: "#EF4444" };
            default: return { bg: "rgba(245, 158, 11, 0.1)", border: "rgba(245, 158, 11, 0.3)", text: "#FCD34D", badgeBg: "#F59E0B" };
        }
    };

    return (
        <div className="vant-premium-wrapper">
            <div className="vant-container">

                {/* Header */}
                <div className="vant-flex vant-justify-between vant-items-center vant-mb-12 vant-animate-fade">
                    <div>
                        <h1 className="vant-title-xl">Análise Completa</h1>
                        <p className="vant-subtitle">Diagnóstico profissional do seu currículo</p>
                    </div>
                    <div className="vant-badge-credits">
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
                        <span>{creditsRemaining} Créditos</span>
                    </div>
                </div>

                {/* Score Cards */}
                <div className="vant-grid-3 vant-mb-12 vant-animate-fade" style={{ animationDelay: '0.1s' }}>

                    {/* Card Atual */}
                    <div className="vant-glass-dark">
                        <div className="vant-flex vant-items-center vant-gap-3 vant-mb-6">
                            <div className="vant-icon-circle"><Target size={20} color="#cbd5e1" /></div>
                            <span className="vant-text-sm vant-font-medium vant-text-slate-400" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Atual</span>
                        </div>
                        <div>
                            <div style={{ fontSize: '3.5rem', fontWeight: 300, color: 'white', lineHeight: 1 }}>{xpAtual}</div>
                            <div className="vant-text-sm vant-text-slate-400">de 100 pontos</div>
                        </div>
                        <div className="vant-score-bar-bg">
                            <div className="vant-score-bar-fill" style={{ width: `${xpAtual}% ` }} />
                        </div>
                    </div>

                    {/* Card Potencial */}
                    <div className="vant-glass-dark" style={{ borderColor: 'rgba(16, 185, 129, 0.3)', boxShadow: '0 0 30px rgba(16, 185, 129, 0.1)' }}>
                        <div className="vant-flex vant-items-center vant-gap-3 vant-mb-6">
                            <div className="vant-icon-circle" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                                <Zap size={20} color="white" />
                            </div>
                            <span className="vant-text-sm vant-font-medium" style={{ color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Potencial</span>
                        </div>
                        <div>
                            <div style={{ fontSize: '3.5rem', fontWeight: 300, background: 'linear-gradient(to right, #34d399, #2dd4bf)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1 }}>
                                {projected.score}
                            </div>
                            <div className="vant-text-sm vant-text-slate-400">+{projected.improvement} pontos possíveis</div>
                        </div>
                        <div className="vant-mt-4" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '99px', color: '#34d399', fontSize: '0.875rem', fontWeight: 500 }}>
                            <TrendingUp size={16} /> Top 5% dos candidatos
                        </div>
                    </div>

                    {/* Card Tempo */}
                    <div className="vant-glass-dark">
                        <div className="vant-flex vant-items-center vant-gap-3 vant-mb-6">
                            <div className="vant-icon-circle"><Clock size={20} color="#cbd5e1" /></div>
                            <span className="vant-text-sm vant-font-medium vant-text-slate-400" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estimativa</span>
                        </div>
                        <div>
                            <div style={{ fontSize: '3.5rem', fontWeight: 300, color: 'white', lineHeight: 1 }}>{totalCorrectionMinutes}</div>
                            <div className="vant-text-sm vant-text-slate-400">minutos de trabalho</div>
                        </div>
                        <div className="vant-text-xs vant-text-slate-400 vant-mt-4">Para aplicar correções</div>
                    </div>
                </div>

                {/* Processing Banner */}
                {cvStatus === 'processing' && (
                    <div className="vant-glass-dark vant-mb-8 vant-animate-fade" style={{ padding: '1.5rem', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                        <div className="vant-flex vant-items-center vant-gap-4">
                            <Loader className="vant-animate-spin" size={20} color="#fbbf24" />
                            <div style={{ flex: 1 }}>
                                <div className="vant-flex vant-justify-between vant-mb-2">
                                    <span className="vant-text-sm vant-font-medium vant-text-white">Gerando CV Otimizado...</span>
                                    <span className="vant-text-sm vant-text-slate-400">{cvProgress}%</span>
                                </div>
                                <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 99, overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: `${cvProgress}% `, background: 'linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%)', transition: 'width 0.5s ease' }} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Navigation Tabs */}
                <div className="vant-flex vant-gap-2 vant-mb-8" style={{ overflowX: 'auto', paddingBottom: '0.5rem' }}>
                    {[
                        { id: "diagnostico", icon: AlertCircle, label: "Diagnóstico" },
                        { id: "cv", icon: FileText, label: "CV Otimizado" },
                        { id: "biblioteca", icon: BookOpen, label: "Biblioteca" },
                        { id: "simulador", icon: MessageSquare, label: "Simulador" }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`vant-btn-tab ${activeTab === tab.id ? 'active' : ''}`}
                        >
                            {loadingTabs[tab.id as keyof typeof loadingTabs] ? <Loader className="vant-animate-spin" size={16} /> : <tab.icon size={16} />}
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Conteúdo das Abas */}
                <div className="vant-animate-fade" style={{ animationDelay: '0.2s' }}>

                    {activeTab === "diagnostico" && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                            {/* LinkedIn Headline */}
                            {reportData.linkedin_headline && (
                                <div className="vant-glass-darker">
                                    <div className="vant-flex vant-justify-between vant-mb-6">
                                        <div className="vant-flex vant-gap-4">
                                            <div className="vant-icon-circle" style={{ width: '3rem', height: '3rem', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', borderRadius: '1rem' }}>
                                                <Linkedin size={24} color="white" />
                                            </div>
                                            <div>
                                                <h3 className="vant-h3">LinkedIn Headline</h3>
                                                <p className="vant-text-sm vant-text-slate-400">Otimizado para visibilidade</p>
                                            </div>
                                        </div>
                                        <button onClick={() => copyToClipboard(reportData.linkedin_headline!, 'headline')} className="vant-btn-copy">
                                            {copiedField === 'headline' ? <CheckCircle size={16} color="#34d399" /> : <Copy size={16} />}
                                            {copiedField === 'headline' ? 'Copiado' : 'Copiar'}
                                        </button>
                                    </div>
                                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                                        <p className="vant-text-white" style={{ fontWeight: 500 }}>{reportData.linkedin_headline}</p>
                                    </div>
                                </div>
                            )}

                            {/* Resumo */}
                            {reportData.resumo_otimizado && (
                                <div className="vant-glass-darker">
                                    <div className="vant-flex vant-justify-between vant-mb-6">
                                        <div className="vant-flex vant-gap-4">
                                            <div className="vant-icon-circle" style={{ width: '3rem', height: '3rem', background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', borderRadius: '1rem' }}>
                                                <User size={24} color="white" />
                                            </div>
                                            <div>
                                                <h3 className="vant-h3">Resumo Profissional</h3>
                                                <p className="vant-text-sm vant-text-slate-400">Pronto para seu CV e LinkedIn</p>
                                            </div>
                                        </div>
                                        <button onClick={() => copyToClipboard(reportData.resumo_otimizado!, 'summary')} className="vant-btn-copy">
                                            {copiedField === 'summary' ? <CheckCircle size={16} color="#34d399" /> : <Copy size={16} />}
                                            {copiedField === 'summary' ? 'Copiado' : 'Copiar'}
                                        </button>
                                    </div>
                                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                                        <p style={{ color: '#e2e8f0', lineHeight: 1.6 }}>{reportData.resumo_otimizado}</p>
                                    </div>
                                </div>
                            )}

                            {/* Gaps */}
                            <div>
                                <div className="vant-flex vant-justify-between vant-items-center vant-mb-6">
                                    <h2 className="vant-h2">Plano de Correção</h2>
                                    <span className="vant-text-sm vant-text-slate-400" style={{ background: 'rgba(255,255,255,0.1)', padding: '0.25rem 0.75rem', borderRadius: 99 }}>
                                        {diagnosticGaps.length} pontos críticos
                                    </span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {diagnosticGaps.map((gap, index) => {
                                        const isExpanded = expandedGaps[index];
                                        const styles = getSeveridadeStyles(gap.severidade);

                                        return (
                                            <div key={gap.id} className="vant-glass-dark" style={{ padding: 0, overflow: 'hidden' }}>
                                                <div
                                                    onClick={() => setExpandedGaps(prev => ({ ...prev, [index]: !prev[index] }))}
                                                    style={{ padding: '1.5rem', cursor: 'pointer', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}
                                                >
                                                    <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', background: styles.bg, border: `1px solid ${styles.border} `, color: styles.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.875rem' }}>
                                                        {gap.id}
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <div className="vant-flex vant-items-center vant-gap-2 vant-mb-2">
                                                            <h3 className="vant-text-white" style={{ fontWeight: 600 }}>{gap.titulo}</h3>
                                                            <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '4px', background: styles.bg, color: styles.text, border: `1px solid ${styles.border} `, textTransform: 'uppercase' }}>
                                                                {gap.impacto}
                                                            </span>
                                                        </div>
                                                        <p className="vant-text-slate-400 vant-text-sm">{gap.evidencia}</p>
                                                    </div>
                                                    {isExpanded ? <ChevronUp size={20} color="#94a3b8" /> : <ChevronDown size={20} color="#94a3b8" />}
                                                </div>

                                                {isExpanded && (
                                                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                                        <div className="vant-grid-2">
                                                            <div style={{ background: 'rgba(239, 68, 68, 0.05)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                                                                <div className="vant-text-xs" style={{ color: '#f87171', fontWeight: 700, marginBottom: '0.5rem', textTransform: 'uppercase' }}>Como está agora</div>
                                                                <p className="vant-text-sm" style={{ color: '#cbd5e1', fontStyle: 'italic' }}>"{gap.exemploAtual}"</p>
                                                            </div>
                                                            <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                                                                <div className="vant-text-xs" style={{ color: '#34d399', fontWeight: 700, marginBottom: '0.5rem', textTransform: 'uppercase' }}>Recomendação</div>
                                                                <div className="vant-text-sm vant-rich-text" style={{ color: '#f1f5f9' }} dangerouslySetInnerHTML={{ __html: gap.exemploOtimizado.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "cv" && (
                        <div className="vant-glass-dark">
                            <h2 className="vant-h2 vant-mb-6">CV Otimizado Completo</h2>
                            {reportData.cv_otimizado_completo ? (
                                <div className="vant-scroll-area">
                                    {isHtmlCv ? (
                                        <div className="vant-cv-html-container">
                                            <div
                                                className="cv-paper-sheet"
                                                dangerouslySetInnerHTML={{ __html: cvContent }}
                                            />
                                        </div>
                                    ) : (
                                        <div className="vant-cv-wrapper">
                                            <pre className="vant-cv-plain">{cvContent}</pre>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '3rem' }}>
                                    <Loader className="vant-animate-spin" size={32} color="#94a3b8" style={{ margin: '0 auto' }} />
                                    <p className="vant-text-slate-400 vant-mt-4">Gerando documento...</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "biblioteca" && (
                        <div className="vant-grid-2">
                            {reportData.biblioteca_tecnica?.map((book, idx) => (
                                <BookCard key={idx} book={book} index={idx} />
                            ))}
                        </div>
                    )}

                    {activeTab === "simulador" && (
                        <InterviewSimulator reportData={reportData} onProgress={() => { }} />
                    )}

                </div>

                {/* Footer */}
                <div className="vant-glass-darker vant-mt-12 vant-mb-12" style={{ textAlign: 'center' }}>
                    <h3 className="vant-h3 vant-mb-2">Pronto para o próximo passo?</h3>
                    <p className="vant-subtitle vant-mb-6">Aplique as melhorias e gere uma nova análise.</p>
                    <div className="vant-flex vant-justify-center vant-gap-4" style={{ flexWrap: 'wrap' }}>
                        <button onClick={() => window.location.href = "/dashboard"} className="vant-btn-outline">
                            <ArrowLeft size={18} /> Voltar ao Dashboard
                        </button>
                        <button onClick={onNewOptimization} className="vant-btn-primary">
                            <Zap size={18} /> Nova Otimização
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}