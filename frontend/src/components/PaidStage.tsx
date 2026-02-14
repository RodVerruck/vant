"use client";

import { useState, useEffect } from "react";
import type { ReportData } from "@/types";
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

const CircularGauge = ({
    value,
    size,
    color,
    label,
    valueLabel,
    glow = false,
}: {
    value: number;
    size: number;
    color: string;
    label: string;
    valueLabel: string;
    glow?: boolean;
}) => {
    const clamped = Math.max(0, Math.min(100, value));
    return (
        <div style={{ textAlign: "center" }}>
            <div
                style={{
                    width: size,
                    height: size,
                    borderRadius: "50%",
                    background: `conic-gradient(${color} ${clamped * 3.6}deg, rgba(148, 163, 184, 0.2) 0deg)`,
                    padding: 8,
                    boxShadow: glow ? `0 0 36px ${color}55` : "0 14px 28px rgba(2, 6, 23, 0.35)",
                    margin: "0 auto 10px",
                }}
            >
                <div
                    style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: "50%",
                        background: "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.16), rgba(15,23,42,0.94))",
                        border: "1px solid rgba(255,255,255,0.18)",
                        display: "grid",
                        placeItems: "center",
                    }}
                >
                    <div style={{ fontSize: size > 140 ? "1.9rem" : "1.45rem", fontWeight: 800, color: "#F8FAFC" }}>{valueLabel}</div>
                </div>
            </div>
            <div style={{ color: "#CBD5E1", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
        </div>
    );
};

interface PaidStageProps {
    reportData: ReportData | null;
    authUserId: string | null;
    creditsRemaining?: number;
    onNewOptimization: () => void;
    onUpdateReport: (updated: ReportData) => void;
    onViewHistory?: () => void;
}

export function PaidStage({ reportData, authUserId, creditsRemaining = 0, onNewOptimization, onUpdateReport, onViewHistory }: PaidStageProps) {
    const [activeTab, setActiveTab] = useState<"diagnostico" | "cv" | "biblioteca" | "simulador">("diagnostico");
    const [editedCvText, setEditedCvText] = useState("");
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [copiedField, setCopiedField] = useState<"headline" | "summary" | null>(null);
    const [openGapIndex, setOpenGapIndex] = useState<number | null>(0);

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

    const notaEstrutural = typeof reportData.nota_ats_estrutura === "number"
        ? reportData.nota_ats_estrutura
        : (reportData.nota_ats ?? 0);
    const notaConteudo = typeof reportData.nota_ats_conteudo === "number"
        ? reportData.nota_ats_conteudo
        : (reportData.nota_ats ?? 0);
    const xpAtual = Math.min(100, notaEstrutural);

    const reportContentGapCount = Math.min(2, reportData.gaps_fatais ? reportData.gaps_fatais.length : 0);
    const reportDataWithPreviewGaps = reportData as ReportData & { gap_1?: unknown; gap_2?: unknown };
    const reportPreviewGapCount = (reportDataWithPreviewGaps.gap_1 ? 1 : 0) + (reportDataWithPreviewGaps.gap_2 ? 1 : 0);
    const gapsCount = reportPreviewGapCount > 0 ? reportPreviewGapCount : reportContentGapCount;

    const impacto = reportData.analise_por_pilares?.impacto || 0;
    const keywords = reportData.analise_por_pilares?.keywords || 0;
    const ats = reportData.analise_por_pilares?.ats || 0;

    const projected = calculateProjectedScore(xpAtual, gapsCount, 0, ats, keywords, impacto);

    useEffect(() => {
        if (process.env.NODE_ENV === "production") return;
        console.log("[PaidStage][score-debug]", {
            scoreSourceLabel: "reportData",
            notaEstrutural,
            notaConteudo,
            reportNota: reportData?.nota_ats,
            renderedNota: xpAtual,
            renderedProjected: projected.score,
            gapsCount,
            pilares: { ats, keywords, impacto },
        });
    }, [
        notaEstrutural,
        notaConteudo,
        reportData,
        xpAtual,
        projected.score,
        gapsCount,
        ats,
        keywords,
        impacto,
    ]);

    let seniorityLabel = "JÚNIOR";
    let seniorityColor = "#F59E0B";
    let seniorityMessage = "Seu currículo já tem potencial, mas ainda transmite menos senioridade do que você realmente possui.";

    if (xpAtual >= 85) {
        seniorityLabel = "SÊNIOR";
        seniorityColor = "#22C55E";
        seniorityMessage = "Excelente base. Agora o foco é elevar precisão e posicionamento para vagas estratégicas.";
    } else if (xpAtual >= 60) {
        seniorityLabel = "PLENO";
        seniorityColor = "#FB923C";
        seniorityMessage = "Seu perfil está forte, com espaço claro para ganhar autoridade e aumentar competitividade.";
    }

    const tabs = [
        { id: "diagnostico", label: "Diagnóstico" },
        { id: "cv", label: "CV Otimizado" },
        { id: "biblioteca", label: "Biblioteca" },
        { id: "simulador", label: "Simulador" },
    ] as const;

    const formatDiagnostic = (text: string) => {
        if (!text) return "";
        return text.replace(/\*\*(.*?)\*\*/g, '<strong style="color:#E2E8F0">$1</strong>');
    };

    const handleCopyText = async (field: "headline" | "summary", content: string) => {
        try {
            await navigator.clipboard.writeText(content);
            setCopiedField(field);
            setTimeout(() => setCopiedField(null), 1800);
        } catch (error) {
            console.error("Erro ao copiar texto:", error);
        }
    };

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

    const pageStyle = {
        minHeight: "100vh",
        color: "#F8FAFC",
        background: "radial-gradient(900px 520px at 12% 5%, rgba(249, 115, 22, 0.16), rgba(10, 15, 30, 0) 72%), radial-gradient(1000px 620px at 88% 12%, rgba(34, 211, 238, 0.13), rgba(10, 15, 30, 0) 76%), linear-gradient(135deg, #05070f 0%, #090f1d 45%, #071226 100%)"
    } as const;

    const sectionGlassStyle = {
        maxWidth: 1200,
        margin: "0 auto",
        padding: "22px 20px 18px",
        borderRadius: 20,
        background: "linear-gradient(135deg, rgba(15, 23, 42, 0.7), rgba(30, 41, 59, 0.45))",
        border: "1px solid rgba(148, 163, 184, 0.18)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        boxShadow: "0 30px 70px rgba(2, 6, 23, 0.45), inset 0 1px 0 rgba(255,255,255,0.06)"
    } as const;

    const tabContentGlassStyle = {
        borderRadius: 22,
        border: "1px solid rgba(255, 255, 255, 0.12)",
        background: "linear-gradient(140deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02))",
        padding: "28px 20px 20px",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        boxShadow: "0 35px 80px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255,255,255,0.15)"
    } as const;

    return (
        <div style={pageStyle}>
            <div style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 18px 34px" }}>
                <header style={{ marginBottom: 22 }}>
                    <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 14,
                        flexWrap: "wrap",
                        marginBottom: 18
                    }}>
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            color: "#F8FAFC",
                            fontWeight: 700,
                            letterSpacing: "0.08em"
                        }}>
                            <div style={{
                                width: 34,
                                height: 34,
                                borderRadius: 12,
                                background: "linear-gradient(145deg, rgba(249,115,22,0.25), rgba(255,255,255,0.08))",
                                border: "1px solid rgba(255,255,255,0.18)",
                                display: "grid",
                                placeItems: "center",
                                boxShadow: "0 14px 30px rgba(0,0,0,0.28)"
                            }}>
                                V
                            </div>
                            VANT
                        </div>

                        <div style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 8,
                            borderRadius: 999,
                            padding: "8px 14px",
                            border: "1px solid rgba(255,255,255,0.14)",
                            background: "linear-gradient(140deg, rgba(255,255,255,0.12), rgba(255,255,255,0.04))",
                            backdropFilter: "blur(20px)",
                            WebkitBackdropFilter: "blur(20px)",
                            color: "#E2E8F0",
                            fontWeight: 600,
                            fontSize: "0.9rem"
                        }}>
                            <span style={{ color: "#FB923C" }}>●</span>
                            Créditos: <strong style={{ color: "#F8FAFC" }}>{creditsRemaining}</strong>
                        </div>
                    </div>

                    <div style={sectionGlassStyle}>
                        <h1 style={{
                            fontSize: "clamp(1.8rem, 3vw, 2.6rem)",
                            fontWeight: 800,
                            letterSpacing: "-0.03em",
                            marginBottom: 6
                        }}>
                            Resultado da Análise
                        </h1>
                        <p style={{ color: "#CBD5E1", marginBottom: 20 }}>
                            Visão estratégica do seu currículo para {reportData.setor_detectado || "sua área"}, com foco em clareza e ações de alto impacto.
                        </p>

                        <div style={{
                            borderRadius: 20,
                            border: "1px solid rgba(255,255,255,0.14)",
                            background: "linear-gradient(140deg, rgba(255,255,255,0.10), rgba(255,255,255,0.03))",
                            backdropFilter: "blur(20px)",
                            WebkitBackdropFilter: "blur(20px)",
                            padding: "20px 18px",
                            boxShadow: "0 30px 80px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.18)",
                            position: "relative",
                            overflow: "hidden"
                        }}>
                            <div style={{
                                position: "absolute",
                                inset: 0,
                                background: "linear-gradient(160deg, rgba(255,255,255,0.12), rgba(255,255,255,0))",
                                pointerEvents: "none"
                            }} />

                            <div style={{
                                position: "relative",
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                                gap: 18,
                                alignItems: "center"
                            }}>
                                <div style={{
                                    borderRadius: 16,
                                    border: "1px solid rgba(255,255,255,0.12)",
                                    background: "rgba(10, 15, 30, 0.34)",
                                    padding: "16px 14px"
                                }}>
                                    <div style={{ color: "#94A3B8", marginBottom: 8, fontSize: "0.82rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                                        Senioridade Detectada
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                        <span style={{ fontSize: "1.3rem" }}>⚠️</span>
                                        <strong style={{ fontSize: "1.55rem", color: seniorityColor, letterSpacing: "0.03em" }}>{seniorityLabel}</strong>
                                    </div>
                                    <p style={{ marginTop: 10, color: "#CBD5E1", lineHeight: 1.5 }}>
                                        {seniorityMessage}
                                    </p>
                                </div>

                                <div style={{
                                    display: "flex",
                                    gap: 18,
                                    justifyContent: "center",
                                    flexWrap: "wrap"
                                }}>
                                    <CircularGauge
                                        value={xpAtual}
                                        size={128}
                                        color="#FB923C"
                                        label="Score Atual"
                                        valueLabel={`${xpAtual}%`}
                                    />
                                    <CircularGauge
                                        value={projected.score}
                                        size={158}
                                        color="#22D3EE"
                                        label="Potencial Projetado"
                                        valueLabel={`${projected.score}/100`}
                                        glow
                                    />
                                </div>
                            </div>

                            <p style={{
                                position: "relative",
                                marginTop: 16,
                                color: "#E2E8F0",
                                lineHeight: 1.6
                            }}>
                                Com pequenos ajustes de linguagem e estrutura, você pode evoluir <strong style={{ color: "#22D3EE" }}>+{projected.improvement}%</strong> e reduzir o risco de rejeição automática.
                            </p>
                        </div>
                    </div>

                    <div style={{
                        marginTop: 16,
                        display: "flex",
                        gap: 10,
                        overflowX: "auto",
                        paddingBottom: 4,
                        scrollbarWidth: "thin"
                    }}>
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                style={{
                                    borderRadius: 999,
                                    padding: "11px 16px",
                                    border: activeTab === tab.id ? "1px solid rgba(249, 115, 22, 0.65)" : "1px solid rgba(255,255,255,0.14)",
                                    background: activeTab === tab.id
                                        ? "linear-gradient(140deg, rgba(249, 115, 22, 0.26), rgba(255,255,255,0.08))"
                                        : "linear-gradient(140deg, rgba(255,255,255,0.09), rgba(255,255,255,0.02))",
                                    color: activeTab === tab.id ? "#FFF7ED" : "#CBD5E1",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    whiteSpace: "nowrap",
                                    backdropFilter: "blur(18px)",
                                    WebkitBackdropFilter: "blur(18px)",
                                    boxShadow: activeTab === tab.id ? "0 10px 26px rgba(249,115,22,0.24)" : "none",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 8
                                }}
                            >
                                {loadingTabs[tab.id] ? (
                                    <>
                                        <span style={{
                                            width: 14,
                                            height: 14,
                                            borderRadius: "50%",
                                            border: "2px solid currentColor",
                                            borderTopColor: "transparent",
                                            animation: "spin 1s linear infinite"
                                        }} />
                                        IA processando
                                    </>
                                ) : tab.label}
                            </button>
                        ))}
                    </div>
                </header>

                <div style={tabContentGlassStyle}>
                    {activeTab === "diagnostico" && (
                        <div style={{ maxWidth: 980, margin: "0 auto" }}>
                            {loadingTabs.diagnostico ? (
                                <LoadingPlaceholder
                                    title="🔍 Analisando seu currículo..."
                                    description="Estamos examinando seu currículo em detalhes para identificar gaps críticos, oportunidades de melhoria e alinhamento com o mercado. Este processo leva cerca de 15-20 segundos."
                                />
                            ) : (
                                <>
                                    <h3 style={{ color: "#F8FAFC", marginBottom: 18, fontSize: "1.45rem", fontWeight: 700 }}>
                                        Plano de Correção
                                    </h3>

                                    <div style={{ display: "grid", gap: 12 }}>
                                        {reportData.gaps_fatais?.map((gap, idx) => {
                                            const isOpen = openGapIndex === idx;
                                            return (
                                                <div
                                                    key={idx}
                                                    style={{
                                                        borderRadius: 16,
                                                        border: "1px solid rgba(255,255,255,0.12)",
                                                        background: "linear-gradient(140deg, rgba(255,255,255,0.09), rgba(255,255,255,0.02))",
                                                        backdropFilter: "blur(20px)",
                                                        WebkitBackdropFilter: "blur(20px)",
                                                        overflow: "hidden",
                                                        boxShadow: "0 14px 34px rgba(0,0,0,0.24)"
                                                    }}
                                                >
                                                    <button
                                                        onClick={() => setOpenGapIndex(isOpen ? null : idx)}
                                                        style={{
                                                            width: "100%",
                                                            border: "none",
                                                            background: "transparent",
                                                            padding: "14px 16px",
                                                            textAlign: "left",
                                                            display: "flex",
                                                            justifyContent: "space-between",
                                                            alignItems: "center",
                                                            color: "#F8FAFC",
                                                            cursor: "pointer"
                                                        }}
                                                    >
                                                        <span style={{ display: "inline-flex", alignItems: "center", gap: 10, fontWeight: 600 }}>
                                                            <span style={{ color: "#FB923C" }}>{idx + 1 <= 2 ? "⚡" : "⚠️"}</span>
                                                            {idx + 1}. {gap.erro}
                                                        </span>
                                                        <span style={{ color: "#CBD5E1", transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.25s ease" }}>⌄</span>
                                                    </button>

                                                    {isOpen && (
                                                        <div style={{ padding: "0 16px 16px" }}>
                                                            <div
                                                                style={{
                                                                    color: "#CBD5E1",
                                                                    lineHeight: 1.6,
                                                                    marginBottom: 12,
                                                                    fontStyle: "italic"
                                                                }}
                                                                dangerouslySetInnerHTML={{ __html: `Evidência: \"${formatDiagnostic(gap.evidencia)}\"` }}
                                                            />

                                                            <div
                                                                style={{
                                                                    borderRadius: 12,
                                                                    border: "1px solid rgba(34, 211, 238, 0.34)",
                                                                    background: "linear-gradient(135deg, rgba(34,211,238,0.12), rgba(255,255,255,0.05))",
                                                                    padding: "12px 13px",
                                                                    color: "#F8FAFC",
                                                                    lineHeight: 1.55,
                                                                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.14)"
                                                                }}
                                                                dangerouslySetInnerHTML={{ __html: `💡 ${formatDiagnostic(gap.correcao_sugerida)}` }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div style={{
                                        marginTop: 24,
                                        display: "grid",
                                        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                                        gap: 14
                                    }}>
                                        <div style={{
                                            borderRadius: 16,
                                            border: "1px solid rgba(255,255,255,0.12)",
                                            background: "linear-gradient(140deg, rgba(255,255,255,0.09), rgba(255,255,255,0.02))",
                                            backdropFilter: "blur(20px)",
                                            WebkitBackdropFilter: "blur(20px)",
                                            padding: 16
                                        }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 10, alignItems: "center" }}>
                                                <strong style={{ color: "#F8FAFC", fontSize: "1rem" }}>💼 Headline LinkedIn</strong>
                                                <button
                                                    onClick={() => handleCopyText("headline", reportData.linkedin_headline || "")}
                                                    style={{
                                                        borderRadius: 999,
                                                        border: "1px solid rgba(255,255,255,0.14)",
                                                        background: "rgba(255,255,255,0.08)",
                                                        color: "#E2E8F0",
                                                        padding: "6px 11px",
                                                        cursor: "pointer",
                                                        fontSize: "0.8rem"
                                                    }}
                                                >
                                                    {copiedField === "headline" ? "✓ Copiado" : "📋 Copiar texto"}
                                                </button>
                                            </div>
                                            <pre style={{
                                                margin: 0,
                                                whiteSpace: "pre-wrap",
                                                color: "#E2E8F0",
                                                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                                                lineHeight: 1.55,
                                                background: "rgba(5,10,20,0.42)",
                                                borderRadius: 12,
                                                border: "1px solid rgba(255,255,255,0.10)",
                                                padding: 12
                                            }}>
                                                {reportData.linkedin_headline || "Sem conteúdo no momento."}
                                            </pre>
                                        </div>

                                        <div style={{
                                            borderRadius: 16,
                                            border: "1px solid rgba(255,255,255,0.12)",
                                            background: "linear-gradient(140deg, rgba(255,255,255,0.09), rgba(255,255,255,0.02))",
                                            backdropFilter: "blur(20px)",
                                            WebkitBackdropFilter: "blur(20px)",
                                            padding: 16
                                        }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 10, alignItems: "center" }}>
                                                <strong style={{ color: "#F8FAFC", fontSize: "1rem" }}>📝 Resumo Profissional</strong>
                                                <button
                                                    onClick={() => handleCopyText("summary", reportData.resumo_otimizado || "")}
                                                    style={{
                                                        borderRadius: 999,
                                                        border: "1px solid rgba(255,255,255,0.14)",
                                                        background: "rgba(255,255,255,0.08)",
                                                        color: "#E2E8F0",
                                                        padding: "6px 11px",
                                                        cursor: "pointer",
                                                        fontSize: "0.8rem"
                                                    }}
                                                >
                                                    {copiedField === "summary" ? "✓ Copiado" : "📋 Copiar texto"}
                                                </button>
                                            </div>
                                            <pre style={{
                                                margin: 0,
                                                whiteSpace: "pre-wrap",
                                                color: "#E2E8F0",
                                                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                                                lineHeight: 1.55,
                                                background: "rgba(5,10,20,0.42)",
                                                borderRadius: 12,
                                                border: "1px solid rgba(255,255,255,0.10)",
                                                padding: 12
                                            }}>
                                                {reportData.resumo_otimizado || "Sem conteúdo no momento."}
                                            </pre>
                                        </div>
                                    </div>

                                    <div style={{
                                        marginTop: 20,
                                        borderRadius: 18,
                                        border: "1px solid rgba(251, 146, 60, 0.5)",
                                        background: "linear-gradient(135deg, rgba(249,115,22,0.16), rgba(34,211,238,0.07), rgba(255,255,255,0.04))",
                                        backdropFilter: "blur(20px)",
                                        WebkitBackdropFilter: "blur(20px)",
                                        boxShadow: "0 24px 54px rgba(0,0,0,0.26), inset 0 1px 0 rgba(255,255,255,0.16)",
                                        padding: 20
                                    }}>
                                        <h3 style={{ color: "#F8FAFC", marginBottom: 10, fontSize: "1.2rem" }}>
                                            Bônus: Acesso ao Mercado Oculto (X-Ray Search)
                                        </h3>
                                        <p style={{ color: "#CBD5E1", marginBottom: 14, lineHeight: 1.55 }}>
                                            Use uma busca avançada para encontrar recrutadores e gestores fora das vagas abertas tradicionais.
                                        </p>

                                        <a href={googleLink} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                                            <button style={{
                                                width: "100%",
                                                border: "none",
                                                borderRadius: 12,
                                                padding: "14px 18px",
                                                cursor: "pointer",
                                                background: "linear-gradient(180deg, #FB923C 0%, #F97316 52%, #EA580C 100%)",
                                                color: "#2A1202",
                                                fontWeight: 800,
                                                fontSize: "1rem",
                                                boxShadow: "0 16px 34px rgba(249,115,22,0.35)"
                                            }}>
                                                🔍 Rodar Busca Avançada no Google
                                            </button>
                                        </a>
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

                                    <div className="cv-paper-sheet" style={{ padding: 32, fontSize: "15px", lineHeight: 1.7 }}>
                                        <div dangerouslySetInnerHTML={{ __html: formatTextToHtml(reportData.cv_otimizado_completo || "") }} />
                                    </div>

                                    <div style={{ marginTop: 24, display: "flex", gap: 12, flexWrap: "wrap" }}>
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
            </div>

            {/* Botões de Ação */}
            <div style={{ marginTop: 30, padding: "0 0 26px" }}>
                <div style={{
                    maxWidth: 1200,
                    margin: "0 auto",
                    borderTop: "1px solid rgba(255,255,255,0.08)",
                    paddingTop: 20,
                    background: "rgba(2,6,23,0.55)",
                    borderRadius: 18,
                    border: "1px solid rgba(255,255,255,0.08)",
                    backdropFilter: "blur(18px)",
                    WebkitBackdropFilter: "blur(18px)",
                    boxShadow: "0 18px 34px rgba(0,0,0,0.3)",
                    paddingLeft: 16,
                    paddingRight: 16,
                    paddingBottom: 16
                }}>
                    <div style={{ maxWidth: 980, margin: "0 auto", display: "flex", gap: 16, marginBottom: 0, flexWrap: "wrap" }}>
                        <button
                            onClick={() => { window.location.href = "/dashboard"; }}
                            style={{
                                background: "rgba(255,255,255,0.03)",
                                border: "1px solid rgba(255,255,255,0.22)",
                                color: "#E2E8F0",
                                padding: "12px 24px",
                                borderRadius: 50,
                                fontWeight: 700,
                                cursor: "pointer",
                                flex: "1 1 260px",
                                minHeight: 52
                            }}
                        >
                            ← Voltar ao Dashboard
                        </button>
                        <button
                            onClick={onNewOptimization}
                            style={{
                                background: "linear-gradient(180deg, #FB923C 0%, #F97316 52%, #EA580C 100%)",
                                border: "none",
                                color: "#2A1202",
                                padding: "12px 24px",
                                borderRadius: 50,
                                fontWeight: 800,
                                cursor: "pointer",
                                flex: "1 1 260px",
                                minHeight: 52,
                                boxShadow: "0 12px 30px rgba(249, 115, 22, 0.35)"
                            }}
                        >
                            Aplicar Correções
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
