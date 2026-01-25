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
    const [jobDescription, setJobDescription] = useState<string>("");
    const [file, setFile] = useState<File | null>(null);
    const [competitorFiles, setCompetitorFiles] = useState<File[]>([]);
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

    function onStart() {
        if (!jobDescription.trim() || !file) {
            return;
        }
    }

    function openFileDialog() {
        uploaderInputRef.current?.click();
    }

    function openCompetitorFileDialog() {
        competitorUploaderInputRef.current?.click();
    }

    return (
        <main>
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

                    <p className="cta-trust-line" style={{ textAlign: "center", color: "#64748B", fontSize: "0.8rem", marginTop: 15 }}>
                        🛡️ <strong>1ª análise 100% gratuita e segura.</strong>
                        <br />
                        Seus dados são processados em RAM volátil e deletados após a sessão.
                    </p>
                </div>
            </div>

            <div style={{ marginTop: 20 }} dangerouslySetInnerHTML={{ __html: trustFooterHtml }} />
        </main>
    );
}
