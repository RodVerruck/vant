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
            <p style="color: #CBD5E1; font-size: 0.9rem; margin: 0;">Tecnologia baseada em dados reais de mercado</p>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; width: 100%; max-width: 1200px; margin: 0 auto;">
            <div style="background: rgba(74, 158, 255, 0.06); border: 1px solid rgba(74, 158, 255, 0.15); border-radius: 16px; padding: 28px; text-align: left;">
                <div style="width: 44px; height: 44px; border-radius: 12px; background: rgba(74, 158, 255, 0.12); display: flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4A9EFF" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/></svg>
                </div>
                <div style="color: #F8FAFC; font-size: 1.1rem; font-weight: 800; margin-bottom: 8px; line-height: 1.3;">
                    IA Treinada com <span style="color: #4A9EFF; font-size: 1.3rem;">50K+</span> Vagas
                </div>
                <div style="color: #CBD5E1; font-size: 0.9rem; line-height: 1.6; opacity: 0.85;">
                    Analisamos milhares de descrições de vagas reais para identificar padrões de sucesso
                </div>
            </div>
            
            <div style="background: rgba(16, 185, 129, 0.06); border: 1px solid rgba(16, 185, 129, 0.15); border-radius: 16px; padding: 28px; text-align: left;">
                <div style="width: 44px; height: 44px; border-radius: 12px; background: rgba(16, 185, 129, 0.12); display: flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
                </div>
                <div style="color: #F8FAFC; font-size: 1.1rem; font-weight: 800; margin-bottom: 8px; line-height: 1.3;">
                    <span style="color: #10B981; font-size: 1.4rem;">43</span> Critérios ATS
                </div>
                <div style="color: #CBD5E1; font-size: 0.9rem; line-height: 1.6; opacity: 0.85;">
                    Verificamos os critérios que os robôs usam para aprovar seu currículo
                </div>
            </div>
            
            <div style="background: rgba(245, 158, 11, 0.06); border: 1px solid rgba(245, 158, 11, 0.15); border-radius: 16px; padding: 28px; text-align: left;">
                <div style="width: 44px; height: 44px; border-radius: 12px; background: rgba(245, 158, 11, 0.12); display: flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                </div>
                <div style="color: #F8FAFC; font-size: 1.1rem; font-weight: 800; margin-bottom: 8px; line-height: 1.3;">
                    Padrões de <span style="color: #F59E0B;">Mercado</span>
                </div>
                <div style="color: #CBD5E1; font-size: 0.9rem; line-height: 1.6; opacity: 0.85;">
                    Otimização baseada em CVs aprovados em processos seletivos reais
                </div>
            </div>
        </div>
        <div style="text-align: center; margin-top: 20px; color: #94A3B8; font-size: 0.8rem; font-style: italic;">
            Baseado em 50.000+ processamentos reais
        </div>
    </div>
`;

export const ANALYSIS_CARD_HTML = `
    <div class="hero-section" style="margin-top: 48px;">
        <div style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(74, 158, 255, 0.05)); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 16px; padding: 32px; text-align: center; max-width: 700px; margin: 0 auto;">
            <div style="width: 48px; height: 48px; border-radius: 14px; background: rgba(16, 185, 129, 0.12); display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #10B981;">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                </svg>
            </div>
            
            <h3 style="color: #F8FAFC; font-size: 1.3rem; font-weight: 700; margin: 0 0 16px 0;">Análise Instantânea</h3>
            <p style="color: #F8FAFC; font-size: 1rem; line-height: 1.2; margin: 10px 0 4px 0;">
                Descubra seu score ATS e os erros que estão te eliminando.
            </p>
            
            <div style="text-align: center; margin-bottom: 20px;">
                <span style="color: #F8FAFC; font-size: 1rem; font-weight: 700;">Sem compromisso. Sem cartão.</span>
            </div>
            
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20 6L9 17l-5-5"/>
                    </svg>
                    <span style="color: #CBD5E1; font-size: 0.85rem;">Score ATS em segundos</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20 6L9 17l-5-5"/>
                    </svg>
                    <span style="color: #CBD5E1; font-size: 0.85rem;">Erros críticos detectados</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20 6L9 17l-5-5"/>
                    </svg>
                    <span style="color: #CBD5E1; font-size: 0.85rem;">Dados destruídos após análise</span>
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
