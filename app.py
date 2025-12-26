import streamlit as st
import time
import base64
import textwrap
import urllib.parse 
# Certifique-se de que logic.py existe e tem todas essas funções
from logic import load_css, extrair_texto_pdf, analyze_cv_logic, gerar_pdf_candidato, format_text_to_html
# Import corrigido do componente visual
from ui_components import HERO_HTML  

# ============================================================
# CONFIGURAÇÃO DA PÁGINA
# ============================================================
st.set_page_config(
    page_title="Vant | Dossiê Técnico", 
    page_icon="💠", 
    layout="centered", 
    initial_sidebar_state="collapsed"
)

# ============================================================
# INJEÇÃO DE DEPENDÊNCIAS (CSS & JS)
# ============================================================
load_css("assets/style.css")

# [TECH LEAD NOTE]: Injetamos o JS aqui para garantir que a função
# copyFromBase64 exista antes de qualquer botão ser renderizado.
st.html("""
<script>
    function copyFromBase64(b64Text, btnElement) {
        const text = atob(b64Text);
        navigator.clipboard.writeText(text).then(function() {
            const originalText = btnElement.innerText;
            btnElement.innerText = "COPIADO! ✅";
            setTimeout(() => { btnElement.innerText = originalText; }, 2000);
        }, function(err) {
            console.error('Erro ao copiar: ', err);
            btnElement.innerText = "ERRO ❌";
        });
    }
</script>
""")

# ============================================================
# ESTADO & INICIALIZAÇÃO
# ============================================================
# Inicialização segura dos Estados (Session State)
if 'stage' not in st.session_state: st.session_state.stage = 'hero'
if 'report_data' not in st.session_state: st.session_state.report_data = None
if 'saved_file' not in st.session_state: st.session_state.saved_file = None
if 'saved_job' not in st.session_state: st.session_state.saved_job = None
if 'competitor_files' not in st.session_state: st.session_state.competitor_files = None

# Estados para Gamificação
if 'interview_idx' not in st.session_state: st.session_state.interview_idx = 0
if 'completed_tasks' not in st.session_state: st.session_state.completed_tasks = set()

# Container Principal (Single Page Application feel)
main_stage = st.empty()

# ============================================================
# HELPER FUNCTIONS
# ============================================================
def render_copyable_section(title, text_content, is_headline=False):
    """Renderiza um bloco de texto com botão de cópia via JS injetado."""
    if not text_content: return
    
    # Processa o texto para injetar HTML seguro e colorir os negritos
    formatted_html = format_text_to_html(text_content)
    
    # Codifica para Base64 para evitar problemas com aspas no JS
    b64_text = base64.b64encode(text_content.encode('utf-8')).decode('utf-8')
    
    body_style = "text-align: center; font-weight: 700;" if is_headline else ""
    
    html_code = f"""
    <div class="unified-doc-container">
        <div class="doc-header">
            <div class="doc-title">{title}</div>
            <button class="header-copy-btn" onclick="copyFromBase64('{b64_text}', this)">
                COPIAR TEXTO 📋
            </button>
        </div>
        <div class="doc-body" style="{body_style}">
            {formatted_html}
        </div>
    </div>
    """
    st.markdown(html_code, unsafe_allow_html=True)
    
# REMOVA o "self" dos argumentos
def _render_progress_bar(label, value):
    # Lógica de cor continua no Python
    color = '#10B981' if value > 70 else '#F59E0B'
            
    # Estrutura HTML/CSS limpa
    return f"""
    <div class="progress-container">
        <div class="progress-label">
            <span style="color: #94A3B8; font-size: 0.85rem;">{label}</span>
            <span style="color: {color}; font-weight: bold; font-size: 0.9rem;">{value}%</span>
        </div>
        <div class="progress-track">
            <div class="progress-fill" style="width: {value}%; background: {color};"></div>
        </div>
    </div>
    """

# ============================================================
# LÓGICA DE ROTEAMENTO (STAGES)
# ============================================================

# --- STAGE 1: HERO (REVISADO POR TECH LEAD V2.1) ---
if st.session_state.stage == 'hero':
    with main_stage.container():
        # 1. TIPO 1: PROPOSTA DE VALOR (Topo Limpo)
        st.html(HERO_HTML) 
        
        c1, c2 = st.columns(2, gap="large")
        with c1:
            st.markdown('**1. VAGA ALVO**')
            st.session_state.saved_job = st.text_area(
                "Vaga", 
                height=150, 
                value=st.session_state.saved_job if st.session_state.saved_job else "",
                placeholder="Dê um Ctrl+V sem medo.\n\nCole o texto completo aqui (LinkedIn, Gupy, Glassdoor).\nNão se preocupe em formatar ou limpar: nossa IA ignora o lixo e foca apenas nos requisitos técnicos e comportamentais.", 
                label_visibility="collapsed"
            )
        with c2:
            st.markdown('**2. SEU CV (PDF)**')
            st.session_state.saved_file = st.file_uploader(
                "CV", 
                type="pdf", 
                label_visibility="collapsed",
                help="Arraste seu arquivo PDF aqui (Máx 10MB)"
            )
            if st.session_state.saved_file:
                st.success("✅ Arquivo carregado!")

        st.markdown("<br>", unsafe_allow_html=True)
        
        # Feature Avançada (Segmentada por Rótulo)
        with st.expander("ANÁLISE COMPETITIVA (MODO AVANÇADO) ⚔️", expanded=False):
            st.markdown("""
                <div style="background: rgba(245, 158, 11, 0.05); 
                            border-left: 3px solid #F59E0B; 
                            padding: 20px; 
                            margin-bottom: 20px;
                            border-radius: 4px;">
                    <p style="color: #94A3B8; font-size: 0.9rem; margin: 0; line-height: 1.6;">
                        <strong>Estratégia Hacker:</strong> Anexe PDFs de profissionais que já ocupam a vaga (LinkedIn > Salvar como PDF). 
                        A IA fará a engenharia reversa do perfil deles contra o seu.
                    </p>
                </div>
            """, unsafe_allow_html=True)

            st.session_state.competitor_files = st.file_uploader(
                "CVs Concorrentes", 
                type="pdf", 
                accept_multiple_files=True,
                label_visibility="collapsed",
                help="Anexe até 3 CVs de referência."
            )

        st.markdown("<br>", unsafe_allow_html=True)
        
        # CTA Principal
        if st.button("ANALISAR COMPATIBILIDADE 🚀", use_container_width=True, type="primary"):
            if st.session_state.saved_job and st.session_state.saved_file:
                st.session_state.stage = 'analyzing'
                st.rerun()
            else:
                st.toast("⚠️ Por favor, preencha a vaga e faça o upload do CV.", icon="⚠️")
        
        # Redutor de Atrito Final (Colado no botão)
        st.markdown("""
            <p class="cta-trust-line">
                🔓 <strong>1ª análise 100% gratuita.</strong><br>
                Seus dados são criptografados e não são compartilhados.
            </p>
        """, unsafe_allow_html=True)
        
        st.markdown('</div>', unsafe_allow_html=True) # Fecha action-island-container

# --- STAGE 2: ANALYZING ---
elif st.session_state.stage == 'analyzing':
    # Limpa o container anterior explicitamente
    main_stage.empty()
    time.sleep(0.1)
    
    with main_stage.container():
        st.markdown("<div class='loading-logo'>vant.core system</div>", unsafe_allow_html=True)
        
        progress_bar = st.progress(0)
        status_text = st.empty()
        
        def update_status(text, percent):
            progress_bar.progress(percent)
            status_text.markdown(f"""
                <div class="terminal-log">
                    <span style="color:#38BDF8;">>> {text}</span>
                    <span style="font-size:0.8rem; margin-top:5px; opacity:0.7; font-family:'JetBrains Mono', monospace;">_thread_id: {int(time.time())}</span>
                </div>
            """, unsafe_allow_html=True)
            time.sleep(0.4)

        try:
            # [MODIFICAÇÃO TECH LEAD] - LABOR ILLUSION HUMANIZADO
            # Mantemos o visual "Terminal" (Identidade), mas o texto agora vende o valor do processamento.
            
            update_status("🔎 LENDO SEU CURRÍCULO LINHA POR LINHA...", 10)
            text_cv = extrair_texto_pdf(st.session_state.saved_file)
            
            if not text_cv or len(text_cv) < 50:
                 st.error("Erro Crítico: Arquivo ilegível ou corrompido.")
                 time.sleep(2)
                 st.session_state.stage = 'hero'
                 st.rerun()
            
            # Passo 2: Análise de Match (Antigo "Vetorizando")
            update_status("🧠 IDENTIFICANDO GAPS ENTRE VOCÊ E A VAGA...", 30)
            
            # Passo 3: Concorrência ou Mercado (Contextual)
            if st.session_state.competitor_files:
                qtd = len(st.session_state.competitor_files)
                update_status(f"⚔️ CRUZANDO SEU PERFIL CONTRA {qtd} CONCORRENTES REAIS...", 45)
            else:
                update_status("📊 VALIDANDO SUA ADERÊNCIA TÉCNICA NO MERCADO...", 45)
            
            # Passo 4: O processamento pesado (LLM)
            # Aqui é onde ocorre a "mágica", então avisamos que estamos pensando.
            update_status("⚡ GERANDO ESTRATÉGIA PARA VENCER O ALGORITMO...", 60)
            
            # Chamada principal da Lógica
            data = analyze_cv_logic(
                text_cv, 
                st.session_state.saved_job,
                st.session_state.competitor_files 
            )
            
            # Passo 5: Finalização
            update_status("💎 RENDERIZANDO SEU DOSSIÊ DE APROVAÇÃO...", 85)
            
            if data:
                # Verificação de fallback
                if "IA Indisponível" in str(data.get('veredito', '')):
                    st.error("🚨 Alta demanda. Tente novamente.")
                    st.stop()

                update_status("✅ ANÁLISE CONCLUÍDA. ABRINDO RELATÓRIO...", 100)
                time.sleep(0.8) # Pequeno delay para o usuário ver o 100%
                
                st.session_state.report_data = data
                st.session_state.stage = 'preview'
                st.rerun()
            else:
                raise Exception("Resposta nula do servidor.")

        except Exception as e:
            st.error(f"Erro técnico: {e}")
            if st.button("Reiniciar"): 
                st.session_state.stage = 'hero'
                st.rerun()

# --- STAGE 3: PREVIEW (FREE TIER) ---
elif st.session_state.stage == 'preview':
    main_stage.empty()
    
    data = st.session_state.report_data
    if not data: # Segurança caso user recarregue a página aqui
        st.session_state.stage = 'hero'
        st.rerun()

    nota = data.get('nota_ats', 0)
    pilares = data.get('analise_por_pilares', {})
    
    # Lógica de Cores e Potencial
    if nota < 50: 
        theme, pot_theme = "#FF4B4B", "#FCA5A5"
        # Se a nota é muito baixa (ex: 30), o potencial não pode ser alto.
        # Boost conservador: +15% a +25%
        potencial = min(nota + 25, 60) 
    elif nota < 80: 
        theme, pot_theme = "#F59E0B", "#FCD34D"
        # Zona de Oportunidade: Aqui a otimização brilha.
        potencial = min(nota + 35, 95)
    else: 
        theme, pot_theme = "#10B981", "#6EE7B7"
        potencial = min(nota + 10, 99) 
    
    with main_stage.container():
        # Scorecard
        st.html(f"""
        <div style="text-align:center; padding: 20px 0;">
            <p style="color:#94A3B8; letter-spacing:3px; font-weight:700; font-size:0.8rem;">COMPATIBILIDADE TÉCNICA</p>
            <h1 style="font-size:5rem; margin:0; line-height:1; color:{theme}; text-shadow: 0 0 30px {theme}40;">{nota}%</h1>
            <div class="score-potential" style="font-size: 1.2rem; color: #94A3B8; margin-top: 5px;">
                POTENCIAL ESTIMADO: <span style="color: {pot_theme}; text-decoration: underline;">{potencial}%</span> 🚀
            </div>
            <p style="color:#F8FAFC; font-size:1.5rem; font-weight:800; margin-top:15px;">{data.get('veredito', 'ANÁLISE CONCLUÍDA').upper()}</p>
        </div>
        """)
        
        c_m1, c_m2, c_m3 = st.columns(3)
        with c_m1: st.metric("Impacto", f"{pilares.get('impacto',0)}%")
        with c_m2: st.metric("Keywords", f"{pilares.get('keywords',0)}%")
        with c_m3: st.metric("ATS", f"{pilares.get('ats',0)}%")
        
        st.markdown("---")
        
        c1, c2 = st.columns(2, gap="large")
        
        # Coluna da Esquerda: Gaps (Amostra Grátis)
        with c1:
            st.html(f"<span style='color:#F59E0B; font-weight:800; letter-spacing:1px; font-size:1.1rem;'>⚡ DIAGNÓSTICO PRELIMINAR</span>")
            st.write("")
            gaps = data.get('gaps_fatais', [])
            
            if gaps:
                fg = gaps[0]
                st.html(f"""
                <div style="border: 2px solid #10B981; background: rgba(16, 185, 129, 0.05); border-radius: 12px; padding: 0; overflow: hidden; margin-bottom: 20px;">
                    <div style="background: #10B981; color: #020617; padding: 5px 15px; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">
                        🔓 Amostra Grátis Desbloqueada
                    </div>
                    <div style="padding: 20px;">
                        <div class="opportunity-title" style="color: #10B981;">⚠️ {fg.get('erro')}</div>
                        <div class="evidence-box" style="border-left-color: #10B981;">"{fg.get('evidencia')}"</div>
                        <div class="solution-box" style="border-color: rgba(16, 185, 129, 0.3); color: #fff;">
                            💡 <strong>Correção Sugerida:</strong><br>
                            {format_text_to_html(fg.get('correcao_sugerida'))}
                        </div>
                    </div>
                </div>
                """)

        # Coluna da Direita: Paywall Teasers
        with c2:
            # -------------------------------------------------------------
            # 1. TEASER DO CURRÍCULO
            # -------------------------------------------------------------
            # Lógica para extrair o "Hook" (A frase genial)
            full_cv = data.get('cv_otimizado_completo', '')
            
            # Tenta pegar o primeiro bullet point forte ou as primeiras 150 letras
            hook_text = "Estratégia de consolidação de infraestrutura..." # Fallback
            if full_cv:
                # Procura por linhas que começam com bullet ou bold
                lines = [l for l in full_cv.split('\n') if len(l) > 20]
                if lines:
                    # Pega a segunda ou terceira linha (geralmente onde está o ouro após o cabeçalho)
                    hook_text = lines[1] if len(lines) > 1 else lines[0]
            
            # Formata o hook para HTML seguro
            hook_html = format_text_to_html(hook_text)

            st.html(f"""
            <div style="border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 12px; overflow: hidden; background: #0F172A; position: relative;">
                
                <div style="background: rgba(56, 189, 248, 0.1); padding: 10px 15px; border-bottom: 1px solid rgba(56, 189, 248, 0.2); display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 1.2rem;">📝</span>
                    <span style="color: #38BDF8; font-weight: 700; font-size: 0.9rem;">SEU NOVO CV (GHOSTWRITER V2)</span>
                </div>

                <div style="padding: 20px 20px 5px 20px; color: #E2E8F0; font-family: 'Inter', sans-serif; font-size: 0.95rem; line-height: 1.5;">
                    <div style="margin-bottom: 10px; padding-left: 10px; border-left: 3px solid #10B981;">
                        {hook_html}
                    </div>
                </div>

                <div style="padding: 0 20px 20px 20px; color: #64748B; filter: blur(5px); user-select: none; pointer-events: none; opacity: 0.7;">
                    <p>• <strong>Otimização de Processos:</strong> Implementação de metodologia ágil reduzindo o tempo de entrega em 30% e aumentando a satisfação do cliente.</p>
                    <p>• <strong>Liderança Técnica:</strong> Gestão de equipe multidisciplinar com foco em resultados de alta performance e desenvolvimento de carreira.</p>
                </div>

                <div style="position: absolute; bottom: 0; left: 0; width: 100%; height: 60%; 
                           background: linear-gradient(to top, #0F172A 20%, rgba(15, 23, 42, 0) 100%);
                           display: flex; flex-direction: column; align-items: center; justify-content: flex-end; padding-bottom: 20px;">
                    
                    <div style="background: #F59E0B; color: #000; font-weight: 800; padding: 5px 15px; border-radius: 20px; font-size: 0.8rem; margin-bottom: 10px; box-shadow: 0 0 15px rgba(245, 158, 11, 0.4);">
                        🔒 CONTEÚDO BLOQUEADO
                    </div>
                </div>

            </div>
            """)
            
            # -------------------------------------------------------------
            # 2. [CORREÇÃO FINAL] LEAD MAGNET X-RAY (HONESTO & INTELIGENTE)
            # Removemos números falsos ("23+") e adaptamos o texto para casos sem nome de empresa.
            # -------------------------------------------------------------
            
            # Lógica simples para personalizar o texto
            job_text = st.session_state.saved_job.lower()
            # Tenta "chutar" se tem empresa ou se é genérico
            tem_empresa = len(job_text) > 50 # Heurística simples
            
            texto_destaque = "Recrutadores e Gestores"
            if "nubank" in job_text: texto_destaque += " do Nubank"
            elif "google" in job_text: texto_destaque += " do Google"
            # (Pode adicionar mais empresas famosas se quiser, mas o genérico abaixo resolve)
            
            st.html(f"""
            <div style='background: rgba(15, 23, 42, 0.6); border: 1px solid #38BDF8; padding: 20px; border-radius: 12px; position: relative; overflow: hidden; margin-top: 20px;'>
                <div style="position: absolute; top: -10px; right: -10px; background: #38BDF8; width: 50px; height: 50px; filter: blur(30px); opacity: 0.2;"></div>
                
                <h3 style='color: #38BDF8; margin-top: 0; font-size: 1.1rem; display: flex; align-items: center; gap: 8px;'>
                    🎯 Radar de Recrutadores Ativo
                </h3>
                
                <p style='color: #94A3B8; font-size: 0.9rem; margin-bottom: 15px; line-height: 1.4;'>
                    Nossa varredura X-Ray já configurou os algoritmos para localizar <strong>{texto_destaque}</strong> no LinkedIn (Mercado Oculto).
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
            """)

            with st.expander("❓ Por que não apenas buscar no LinkedIn?"):
                st.markdown("""
                <div style="font-size: 0.85rem; color: #CBD5E1;">
                    <p>A busca comum do LinkedIn tem travas para contas gratuitas. O <strong>X-Ray Search</strong> usa o Google para contornar isso:</p>
                    <ul style="padding-left: 15px; margin-bottom: 0;">
                        <li>🔓 <strong>Sem Bloqueios:</strong> O LinkedIn bloqueia buscas excessivas. O Google não.</li>
                        <li>👁️ <strong>Visão Raio-X:</strong> Veja nomes de perfis que aparecem como "Usuário do LinkedIn" (fora da sua rede).</li>
                        <li>🎯 <strong>Precisão Cirúrgica:</strong> Nossa IA monta o código booleano complexo para achar os tomadores de decisão certos.</li>
                    </ul>
                </div>
                """, unsafe_allow_html=True)

            # Feature List Secundária (Reduzida para caber no visual)
            st.markdown("""
            <div style="margin-top: 15px; display: flex; gap: 10px; justify-content: space-around; opacity: 0.8;">
                <div style="text-align: center;">
                    <div style="font-size: 1.2rem;">🗓️</div>
                    <div style="font-size: 0.7rem; color: #94A3B8;">Plano<br>4 Semanas</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 1.2rem;">🎤</div>
                    <div style="font-size: 0.7rem; color: #94A3B8;">Treino<br>Entrevista</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 1.2rem;">📚</div>
                    <div style="font-size: 0.7rem; color: #94A3B8;">Biblioteca<br>Técnica</div>
                </div>
            </div>
            """, unsafe_allow_html=True)

        # Checkout Section
        st.markdown("---")
        st.html("""
            <div class="price-container" style="max-width: 600px; margin: 0 auto; text-align: center;">
                <p style="margin-bottom:5px; font-size:1rem; color:#10B981; font-weight:600;">✅ Diagnóstico Completo Gerado</p>
                <div style="display:flex; align-items:center; justify-content:center; gap:15px; margin: 10px 0;">
                    <span class="old-price" style="font-size:1.2rem; text-decoration: line-through; color: #64748B;">R$ 97,90</span>
                    <span class="new-price" style="font-size:2.5rem; font-weight: 800; color: #F8FAFC;">R$ 29,90</span>
                </div>
                <p style="font-size:0.9rem; opacity:0.8; color:#CBD5E1;">
                    Desbloqueie agora: <strong>CV Reescrito</strong> + <strong>X-Ray Search</strong> + <strong>Roadmap</strong> + <strong>Análise de Concorrência</strong>
                </p>
            </div>
        """)

        st.markdown("<br>", unsafe_allow_html=True)
        if st.button("🔥 DESBLOQUEAR MEU DOSSIÊ COMPLETO", key="pay_btn", use_container_width=True, type="primary"):
            st.session_state.stage = 'paid'
            st.rerun()

# --- STAGE 4: PAID (FULL ACCESS) ---
elif st.session_state.stage == 'paid':
    main_stage.empty()
    st.balloons()
    
    data = st.session_state.report_data
    if not data:
        st.error("Dados da sessão perdidos. Por favor, reinicie.")
        if st.button("Reiniciar"): st.session_state.stage = 'hero'; st.rerun()
        st.stop()

    comp_data = data.get("analise_comparativa", {})
    
    # Cálculo Gamificação
    nota_inicial = data.get('nota_ats', 0)
    completed_count = len(st.session_state.completed_tasks)
    xp_atual = min(100, nota_inicial + (completed_count * 5))
    nivel = "Júnior 🧱" if xp_atual < 60 else "Pleno ⚔️" if xp_atual < 85 else "Sênior 👑"
    
    with main_stage.container():
        # Dashboard de XP
        st.html(f"""
        <div style="background: linear-gradient(90deg, rgba(15,23,42,1) 0%, rgba(30,41,59,1) 100%); padding: 25px; border-radius: 16px; border: 1px solid rgba(56, 189, 248, 0.2); margin-bottom: 30px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <div style="color: #94A3B8; font-weight: 600; letter-spacing: 1px;">NÍVEL DE PRONTIDÃO</div>
                <div style="color: #F59E0B; font-weight: 800; font-size: 1.2rem;">{nivel}</div>
            </div>
            <div style="width: 100%; background: rgba(0,0,0,0.5); height: 12px; border-radius: 10px; overflow: hidden;">
                <div style="width: {xp_atual}%; background: linear-gradient(90deg, #38BDF8, #10B981); height: 100%; transition: width 1s ease;"></div>
            </div>
            <div style="display: flex; justify-content: space-between; margin-top: 8px; font-size: 0.85rem; color: #64748B;">
                <span>XP Inicial: {nota_inicial}</span>
                <span style="color: #10B981; font-weight: bold;">XP Atual: {xp_atual} / 100</span>
            </div>
        </div>
        """)
        
        # Abas de Conteúdo
        tabs = ["📊 DIAGNÓSTICO", "📝 CV OTIMIZADO", "⚔️ CONCORRÊNCIA", "🎤 SIMULADOR", "🗓️ ROADMAP", "📚 BIBLIOTECA"]
        t1, t2, t3, t4, t5, t6 = st.tabs(tabs)
        
        # 1. DIAGNÓSTICO
        with t1:
            st.subheader("1. Plano de Correção")
            
            # [MODIFICAÇÃO TECH LEAD] - FIX MARKDOWN RENDER
            # Aplicamos format_text_to_html para transformar "**texto**" em HTML colorido
            # antes de injetar na div. Isso remove os asteriscos visuais.
            
            for gap in data.get('gaps_fatais', []):
                correcao_html = format_text_to_html(gap.get('correcao_sugerida'))
                
                st.html(f"""
                <div class="opportunity-box">
                    <div class="opportunity-title">⚡ {gap.get('erro')}</div>
                    <div class="evidence-box">Evidência: "{gap.get('evidencia')}"</div>
                    <div class="solution-box">💡 {correcao_html}</div>
                </div>
                """)
                
            st.markdown("---")
            render_copyable_section("💼 Headline LinkedIn", data.get('linkedin_headline', ''), is_headline=True)
            render_copyable_section("📝 Resumo Profissional Otimizado", data.get('resumo_otimizado', ''))

        # 2. CV OTIMIZADO
        with t2:
            st.subheader("🚀 Currículo Reestruturado Integralmente")
            
            cv_raw_text = data.get('cv_otimizado_completo', '')
            
            # 1. Limpeza de caracteres residuais e formatação HTML
            # Garantimos que os asteriscos sejam convertidos em tags <strong>
            cv_cleaned_html = format_text_to_html(cv_raw_text)
            
            # 2. Codificação para o botão de cópia (mantém o texto original sem HTML)
            b64_cv = base64.b64encode(cv_raw_text.encode('utf-8')).decode('utf-8')

            st.html(f"""
            <div class="cv-preview-container">
                <div class="paper-header">
                    <span>DOCUMENTO TÉCNICO FORMATADO</span>
                    <button class="header-copy-btn" onclick="copyFromBase64('{b64_cv}', this)">
                        COPIAR TEXTO 📄
                    </button>
                </div>
                
                <div class="paper-view">
                    <div class="cv-content-flow">
                        {cv_cleaned_html}
                    </div>
                </div>
                
                <div class="paper-footer-hint">
                    💡 Dica: O conteúdo acima já está otimizado para sistemas ATS. 
                    Ao colar no Word, utilize fontes como Arial ou Calibri, tamanho 10 ou 11.
                </div>
            </div>
            """)

        # 3. CONCORRÊNCIA
        with t3:
            if comp_data:
                st.subheader("⚔️ Benchmarking Competitivo")
                st.caption("Comparativo direto entre seu Perfil e os Benchmarks anexados por você.")
                
                # Layout de Colunas para comparação Lado a Lado
                c_a, c_b = st.columns(2, gap="medium")
                
                # Coluna A: O que eles têm (Gaps) - Estilo "Danger/Warning" mas legível
                with c_a:
                    items_html = ""
                    for item in comp_data.get("vantagens_concorrentes", []):
                        items_html += f"<li style='margin-bottom:8px; color:#CBD5E1;'>{item}</li>"
                    
                    st.html(f"""
                    <div style="background: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 12px; padding: 20px; height: 100%;">
                        <h4 style="color: #EF4444; margin-top: 0; display: flex; align-items: center; gap: 8px;">
                            ❌ GAPS DE MERCADO
                        </h4>
                        <p style="font-size: 0.8rem; color: #94A3B8; margin-bottom: 15px;">
                            Pontos presentes nos concorrentes e ausentes no seu perfil:
                        </p>
                        <ul style="padding-left: 20px; margin: 0; font-size: 0.9rem;">
                            {items_html}
                        </ul>
                    </div>
                    """)

                # Coluna B: Seus Diferenciais (Ouro) - Estilo "Success"
                with c_b:
                    items_html_diff = ""
                    for item in comp_data.get("seus_diferenciais", []):
                        items_html_diff += f"<li style='margin-bottom:8px; color:#E2E8F0;'>{item}</li>"

                    st.html(f"""
                    <div style="background: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; padding: 20px; height: 100%;">
                        <h4 style="color: #10B981; margin-top: 0; display: flex; align-items: center; gap: 8px;">
                            ✅ SEUS TRUNFOS
                        </h4>
                        <p style="font-size: 0.8rem; color: #94A3B8; margin-bottom: 15px;">
                            Onde você vence tecnicamente a concorrência:
                        </p>
                        <ul style="padding-left: 20px; margin: 0; font-size: 0.9rem;">
                            {items_html_diff}
                        </ul>
                    </div>
                    """)
                
                st.markdown("<br>", unsafe_allow_html=True)

                # Plano de Ataque (Estratégia)
                plano = comp_data.get('plano_de_ataque', 'Foque nos seus diferenciais.')
                st.html(f"""
                <div style="background: rgba(56, 189, 248, 0.1); border-left: 4px solid #38BDF8; padding: 15px; border-radius: 4px;">
                    <strong style="color: #38BDF8;">💡 ESTRATÉGIA RECOMENDADA:</strong><br>
                    <span style="color: #E2E8F0;">{plano}</span>
                </div>
                """)
                
                # Barra de Probabilidade
                prob = comp_data.get("probabilidade_aprovacao", 0)
                
                # Cor dinâmica da barra
                bar_color = "#EF4444" if prob < 40 else "#F59E0B" if prob < 70 else "#10B981"
                
                st.markdown(f"""
                <div style="margin-top: 25px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <span style="font-weight: bold; color: #94A3B8;">PROBABILIDADE ESTIMADA DE ENTREVISTA</span>
                        <span style="font-weight: 800; color: {bar_color};">{prob}%</span>
                    </div>
                    <div style="width: 100%; background: #1E293B; height: 10px; border-radius: 5px; overflow: hidden;">
                        <div style="width: {prob}%; background: {bar_color}; height: 100%; border-radius: 5px;"></div>
                    </div>
                </div>
                """, unsafe_allow_html=True)

            else:
                # Fallback caso o usuário não tenha subido arquivos
                st.warning("⚠️ Esta análise requer que você envie CVs de referência na etapa inicial.")
                st.markdown("""
                <div style="padding: 15px; background: rgba(255,255,255,0.05); border-radius: 8px; margin-top: 10px;">
                    <p>Para ativar este módulo, reinicie a análise e anexe os PDFs no campo <strong>"Quer vencer a concorrência?"</strong>.</p>
                </div>
                """, unsafe_allow_html=True)

        # 4. SIMULADOR (UX V2.2 - CLEAN ARCHITECTURE)
        with t4:
            st.subheader("🎤 Simulador de Entrevista (IA Feedback)")
            
            questions = data.get('perguntas_entrevista', [])
            
            # States
            if 'sim_transcript' not in st.session_state: st.session_state.sim_transcript = ""
            if 'sim_feedback' not in st.session_state: st.session_state.sim_feedback = None
            if 'last_audio_bytes' not in st.session_state: st.session_state.last_audio_bytes = None
            if 'retry_count' not in st.session_state: st.session_state.retry_count = 0

            if questions and len(questions) > 0:
                idx = st.session_state.interview_idx
                q = questions[idx % len(questions)]
                
                # --- UI: CARD DA PERGUNTA (Refatorado para CSS) ---
                st.html(f"""
                <div class="interview-card">
                    <div class="interview-header">
                        <span style="color: #94A3B8; font-size: 0.85rem;">Pergunta {(idx % len(questions)) + 1} de {len(questions)}</span>
                        <span style="color: #38BDF8; font-size: 0.85rem; font-weight: 600;">Tempo ideal: 90s</span>
                    </div>
                    <div class="interview-question-box">
                        <div class="interview-bar"></div>
                        <div class="interview-text">"{q.get('pergunta')}"</div>
                    </div>
                    <div class="interview-footer">
                        <span style="color: #E2E8F0; font-weight: 600; font-size: 0.9rem;">O que o recrutador espera: </span>
                        <span style="color: #94A3B8; font-size: 0.9rem;">{q.get('expectativa_recrutador')}</span>
                    </div>
                </div>
                """)
                
                # --- ÁREA DE GRAVAÇÃO ---
                audio_key = f"audio_rec_{st.session_state.interview_idx}_v{st.session_state.retry_count}"
                audio_value = st.audio_input("Grave sua resposta", key=audio_key)

                if audio_value:
                    audio_bytes = audio_value.getvalue()
                    if st.session_state.last_audio_bytes != audio_bytes:
                        st.session_state.last_audio_bytes = audio_bytes
                        st.session_state.sim_transcript = "" 
                        st.session_state.sim_feedback = None 
                        
                        with st.spinner("🎧 Ouvindo e analisando..."):
                            from llm_core import transcribe_audio_groq, analyze_interview_gemini
                            text = transcribe_audio_groq(audio_bytes)
                            st.session_state.sim_transcript = text
                        
                        if text and "Erro" not in text:
                            with st.spinner("🧠 Gerando feedback técnico..."):
                                job_context = st.session_state.saved_job
                                feedback = analyze_interview_gemini(q.get('pergunta'), text, job_context)
                                st.session_state.sim_feedback = feedback

                # --- RESULTADOS ---
                if st.session_state.sim_transcript:
                    # UX: Box de Transcrição Limpo
                    st.html(f"""
                    <div class="transcript-box">
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
                            <div style="display:flex; gap:8px; align-items:center;">
                                <span>📝</span><span style="color: #F8FAFC; font-weight: 600;">Sua Resposta</span>
                            </div>
                            <div style="padding: 5px; opacity: 0.7;">✏️</div>
                        </div>
                        <div class="transcript-text">"{st.session_state.sim_transcript}"</div>
                    </div>
                    """)

                fb = st.session_state.sim_feedback
                if fb:
                    score = fb.get('nota_final', 0)
                    af = fb.get('analise_fina', {})
                    exemplo_ideal = fb.get('exemplo_resposta_star', None)
                    
                    # Lógica de Cores (MANTIDA NO PYTHON POIS É DINÂMICA)
                    if score >= 90:
                        score_color, badge_bg, msg_title = "#10B981", "rgba(16, 185, 129, 0.1)", "Resposta de Especialista! 🏆"
                    elif score >= 70:
                        score_color, badge_bg, msg_title = "#34D399", "rgba(52, 211, 153, 0.1)", "Mandou bem!"
                    elif score >= 41:
                        score_color, badge_bg, msg_title = "#F59E0B", "rgba(245, 158, 11, 0.1)", "Boa base, vamos refinar?"
                    elif score > 0:
                        score_color, badge_bg, msg_title = "#F59E0B", "rgba(245, 158, 11, 0.1)", "Vamos ajustar?"
                    else:
                        score_color, badge_bg, msg_title = "#EF4444", "rgba(239, 68, 68, 0.1)", "Resposta Inválida"

                    feedback_display = fb.get('feedback_curto', '')
                    if score == 0: feedback_display = "Não detectamos uma resposta coerente."

                    # Card Principal com Classes CSS + Estilos Dinâmicos Específicos
                    st.html(f"""
                        <div class="feedback-card" style="border: 1px solid {score_color}40;">
                            
                            <div class="card-header-flex">
                                <div>
                                    <h3 class="card-title-text">{msg_title}</h3>
                                    <p class="card-subtitle-text">{feedback_display}</p>
                                </div>
                                
                                <div class="score-badge" style="background: {badge_bg}; color: {score_color}; border: 1px solid {score_color};">
                                    {score}
                                </div>
                            </div>

                            <div class="card-stats-grid">
                                {_render_progress_bar("Clareza", af.get('clareza',0))}
                                {_render_progress_bar("Estrutura", af.get('estrutura',0))}
                                {_render_progress_bar("Impacto", af.get('impacto',0))}
                                {_render_progress_bar("Conteúdo Técnico", af.get('conteudo_tecnico',0))}
                            </div>

                            <div class="action-plan-box">
                                <h4 style="color: #F59E0B; margin-top: 0; margin-bottom: 15px; font-size: 1rem; display: flex; align-items: center; gap: 8px;">
                                    ⚡ Plano de Ação
                                </h4>
                                <ul class="action-list">
                                    {"".join([f"<li>{p}</li>" for p in fb.get('pontos_melhoria', [])])}
                                </ul>
                            </div>
                        </div>
                        """)
                    
                    if exemplo_ideal:
                        # [TECH LEAD FIX] Parsear Markdown para HTML antes de exibir
                        exemplo_html = format_text_to_html(exemplo_ideal)
                        
                        with st.expander("✨ Ver Exemplo de Resposta Ideal (Referência)", expanded=False):
                            st.html(f"""
                            <div class="ideal-answer-box">
                                {exemplo_html}
                            </div>
                            """)

                # --- BOTÕES DE AÇÃO ---
                st.markdown("<br>", unsafe_allow_html=True)
                c_retry, c_next = st.columns([1, 1])
                is_passing = fb and fb.get('nota_final', 0) >= 70
                
                with c_retry:
                    btn_type = "secondary" if is_passing else "primary"
                    if st.button("🔄 Tentar Novamente", use_container_width=True, type=btn_type):
                        st.session_state.retry_count += 1
                        st.session_state.sim_transcript = ""
                        st.session_state.sim_feedback = None
                        st.session_state.last_audio_bytes = None
                        st.rerun()
                
                with c_next:
                    btn_type = "primary" if is_passing else "secondary"
                    btn_label = "Próxima Pergunta ➡️" if is_passing else "Pular / Próxima ⏩"
                    if st.button(btn_label, use_container_width=True, type=btn_type):
                        st.session_state.interview_idx += 1
                        st.session_state.retry_count = 0
                        st.session_state.sim_transcript = ""
                        st.session_state.sim_feedback = None
                        st.session_state.last_audio_bytes = None
                        st.rerun()

            else:
                 st.info("💡 Realize o diagnóstico do CV na aba inicial para gerar as perguntas personalizadas.")

        # 5. ROADMAP (PLANO DE GUERRA ATUALIZADO)
        with t5:
            st.subheader("🗓️ Plano de Guerra (30 Dias)")
            
            # X-Ray Search (Mantido)
            st.markdown("### 🎯 X-Ray Search")
            st.code(data.get('kit_hacker', {}).get('boolean_string', 'site:linkedin.com/in'), language="text")
            
            st.markdown("---")
            
            # Novo Renderizador Hierárquico
            roadmap = data.get('roadmap_semanal', [])
            
            if not roadmap:
                st.info("O plano tático está sendo gerado. Tente novamente em alguns segundos.")
            
            for sem in roadmap:
                # Cabeçalho da Semana com Meta
                with st.expander(f"{sem.get('semana', 'Semana')} 🎯", expanded=True):
                    st.caption(f"🏆 Meta: {sem.get('meta', 'Foco total')}")
                    
                    # Verifica se é o formato novo (com dias) ou antigo (lista plana)
                    # Isso garante retrocompatibilidade se o cache antigo ainda estiver lá
                    if 'cronograma_diario' in sem:
                        # FORMATO NOVO: DIAS ESPECÍFICOS
                        for dia in sem.get('cronograma_diario', []):
                            # Visual do Dia: "Segunda-feira (1h30)"
                            st.markdown(f"**📅 {dia.get('dia')}** <span style='color:#94A3B8; font-size:0.8em;'>⏱️ {dia.get('tempo', '')}</span>", unsafe_allow_html=True)
                            
                            for t in dia.get('tarefas', []):
                                t_key = f"task_{abs(hash(t))}"
                                is_checked = t in st.session_state.completed_tasks
                                
                                # Checkbox com Gamificação
                                if st.checkbox(t, value=is_checked, key=t_key):
                                    if t not in st.session_state.completed_tasks:
                                        st.session_state.completed_tasks.add(t)
                                        st.toast("Tarefa Concluída! XP +5 🆙", icon="✨")
                                        time.sleep(0.5); st.rerun()
                                else:
                                    if t in st.session_state.completed_tasks:
                                        st.session_state.completed_tasks.discard(t); st.rerun()
                            
                            st.markdown("<div style='margin-bottom: 10px;'></div>", unsafe_allow_html=True)
                    
                    else:
                        # FALLBACK (FORMATO ANTIGO) - Caso a IA gere lista simples
                        for t in sem.get('tarefas', []):
                            st.checkbox(t, key=f"old_{abs(hash(t))}")

            # Projeto Prático (Mantido)
            st.markdown("---")
            st.markdown("### 🏆 Projeto Prático")
            proj = data.get('projeto_pratico', {})
            if proj:
                st.html(f"""
                <div style="background: rgba(16, 185, 129, 0.05); border: 1px solid #10B981; border-radius: 12px; padding: 20px;">
                    <h3 style="color: #10B981; margin-top:0;">🔨 {proj.get('titulo', 'Projeto Sugerido')}</h3>
                    <p style="color: #E2E8F0; font-size: 1rem;">{proj.get('descricao', '')}</p>
                    <div style="margin-top: 15px; padding-top: 10px; border-top: 1px dashed rgba(16, 185, 129, 0.3);">
                        <strong style="color: #38BDF8;">🚀 Pitch para Entrevista:</strong><br>
                        <span style="color: #94A3B8; font-style: italic;">"{proj.get('como_apresentar', '')}"</span>
                    </div>
                </div>
                """)

        # 6. BIBLIOTECA
        with t6:
            st.subheader("📚 Biblioteca Definitiva")
            for i, book in enumerate(data.get('biblioteca_tecnica', [])):
                # Fallback simples caso logic.py não tenha gerar_link_amazon
                link = f"https://www.amazon.com.br/s?k={urllib.parse.quote(book.get('titulo', ''))}"
                
                st.html(f"""
                <a href="{link}" target="_blank" class="book-card" style="text-decoration:none;">
                    <div class="book-rank">{i+1}</div>
                    <div class="book-info">
                        <h4 style="margin:0; color:#F8FAFC; font-size:1rem;">{book.get('titulo')} ↗</h4>
                        <p style="margin:2px 0 0 0; color:#94A3B8; font-size:0.85rem;">{book.get('autor')}</p>
                        <div class="book-reason" style="color:#38BDF8; font-size:0.85rem; margin-top:5px; font-style:italic;">"{book.get('motivo')}"</div>
                    </div>
                </a>
                """)

        st.markdown("---")
        # Botão de Download do PDF
        try:
            pdf_bytes = gerar_pdf_candidato(data)
            st.download_button("📥 BAIXAR DOSSIÊ (PDF)", data=pdf_bytes, file_name="Dossie_VANT.pdf", mime="application/pdf", use_container_width=True, type="primary")
        except Exception as e:
            st.warning(f"Não foi possível gerar o PDF: {e}")

        st.markdown("<br>", unsafe_allow_html=True)
        if st.button("Analisar outro perfil", use_container_width=True):
            st.session_state.stage = 'hero'
            st.rerun()