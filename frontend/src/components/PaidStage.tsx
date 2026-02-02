"use client";

import { useState } from "react";
import type { ReportData } from "@/types";
import { CopyableSection } from "./CopyableSection";
import { GapCard } from "./GapCard";
import { BookCard } from "./BookCard";

interface PaidStageProps {
    reportData: ReportData | null;
    authUserId: string | null;
    onNewOptimization: () => void;
    onUpdateReport: (updated: ReportData) => void;
}

export function PaidStage({ reportData, authUserId, onNewOptimization, onUpdateReport }: PaidStageProps) {
    const [activeTab, setActiveTab] = useState<"diagnostico" | "cv" | "biblioteca">("diagnostico");
    const [editedCvText, setEditedCvText] = useState("");
    const [isEditorOpen, setIsEditorOpen] = useState(false);

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
            if (text.includes('Ã£') || text.includes('Ã§') || text.includes('Ã©')) {
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
                html_output.push(`<div class="vant-cv-contact-line">${full_html}</div>`);
            }
            // Texto corrido
            else {
                let clean = line.replace(/\*\*(.*?)\*\*/g, '<span class="vant-bold">$1</span>');
                html_output.push(`<p class="vant-cv-paragraph">${clean}</p>`);
            }
        }

        return html_output.join("\n");
    };

    const kitHacker = reportData.kit_hacker || { boolean_string: "" };
    const googleLink = `https://www.google.com/search?q=${encodeURIComponent(kitHacker.boolean_string)}`;

    return (
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "20px 0" }}>
            {/* Dashboard de XP */}
            <div style={{
                background: "linear-gradient(90deg, rgba(15,23,42,1) 0%, rgba(30,41,59,1) 100%)",
                padding: 25,
                borderRadius: 16,
                border: `1px solid ${barColor}40`,
                marginBottom: 30,
                boxShadow: `0 4px 20px ${bgGlow}`
            }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 15 }}>
                    <div>
                        <div style={{ color: "#94A3B8", fontSize: "0.8rem", fontWeight: 600, letterSpacing: "1px", marginBottom: 4 }}>DIAGNÓSTICO TÉCNICO</div>
                        <div style={{ color: barColor, fontWeight: 800, fontSize: "1.4rem" }}>{nivelLabel}</div>
                        <div style={{ color: "#CBD5E1", fontSize: "0.9rem", marginTop: 4, fontStyle: "italic" }}>"{msgEgo}"</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "2rem", fontWeight: 800, color: "#F8FAFC", lineHeight: 1 }}>
                            {xpAtual}<span style={{ fontSize: "1rem", color: "#64748B" }}>/100</span>
                        </div>
                        <div style={{ fontSize: "0.75rem", color: barColor, fontWeight: "bold" }}>SCORE ATS</div>
                    </div>
                </div>

                <div style={{
                    width: "100%",
                    background: "rgba(0,0,0,0.6)",
                    height: 14,
                    borderRadius: 10,
                    overflow: "hidden",
                    border: "1px solid rgba(255,255,255,0.05)"
                }}>
                    <div style={{
                        width: `${xpAtual}%`,
                        background: barColor,
                        height: "100%",
                        transition: "width 1.5s cubic-bezier(0.4, 0, 0.2, 1)",
                        boxShadow: `0 0 15px ${barColor}`
                    }} />
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: "0.8rem", color: "#64748B" }}>
                    <span>Análise Estrutural: <strong style={{ color: "#E2E8F0" }}>Concluída</strong></span>
                    <span>Otimização Semântica: <strong style={{ color: "#E2E8F0" }}>Aplicada</strong></span>
                </div>
            </div>

            {/* Progresso do Dossiê */}
            <div style={{
                background: "rgba(15, 23, 42, 0.6)",
                border: "1px solid rgba(56, 189, 248, 0.1)",
                borderRadius: 12,
                padding: 20,
                marginBottom: 25
            }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 15 }}>
                    <span style={{ color: "#94A3B8", fontSize: "0.85rem", fontWeight: 600 }}>PROGRESSO DO DOSSIÊ</span>
                    <span style={{ color: "#10B981", fontSize: "0.9rem", fontWeight: 700 }}>3/3 SEÇÕES ✓</span>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                    <div style={{ flex: 1, height: 6, background: "#10B981", borderRadius: 3 }} title="Diagnóstico"></div>
                    <div style={{ flex: 1, height: 6, background: "#10B981", borderRadius: 3 }} title="CV Otimizado"></div>
                    <div style={{ flex: 1, height: 6, background: "#10B981", borderRadius: 3 }} title="Biblioteca"></div>
                </div>
                <p style={{ color: "#64748B", fontSize: "0.75rem", marginTop: 10, marginBottom: 0 }}>
                    🎉 Dossiê completo gerado! Explore todas as abas abaixo.
                </p>
            </div>

            {/* Tabs */}
            <div style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", gap: 8, borderBottom: "1px solid rgba(255,255,255,0.1)", marginBottom: 20 }}>
                    {[
                        { id: "diagnostico", label: "📊 DIAGNÓSTICO E AÇÃO" },
                        { id: "cv", label: "📄 CV OTIMIZADO" },
                        { id: "biblioteca", label: "📚 BIBLIOTECA" }
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
                                transition: "all 0.2s"
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                {activeTab === "diagnostico" && (
                    <div style={{ maxWidth: 850, margin: "0 auto" }}>
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
                                        padding: 10,
                                        borderRadius: 6,
                                        borderLeft: "2px solid #64748B",
                                        fontFamily: "monospace",
                                        fontSize: "0.75rem",
                                        color: "#CBD5E1",
                                        wordBreak: "break-all"
                                    }}>
                                        {kitHacker.boolean_string}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Projeto Prático */}
                        {reportData.projeto_pratico && (
                            <>
                                <div style={{ height: 20 }} />
                                <h3 style={{ color: "#F8FAFC", marginBottom: 15, fontSize: "1.5rem", fontWeight: 600 }}>🏆 Projeto Prático (Diferencial)</h3>
                                <div style={{
                                    background: "rgba(16, 185, 129, 0.05)",
                                    border: "1px solid #10B981",
                                    borderRadius: 12,
                                    padding: 20
                                }}>
                                    <h3 style={{ color: "#10B981", marginTop: 0, fontSize: "1.3rem", fontWeight: 700 }}>
                                        🔨 {reportData.projeto_pratico.titulo}
                                    </h3>
                                    <p style={{ color: "#E2E8F0", fontSize: "1rem", lineHeight: 1.6 }}>
                                        {reportData.projeto_pratico.descricao}
                                    </p>
                                    <div style={{
                                        marginTop: 15,
                                        paddingTop: 10,
                                        borderTop: "1px dashed rgba(16, 185, 129, 0.3)"
                                    }}>
                                        <strong style={{ color: "#38BDF8" }}>🚀 Pitch para Entrevista:</strong><br />
                                        <span style={{ color: "#94A3B8", fontStyle: "italic" }}>
                                            "{reportData.projeto_pratico.como_apresentar}"
                                        </span>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {activeTab === "cv" && (
                    <div style={{ maxWidth: 850, margin: "0 auto" }}>
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
                                style={{ fontWeight: 600, color: "#94A3B8", cursor: "pointer" }}
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
                                        💡 Edite o texto abaixo e clique em SALVAR para atualizar o PDF, o Word e a visualização.
                                    </div>
                                    <textarea
                                        value={editedCvText}
                                        onChange={(e) => setEditedCvText(e.target.value)}
                                        style={{
                                            width: "100%",
                                            height: 300,
                                            background: "rgba(15, 23, 42, 0.8)",
                                            border: "1px solid rgba(255,255,255,0.1)",
                                            borderRadius: 8,
                                            color: "#F8FAFC",
                                            padding: 12,
                                            fontFamily: "monospace",
                                            fontSize: "0.9rem",
                                            resize: "vertical"
                                        }}
                                    />
                                    <button
                                        onClick={handleSaveEdit}
                                        style={{
                                            background: "linear-gradient(90deg, #F59E0B, #D97706)",
                                            color: "white",
                                            border: "none",
                                            padding: "12px 24px",
                                            borderRadius: 50,
                                            fontWeight: 800,
                                            textTransform: "uppercase",
                                            cursor: "pointer",
                                            width: "100%",
                                            marginTop: 12
                                        }}
                                    >
                                        💾 SALVAR ALTERAÇÕES
                                    </button>
                                </div>
                            )}
                        </details>

                        {/* Preview do CV */}
                        <div className="cv-paper-sheet">
                            <div
                                className="cv-content-flow"
                                dangerouslySetInnerHTML={{ __html: formatTextToHtml(reportData.cv_otimizado_completo || "") }}
                            />
                        </div>

                        {/* Botões de Download */}
                        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 20 }}>
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
                                📥 BAIXAR PDF (OFICIAL)
                            </button>
                            <button
                                onClick={handleDownloadWord}
                                style={{
                                    background: "#38BDF8",
                                    color: "#0F172A",
                                    border: "none",
                                    padding: "12px 20px",
                                    borderRadius: 8,
                                    fontWeight: 600,
                                    cursor: "pointer"
                                }}
                            >
                                📝 BAIXAR WORD (EDITÁVEL)
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === "biblioteca" && (
                    <div style={{ maxWidth: 850, margin: "0 auto" }}>
                        <h3 style={{ color: "#F8FAFC", marginBottom: 20 }}>📚 Biblioteca Definitiva</h3>
                        {reportData.biblioteca_tecnica?.map((book, idx) => (
                            <BookCard key={idx} book={book} index={idx} />
                        ))}
                    </div>
                )}
            </div>

            {/* Botão Nova Otimização */}
            <div style={{ marginTop: 40, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                <button
                    onClick={onNewOptimization}
                    style={{
                        background: "transparent",
                        border: "2px solid #F59E0B",
                        color: "#F59E0B",
                        padding: "12px 24px",
                        borderRadius: 50,
                        fontWeight: 800,
                        textTransform: "uppercase",
                        cursor: "pointer",
                        width: "100%"
                    }}
                >
                    Analisar outro perfil
                </button>
            </div>
        </div>
    );
}
