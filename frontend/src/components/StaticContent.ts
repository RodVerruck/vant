/**
 * Static HTML Content Constants
 * 
 * Este arquivo centraliza todo o conteúdo HTML estático usado na aplicação
 * para melhorar a manutenibilidade e reduzir o tamanho do bundle principal.
 */

// V3 Layout: Split into separate sections for above-the-fold CRO optimization
export const HERO_HEADER_HTML = `
    <div class="hero-section">
        <div class="badge-live" data-cy="main-heading" style="margin-bottom: 24px;">
            <span class="vant-tooltip" 
                  tabindex="0" 
                  style="border-bottom: none; cursor: help; font-size: 0.82rem; color: #94A3B8; letter-spacing: 0.3px;" 
                  data-tooltip="Mais de 50.000 CVs otimizados. Taxa de sucesso comprovada em seleções de grandes empresas.">
                <span style="color: #4ADE80;">✓</span>&nbsp; Mais de <strong style="color: #CBD5E1; font-weight: 600;">50.000</strong> currículos otimizados
            </span>
        </div>

        <div class="headline" style="margin-bottom: 24px;">
            Vença o algoritmo ATS.<br>
            <span class="highlight">Chegue na mão do recrutador.</span>
        </div>

        <div class="subheadline" style="max-width: 420px; margin-bottom: 32px;">
            IA que otimiza seu CV para passar nos filtros automáticos e chegar no recrutador.
        </div>
    </div>
`;

export const TRUST_BAR_HTML = `
    <div class="hero-section" style="margin-top: 24px;">
        <div class="stats-grid">
            <div class="stat-card">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div class="stat-icon" style="background: rgba(56, 189, 248, 0.1); color: #38BDF8;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
                    </div>
                    <div>
                        <div class="stat-number">+34%</div>
                        <div class="stat-label">
                            aprovação ATS
                            <span class="vant-tooltip" tabindex="0" data-tooltip="Aumento médio comparado ao original (Base: 50k+ processamentos)." style="margin-left: 4px; opacity: 0.6; border-bottom: 1px dotted #CBD5E1; cursor: help;"></span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="stat-card">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div class="stat-icon" style="background: rgba(16, 185, 129, 0.1); color: #10B981;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    </div>
                    <div>
                        <div class="stat-number">3x</div>
                        <div class="stat-label">
                            mais entrevistas
                            <span class="vant-tooltip" tabindex="0" data-tooltip="Média de conversão dos últimos 3 meses." style="margin-left: 4px; opacity: 0.6; border-bottom: 1px dotted #CBD5E1; cursor: help;"></span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="stat-card">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div class="stat-icon" style="background: rgba(168, 85, 247, 0.1); color: #A855F7;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                    </div>
                    <div>
                        <div class="stat-number">Top 5%</div>
                        <div class="stat-label">
                            dos candidatos
                            <span class="vant-tooltip" tabindex="0" data-tooltip="Colocação média dos usuários em processos seletivos." style="margin-left: 4px; opacity: 0.6; border-bottom: 1px dotted #CBD5E1; cursor: help;"></span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
`;

export const VALUE_PROP_HTML = `
    <div class="hero-section" style="margin-top: 60px;">
        <div style="text-align: center; margin-bottom: 32px;">
            <h3 style="color: #F8FAFC; font-size: 1.5rem; font-weight: 700; margin: 0 0 8px 0;">Por que funciona</h3>
            <p style="color: #94A3B8; font-size: 1rem; margin: 0; max-width: 600px; margin: 0 auto;">
                Nossa IA analisa seu currículo e a vaga desejada para criar uma versão otimizada que passa nos filtros ATS e impressiona recrutadores.
            </p>
        </div>
        
        <div class="features-grid">
            <div class="feature-card">
                <div class="feature-icon" style="background: rgba(56, 189, 248, 0.1); color: #38BDF8;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                </div>
                <h4 style="color: #F8FAFC; font-size: 1.1rem; font-weight: 600; margin: 0 0 8px 0;">Análise ATS Completa</h4>
                <p style="color: #94A3B8; font-size: 0.95rem; line-height: 1.5; margin: 0;">
                    Verificação em mais de 40 critérios dos sistemas de triagem automática usados pelas empresas.
                </p>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon" style="background: rgba(16, 185, 129, 0.1); color: #10B981;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                </div>
                <h4 style="color: #F8FAFC; font-size: 1.1rem; font-weight: 600; margin: 0 0 8px 0;">Otimização Inteligente</h4>
                <p style="color: #94A3B8; font-size: 0.95rem; line-height: 1.5; margin: 0;">
                    Sugestões personalizadas baseadas na vaga e nas palavras-chave que recrutadores procuram.
                </p>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon" style="background: rgba(168, 85, 247, 0.1); color: #A855F7;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                </div>
                <h4 style="color: #F8FAFC; font-size: 1.1rem; font-weight: 600; margin: 0 0 8px 0;">Resultados Comprovados</h4>
                <p style="color: #94A3B8; font-size: 0.95rem; line-height: 1.5; margin: 0;">
                    Mais de 50.000 currículos otimizados com taxa de sucesso 3x maior na obtenção de entrevistas.
                </p>
            </div>
        </div>
    </div>
`;

export const ANALYSIS_CARD_HTML = `
    <div class="hero-section" style="margin-top: 48px;">
        <div style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(74, 158, 255, 0.05)); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 16px; padding: 32px; text-align: center; max-width: 700px; margin: 0 auto;">
            <div style="width: 48px; height: 48px; border-radius: 14px; background: rgba(16, 185, 129, 0.12); display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #10B981;">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
            </div>
            
            <h3 style="color: #F8FAFC; font-size: 1.3rem; font-weight: 700; margin: 0 0 12px 0;">Análise Grátis e Instantânea</h3>
            <p style="color: #94A3B8; font-size: 1rem; line-height: 1.6; margin: 0 0 24px 0;">
                Descubra seu score ATS atual e receba um diagnóstico completo dos pontos de melhoria do seu currículo.
            </p>
            
            <div style="display: flex; align-items: center; justify-content: center; gap: 16px; flex-wrap: wrap;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20 6L9 17l-5-5"/>
                    </svg>
                    <span style="color: #CBD5E1; font-size: 0.9rem;">Score ATS em 10 segundos</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20 6L9 17l-5-5"/>
                    </svg>
                    <span style="color: #CBD5E1; font-size: 0.9rem;">Diagnóstico completo</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20 6L9 17l-5-5"/>
                    </svg>
                    <span style="color: #CBD5E1; font-size: 0.9rem;">Sem cadastro obrigatório</span>
                </div>
            </div>
        </div>
    </div>
`;

export const LINKEDIN_INSTRUCTIONS_HTML = `
    <div style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(56, 189, 248, 0.05)); 
                border-left: 3px solid #10B981; 
                padding: 16px; 
                border-radius: 8px; 
                margin: 16px 0;">
        <div style="display: flex; align-items: flex-start; gap: 12px;">
            <div style="color: #10B981; font-size: 20px; margin-top: 2px;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 16v-4"/>
                    <path d="M12 8h.01"/>
                </svg>
            </div>
            <div>
                <h4 style="color: #F8FAFC; font-size: 1rem; font-weight: 600; margin: 0 0 8px 0;">Como exportar seu currículo do LinkedIn</h4>
                <ol style="color: #94A3B8; font-size: 0.9rem; line-height: 1.6; margin: 0; padding-left: 16px;">
                    <li style="margin-bottom: 4px;">Acesse seu perfil LinkedIn</li>
                    <li style="margin-bottom: 4px;">Clique em "Mais" e depois em "Criar currículo"</li>
                    <li style="margin-bottom: 4px;">Salve como PDF e faça o upload aqui</li>
                </ol>
            </div>
        </div>
    </div>
`;
