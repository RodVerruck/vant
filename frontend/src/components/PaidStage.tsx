"use client";

import { useState, useEffect } from "react";
import type { ReportData } from "@/types";
import { CopyableSection } from "./CopyableSection";
import { GapCard } from "./GapCard";
import { BookCard } from "./BookCard";
import { InterviewSimulator } from "./InterviewSimulator";
import { calculateProjectedScore } from "@/lib/helpers";

// Estilos CSS para animação de loading
const loadingStyles = `
@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
`;

// Adicionar estilos ao head do documento
if (typeof window !== "undefined") {
    const styleElement = document.createElement("style");
    styleElement.textContent = loadingStyles;
    document.head.appendChild(styleElement);
}

// Componente de placeholder para conteúdo carregando
const LoadingPlaceholder = ({ title, description }: { title: string; description: string }) => (
    <div style={{
        background: "linear-gradient(135deg, rgba(15, 23, 42, 0.3) 0%, rgba(56, 189, 248, 0.05) 100%)",
        border: "1px solid rgba(56, 189, 248, 0.2)",
        borderRadius: 12,
        padding: 24,
        margin: "20px 0",
        position: "relative",
        overflow: "hidden"
    }}>
        <div style={{
            position: "absolute",
            top: -20,
            right: -20,
            width: 80,
            height: 80,
            background: "#38BDF8",
            filter: "blur(50px)",
            opacity: 0.1
        }} />

        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
            <div
                style={{
                    width: "24px",
                    height: "24px",
                    border: "3px solid #38BDF8",
                    borderTop: "3px solid transparent",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite"
                }}
            />
            <h4 style={{ color: "#38BDF8", margin: 0, fontSize: "1.1rem", fontWeight: 600 }}>
                {title}
            </h4>
        </div>

        <p style={{ color: "#94A3B8", margin: 0, lineHeight: 1.6, fontSize: "0.95rem" }}>
            {description}
        </p>

        <div style={{
            marginTop: 16,
            padding: 12,
            background: "rgba(56, 189, 248, 0.1)",
            borderRadius: 8,
            border: "1px solid rgba(56, 189, 248, 0.2)"
        }}>
            <p style={{
                color: "#38BDF8",
                margin: 0,
                fontSize: "0.85rem",
                fontWeight: 500,
                textAlign: "center"
            }}>
                🤖 Nossa IA está analisando seu currículo e gerando insights personalizados...
            </p>
        </div>
    </div>
);

interface PaidStageProps {
    reportData: ReportData | null;
    authUserId: string | null;
    onNewOptimization: () => void;
    onUpdateReport: (updated: ReportData) => void;
    onViewHistory?: () => void;
}

export function PaidStage({ reportData, authUserId, onNewOptimization, onUpdateReport, onViewHistory }: PaidStageProps) {
    const [activeTab, setActiveTab] = useState<"diagnostico" | "cv" | "biblioteca" | "simulador">("diagnostico");
    const [editedCvText, setEditedCvText] = useState("");
    const [isEditorOpen, setIsEditorOpen] = useState(false);

    // Estado para controlar quais abas estão carregando
    const [loadingTabs, setLoadingTabs] = useState<Record<string, boolean>>({
        diagnostico: false,
        cv: false,
        biblioteca: false,
        simulador: false
    });

    // Detectar quando as abas estão carregando baseado nos dados disponíveis
    useEffect(() => {
        if (!reportData) return;

        const newLoadingTabs = {
            diagnostico: !reportData.gaps_fatais || !reportData.linkedin_headline || !reportData.resumo_otimizado,
            cv: !reportData.cv_otimizado_completo,
            biblioteca: !reportData.biblioteca_tecnica || (Array.isArray(reportData.biblioteca_tecnica) && reportData.biblioteca_tecnica.length === 0),
            simulador: false // Simulador sempre disponível quando há dados
        };

        setLoadingTabs(newLoadingTabs);
    }, [reportData]);

    if (!reportData) {
        return (
            <div className="hero-container">
                <h2 style={{ color: "#EF4444" }}>Dados da sessão perdidos</h2>
                <p style={{ color: "#94A3B8" }}>Por favor, reinicie o processo.</p>
                <button
                    onClick={onNewOptimization}
                    style={{
                        background: "#10B981",
                        color: "white",
                        padding: "12px 24px",
                        borderRadius: 8,
                        border: "none",
                        cursor: "pointer",
                        fontWeight: 600
                    }}
                >
                    Reiniciar
                </button>
            </div>
        );
    }

    const nota = reportData.nota_ats || 0;
    const xpAtual = Math.min(100, nota);

    // 🎯 Calcular score projetado inteligente
    const gapsCount = reportData.gaps_fatais ? reportData.gaps_fatais.length : 0;
    const impacto = reportData.analise_por_pilares?.impacto || 0;
    const keywords = reportData.analise_por_pilares?.keywords || 0;
    const ats = reportData.analise_por_pilares?.ats || 0;

    const projected = calculateProjectedScore(xpAtual, gapsCount, 0, ats, keywords, impacto);

    let nivelLabel = "FORMATADO COMO JÚNIOR 🧱";
    let barColor = "#EF4444";
    let bgGlow = "rgba(239, 68, 68, 0.2)";
    let msgEgo = "Seu currículo está escondendo sua senioridade real.";

    if (xpAtual >= 85) {
        nivelLabel = "FORMATADO COMO SÊNIOR 👑";
        barColor = "#10B981";
        bgGlow = "rgba(16, 185, 129, 0.2)";
        msgEgo = "Documento alinhado com sua experiência real.";
    } else if (xpAtual >= 60) {
        nivelLabel = "FORMATADO COMO PLENO ⚔️";
        barColor = "#F59E0B";
        bgGlow = "rgba(245, 158, 11, 0.2)";
        msgEgo = "Bom potencial, mas a formatação limita seu salário.";
    }

    const handleSaveEdit = () => {
        if (editedCvText && reportData) {
            const updated = { ...reportData, cv_otimizado_completo: editedCvText };
            onUpdateReport(updated);
            setIsEditorOpen(false);
        }
    };

    const handleDownloadPdf = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/generate-pdf`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ data: reportData, user_id: authUserId }),
            });

            if (!response.ok) throw new Error("Falha ao gerar PDF");

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "Curriculo_VANT.pdf";
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            alert("Erro ao gerar PDF: " + error);
        }
    };

    const handleDownloadWord = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/generate-word`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ data: reportData, user_id: authUserId }),
            });

            if (!response.ok) throw new Error("Falha ao gerar Word");

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "Curriculo_VANT_Editavel.docx";
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            alert("Erro ao gerar Word: " + error);
        }
    };

    const formatTextToHtml = (text: string) => {
        if (!text) return "";

        // Garantir decoding correto de UTF-8
        try {
            // Se o texto estiver mal-decodificado, tentar corrigir
            if (text.includes('ã£') || text.includes('ã§') || text.includes('ã©')) {
                // Corrigir encoding problemático
                const decoder = new TextDecoder('utf-8');
                const encoder = new TextEncoder();
                const bytes = encoder.encode(text);
                text = decoder.decode(bytes);
            }
        } catch (e) {
            // Se falhar, manter o texto original
            console.warn('Erro ao corrigir encoding:', e);
        }

        text = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
        let html_output: string[] = [];
        let lines = text.split('\n');

        for (let line of lines) {
            line = line.trim();
            if (!line) continue;

            // Nome (h1)
            if (line.startsWith('# ')) {
                let clean = line.replace('# ', '').toUpperCase();
                html_output.push(`<h1 class="vant-cv-name">${clean}</h1>`);
            }
            // Seções (h2)
            else if (line.startsWith('###')) {
                let clean = line.replace('###', '').trim().toUpperCase();
                html_output.push(`<h2 class="vant-cv-section">${clean}</h2>`);
            }
            // Listas (experiências e tarefas)
            else if (line.startsWith('- ') || line.startsWith('* ') || line.startsWith('• ')) {
                let clean = line.replace(/^[-*•]\s+/, '').replace(/\*\*(.*?)\*\*/g, '<span class="vant-bold">$1</span>');

                // Se tem |, é cargo/empresa/data
                if (line.includes('|')) {
                    let parts = clean.split('|').map(p => p.trim());
                    let cargo = clean;
                    let empresa = "";
                    let data = "";

                    if (parts.length >= 3) {
                        cargo = parts[0];
                        empresa = parts[1];
                        data = parts[2].replace(/\*/g, '').replace('_', '').trim(); // Remove todos os asteriscos
                    } else if (parts.length === 2) {
                        cargo = parts[0];
                        empresa = parts[1].replace(/\*/g, '').trim(); // Remove todos os asteriscos
                    }

                    let job_html = `
                    <div class="vant-cv-job-container">
                        <div class="vant-job-row-primary">
                            <span class="vant-job-title">${cargo}</span>
                            <span class="vant-job-sep">|</span>
                            <span class="vant-job-company">${empresa}</span>
                        </div>`;

                    if (data) {
                        job_html += `
                        <div class="vant-job-row-secondary">
                            <span class="vant-job-date">${data}</span>
                        </div>`;
                    }

                    job_html += "</div>";
                    html_output.push(job_html);
                }
                // Senão é tarefa com bullet
                else {
                    let row = `
                    <div class="vant-cv-grid-row">
                        <div class="vant-cv-bullet-col">•</div>
                        <div class="vant-cv-text-col">${clean}</div>
                    </div>`;
                    html_output.push(row);
                }
            }
            // Descrições de experiências (começam com ** mas não têm -)
            else if (line.startsWith('**') && line.includes(':')) {
                let clean = line.replace(/\*\*(.*?)\*\*/g, '<span class="vant-bold">$1</span>');
                let row = `
                <div class="vant-cv-grid-row">
                    <div class="vant-cv-bullet-col"></div>
                    <div class="vant-cv-text-col">${clean}</div>
                </div>`;
                html_output.push(row);
            }
            // Contato (linha com | ou @)
            else if ((line.includes('|') || line.includes('@')) && line.length < 300) {
                let clean_line = line.replace(/\*\*/g, ''); // Remove todos os ** da linha
                let parts = clean_line.split('|').map(p => p.trim());
                let items_html: string[] = [];

                for (let p of parts) {
                    if (p) {
                        if (p.includes(':')) {
                            let [label, val] = p.split(":", 2);
                            let block = `<span class="vant-contact-block"><span class="vant-bold">${label}:</span> ${val}</span>`;
                            items_html.push(block);
                        } else {
                            items_html.push(`<span class="vant-contact-block">${p}</span>`);
                        }
                    }
                }
                let full_html = items_html.join('<span class="vant-contact-separator"> • </span>');
                html_output.push(`<div class="vant-cv-contact-row">${full_html}</div>`);
            }
            // Texto normal
            else {
                let clean = line.replace(/\*\*(.*?)\*\*/g, '<span class="vant-bold">$1</span>');
                html_output.push(`<div class="vant-cv-text-row">${clean}</div>`);
            }
        }

        return html_output.join('');
    };

    // Gerar link do Google X-Ray Search
    const googleLink = reportData.kit_hacker?.boolean_string
        ? `https://www.google.com/search?q=${encodeURIComponent(reportData.kit_hacker.boolean_string)}`
        : `https://www.google.com/search?q=${encodeURIComponent(`site:linkedin.com/in "${reportData.setor_detectado || ''}" "${reportData.linkedin_headline}"`)}`;

    return (
        <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)", color: "#F8FAFC" }}>
            {/* Header */}
            <div style={{ padding: "40px 20px", textAlign: "center" }}>
                <h1 style={{ fontSize: "2.5rem", fontWeight: 800, marginBottom: 16, background: "linear-gradient(135deg, #38BDF8 0%, #8B5CF6 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                    VANT - Análise Completa
                </h1>
                <p style={{ fontSize: "1.2rem", color: "#94A3B8", marginBottom: 32 }}>
                    Currículo otimizado com IA para {reportData.setor_detectado || "sua área"}
                </p>

                {/* Score Card */}
                <div style={{
                    maxWidth: 600,
                    margin: "0 auto 40px",
                    background: "rgba(15, 23, 42, 0.6)",
                    border: "1px solid rgba(56, 189, 248, 0.2)",
                    borderRadius: 16,
                    padding: 24,
                    backdropFilter: "blur(10px)"
                }}>
                    {/* Score Atual vs Projetado */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                        <div>
                            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 4 }}>{nivelLabel}</h2>
                            <p style={{ color: "#94A3B8", margin: 0 }}>{msgEgo}</p>
                        </div>
                        <div style={{ textAlign: "center" }}>
                            <div style={{ fontSize: "3rem", fontWeight: 800, color: barColor, lineHeight: 1 }}>{xpAtual}%</div>
                            <div style={{ fontSize: "0.9rem", color: "#64748B", textTransform: "uppercase", letterSpacing: 1 }}>Score ATS Atual</div>
                        </div>
                    </div>

                    {/* Barra do Score Atual */}
                    <div style={{ marginBottom: 8 }}>
                        <div style={{ height: 8, background: "rgba(255,255,255,0.1)", borderRadius: 4, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${xpAtual}%`, background: barColor, borderRadius: 4, transition: "width 1s ease-out" }} />
                        </div>
                    </div>

                    {/* Score Projetado */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, padding: "16px", background: "linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(34, 197, 94, 0.05) 100%)", borderRadius: 12, border: "1px solid rgba(16, 185, 129, 0.2)" }}>
                        <div>
                            <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#10B981", lineHeight: 1 }}>{projected.score}/100</div>
                            <div style={{ fontSize: "0.85rem", color: "#10B981", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>Score Projetado Pós-Otimização</div>
                            <div style={{ fontSize: "0.72rem", color: "#94A3B8", marginTop: 6, maxWidth: 420, lineHeight: 1.35 }}>{projected.reasoning}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "#10B981" }}>+{projected.improvement}%</div>
                            <div style={{ fontSize: "0.75rem", color: "#64748B", textTransform: "uppercase", letterSpacing: 1 }}>Potencial de Melhoria</div>
                        </div>
                    </div>

                    {/* Barra do Score Projetado */}
                    <div style={{ marginBottom: 16 }}>
                        <div style={{ height: 10, background: "rgba(255,255,255,0.1)", borderRadius: 5, overflow: "hidden", position: "relative" }}>
                            <div style={{ height: "100%", width: `${projected.score}%`, background: "linear-gradient(90deg, #10B981 0%, #22C55E 100%)", borderRadius: 5, transition: "width 1s ease-out", boxShadow: "0 0 20px rgba(16, 185, 129, 0.3)" }} />
                            {/* Indicador visual do ganho */}
                            <div style={{
                                position: "absolute",
                                left: `${xpAtual}%`,
                                top: 0,
                                width: "2px",
                                height: "100%",
                                background: "#F59E0B",
                                boxShadow: "0 0 10px rgba(245, 158, 11, 0.5)"
                            }} />
                        </div>
                    </div>

                    {/* Progresso das Etapas */}
                    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                        <div style={{ flex: 1, height: 6, background: "#10B981", borderRadius: 3 }} title="Diagnóstico"></div>
                        <div style={{ flex: 1, height: 6, background: "#10B981", borderRadius: 3 }} title="CV Otimizado"></div>
                        <div style={{ flex: 1, height: 6, background: "#10B981", borderRadius: 3 }} title="Biblioteca"></div>
                        <div style={{
                            flex: 1,
                            height: 6,
                            background: "#374151",
                            borderRadius: 3,
                            transition: "background 0.3s ease"
                        }} title="Simulador"></div>
                    </div>
                    <p style={{ color: "#64748B", fontSize: "0.75rem", marginTop: 10, marginBottom: 0 }}>
                        Progresso: Diagnóstico ✅ | CV Otimizado ✅ | Biblioteca ✅ | Simulador ⏳
                    </p>
                </div>
            </div>

            {/* Content */}
            <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px" }}>
                {/* Tabs */}
                <div style={{ display: "flex", gap: 8, borderBottom: "1px solid rgba(255,255,255,0.1)", marginBottom: 20 }}>
                    {[
                        { id: "diagnostico", label: "📊 DIAGNÓSTICO E AÇÃO" },
                        { id: "cv", label: "📄 CV OTIMIZADO" },
                        { id: "biblioteca", label: "📚 BIBLIOTECA" },
                        { id: "simulador", label: "🎙️ SIMULADOR DE ENTREVISTA" }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            style={{
                                background: activeTab === tab.id ? "rgba(56, 189, 248, 0.1)" : "transparent",
                                color: activeTab === tab.id ? "#38BDF8" : "#94A3B8",
                                border: "none",
                                borderBottom: activeTab === tab.id ? "2px solid #38BDF8" : "2px solid transparent",
                                padding: "12px 20px",
                                cursor: "pointer",
                                fontWeight: 600,
                                fontSize: "0.9rem",
                                transition: "all 0.2s",
                                position: "relative",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px"
                            }}
                        >
                            {loadingTabs[tab.id] && (
                                <>
                                    <div
                                        style={{
                                            width: "16px",
                                            height: "16px",
                                            border: "2px solid #38BDF8",
                                            borderTop: "2px solid transparent",
                                            borderRadius: "50%",
                                            animation: "spin 1s linear infinite"
                                        }}
                                    />
                                    <span style={{ opacity: 0.7 }}>IA processando...</span>
                                </>
                            )}
                            {!loadingTabs[tab.id] && tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                {activeTab === "diagnostico" && (
                    <div style={{ maxWidth: 850, margin: "0 auto" }}>
                        {loadingTabs.diagnostico ? (
                            <LoadingPlaceholder
                                title="🔍 Analisando seu currículo..."
                                description="Estamos examinando seu currículo em detalhes para identificar gaps críticos, oportunidades de melhoria e alinhamento com o mercado. Este processo leva cerca de 15-20 segundos."
                            />
                        ) : (
                            <>
                                <h3 style={{ color: "#F8FAFC", marginBottom: 20, fontSize: "1.5rem", fontWeight: 600 }}>1. Plano de Correção Imediata</h3>
                                {reportData.gaps_fatais?.map((gap, idx) => (
                                    <GapCard key={idx} gap={gap} />
                                ))}

                                <div style={{ height: 20 }} />
                                <CopyableSection title="💼 Headline LinkedIn" content={reportData.linkedin_headline || ""} isHeadline />
                                <CopyableSection title="📝 Resumo Profissional Otimizado" content={reportData.resumo_otimizado || ""} />

                                {/* X-Ray Search */}
                                <div style={{ marginTop: 30, marginBottom: 20, borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 20 }}>
                                    <h3 style={{ color: "#F8FAFC", marginBottom: 15, fontSize: "1.5rem", fontWeight: 600 }}>🎯 X-Ray Search (Acesso ao Mercado Oculto)</h3>
                                    <div style={{
                                        background: "linear-gradient(135deg, rgba(15, 23, 42, 0.6) 0%, rgba(56, 189, 248, 0.1) 100%)",
                                        border: "1px solid #38BDF8",
                                        borderRadius: 12,
                                        padding: 20,
                                        position: "relative",
                                        overflow: "hidden"
                                    }}>
                                        <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, background: "#38BDF8", filter: "blur(50px)", opacity: 0.2 }} />

                                        <div style={{ marginBottom: 15 }}>
                                            <strong style={{ color: "#F8FAFC", fontSize: "1.05rem" }}>Como encontrar os Recrutadores dessa vaga?</strong>
                                            <p style={{ color: "#94A3B8", fontSize: "0.9rem", marginTop: 5, lineHeight: 1.5 }}>
                                                Não espere eles te acharem. Nossa IA gerou um código de busca avançada (Google Dorking) para filtrar Gestores, Recrutadores e Pares Sêniores.
                                            </p>
                                        </div>

                                        <a href={googleLink} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                                            <div style={{
                                                background: "#38BDF8",
                                                color: "#0F172A",
                                                textAlign: "center",
                                                padding: 12,
                                                borderRadius: 8,
                                                fontWeight: 800,
                                                fontSize: "1rem",
                                                transition: "transform 0.2s",
                                                boxShadow: "0 4px 15px rgba(56, 189, 248, 0.3)",
                                                cursor: "pointer"
                                            }}>
                                                🔍 CLIQUE PARA RODAR A BUSCA NO GOOGLE
                                            </div>
                                        </a>

                                        <div style={{ marginTop: 20 }}>
                                            <p style={{ fontSize: "0.75rem", color: "#64748B", marginBottom: 5, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>
                                                CÓDIGO GERADO PELA IA:
                                            </p>
                                            <div style={{
                                                background: "rgba(0,0,0,0.3)",
                                                border: "1px solid rgba(255,255,255,0.1)",
                                                borderRadius: 6,
                                                padding: 12,
                                                fontFamily: "monospace",
                                                fontSize: "0.85rem",
                                                color: "#CBD5E1",
                                                wordBreak: "break-all",
                                                lineHeight: 1.4
                                            }}>
                                                {googleLink}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {activeTab === "cv" && (
                    <div style={{ maxWidth: 850, margin: "0 auto" }}>
                        {loadingTabs.cv ? (
                            <LoadingPlaceholder
                                title="✍️ Otimizando seu currículo..."
                                description="Nossa IA está reestruturando seu currículo para destacar seus pontos fortes, adicionar métricas de impacto e alinhar com as melhores práticas do mercado. Este processo leva cerca de 20-30 segundos."
                            />
                        ) : (
                            <>
                                <h3 style={{ color: "#F8FAFC", marginBottom: 20 }}>🚀 Currículo Reestruturado Integralmente</h3>

                                {/* Editor */}
                                <details open={isEditorOpen} style={{
                                    background: "rgba(15, 23, 42, 0.4)",
                                    border: "1px solid rgba(255,255,255,0.05)",
                                    borderRadius: 8,
                                    padding: "12px",
                                    marginBottom: 20,
                                    cursor: "pointer"
                                }}>
                                    <summary
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setIsEditorOpen(!isEditorOpen);
                                            if (!isEditorOpen) {
                                                setEditedCvText(reportData.cv_otimizado_completo || "");
                                            }
                                        }}
                                        style={{ fontWeight: 600, color: "#CBD5E1", cursor: "pointer" }}
                                    >
                                        ✏️ ENCONTROU UM ERRO? CLIQUE PARA EDITAR O TEXTO
                                    </summary>
                                    {isEditorOpen && (
                                        <div style={{ marginTop: 15 }}>
                                            <div style={{
                                                background: "rgba(56, 189, 248, 0.1)",
                                                border: "1px solid rgba(56, 189, 248, 0.3)",
                                                borderRadius: 6,
                                                padding: 12,
                                                marginBottom: 12,
                                                color: "#38BDF8",
                                                fontSize: "0.85rem"
                                            }}>
                                                💡 Dica: Use **texto em negrito** para destacar cargos e empresas. Use | para separar cargo | empresa | data.
                                            </div>
                                            <textarea
                                                value={editedCvText}
                                                onChange={(e) => setEditedCvText(e.target.value)}
                                                style={{
                                                    width: "100%",
                                                    height: 400,
                                                    background: "rgba(15, 23, 42, 0.6)",
                                                    border: "1px solid rgba(56, 189, 248, 0.3)",
                                                    borderRadius: 6,
                                                    padding: 16,
                                                    color: "#F8FAFC",
                                                    fontFamily: "monospace",
                                                    fontSize: "14px",
                                                    lineHeight: 1.6,
                                                    resize: "vertical"
                                                }}
                                                placeholder="Cole seu currículo aqui..."
                                            />
                                            <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
                                                <button
                                                    onClick={handleSaveEdit}
                                                    style={{
                                                        background: "#10B981",
                                                        color: "white",
                                                        border: "none",
                                                        padding: "10px 20px",
                                                        borderRadius: 6,
                                                        fontWeight: 600,
                                                        cursor: "pointer"
                                                    }}
                                                >
                                                    💾 SALVAR
                                                </button>
                                                <button
                                                    onClick={() => setIsEditorOpen(false)}
                                                    style={{
                                                        background: "transparent",
                                                        color: "#CBD5E1",
                                                        border: "1px solid #CBD5E1",
                                                        padding: "10px 20px",
                                                        borderRadius: 6,
                                                        fontWeight: 600,
                                                        cursor: "pointer"
                                                    }}
                                                >
                                                    CANCELAR
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </details>

                                {/* CV Content */}
                                <div className="cv-paper-sheet" style={{
                                    padding: 32,
                                    fontSize: "15px",
                                    lineHeight: 1.7
                                }}>
                                    <div dangerouslySetInnerHTML={{ __html: formatTextToHtml(reportData.cv_otimizado_completo || "") }} />
                                </div>

                                {/* Download Buttons */}
                                <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
                                    <button
                                        onClick={handleDownloadPdf}
                                        style={{
                                            background: "#10B981",
                                            color: "white",
                                            border: "none",
                                            padding: "12px 20px",
                                            borderRadius: 8,
                                            fontWeight: 600,
                                            cursor: "pointer"
                                        }}
                                    >
                                        📄 BAIXAR PDF
                                    </button>
                                    <button
                                        onClick={handleDownloadWord}
                                        style={{
                                            background: "transparent",
                                            color: "#F8FAFC",
                                            border: "2px solid #F8FAFC",
                                            padding: "12px 20px",
                                            borderRadius: 8,
                                            fontWeight: 600,
                                            cursor: "pointer"
                                        }}
                                    >
                                        📝 BAIXAR WORD (EDITÁVEL)
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {activeTab === "biblioteca" && (
                    <div style={{ maxWidth: 850, margin: "0 auto" }}>
                        {loadingTabs.biblioteca ? (
                            <LoadingPlaceholder
                                title="📚 Montando sua biblioteca técnica..."
                                description="Estamos compilando os melhores livros, artigos e recursos técnicos específicos para sua área e nível de senioridade. Este processo leva cerca de 15-25 segundos."
                            />
                        ) : (
                            <>
                                <h3 style={{ color: "#F8FAFC", marginBottom: 20 }}>📚 Biblioteca Definitiva</h3>
                                {reportData.biblioteca_tecnica?.map((book, idx) => (
                                    <BookCard key={idx} book={book} index={idx} />
                                ))}
                            </>
                        )}
                    </div>
                )}

                {activeTab === "simulador" && (
                    <div style={{ maxWidth: 850, margin: "0 auto" }}>
                        {loadingTabs.simulador ? (
                            <LoadingPlaceholder
                                title="🎙️ Preparando simulador de entrevista..."
                                description="Estamos gerando perguntas personalizadas baseadas no seu CV e na vaga alvo. O simulador incluirá questões comportamentais, técnicas e situacionais relevantes para sua área."
                            />
                        ) : (
                            <InterviewSimulator
                                reportData={reportData}
                                onProgress={(questionIndex, total) => {
                                    if (questionIndex === total) {
                                        setLoadingTabs(prev => ({ ...prev, simulador: false }));
                                    }
                                }}
                            />
                        )}
                    </div>
                )}
            </div>

            {/* Botões de Ação */}
            <div style={{ marginTop: 40, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                <div style={{ maxWidth: 850, margin: "0 auto", display: "flex", gap: 16, marginBottom: 16 }}>
                    <button
                        onClick={() => { window.location.href = "/dashboard"; }}
                        style={{
                            background: "linear-gradient(135deg, rgba(56, 189, 248, 0.1), rgba(99, 102, 241, 0.1))",
                            border: "2px solid rgba(56, 189, 248, 0.3)",
                            color: "#38BDF8",
                            padding: "12px 24px",
                            borderRadius: 50,
                            fontWeight: 800,
                            textTransform: "uppercase",
                            cursor: "pointer",
                            flex: 1
                        }}
                    >
                        ⬅️ Voltar ao Dashboard
                    </button>
                    <button
                        onClick={onNewOptimization}
                        style={{
                            background: "linear-gradient(to bottom, #FFD54F 0%, #FF8F00 50%, #EF6C00 100%)",
                            border: "none",
                            color: "#210B00",
                            padding: "12px 24px",
                            borderRadius: 50,
                            fontWeight: 800,
                            textTransform: "uppercase",
                            cursor: "pointer",
                            flex: 1,
                            boxShadow: "0 4px 16px rgba(255, 143, 0, 0.4)"
                        }}
                    >
                        ➡️ Nova Otimização
                    </button>
                </div>
            </div>
        </div>
    );
}
