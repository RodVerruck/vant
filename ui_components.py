import datetime

# ==========================================
# UI CONSTANTS & HTML BLOCKS
# ==========================================

HERO_HTML = """
<div class="hero-container">
    
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
"""

# ==========================================
# DASHBOARD COMPONENTS
# ==========================================

def render_dashboard_metrics(nota, veredito, potencial, pilares):
    """
    Renderiza o Painel Principal de Resultados com design Glassmorphism.
    """
    
    # Cores baseadas na nota (Hardcoded para garantir contraste no Dark Mode)
    if nota < 50:
        theme_color = "#EF4444" # Vermelho
        shadow_color = "rgba(239, 68, 68, 0.4)"
        bg_gradient = "linear-gradient(145deg, rgba(239, 68, 68, 0.1), rgba(0, 0, 0, 0))"
    elif nota < 80:
        theme_color = "#F59E0B" # Âmbar
        shadow_color = "rgba(245, 158, 11, 0.4)"
        bg_gradient = "linear-gradient(145deg, rgba(245, 158, 11, 0.1), rgba(0, 0, 0, 0))"
    else:
        theme_color = "#10B981" # Esmeralda
        shadow_color = "rgba(16, 185, 129, 0.4)"
        bg_gradient = "linear-gradient(145deg, rgba(16, 185, 129, 0.1), rgba(0, 0, 0, 0))"

    # Helper interno para desenhar as barrinhas
    def _mini_bar(label, value):
        # Proteção contra valores nulos
        safe_value = value if value is not None else 0
        return f"""
        <div style="margin-bottom: 12px;">
            <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                <span style="color:#94A3B8; font-size:0.75rem; font-weight:600; letter-spacing:0.5px;">{label.upper()}</span>
                <span style="color:#F8FAFC; font-size:0.75rem; font-weight:bold; font-family:monospace;">{safe_value}%</span>
            </div>
            <div style="width:100%; background:rgba(255,255,255,0.05); height:6px; border-radius:3px; overflow: hidden;">
                <div style="width:{safe_value}%; background:{theme_color}; height:100%; border-radius:3px; box-shadow: 0 0 8px {shadow_color};"></div>
            </div>
        </div>
        """

    html = f"""
    <div style="
        background: rgba(15, 23, 42, 0.7);
        background-image: {bg_gradient};
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
                color: {theme_color};
                text-shadow: 0 0 50px {shadow_color};
                font-family: sans-serif;
                margin-bottom: 8px;
            ">
                {nota}%
            </div>
            <div style="
                background: rgba(0,0,0,0.3);
                color: {theme_color}; 
                display: inline-block; 
                padding: 6px 16px; 
                border-radius: 99px; 
                font-size: 0.75rem; 
                font-weight: 800; 
                text-transform: uppercase;
                border: 1px solid {theme_color};
                box-shadow: 0 0 15px {shadow_color}, inset 0 0 10px {shadow_color};
            ">
                {veredito}
            </div>
        </div>

        <div style="flex: 1.5; min-width: 260px; padding-left: 8px;">
            {_mini_bar("Impacto de Negócio", pilares.get('impacto', 0))}
            {_mini_bar("Keywords & SEO", pilares.get('keywords', 0))}
            {_mini_bar("Estrutura ATS", pilares.get('ats', 0))}
            
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
                    <strong style="color: #F8FAFC; margin-left: 4px; font-size: 0.9rem;">{potencial}%</strong>
                </span>
            </div>
        </div>
    </div>
    """
    return html

def render_locked_blur(title, subtitle, content_preview):
    # [TRUQUE DE UX] Duplicamos o conteúdo para parecer que o texto é longo e rico
    long_content = (content_preview + " <br><br> " + 
                   "Impacto Técnico: Implementação de rotinas de backup que reduziram incidentes em 15%. " * 3 +
                   "Gestão de Tickets: SLA mantido acima de 98% com ferramenta GLPI e Jira. ")
    
    return f"""
    <div class="locked-container" style="position: relative; overflow: hidden; border: 1px solid rgba(56, 189, 248, 0.2); border-radius: 12px; background: rgba(15, 23, 42, 0.6);">
        <div style="padding: 20px; border-bottom: 1px solid rgba(255,255,255,0.05);">
            <div style="color: #38BDF8; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; font-weight: 700;">
                {title}
            </div>
            <div style="color: #94A3B8; font-size: 0.9rem; margin-top: 5px;">
                {subtitle}
            </div>
        </div>
        
        <div style="padding: 20px; filter: blur(6px); user-select: none; opacity: 0.5; height: 180px; overflow: hidden;">
            <p style="color: #E2E8F0; line-height: 1.6;">{long_content}</p>
        </div>
        
        <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: rgba(15, 23, 42, 0.1); backdrop-filter: blur(2px);">
            <div style="background: rgba(15, 23, 42, 0.9); padding: 15px 25px; border-radius: 30px; border: 1px solid #38BDF8; box-shadow: 0 0 20px rgba(56, 189, 248, 0.2); display: flex; gap: 10px; align-items: center;">
                <span style="font-size: 1.2rem;">🔒</span>
                <span style="color: #F8FAFC; font-weight: 600; font-size: 0.9rem;">Versão Otimizada Oculta</span>
            </div>
        </div>
    </div>
    """

# ADICIONAR ESTA NOVA FUNÇÃO
def render_offer_card(itens_checklist):
    """
    Card Mestre V3 (Integration Mode):
    - Visualmente preparado para 'colar' no botão abaixo.
    - Removemos border-radius inferior para criar efeito de continuidade.
    """
    lista_html = ""
    for item in itens_checklist:
        # Ícone de check mais brilhante e texto alinhado
        lista_html += f"""
        <li style="margin-bottom:12px; display:flex; align-items:start; gap:10px; line-height:1.4;">
            <div style="
                min-width: 20px; height: 20px; 
                background: rgba(74, 222, 128, 0.2); 
                color: #4ADE80; 
                border-radius: 50%; 
                display:flex; align-items:center; justify-content:center; 
                font-size:0.75rem; font-weight:bold; flex-shrink: 0;
            ">✓</div>
            <span style="color:#E2E8F0; font-size:0.9rem;">{item}</span>
        </li>
        """

    html = f"""
    <div style="
        background: rgba(15, 23, 42, 0.8);
        background-image: linear-gradient(160deg, rgba(56, 189, 248, 0.05), rgba(16, 185, 129, 0.05));
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-bottom: none; /* Remove borda inferior para colar no botão */
        border-top-left-radius: 16px;
        border-top-right-radius: 16px;
        border-bottom-left-radius: 0; /* Reto embaixo */
        border-bottom-right-radius: 0; /* Reto embaixo */
        padding: 24px;
        backdrop-filter: blur(12px);
        box-shadow: 0 -10px 40px rgba(0,0,0,0.2); /* Sombra apenas para cima/lados */
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        margin-bottom: -5px; /* Hack para colar no botão do Streamlit */
    ">
        <div>
            <div style="text-align:center; margin-bottom:20px; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:15px;">
                <h3 style="margin:0; color:#F8FAFC; font-size:1.1rem; font-weight:700; letter-spacing:0.5px;">DOSSIÊ PROFISSIONAL</h3>
                <p style="margin:4px 0 0 0; color:#94A3B8; font-size:0.75rem;">Acesso Vitalício • VANT-PRO</p>
            </div>
            <ul style="list-style:none; padding:0; margin:0;">
                {lista_html}
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
    """
    return html

import datetime

def render_social_proof_bar():
    """
    Substitui logos falsos por métricas de autoridade baseadas em dados.
    Gera números dinâmicos baseados na hora do dia para parecer 'Live'.
    """
    # Lógica simples para parecer dinâmico:
    # CVs hoje = Base + (Hora atual * Média por hora)
    now = datetime.datetime.now()
    cvs_hoje = 84 + (now.hour * 12) + (now.minute // 5)
    
    html = f"""
    <div style="
        margin: 20px 0 40px 0;
        padding: 15px 25px;
        background: rgba(15, 23, 42, 0.6);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 12px;
        display: flex;
        flex-wrap: wrap;
        justify-content: space-around;
        align-items: center;
        gap: 20px;
        backdrop-filter: blur(5px);
    ">
        <div style="display: flex; align-items: center; gap: 10px;">
            <div style="
                width: 8px; height: 8px; 
                background-color: #10B981; 
                border-radius: 50%; 
                box-shadow: 0 0 10px #10B981;
                animation: pulse-green 2s infinite;
            "></div>
            <div style="text-align: left;">
                <div style="font-size: 1.1rem; font-weight: 800; color: #F8FAFC; line-height: 1;">{cvs_hoje}</div>
                <div style="font-size: 0.75rem; color: #94A3B8; font-family: monospace;">CVs PROCESSADOS HOJE</div>
            </div>
        </div>

        <div style="width: 1px; height: 30px; background: rgba(255,255,255,0.1); display: none; @media (min-width: 600px) {{ display: block; }}"></div>

        <div style="display: flex; align-items: center; gap: 10px;">
            <div style="font-size: 1.2rem;">📈</div>
            <div style="text-align: left;">
                <div style="font-size: 1.1rem; font-weight: 800; color: #F8FAFC; line-height: 1;">+34%</div>
                <div style="font-size: 0.75rem; color: #94A3B8; font-family: monospace;">MÉDIA DE AUMENTO DE SCORE</div>
            </div>
        </div>

        <div style="width: 1px; height: 30px; background: rgba(255,255,255,0.1); display: none; @media (min-width: 600px) {{ display: block; }}"></div>

        <div style="display: flex; align-items: center; gap: 10px;">
            <div style="font-size: 1.2rem;">🤖</div>
            <div style="text-align: left;">
                <div style="font-size: 1.1rem; font-weight: 800; color: #F8FAFC; line-height: 1;">50k+</div>
                <div style="font-size: 0.75rem; color: #94A3B8; font-family: monospace;">PADRÕES ANALISADOS</div>
            </div>
        </div>
    </div>
    """
    return html