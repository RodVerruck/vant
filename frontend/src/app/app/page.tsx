"use client";

import { useMemo, useRef, useState } from "react";

const HERO_INNER_HTML = `
    <div class="badge">
        <span>💠</span> 
        <span class="vant-tooltip" 
              tabindex="0" 
              style="border-bottom: none; cursor: help;" 
              data-tooltip="Atualização V2: Nova arquitetura de leitura 100% compatível com Gupy, Greenhouse e Workday.">
            VANT NEURAL ENGINE V2.0 LIVE
        </span>
    </div>

    <div class="logo-text">VANT</div>

    <div class="headline">
        Chega de rejeições invisíveis.<br>
        <span class="highlight">Vença o algoritmo.</span>
    </div>

    <div class="subheadline">
        Não deixe um robô decidir seu futuro. Nossa IA faz engenharia reversa da vaga
        e reescreve seu currículo para passar na triagem automática e chegar na mão do recrutador.
    </div>

    <div class="stats-grid">
        <div class="stat-card">
            <div class="stat-number">+34%</div>
            <div class="stat-label">
                Score Médio<br>
                <span class="vant-tooltip" tabindex="0" data-tooltip="Aumento médio de pontuação comparado ao currículo original (Base: 50k+ processamentos).">
                    Otimização ℹ️
                </span>
            </div>
        </div>
        
        <div class="stat-card">
            <div class="stat-number">3x</div>
            <div class="stat-label">
                Mais Entrevistas<br>
                <span class="vant-tooltip" tabindex="0" data-tooltip="Média de conversão de usuários ativos nos últimos 3 meses.">
                    Performance ℹ️
                </span>
            </div>
        </div>
        
        <div class="stat-card">
            <div class="stat-number">100%</div>
            <div class="stat-label">
                Privacidade<br>
                <span class="vant-tooltip" tabindex="0" data-tooltip="Processamento em memória volátil (RAM). Seus dados são destruídos após a sessão. Zero logs">
                    Dados Anônimos ℹ️
                </span>
            </div>
        </div>
    </div>
`;

const LINKEDIN_INSTRUCTIONS_HTML = `
        <div style="background: rgba(56, 189, 248, 0.05); 
                    border-left: 3px solid #38BDF8; 
                    padding: 16px; 
                    margin-bottom: 12px;
                    border-radius: 4px;">
            <p style="color: #94A3B8; font-size: 0.85rem; margin: 0; line-height: 1.6;">
                <strong>Quer descobrir os segredos de quem já foi contratado?</strong><br>
                Anexe o CV de um profissional da área e a IA fará a engenharia reversa para aplicar os acertos no seu perfil.<br>
                <br>
                <span style="color: #E2E8F0;">⚡ Não tem arquivo? Fique tranquilo.</span><br>
                
                <span style="color: #FFFFFF; font-weight: 500; letter-spacing: 0.3px;">
                    O sistema usará automaticamente nosso padrão "Top Performer" para essa vaga.
                </span>
            </p>
        </div>

        <details style="
            background: rgba(15, 23, 42, 0.4); 
            border: 1px solid rgba(255,255,255,0.05);
            border-radius: 6px;
            padding: 8px 12px;
            margin-bottom: 16px;
            cursor: pointer;
            color: #94A3B8; 
            font-size: 0.8rem;">
            
            <summary style="font-weight: 600; outline: none; list-style: none;">
                💡 Como baixar um perfil do LinkedIn em PDF? (Clique aqui)
            </summary>
            
            <ol style="margin-top: 12px; margin-bottom: 4px; padding-left: 20px; color: #cbd5e1; line-height: 1.6;">
                <li>Acesse o perfil da pessoa no <strong>LinkedIn</strong> (pelo computador).</li>
                <li>Clique no botão <strong>"Mais"</strong> (abaixo da foto/cargo).</li>
                <li>Selecione a opção <strong>"Salvar como PDF"</strong>.</li>
                <li>Anexe o arquivo baixado no campo abaixo 👇.</li>
            </ol>
        </details>
`;

function calculateDynamicCvCount() {
    const now = new Date();
    const baseCount = 12;
    const ratePerHour = 14;
    const currentCount = baseCount + now.getHours() * ratePerHour + Math.floor(now.getMinutes() / 4);
    const daySeed = now.getDate() * 3;
    return currentCount + daySeed;
}

export default function AppPage() {
    const [stage, setStage] = useState<"hero" | "analyzing" | "preview" | "checkout">("hero");
    const [jobDescription, setJobDescription] = useState<string>("");
    const [file, setFile] = useState<File | null>(null);
    const [competitorFiles, setCompetitorFiles] = useState<File[]>([]);
    const [selectedPlan, setSelectedPlan] = useState<"basico" | "pro" | "premium_plus" | "">("");
    const [progress, setProgress] = useState<number>(0);
    const [statusText, setStatusText] = useState<string>("");
    const [apiError, setApiError] = useState<string>("");
    const [previewData, setPreviewData] = useState<any>(null);
    const uploaderInputRef = useRef<HTMLInputElement | null>(null);
    const competitorUploaderInputRef = useRef<HTMLInputElement | null>(null);

    const trustFooterHtml = useMemo(() => {
        const cvCount = calculateDynamicCvCount();
        return `
    <style>
        @keyframes pulse-animation {
            0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
            70% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
            100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
        .live-dot {
            width: 8px;
            height: 8px;
            background-color: #10B981;
            border-radius: 50%;
            display: inline-block;
            margin-right: 6px;
            animation: pulse-animation 2s infinite;
        }
    </style>

    <div class="trust-footer">
        <div class="footer-stat">
            <div class="live-dot"></div>
            <span><strong>${cvCount}</strong> CVs Otimizados Hoje</span>
        </div>
        
        <div style="width: 1px; height: 15px; background: rgba(255,255,255,0.1); display: inline-block;"></div>

        <div class="footer-stat">
            <span class="footer-icon">📈</span>
            <span>+34% Score Médio</span>
        </div>

        <div style="width: 1px; height: 15px; background: rgba(255,255,255,0.1); display: inline-block;"></div>

        <div class="footer-stat">
            <span class="footer-icon">🤖</span>
            <span>50k+ Padrões Analisados</span>
        </div>
    </div>
    `;
    }, []);

    function sleep(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    async function onStart() {
        if (!jobDescription.trim() || !file) {
            return;
        }

        setApiError("");
        setPreviewData(null);
        setProgress(0);
        setStatusText("");
        setStage("analyzing");

        await sleep(120);

        try {
            const updateStatus = async (text: string, percent: number) => {
                setStatusText(text);
                setProgress(percent);
                await sleep(220);
            };

            await updateStatus("INICIANDO SCANNER BIOMÉTRICO DO CV...", 10);
            await updateStatus("MAPEANDO DENSIDADE DE PALAVRAS-CHAVE...", 40);

            const form = new FormData();
            form.append("job_description", jobDescription);
            form.append("file", file);

            const resp = await fetch("http://127.0.0.1:8000/api/analyze-lite", {
                method: "POST",
                body: form,
            });

            if (!resp.ok) {
                const text = await resp.text();
                throw new Error(text || `HTTP ${resp.status}`);
            }

            const data = await resp.json();

            await updateStatus("CALCULANDO SCORE DE ADERÊNCIA...", 80);
            await sleep(450);
            await updateStatus("RELATÓRIO PRELIMINAR PRONTO.", 100);
            await sleep(350);

            setPreviewData(data);
            setStage("preview");
        } catch (e: any) {
            const message = e?.message ? String(e.message) : "Erro no Scanner Lite";
            setApiError(message);
            setStage("hero");
        }
    }

    function openFileDialog() {
        uploaderInputRef.current?.click();
    }

    function openCompetitorFileDialog() {
        competitorUploaderInputRef.current?.click();
    }

    function calcPotencial(nota: number) {
        if (nota < 50) {
            return Math.min(nota + 25, 60);
        }
        if (nota < 80) {
            return Math.min(nota + 35, 95);
        }
        return Math.min(nota + 10, 99);
    }

    function renderDashboardMetrics(nota: number, veredito: string, potencial: number, pilares: any) {
        let theme_color = "#F59E0B";
        let shadow_color = "rgba(245, 158, 11, 0.4)";
        let bg_gradient = "linear-gradient(145deg, rgba(245, 158, 11, 0.1), rgba(0, 0, 0, 0))";

        if (nota < 50) {
            theme_color = "#EF4444";
            shadow_color = "rgba(239, 68, 68, 0.4)";
            bg_gradient = "linear-gradient(145deg, rgba(239, 68, 68, 0.1), rgba(0, 0, 0, 0))";
        } else if (nota >= 80) {
            theme_color = "#10B981";
            shadow_color = "rgba(16, 185, 129, 0.4)";
            bg_gradient = "linear-gradient(145deg, rgba(16, 185, 129, 0.1), rgba(0, 0, 0, 0))";
        }

        const miniBar = (label: string, value: number | null | undefined) => {
            const safeValue = typeof value === "number" ? value : 0;
            return `
        <div style="margin-bottom: 12px;">
            <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                <span style="color:#94A3B8; font-size:0.75rem; font-weight:600; letter-spacing:0.5px;">${label.toUpperCase()}</span>
                <span style="color:#F8FAFC; font-size:0.75rem; font-weight:bold; font-family:monospace;">${safeValue}%</span>
            </div>
            <div style="width:100%; background:rgba(255,255,255,0.05); height:6px; border-radius:3px; overflow: hidden;">
                <div style="width:${safeValue}%; background:${theme_color}; height:100%; border-radius:3px; box-shadow: 0 0 8px ${shadow_color};"></div>
            </div>
        </div>
        `;
        };

        return `
    <div style="
        background: rgba(15, 23, 42, 0.7);
        background-image: ${bg_gradient};
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 16px;
        padding: 24px;
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        box-shadow: 0 10px 40px rgba(0,0,0,0.5);
        margin-bottom: 32px;
        display: flex;
        flex-wrap: wrap;
        gap: 24px;
        align-items: center;
        justify-content: space-between;
    ">
        <div style="flex: 1; min-width: 200px; text-align: center; border-right: 1px solid rgba(255,255,255,0.05); padding-right: 24px;">
            <div style="font-size: 0.7rem; color: #64748B; letter-spacing: 2px; font-weight: 700; margin-bottom: 8px;">ADERÊNCIA TÉCNICA</div>
            <div style="
                font-size: 4.5rem; 
                font-weight: 800; 
                line-height: 1; 
                color: ${theme_color};
                text-shadow: 0 0 50px ${shadow_color};
                font-family: sans-serif;
                margin-bottom: 8px;
            ">
                ${nota}%
            </div>
            <div style="
                background: rgba(0,0,0,0.3);
                color: ${theme_color}; 
                display: inline-block; 
                padding: 6px 16px; 
                border-radius: 99px; 
                font-size: 0.75rem; 
                font-weight: 800; 
                text-transform: uppercase;
                border: 1px solid ${theme_color};
                box-shadow: 0 0 15px ${shadow_color}, inset 0 0 10px ${shadow_color};
            ">
                ${veredito}
            </div>
        </div>

        <div style="flex: 1.5; min-width: 260px; padding-left: 8px;">
            ${miniBar("Impacto de Negócio", pilares?.impacto)}
            ${miniBar("Keywords & SEO", pilares?.keywords)}
            ${miniBar("Estrutura ATS", pilares?.ats)}

            <div style="
                margin-top: 16px; 
                padding-top: 16px; 
                border-top: 1px solid rgba(255,255,255,0.05);
                display: flex; 
                align-items: center; 
                gap: 12px;
            ">
                <span style="font-size: 1.2rem;">🚀</span>
                <span style="font-size: 0.8rem; color: #94A3B8; line-height: 1.4;">
                    Potencial Estimado com Ajustes: 
                    <strong style="color: #F8FAFC; margin-left: 4px; font-size: 0.9rem;">${potencial}%</strong>
                </span>
            </div>
        </div>
    </div>
    `;
    }

    function renderLockedBlur(title: string, subtitle: string, contentPreview: string) {
        const longContent = `${contentPreview} <br><br> ` +
            "Impacto Técnico: Implementação de rotinas de backup que reduziram incidentes em 15%. ".repeat(3) +
            "Gestão de Tickets: SLA mantido acima de 98% com ferramenta GLPI e Jira. ";

        return `
    <div class="locked-container" style="position: relative; overflow: hidden; border: 1px solid rgba(56, 189, 248, 0.2); border-radius: 12px; background: rgba(15, 23, 42, 0.6);">
        <div style="padding: 20px; border-bottom: 1px solid rgba(255,255,255,0.05);">
            <div style="color: #38BDF8; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; font-weight: 700;">
                ${title}
            </div>
            <div style="color: #94A3B8; font-size: 0.9rem; margin-top: 5px;">
                ${subtitle}
            </div>
        </div>

        <div style="padding: 20px; filter: blur(6px); user-select: none; opacity: 0.5; height: 180px; overflow: hidden;">
            <p style="color: #E2E8F0; line-height: 1.6;">${longContent}</p>
        </div>

        <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: rgba(15, 23, 42, 0.1); backdrop-filter: blur(2px);">
            <div style="background: rgba(15, 23, 42, 0.9); padding: 15px 25px; border-radius: 30px; border: 1px solid #38BDF8; box-shadow: 0 0 20px rgba(56, 189, 248, 0.2); display: flex; gap: 10px; align-items: center;">
                <span style="font-size: 1.2rem;">🔒</span>
                <span style="color: #F8FAFC; font-weight: 600; font-size: 0.9rem;">Versão Otimizada Oculta</span>
            </div>
        </div>
    </div>
    `;
    }

    function renderOfferCard(itensChecklist: string[]) {
        let listaHtml = "";
        for (const item of itensChecklist) {
            listaHtml += `
        <li style="margin-bottom:12px; display:flex; align-items:start; gap:10px; line-height:1.4;">
            <div style="
                min-width: 20px; height: 20px; 
                background: rgba(74, 222, 128, 0.2); 
                color: #4ADE80; 
                border-radius: 50%; 
                display:flex; align-items:center; justify-content:center; 
                font-size:0.75rem; font-weight:bold; flex-shrink: 0;
            ">✓</div>
            <span style="color:#E2E8F0; font-size:0.9rem;">${item}</span>
        </li>
        `;
        }

        return `
    <div style="
        background: rgba(15, 23, 42, 0.8);
        background-image: linear-gradient(160deg, rgba(56, 189, 248, 0.05), rgba(16, 185, 129, 0.05));
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-bottom: none; 
        border-top-left-radius: 16px;
        border-top-right-radius: 16px;
        border-bottom-left-radius: 0; 
        border-bottom-right-radius: 0; 
        padding: 24px;
        backdrop-filter: blur(12px);
        box-shadow: 0 -10px 40px rgba(0,0,0,0.2); 
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        margin-bottom: -5px; 
    ">
        <div>
            <div style="text-align:center; margin-bottom:20px; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:15px;">
                <h3 style="margin:0; color:#F8FAFC; font-size:1.1rem; font-weight:700; letter-spacing:0.5px;">DOSSIÊ PROFISSIONAL</h3>
                <p style="margin:4px 0 0 0; color:#94A3B8; font-size:0.75rem;">Acesso Vitalício • VANT-PRO</p>
            </div>
            <ul style="list-style:none; padding:0; margin:0;">
                ${listaHtml}
            </ul>
        </div>

        <div style="text-align:center; margin-top: 20px;">
            <div style="display:flex; align-items:center; justify-content:center; gap:8px;">
                <span style="text-decoration: line-through; color: #64748B; font-size: 0.8rem;">R$ 97,90</span>
                <span style="background:#10B981; color:#fff; font-size:0.6rem; padding:2px 6px; border-radius:4px; font-weight:700;">-70% OFF</span>
            </div>
            <div style="font-size: 3rem; font-weight: 800; color: #fff; line-height:1; margin-bottom: 5px;">
                <span style="font-size:1.5rem; vertical-align:top; color:#94A3B8;">R$</span>29<span style="font-size:1rem; color:#94A3B8;">,90</span>
            </div>
        </div>
    </div>
    `;
    }

    return (
        <main>
            {stage === "hero" && (
                <>
                    <div className="hero-container">
                        <div dangerouslySetInnerHTML={{ __html: HERO_INNER_HTML }} />

                        <div className="action-island-container">
                            <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
                                <div style={{ flex: "1 1 380px" }}>
                                    <h5>1. VAGA ALVO 🎯</h5>
                                    <div className="stTextArea">
                                        <textarea
                                            value={jobDescription}
                                            onChange={(e) => setJobDescription(e.target.value)}
                                            placeholder="Dê um Ctrl+V sem medo..."
                                            style={{ height: 185, width: "100%", boxSizing: "border-box" }}
                                        />
                                    </div>
                                </div>

                                <div style={{ flex: "1 1 380px" }}>
                                    <h5>2. SEU CV (PDF) 📄</h5>
                                    <div data-testid="stFileUploader">
                                        <section>
                                            <div>
                                                <div>
                                                    <span>Drag and drop file here</span>
                                                </div>
                                                <small>Limit: 10MB • PDF</small>
                                                <button type="button" onClick={openFileDialog}>Browse files</button>
                                                <input
                                                    ref={uploaderInputRef}
                                                    type="file"
                                                    accept="application/pdf"
                                                    style={{ display: "none" }}
                                                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                                                />
                                            </div>
                                        </section>
                                    </div>
                                </div>
                            </div>

                            <div style={{ height: 16 }} />

                            <details data-testid="stExpander">
                                <summary>📂 Comparar com Referência de Mercado (Opcional)</summary>
                                <div>
                                    <div dangerouslySetInnerHTML={{ __html: LINKEDIN_INSTRUCTIONS_HTML }} />
                                    <div data-testid="stFileUploader">
                                        <section>
                                            <div>
                                                <div>
                                                    <span>Drag and drop file here</span>
                                                </div>
                                                <small>Limit: 10MB • PDF</small>
                                                <button type="button" onClick={openCompetitorFileDialog}>Browse files</button>
                                                <input
                                                    ref={competitorUploaderInputRef}
                                                    type="file"
                                                    accept="application/pdf"
                                                    multiple
                                                    style={{ display: "none" }}
                                                    onChange={(e) => setCompetitorFiles(Array.from(e.target.files ?? []))}
                                                />
                                            </div>
                                        </section>
                                    </div>
                                </div>
                            </details>

                            <div style={{ height: 8 }} />

                            <div data-testid="stButton" className="stButton" style={{ width: "100%" }}>
                                <button type="button" data-kind="primary" onClick={onStart} style={{ width: "100%" }}>
                                    OTIMIZAR PARA ESSA VAGA 🚀
                                </button>
                            </div>

                            {apiError && (
                                <div style={{ marginTop: 12, color: "#EF4444", fontSize: "0.85rem" }}>{apiError}</div>
                            )}

                            <p className="cta-trust-line" style={{ textAlign: "center", color: "#64748B", fontSize: "0.8rem", marginTop: 15 }}>
                                🛡️ <strong>1ª análise 100% gratuita e segura.</strong>
                                <br />
                                Seus dados são processados em RAM volátil e deletados após a sessão.
                            </p>
                        </div>
                    </div>

                    <div style={{ marginTop: 20 }} dangerouslySetInnerHTML={{ __html: trustFooterHtml }} />
                </>
            )}

            {stage === "analyzing" && (
                <div className="hero-container">
                    <div className="loading-logo">vant.core scanner</div>
                    <div style={{ maxWidth: 680, margin: "0 auto" }}>
                        <div style={{ height: 10, background: "rgba(255,255,255,0.08)", borderRadius: 999, overflow: "hidden" }}>
                            <div
                                style={{
                                    width: `${Math.max(0, Math.min(100, progress))}%`,
                                    height: "100%",
                                    background: "linear-gradient(90deg, #38BDF8, #818CF8)",
                                    transition: "width 0.25s ease",
                                }}
                            />
                        </div>

                        <div style={{ marginTop: 18 }}>
                            <div className="terminal-log" style={{ color: "#38BDF8" }}>
                                &gt;&gt; {statusText}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {stage === "preview" && (
                <div className="hero-container">
                    {(() => {
                        const data = previewData || {};
                        const nota = typeof data.nota_ats === "number" ? data.nota_ats : 0;
                        const pilares = data.analise_por_pilares || {};
                        const veredito = data.veredito || "ANÁLISE CONCLUÍDA";
                        const potencial = calcPotencial(nota);

                        let texto_destaque = "Recrutadores e Gestores";
                        const jobText = (jobDescription || "").toLowerCase();
                        if (jobText.includes("nubank")) texto_destaque += " do Nubank";
                        else if (jobText.includes("google")) texto_destaque += " do Google";
                        else if (jobText.includes("amazon")) texto_destaque += " da Amazon";
                        else if (jobText.includes("itaú") || jobText.includes("itau")) texto_destaque += " do Itaú";

                        const metaHtml = `
        <div style="background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(16, 185, 129, 0.1)); 
                    border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 12px; padding: 20px; margin-top: 20px;">
            <div style="display: flex; align-items: center; gap: 15px;">
                <div style="font-size: 2.5rem;">🎯</div>
                <div>
                    <div style="color: #F59E0B; font-weight: 800; font-size: 1.1rem;">META DE PONTUAÇÃO</div>
                    <div style="color: #E2E8F0; font-size: 0.9rem; margin-top: 5px;">
                        Se aplicar as correções sugeridas, sua nota pode chegar a <strong style="color: #10B981;">${potencial}%</strong>
                        <br>Isso coloca você no <strong>Top 15%</strong> dos candidatos.
                    </div>
                </div>
            </div>
        </div>
        `;

                        const dashHtml = renderDashboardMetrics(nota, veredito, potencial, pilares);

                        const exemploMelhoria = `Especialista em ${(pilares.setor_detectado || "Gestão Estratégica")} com histórico de ` +
                            "liderança em projetos de alta complexidade. Otimizou o budget operacional em 22%..." +
                            "Implementação de frameworks ágeis e reestruturação de governança corporativa.";

                        const lockedHtml = renderLockedBlur(
                            "Ghostwriter V2 (Amostra)",
                            "IA reescrevendo seu CV com keywords de elite:",
                            (exemploMelhoria + exemploMelhoria)
                        );

                        const offerChecklist = [
                            "<b>Ghostwriter V2:</b> Seu CV 100% Otimizado (ATS)",
                            "<b>Radar X-Ray:</b> <span style='color:#FCD34D'>Recrutadores</span> buscando você",
                            "<b>Análise de Gap:</b> O que falta para o nível Sênior",
                            "<b>Bônus:</b> Script de Entrevista Comportamental",
                        ];

                        const offerHtml = renderOfferCard(offerChecklist);

                        const xrayHtml = `
        <div style='background: rgba(15, 23, 42, 0.6); border: 1px solid #38BDF8; padding: 20px; border-radius: 12px; position: relative; overflow: hidden; margin-top: 25px;'>
            <div style="position: absolute; top: -10px; right: -10px; background: #38BDF8; width: 50px; height: 50px; filter: blur(30px); opacity: 0.2;"></div>
            
            <h3 style='color: #38BDF8; margin-top: 0; font-size: 1.1rem; display: flex; align-items: center; gap: 8px;'>
                🎯 Radar de Recrutadores Ativo
            </h3>
            
            <p style='color: #94A3B8; font-size: 0.9rem; margin-bottom: 15px; line-height: 1.4;'>
                Nossa varredura X-Ray já configurou os algoritmos para localizar <strong>${texto_destaque}</strong> no LinkedIn (Mercado Oculto).
            </p>
            
            <div style='background: rgba(0,0,0,0.3); padding: 12px; border-radius: 6px; margin-bottom: 15px; border-left: 2px solid #38BDF8; font-family: monospace; font-size: 0.75rem; color: #10B981; overflow-x: hidden; white-space: nowrap;'>
                site:linkedin.com/in/ "talent acquisition" "hiring" ...
            </div>
            
            <div style='text-align: center;'>
                <div style='background: rgba(245,158,11,0.1); padding: 8px 12px; border-radius: 6px; border: 1px dashed #F59E0B; display: inline-block;'>
                    <p style='color: #F59E0B; font-weight: 700; margin: 0; font-size: 0.75rem;'>
                        🔒 Lista pronta para acesso no Dossiê
                    </p>
                </div>
            </div>
        </div>
        `;

                        return (
                            <>
                                <div dangerouslySetInnerHTML={{ __html: metaHtml }} />

                                <div className="action-island-container" style={{ textAlign: "left", marginTop: 18 }}>
                                    <div dangerouslySetInnerHTML={{ __html: dashHtml }} />

                                    <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
                                        <div style={{ flex: "1.3 1 420px" }}>
                                            <div style={{ color: "#94A3B8", fontSize: "0.8rem", marginBottom: 10 }}>
                                                👁️ PREVIEW DO GHOSTWRITER (BLOQUEADO)
                                            </div>
                                            <div dangerouslySetInnerHTML={{ __html: lockedHtml }} />
                                        </div>

                                        <div style={{ flex: "1 1 320px" }}>
                                            <div dangerouslySetInnerHTML={{ __html: offerHtml }} />
                                            <div data-testid="stButton" className="stButton" style={{ width: "100%" }}>
                                                <button
                                                    type="button"
                                                    data-kind="primary"
                                                    onClick={() => {
                                                        setSelectedPlan("basico");
                                                        setStage("checkout");
                                                    }}
                                                    style={{ width: "100%", borderTopLeftRadius: 0, borderTopRightRadius: 0 }}
                                                >
                                                    DESBLOQUEAR AGORA
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div dangerouslySetInnerHTML={{ __html: xrayHtml }} />

                                    <div style={{ height: 12 }} />

                                    <details data-testid="stExpander">
                                        <summary>❓ Por que não apenas buscar no LinkedIn?</summary>
                                        <div>
                                            <div
                                                dangerouslySetInnerHTML={{
                                                    __html: `
            <div style="font-size: 0.85rem; color: #CBD5E1;">
                <p>A busca comum do LinkedIn tem travas. O <strong>X-Ray Search</strong> usa o Google para:</p>
                <ul style="padding-left: 15px; margin-bottom: 0;">
                    <li>🔓 <strong>Furar Bloqueios:</strong> Encontrar perfis fora da sua rede (3º grau).</li>
                    <li>🎯 <strong>Precisão Cirúrgica:</strong> Strings booleanas complexas já prontas.</li>
                </ul>
            </div>
            `,
                                                }}
                                            />
                                        </div>
                                    </details>

                                    <div style={{ marginTop: 22, marginBottom: 18, borderTop: "1px solid rgba(255,255,255,0.08)" }} />

                                    <div style={{ color: "#E2E8F0", fontSize: "1.25rem", fontWeight: 800, marginBottom: 14 }}>
                                        💳 Escolha Seu Plano
                                    </div>

                                    <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                                        <div style={{ flex: "1 1 220px" }}>
                                            <div
                                                dangerouslySetInnerHTML={{
                                                    __html: `
            <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 20px; text-align: center;">
                <div style="color: #94A3B8; font-size: 0.8rem; margin-bottom: 10px;">BÁSICO</div>
                <div style="font-size: 2rem; font-weight: 800; color: #F8FAFC; margin-bottom: 5px;">R$ 29,90</div>
                <div style="color: #64748B; font-size: 0.75rem; margin-bottom: 15px;">Pagamento único</div>
                <div style="text-align: left; font-size: 0.85rem; color: #CBD5E1; margin-bottom: 15px;">
                    ✅ 1 CV otimizado<br>
                    ✅ Análise ATS<br>
                    ✅ Download PDF + DOCX<br>
                    ✅ X-Ray Search
                </div>
            </div>
            `,
                                                }}
                                            />
                                            <div data-testid="stButton" className="stButton" style={{ width: "100%" }}>
                                                <button
                                                    type="button"
                                                    data-kind="secondary"
                                                    onClick={() => {
                                                        setSelectedPlan("basico");
                                                        setStage("checkout");
                                                    }}
                                                    style={{ width: "100%" }}
                                                >
                                                    ESCOLHER BÁSICO
                                                </button>
                                            </div>
                                        </div>

                                        <div style={{ flex: "1 1 220px" }}>
                                            <div
                                                dangerouslySetInnerHTML={{
                                                    __html: `
            <div style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(56, 189, 248, 0.1)); border: 2px solid #10B981; border-radius: 12px; padding: 20px; text-align: center; position: relative;">
                <div style="position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: #10B981; color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.7rem; font-weight: 700;">
                    🔥 MAIS VENDIDO
                </div>
                <div style="color: #10B981; font-size: 0.8rem; margin-bottom: 10px; margin-top: 8px;">PRO</div>
                <div style="font-size: 2rem; font-weight: 800; color: #F8FAFC; margin-bottom: 5px;">R$ 69,90</div>
                <div style="color: #64748B; font-size: 0.75rem; margin-bottom: 5px;">R$ 23,30/CV</div>
                <div style="background: rgba(16, 185, 129, 0.2); color: #10B981; padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; display: inline-block; margin-bottom: 10px;">
                    Economize 20%
                </div>
                <div style="text-align: left; font-size: 0.85rem; color: #CBD5E1; margin-bottom: 15px;">
                    ✅ 3 CVs otimizados<br>
                    ✅ Análise comparativa<br>
                    ✅ Templates premium<br>
                    ✅ Simulador de entrevista<br>
                    ✅ Biblioteca curada
                </div>
            </div>
            `,
                                                }}
                                            />
                                            <div data-testid="stButton" className="stButton" style={{ width: "100%" }}>
                                                <button
                                                    type="button"
                                                    data-kind="primary"
                                                    onClick={() => {
                                                        setSelectedPlan("pro");
                                                        setStage("checkout");
                                                    }}
                                                    style={{ width: "100%" }}
                                                >
                                                    ESCOLHER PRO
                                                </button>
                                            </div>
                                        </div>

                                        <div style={{ flex: "1 1 220px" }}>
                                            <div
                                                dangerouslySetInnerHTML={{
                                                    __html: `
            <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 12px; padding: 20px; text-align: center;">
                <div style="color: #F59E0B; font-size: 0.8rem; margin-bottom: 10px;">PREMIUM PLUS</div>
                <div style="font-size: 2rem; font-weight: 800; color: #F8FAFC; margin-bottom: 5px;">R$ 49,90</div>
                <div style="color: #64748B; font-size: 0.75rem; margin-bottom: 15px;">por mês (assinatura)</div>
                <div style="text-align: left; font-size: 0.85rem; color: #CBD5E1; margin-bottom: 15px;">
                    ✅ 30 CVs por mês<br>
                    ✅ Tudo do Pro<br>
                    ✅ Suporte prioritário<br>
                    ✅ Acesso antecipado<br>
                    💎 Melhor para quem aplica para várias vagas
                </div>
            </div>
            `,
                                                }}
                                            />
                                            <div data-testid="stButton" className="stButton" style={{ width: "100%" }}>
                                                <button
                                                    type="button"
                                                    data-kind="secondary"
                                                    onClick={() => {
                                                        setSelectedPlan("premium_plus");
                                                        setStage("checkout");
                                                    }}
                                                    style={{ width: "100%" }}
                                                >
                                                    ESCOLHER PREMIUM PLUS
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        );
                    })()}
                </div>
            )}

            {stage === "checkout" && (
                <div className="hero-container">
                    <div className="loading-logo">vant.checkout</div>
                    <div className="action-island-container" style={{ textAlign: "left" }}>
                        <div style={{ color: "#94A3B8", fontSize: "0.9rem", lineHeight: 1.6 }}>
                            Plano selecionado: <strong style={{ color: "#E2E8F0" }}>{selectedPlan || "-"}</strong>
                            <br />
                            Checkout/Stripe e login serão conectados no próximo passo.
                        </div>

                        <div style={{ height: 16 }} />

                        <div data-testid="stButton" className="stButton" style={{ width: "100%" }}>
                            <button type="button" data-kind="secondary" onClick={() => setStage("preview")} style={{ width: "100%" }}>
                                VOLTAR
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
