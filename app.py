import streamlit as st
import streamlit.components.v1 as components
import time
import base64
import textwrap
import urllib.parse 
import os
import json
import hashlib
import io
import stripe
from supabase import create_client
# Certifique-se de que logic.py existe e tem todas essas funções
from logic import extrair_texto_pdf, analyze_cv_logic, gerar_pdf_candidato, format_text_to_html, gerar_word_candidato
from logic import analyze_preview_lite, parse_raw_data_to_struct, render_cv_html
from css_constants import CSS_V13
from ui_components import render_dashboard_metrics, render_locked_blur, render_offer_card, render_social_proof_bar, HERO_HTML
from datetime import datetime
import logging

# --- SILENCIADOR DE LOGS ---
# Define que essas bibliotecas só devem avisar se for um ERRO grave
logging.getLogger("fontTools").setLevel(logging.ERROR)
logging.getLogger("weasyprint").setLevel(logging.ERROR)
logging.getLogger("pypdf").setLevel(logging.ERROR)

# ============================================================
# CONFIGURAÇÃO DA PÁGINA
# ============================================================
st.set_page_config(
    page_title="Vant | Dossiê Técnico", 
    page_icon="💠", 
    layout="centered", 
    initial_sidebar_state="collapsed",
    menu_items={
        'Get Help': None,
        'Report a bug': None,
        'About': "Vant Neural Engine - Otimização de CVs com IA"
    }
)

STRIPE_SECRET_KEY = st.secrets.get("STRIPE_SECRET_KEY") or os.getenv("STRIPE_SECRET_KEY")
APP_BASE_URL = st.secrets.get("APP_BASE_URL") or os.getenv("APP_BASE_URL")

STRIPE_PRICE_ID_BASIC = st.secrets.get("STRIPE_PRICE_ID_BASIC") or os.getenv("STRIPE_PRICE_ID_BASIC")
STRIPE_PRICE_ID_PRO = st.secrets.get("STRIPE_PRICE_ID_PRO") or os.getenv("STRIPE_PRICE_ID_PRO")
STRIPE_PRICE_ID_UNLIMITED = st.secrets.get("STRIPE_PRICE_ID_UNLIMITED") or os.getenv("STRIPE_PRICE_ID_UNLIMITED")
STRIPE_PRICE_ID_PREMIUM_PLUS = (
    st.secrets.get("STRIPE_PRICE_ID_PREMIUM_PLUS")
    or os.getenv("STRIPE_PRICE_ID_PREMIUM_PLUS")
    or STRIPE_PRICE_ID_UNLIMITED
)

SUPABASE_URL = st.secrets.get("SUPABASE_URL") or os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = st.secrets.get("SUPABASE_ANON_KEY") or os.getenv("SUPABASE_ANON_KEY")
SUPABASE_SERVICE_ROLE_KEY = st.secrets.get("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase_public = None
supabase_admin = None
if SUPABASE_URL and SUPABASE_ANON_KEY:
    supabase_public = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
if SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY:
    supabase_admin = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

PRICING = {
    "basico": {
        "price": 29.90,
        "name": "1 Otimização",
        "stripe_price_id": STRIPE_PRICE_ID_BASIC,
        "credits": 1,
        "billing": "one_time",
    },
    "pro": {
        "price": 69.90,
        "name": "Pacote 3 Vagas",
        "stripe_price_id": STRIPE_PRICE_ID_PRO,
        "credits": 3,
        "badge": "🔥 MAIS VENDIDO",
        "billing": "one_time",
    },
    "premium_plus": {
        "price": 49.90,
        "name": "VANT - Pacote Premium Plus",
        "stripe_price_id": STRIPE_PRICE_ID_PREMIUM_PLUS,
        "credits": 30,
        "badge": "💎 PREMIUM PLUS",
        "billing": "subscription",
    },
}

if STRIPE_SECRET_KEY:
    stripe.api_key = STRIPE_SECRET_KEY

GA4_MEASUREMENT_ID = (
    st.secrets.get("GA4_MEASUREMENT_ID")
    or os.getenv("GA4_MEASUREMENT_ID")
    or "G-EYNHF1X75P"
)

def _inject_ga4(measurement_id: str):
    if not measurement_id:
        return
    if st.session_state.get("ga4_injected"):
        return
    components.html(
        f"""
        <script async src="https://www.googletagmanager.com/gtag/js?id={measurement_id}"></script>
        <script>
          window.dataLayer = window.dataLayer || [];
          function gtag(){{dataLayer.push(arguments);}}
          gtag('js', new Date());
          gtag('config', '{measurement_id}');
        </script>
        """,
        height=0,
        width=0,
    )

    st.session_state["ga4_injected"] = True

_inject_ga4(GA4_MEASUREMENT_ID)

def track_event(event_name: str, params=None):
    if not event_name:
        return
    payload = params or {}
    try:
        payload_json = json.dumps(payload, ensure_ascii=False)
    except Exception:
        payload_json = "{}"
    components.html(
        f"""
        <script>
          (function() {{
            try {{
              if (typeof window.gtag === 'function') {{
                window.gtag('event', '{event_name}', {payload_json});
              }}
            }} catch (e) {{}}
          }})();
        </script>
        """,
        height=0,
        width=0,
    )

# ============================================================
# INJEÇÃO DE DEPENDÊNCIAS (CSS & JS)
# ============================================================
# Carrega CSS diretamente do arquivo
try:
    with open("assets/style.css", encoding="utf-8") as f:
        css_content = f.read()
        st.markdown(f"<style>{css_content}</style>", unsafe_allow_html=True)
except FileNotFoundError:
    st.warning("⚠️ Arquivo CSS não encontrado")

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
if 'dev_mode' not in st.session_state: st.session_state.dev_mode = False
if 'last_uploaded_cv_hash' not in st.session_state: st.session_state.last_uploaded_cv_hash = None
if 'payment_verified' not in st.session_state: st.session_state.payment_verified = False
if 'stripe_session_id' not in st.session_state: st.session_state.stripe_session_id = None
if 'selected_plan' not in st.session_state: st.session_state.selected_plan = "basico"
if 'credits_remaining' not in st.session_state: st.session_state.credits_remaining = 0
if 'purchased_plan' not in st.session_state: st.session_state.purchased_plan = None
if 'auth_user_id' not in st.session_state: st.session_state.auth_user_id = None
if 'auth_email' not in st.session_state: st.session_state.auth_email = None
if 'supabase_session' not in st.session_state: st.session_state.supabase_session = None
if 'entitlements_synced' not in st.session_state: st.session_state.entitlements_synced = False

CACHE_DIR = os.path.join(os.path.dirname(__file__), ".cache")
os.makedirs(CACHE_DIR, exist_ok=True)

LAST_CV_PATH = os.path.join(CACHE_DIR, "last_cv.pdf")
LAST_JOB_PATH = os.path.join(CACHE_DIR, "last_job.txt")

def _read_text_file(path):
    try:
        with open(path, "r", encoding="utf-8") as f:
            return f.read()
    except Exception:
        return None

def _write_text_file(path, content):
    try:
        with open(path, "w", encoding="utf-8") as f:
            f.write(content or "")
        return True
    except Exception:
        return False

def _get_file_bytes(file_obj):
    if file_obj is None:
        return None
    if hasattr(file_obj, "getvalue"):
        try:
            return file_obj.getvalue()
        except Exception:
            return None
    try:
        pos = None
        if hasattr(file_obj, "tell"):
            try:
                pos = file_obj.tell()
            except Exception:
                pos = None
        b = file_obj.read()
        if hasattr(file_obj, "seek"):
            try:
                file_obj.seek(pos if pos is not None else 0)
            except Exception:
                pass
        return b
    except Exception:
        return None

def _write_bytes_file(path, b):
    try:
        with open(path, "wb") as f:
            f.write(b or b"")
        return True
    except Exception:
        return False

def _sha256_text(text):
    return hashlib.sha256((text or "").encode("utf-8", errors="ignore")).hexdigest()

def _sha256_bytes(b):
    return hashlib.sha256(b or b"").hexdigest()

def _hash_competitors(files):
    if not files:
        return "none"
    h = hashlib.sha256()
    for f in files:
        try:
            name = getattr(f, "name", "")
            h.update(name.encode("utf-8", errors="ignore"))
            fb = _get_file_bytes(f) or b""
            h.update(_sha256_bytes(fb).encode("utf-8"))
        except Exception:
            continue
    return h.hexdigest()

def _premium_cache_path(text_cv, job_text, competitor_files):
    key_material = "|".join([
        _sha256_text(text_cv),
        _sha256_text(job_text),
        _hash_competitors(competitor_files)
    ])
    key = hashlib.sha256(key_material.encode("utf-8")).hexdigest()
    return os.path.join(CACHE_DIR, f"premium_{key}.json")

def _load_json(path):
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return None

def _save_json(path, data):
    try:
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False)
        return True
    except Exception:
        return False

if not st.session_state.saved_job:
    last_job = _read_text_file(LAST_JOB_PATH)
    if last_job:
        st.session_state.saved_job = last_job

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
    
    # [FIX CRÍTICO] Usa a versão de diagnóstico (cores vibrantes)
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
    
def get_linkedin_instructions_html():
    """Retorna o HTML sanitizado para as instruções do LinkedIn."""
    return textwrap.dedent("""
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
    """)
    
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
    
def clean_html(html_string):
    """
    Remove quebras de linha e espaços extras para forçar o Streamlit 
    a renderizar como HTML puro, evitando blocos de código acidentais.
    """
    if not html_string: return ""
    # Troca quebras de linha por espaço para não colar palavras
    return html_string.replace("\n", " ").strip()

# ============================================================
# HELPER FUNCTIONS (CORREÇÃO DE RENDERIZAÇÃO & GROWTH)
# ============================================================

def calculate_dynamic_cv_count():
    """
    Calcula um número de CVs baseados na hora do dia (Lógica Growth Hacking).
    Simula: 12 base + 14 por hora + variação por minuto.
    """
    now = datetime.now()
    
    base_count = 12
    rate_per_hour = 14
    
    # Cálculo matemático: Base + (Horas * Taxa) + (Minutos / 4)
    # Exemplo 14:00 -> 12 + (14*14) + (0) = 208
    current_count = base_count + (now.hour * rate_per_hour) + int(now.minute / 4)
    
    # Seed diário para variação (dia * 3)
    # Isso garante que dia 27 seja diferente do dia 28, mas fixo durante o dia 27
    day_seed = now.day * 3
    
    return current_count + day_seed

def render_trust_footer():
    # 1. Obtemos o número mágico calculado em tempo real
    cv_count = calculate_dynamic_cv_count()
    
    # 2. Definimos o CSS da animação (Pulse) inline para garantir que funcione
    # e injetamos o número calculado via f-string {cv_count}
    raw_html = f"""
    <style>
        @keyframes pulse-animation {{
            0% {{ box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }}
            70% {{ box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }}
            100% {{ box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }}
        }}
        .live-dot {{
            width: 8px;
            height: 8px;
            background-color: #10B981; /* Verde Emerald */
            border-radius: 50%;
            display: inline-block;
            margin-right: 6px;
            animation: pulse-animation 2s infinite;
        }}
    </style>

    <div class="trust-footer">
        <div class="footer-stat">
            <div class="live-dot"></div>
            <span><strong>{cv_count}</strong> CVs Otimizados Hoje</span>
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
    """
    
    # [FIX NUCLEAR] Mantemos o clean_html para segurança de renderização
    st.markdown(clean_html(raw_html), unsafe_allow_html=True)

# ============================================================
# LÓGICA DE ROTEAMENTO
# ============================================================
try:
    qp = st.query_params
except Exception:
    qp = {}

def _qp_first(v):
    if isinstance(v, (list, tuple)):
        return v[0] if v else None
    return v

qp_payment = _qp_first(qp.get("payment"))
qp_session_id = _qp_first(qp.get("session_id"))
qp_code = _qp_first(qp.get("code")) or _qp_first(qp.get("auth_code"))

def _auth_clear_query_params():
    try:
        for k in ["code", "auth_code", "type", "auth", "next"]:
            try:
                del st.query_params[k]
            except Exception:
                pass
    except Exception:
        pass

def _sync_entitlements_from_db(user_id: str):
    if not supabase_admin or not user_id:
        return
    try:
        subs = (
            supabase_admin.table("subscriptions")
            .select("plan,status,current_period_start,current_period_end")
            .eq("user_id", user_id)
            .order("current_period_end", desc=True)
            .limit(1)
            .execute()
        )
        sub = (subs.data or [None])[0]

        if sub and (sub.get("plan") == "premium_plus") and (sub.get("status") == "active"):
            period_start = sub.get("current_period_start")
            usage = (
                supabase_admin.table("usage")
                .select("used,limit")
                .eq("user_id", user_id)
                .eq("period_start", period_start)
                .limit(1)
                .execute()
            )
            row = (usage.data or [None])[0]
            used = int((row or {}).get("used") or 0)
            limit_val = int((row or {}).get("limit") or 30)
            st.session_state.credits_remaining = max(0, limit_val - used)
            st.session_state.payment_verified = st.session_state.credits_remaining > 0
            st.session_state.purchased_plan = "premium_plus"
            return

        credits = (
            supabase_admin.table("user_credits")
            .select("balance")
            .eq("user_id", user_id)
            .limit(1)
            .execute()
        )
        row = (credits.data or [None])[0]
        balance = int((row or {}).get("balance") or 0)
        st.session_state.credits_remaining = max(0, balance)
        st.session_state.payment_verified = balance > 0
    except Exception:
        return

def _consume_one_credit(user_id: str):
    if not supabase_admin or not user_id:
        raise RuntimeError("Banco não configurado")

    subs = (
        supabase_admin.table("subscriptions")
        .select("plan,status,current_period_start,current_period_end")
        .eq("user_id", user_id)
        .order("current_period_end", desc=True)
        .limit(1)
        .execute()
    )
    sub = (subs.data or [None])[0]
    if sub and (sub.get("plan") == "premium_plus") and (sub.get("status") == "active"):
        period_start = sub.get("current_period_start")
        usage = (
            supabase_admin.table("usage")
            .select("used,limit")
            .eq("user_id", user_id)
            .eq("period_start", period_start)
            .limit(1)
            .execute()
        )
        row = (usage.data or [None])[0]
        used = int((row or {}).get("used") or 0)
        limit_val = int((row or {}).get("limit") or 30)
        if used >= limit_val:
            raise RuntimeError("Limite mensal atingido")

        if row is None:
            supabase_admin.table("usage").insert({"user_id": user_id, "period_start": period_start, "used": 1, "limit": limit_val}).execute()
        else:
            supabase_admin.table("usage").update({"used": used + 1}).eq("user_id", user_id).eq("period_start", period_start).execute()
        return

    credits = (
        supabase_admin.table("user_credits")
        .select("balance")
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    row = (credits.data or [None])[0]
    balance = int((row or {}).get("balance") or 0)
    if balance <= 0:
        raise RuntimeError("Sem créditos")
    supabase_admin.table("user_credits").upsert({"user_id": user_id, "balance": balance - 1}).execute()

if qp_code and supabase_public and not st.session_state.auth_user_id:
    try:
        resp = supabase_public.auth.exchange_code_for_session({"auth_code": qp_code})
        session = getattr(resp, "session", None) or (resp.get("session") if isinstance(resp, dict) else None)
        user = getattr(resp, "user", None) or (resp.get("user") if isinstance(resp, dict) else None)
        if user:
            st.session_state.auth_user_id = user.id if hasattr(user, "id") else user.get("id")
            st.session_state.auth_email = user.email if hasattr(user, "email") else user.get("email")
            st.session_state.supabase_session = session
            st.session_state.entitlements_synced = False
            _auth_clear_query_params()
            _sync_entitlements_from_db(st.session_state.auth_user_id)
            st.session_state.entitlements_synced = True
            st.rerun()
    except Exception as e:
        st.error(f"Falha no login: {type(e).__name__}: {e}")

if st.session_state.auth_user_id and supabase_admin and not st.session_state.entitlements_synced:
    _sync_entitlements_from_db(st.session_state.auth_user_id)
    st.session_state.entitlements_synced = True

if qp_payment == "success" and qp_session_id and not st.session_state.payment_verified:
    if not STRIPE_SECRET_KEY:
        st.error("Stripe não configurado (STRIPE_SECRET_KEY ausente).")
    else:
        try:
            session = stripe.checkout.Session.retrieve(qp_session_id)
            is_paid = bool(
                session
                and (
                    session.get("payment_status") in ("paid", "no_payment_required")
                    or (session.get("mode") == "subscription" and session.get("status") == "complete")
                )
            )
            if is_paid:
                meta = session.get("metadata") or {}
                plan_id = (meta.get("plan") or "basico").strip()
                if plan_id not in PRICING:
                    plan_id = "basico"

                if not st.session_state.auth_user_id:
                    st.error("Faça login para finalizar a ativação do seu plano.")
                    st.stop()

                if not supabase_admin:
                    st.error("Banco não configurado. Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.")
                    st.stop()

                if (PRICING[plan_id].get("billing") or "one_time") == "subscription":
                    subscription_id = session.get("subscription")
                    if not subscription_id:
                        st.error("Assinatura não encontrada nesta sessão do Stripe.")
                        st.stop()
                    sub = stripe.Subscription.retrieve(subscription_id)
                    cps = int(sub.get("current_period_start") or 0)
                    cpe = int(sub.get("current_period_end") or 0)
                    supabase_admin.table("subscriptions").upsert(
                        {
                            "user_id": st.session_state.auth_user_id,
                            "plan": "premium_plus",
                            "stripe_subscription_id": subscription_id,
                            "status": sub.get("status"),
                            "current_period_start": cps,
                            "current_period_end": cpe,
                        }
                    ).execute()
                    supabase_admin.table("usage").upsert(
                        {"user_id": st.session_state.auth_user_id, "period_start": cps, "used": 0, "limit": 30}
                    ).execute()
                else:
                    purchased_credits = int(PRICING[plan_id].get("credits", 1))
                    existing = (
                        supabase_admin.table("user_credits")
                        .select("balance")
                        .eq("user_id", st.session_state.auth_user_id)
                        .limit(1)
                        .execute()
                    )
                    row = (existing.data or [None])[0]
                    balance = int((row or {}).get("balance") or 0)
                    supabase_admin.table("user_credits").upsert(
                        {"user_id": st.session_state.auth_user_id, "balance": balance + purchased_credits}
                    ).execute()

                _sync_entitlements_from_db(st.session_state.auth_user_id)

                st.session_state.selected_plan = plan_id
                st.session_state.purchased_plan = plan_id
                st.session_state.payment_verified = True
                st.session_state.stripe_session_id = qp_session_id
                st.session_state.stage = 'processing_premium'
                st.rerun()
            else:
                st.error("Pagamento não confirmado ainda. Tente novamente em alguns segundos.")
        except Exception as e:
            st.error(f"Falha ao validar pagamento: {type(e).__name__}: {e}")

if qp_payment == "cancel" and not st.session_state.payment_verified:
    st.info("Pagamento cancelado. Você pode tentar novamente.")

if st.session_state.stage == 'hero':
    with main_stage.container():
        # 1. TIPO 1: PROPOSTA DE VALOR
        # [FIX NUCLEAR] Limpa o HTML importado também
        st.markdown(clean_html(HERO_HTML), unsafe_allow_html=True) 
        
        # Espaçamento
        st.write("") 
        
        # 2. INPUTS
        c1, c2 = st.columns(2, gap="large")
        
        with c1:
            st.markdown("##### 1. VAGA ALVO 🎯")
            st.session_state.saved_job = st.text_area(
                "Vaga", 
                height=185, 
                value=st.session_state.saved_job if st.session_state.saved_job else "",
                placeholder="Dê um Ctrl+V sem medo...", 
                label_visibility="collapsed"
            )
            
        with c2:
            st.markdown("##### 2. SEU CV (PDF) 📄")
            uploaded_cv = st.file_uploader(
                "CV", 
                type="pdf", 
                label_visibility="collapsed"
            )
            if uploaded_cv is not None:
                st.session_state.saved_file = uploaded_cv
                cv_bytes = _get_file_bytes(uploaded_cv)
                if cv_bytes:
                    cv_hash = _sha256_bytes(cv_bytes)
                    if st.session_state.last_uploaded_cv_hash != cv_hash:
                        st.session_state.last_uploaded_cv_hash = cv_hash
                        track_event("cv_uploaded", {"size_bytes": len(cv_bytes)})
            if st.session_state.saved_file:
                st.success("✅ Arquivo carregado!")
            if (not st.session_state.saved_file) and os.path.exists(LAST_CV_PATH):
                if st.button("Usar último CV", use_container_width=True):
                    try:
                        with open(LAST_CV_PATH, "rb") as f:
                            st.session_state.saved_file = io.BytesIO(f.read())
                        st.success("✅ Último CV carregado.")
                    except Exception:
                        st.error("Não foi possível carregar o último CV.")

        st.markdown("<br>", unsafe_allow_html=True)
        
        # 3. EXPANDER (ANÁLISE COMPETITIVA - REFACTORED V3)
        with st.expander("📂 Comparar com Referência de Mercado (Opcional)", expanded=False):
            
            # [FIX REAL] Envolvemos em clean_html() para remover as quebras de linha que causam o erro
            st.markdown(clean_html(get_linkedin_instructions_html()), unsafe_allow_html=True)

            st.session_state.competitor_files = st.file_uploader(
                "CVs Referência (Opcional)", 
                type="pdf", 
                accept_multiple_files=True, 
                label_visibility="collapsed"
            )
        
        # 4. CTA
        if st.button("OTIMIZAR PARA ESSA VAGA 🚀", use_container_width=True, type="primary"):
            if st.session_state.saved_job and st.session_state.saved_file:
                track_event("analysis_started")
                _write_text_file(LAST_JOB_PATH, st.session_state.saved_job)
                cv_bytes = _get_file_bytes(st.session_state.saved_file)
                if cv_bytes:
                    _write_bytes_file(LAST_CV_PATH, cv_bytes)
                st.session_state.stage = 'analyzing'
                st.rerun()
            else:
                st.toast("⚠️ Por favor, preencha a vaga e faça o upload do CV.", icon="⚠️")
        
        # 5. TRUST BADGE
        st.markdown(textwrap.dedent("""
            <p class="cta-trust-line" style="text-align: center; color: #64748B; font-size: 0.8rem; margin-top: 15px;">
                🛡️ <strong>1ª análise 100% gratuita e segura.</strong><br>
                Seus dados são processados em RAM volátil e deletados após a sessão.
            </p>
        """), unsafe_allow_html=True)
        
        # Fecha div container se necessário (opcional)
        st.markdown('</div>', unsafe_allow_html=True)

        # 6. FOOTER
        st.write("")
        st.write("")
        render_trust_footer()

# --- STAGE 2: ANALYZING (AGORA É O LITE / FREE) ---
elif st.session_state.stage == 'analyzing':
    main_stage.empty()
    time.sleep(0.1)
    
    with main_stage.container():
        st.markdown("<div class='loading-logo'>vant.core scanner</div>", unsafe_allow_html=True)
        progress_bar = st.progress(0)
        status_text = st.empty()
        
        def update_status(text, percent):
            progress_bar.progress(percent)
            status_text.markdown(f"<div class='terminal-log' style='color:#38BDF8;'>>> {text}</div>", unsafe_allow_html=True)
            time.sleep(0.2) # Mais rápido que antes (UX Speed)

        try:
            # Simulando scan rápido (Labor Illusion reduzido)
            update_status("INICIANDO SCANNER BIOMÉTRICO DO CV...", 10)
            text_cv = extrair_texto_pdf(st.session_state.saved_file)
            
            if not text_cv or len(text_cv) < 50:
                 st.error("Erro: Arquivo ilegível.")
                 time.sleep(2)
                 st.session_state.stage = 'hero'; st.rerun()
            
            update_status("MAPEANDO DENSIDADE DE PALAVRAS-CHAVE...", 40)
            
            # [MUDANÇA CRÍTICA] CHAMADA DA LÓGICA LITE (Custo Zero)
             
            data = analyze_preview_lite(text_cv, st.session_state.saved_job)
            
            update_status("CALCULANDO SCORE DE ADERÊNCIA...", 80)
            time.sleep(0.5)
            
            update_status("RELATÓRIO PRELIMINAR PRONTO.", 100)
            time.sleep(0.5)
            
            st.session_state.report_data = data
            st.session_state.stage = 'preview'
            st.rerun()

        except Exception as e:
            st.error(f"Erro no Scanner Lite: {e}")
            if st.button("Voltar"): st.session_state.stage = 'hero'; st.rerun()

# --- STAGE 3: PREVIEW (FREE TIER) ---
elif st.session_state.stage == 'preview':
    main_stage.empty()
    
    data = st.session_state.report_data
    if not data: # Segurança caso user recarregue a página aqui
        st.session_state.stage = 'hero'
        st.rerun()

    # 1. Extração de Dados
    nota = data.get('nota_ats', 0)
    pilares = data.get('analise_por_pilares', {})
    veredito = data.get('veredito', 'ANÁLISE CONCLUÍDA')
    
    # 2. Lógica de Potencial
    if nota < 50: 
        potencial = min(nota + 25, 60) 
    elif nota < 80: 
        potencial = min(nota + 35, 95)
    else: 
        potencial = min(nota + 10, 99) 
        
    st.html(f"""
        <div style="background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(16, 185, 129, 0.1)); 
                    border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 12px; padding: 20px; margin-top: 20px;">
            <div style="display: flex; align-items: center; gap: 15px;">
                <div style="font-size: 2.5rem;">🎯</div>
                <div>
                    <div style="color: #F59E0B; font-weight: 800; font-size: 1.1rem;">META DE PONTUAÇÃO</div>
                    <div style="color: #E2E8F0; font-size: 0.9rem; margin-top: 5px;">
                        Se aplicar as correções sugeridas, sua nota pode chegar a <strong style="color: #10B981;">{potencial}%</strong>
                        <br>Isso coloca você no <strong>Top 15%</strong> dos candidatos.
                    </div>
                </div>
            </div>
        </div>
        """)
    
    with main_stage.container():
        # A. DASHBOARD DE MÉTRICAS (TOPO)
        st.html(render_dashboard_metrics(
            nota, 
            veredito, 
            potencial, 
            pilares
        ))
        
        # B. SPLIT VIEW (GHOSTWRITER vs OFERTA)
        c_left, c_right = st.columns([1.3, 1], gap="large")
        
        with c_left:
            st.caption("👁️ PREVIEW DO GHOSTWRITER (BLOQUEADO)")
            
            exemplo_melhoria = (
                f"Especialista em {pilares.get('setor_detectado', 'Gestão Estratégica')} com histórico de "
                "liderança em projetos de alta complexidade. Otimizou o budget operacional em 22%..."
                "Implementação de frameworks ágeis e reestruturação de governança corporativa."
            )
            
            st.html(render_locked_blur(
                "Ghostwriter V2 (Amostra)", 
                "IA reescrevendo seu CV com keywords de elite:", 
                exemplo_melhoria * 2 
            ))

        with c_right:
            # Lista de Benefícios (Resumida para caber na coluna)
            checklist_beneficios = [
                "<b>Ghostwriter V2:</b> Seu CV 100% Otimizado (ATS)",
                "<b>Radar X-Ray:</b> <span style='color:#FCD34D'>Recrutadores</span> buscando você",
                "<b>Análise de Gap:</b> O que falta para o nível Sênior",
                "<b>Bônus:</b> Script de Entrevista Comportamental"
            ]
            st.html(render_offer_card(checklist_beneficios))
            
        # ---------------------------------------------------------
        # C. LEAD MAGNET X-RAY (FORA DAS COLUNAS - LARGURA TOTAL)
        # ---------------------------------------------------------
        
        # Lógica de personalização do texto
        job_text = st.session_state.saved_job.lower() if st.session_state.saved_job else ""
        texto_destaque = "Recrutadores e Gestores"
        
        if "nubank" in job_text: texto_destaque += " do Nubank"
        elif "google" in job_text: texto_destaque += " do Google"
        elif "amazon" in job_text: texto_destaque += " da Amazon"
        elif "itaú" in job_text or "itau" in job_text: texto_destaque += " do Itaú"
        
        st.html(f"""
        <div style='background: rgba(15, 23, 42, 0.6); border: 1px solid #38BDF8; padding: 20px; border-radius: 12px; position: relative; overflow: hidden; margin-top: 25px;'>
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

        # Explicação do X-Ray (Expander Discreto)
        with st.expander("❓ Por que não apenas buscar no LinkedIn?"):
            st.markdown("""
            <div style="font-size: 0.85rem; color: #CBD5E1;">
                <p>A busca comum do LinkedIn tem travas. O <strong>X-Ray Search</strong> usa o Google para:</p>
                <ul style="padding-left: 15px; margin-bottom: 0;">
                    <li>🔓 <strong>Furar Bloqueios:</strong> Encontrar perfis fora da sua rede (3º grau).</li>
                    <li>🎯 <strong>Precisão Cirúrgica:</strong> Strings booleanas complexas já prontas.</li>
                </ul>
            </div>
            """, unsafe_allow_html=True)

        # ---------------------------------------------------------
        # D. CHECKOUT & FECHAMENTO (BOTTOM)
        # ---------------------------------------------------------
        st.markdown("---")

        if not st.session_state.auth_user_id:
            st.info("🔐 Entre com seu e-mail para salvar créditos/assinatura e acessar de qualquer dispositivo.")
            if supabase_public:
                email = st.text_input("Seu e-mail", key="login_email_preview")
                if st.button("Enviar link de acesso", key="send_magic_preview", use_container_width=True):
                    if not email or "@" not in email:
                        st.error("Digite um e-mail válido.")
                    else:
                        supabase_public.auth.sign_in_with_otp({"email": email, "options": {"email_redirect_to": f"{APP_BASE_URL}?auth=callback"}})
                        st.success("Link enviado. Abra o e-mail e clique para entrar.")
            else:
                st.warning("Supabase ainda não configurado no app.")

        if st.session_state.payment_verified and st.session_state.credits_remaining != 0:
            credits_label = str(int(st.session_state.credits_remaining or 0))
            st.success(f"✅ Pagamento já confirmado nesta sessão. Créditos disponíveis: {credits_label}")
            if st.button("GERAR DOSSIÊ AGORA (usar 1 crédito)", key="use_credit_now", use_container_width=True, type="primary"):
                st.session_state.stage = 'processing_premium'
                st.rerun()

        st.markdown("### 💳 Escolha Seu Plano")
        col1, col2, col3 = st.columns(3, gap="medium")

        with col1:
            st.html("""
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
            """)
            if st.button("ESCOLHER BÁSICO", key="plan_basic", use_container_width=True):
                st.session_state.selected_plan = "basico"
                track_event("plan_selected", {"plan": "basico", "score": int(nota) if nota is not None else 0})
                st.session_state.stage = 'checkout'
                st.rerun()

        with col2:
            st.html("""
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
            """)
            if st.button("ESCOLHER PRO", key="plan_pro", use_container_width=True, type="primary"):
                st.session_state.selected_plan = "pro"
                track_event("plan_selected", {"plan": "pro", "score": int(nota) if nota is not None else 0})
                st.session_state.stage = 'checkout'
                st.rerun()

        with col3:
            st.html("""
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
            """)
            if st.button("ESCOLHER PREMIUM PLUS", key="plan_premium_plus", use_container_width=True):
                st.session_state.selected_plan = "premium_plus"
                track_event("plan_selected", {"plan": "premium_plus", "score": int(nota) if nota is not None else 0})
                st.session_state.stage = 'checkout'
                st.rerun()
            
elif st.session_state.stage == 'checkout':
    main_stage.empty()

    with main_stage.container():
        st.markdown("<div class='loading-logo'>vant.checkout</div>", unsafe_allow_html=True)

        if not st.session_state.auth_user_id:
            st.warning("🔐 Faça login para continuar.")
            if not supabase_public:
                st.error("Supabase não configurado. Defina SUPABASE_URL e SUPABASE_ANON_KEY.")
                if st.button("Voltar"):
                    st.session_state.stage = 'preview'
                    st.rerun()
                st.stop()
            email = st.text_input("Seu e-mail", key="login_email_checkout")
            if st.button("Enviar link de acesso", key="send_magic_checkout", use_container_width=True):
                if not email or "@" not in email:
                    st.error("Digite um e-mail válido.")
                else:
                    supabase_public.auth.sign_in_with_otp({"email": email, "options": {"email_redirect_to": f"{APP_BASE_URL}?auth=callback"}})
                    st.success("Link enviado. Abra o e-mail e clique para entrar.")
            if st.button("Voltar"):
                st.session_state.stage = 'preview'
                st.rerun()
            st.stop()

        plan_id = st.session_state.get("selected_plan") or "basico"
        if plan_id not in PRICING:
            plan_id = "basico"
        plan = PRICING[plan_id]
        price_id = plan.get("stripe_price_id")

        if not STRIPE_SECRET_KEY or not price_id:
            st.error("Stripe não configurado. Defina STRIPE_SECRET_KEY e os STRIPE_PRICE_ID_* em secrets/env.")
            if st.button("Voltar"):
                st.session_state.stage = 'preview'
                st.rerun()
            st.stop()

        if not APP_BASE_URL:
            st.error("APP_BASE_URL não configurado. Ex: https://seuapp.streamlit.app")
            if st.button("Voltar"):
                st.session_state.stage = 'preview'
                st.rerun()
            st.stop()

        try:
            success_url = f"{APP_BASE_URL}?payment=success&session_id={{CHECKOUT_SESSION_ID}}"
            cancel_url = f"{APP_BASE_URL}?payment=cancel"

            billing = (plan.get("billing") or "one_time").strip().lower()
            is_subscription = billing == "subscription"
            billing_line = "✅ Pagamento único · ✅ Acesso imediato" if not is_subscription else "✅ Assinatura mensal · ✅ 30 CVs/mês"

            st.markdown(f"### Confirmar Compra: {plan_id.upper()}")
            st.html(f"""
            <div style="background: rgba(15, 23, 42, 0.6); padding: 20px; border-radius: 12px; margin-bottom: 16px; border: 1px solid rgba(255,255,255,0.08);">
                <div style="display:flex; justify-content: space-between; align-items:center; margin-bottom: 8px;">
                    <span style="color:#94A3B8;">Plano</span>
                    <strong style="color:#F8FAFC;">{plan.get('name','')}</strong>
                </div>
                <div style="display:flex; justify-content: space-between; align-items:center; margin-bottom: 8px;">
                    <span style="color:#94A3B8;">Valor</span>
                    <strong style="color:#10B981; font-size: 1.4rem;">R$ {plan.get('price',0):.2f}</strong>
                </div>
                <div style="color:#64748B; font-size: 0.8rem;">{billing_line}</div>
            </div>
            """)

            session = stripe.checkout.Session.create(
                mode="subscription" if is_subscription else "payment",
                line_items=[{"price": price_id, "quantity": 1}],
                success_url=success_url,
                cancel_url=cancel_url,
                allow_promotion_codes=True,
                customer_email=st.session_state.auth_email,
                client_reference_id=st.session_state.auth_user_id,
                metadata={
                    "plan": plan_id,
                    "score": str(int(st.session_state.report_data.get('nota_ats', 0)) if st.session_state.report_data else 0),
                },
            )

            st.session_state.stripe_session_id = session.get("id")
            st.link_button("Continuar para pagamento", session.get("url"), use_container_width=True)
            st.caption("Se o redirecionamento não abrir automaticamente, use o botão acima.")

            st.html(
                f"""
                <script>
                  window.location.href = "{session.get('url')}";
                </script>
                """,
            )

        except Exception as e:
            st.error(f"Erro ao iniciar checkout: {type(e).__name__}: {e}")
            if st.button("Voltar"):
                st.session_state.stage = 'preview'
                st.rerun()
                
# --- NOVO STAGE: PROCESSING PREMIUM (Onde o gasto acontece) ---
elif st.session_state.stage == 'processing_premium':
    main_stage.empty()
    
    with main_stage.container():
        st.markdown("<div class='loading-logo'>vant.neural engine</div>", unsafe_allow_html=True)
        if not st.session_state.payment_verified:
            st.warning("🔒 Você precisa concluir o pagamento para continuar.")
            if st.button("Ir para pagamento", use_container_width=True, type="primary"):
                st.session_state.stage = 'checkout'
                st.rerun()
            st.stop()

        if st.session_state.credits_remaining == 0:
            st.warning("Você não tem mais créditos disponíveis.")
            if st.button("Comprar mais créditos", use_container_width=True, type="primary"):
                st.session_state.stage = 'preview'
                st.rerun()
            st.stop()

        st.info("🔒 Pagamento Verificado. Iniciando Inteligência Artificial Generativa...")
        
        prog = st.progress(0)
        status = st.empty()
        
        # Agora sim chamamos a LLM cara (analyze_cv_logic ORIGINAL)
        try:
            dev_mode = st.checkbox("DEV: usar mock (sem tokens)", value=st.session_state.dev_mode)
            st.session_state.dev_mode = dev_mode
            os.environ["VANT_DEV_MODE"] = "1" if dev_mode else "0"
            force_recalc = st.checkbox("Recalcular (gasta tokens)", value=False)
            status.text("Reescrevendo seu CV (GPT-4o Agent)...")
            prog.progress(25)
            
            text_cv = extrair_texto_pdf(st.session_state.saved_file)

            cache_path = _premium_cache_path(text_cv, st.session_state.saved_job, st.session_state.competitor_files)
            if (not force_recalc) and os.path.exists(cache_path):
                cached = _load_json(cache_path)
                if cached:
                    full_data = cached
                else:
                    full_data = None
            else:
                full_data = None
            
            # Chama a função PESADA original
            if full_data is None:
                if st.session_state.auth_user_id and supabase_admin:
                    try:
                        _consume_one_credit(st.session_state.auth_user_id)
                        _sync_entitlements_from_db(st.session_state.auth_user_id)
                    except Exception as e:
                        st.warning(str(e))
                        if st.button("Voltar", use_container_width=True):
                            st.session_state.stage = 'preview'
                            st.rerun()
                        st.stop()

                full_data = analyze_cv_logic(
                    text_cv, 
                    st.session_state.saved_job,
                    st.session_state.competitor_files
                )
                _save_json(cache_path, full_data)
            
            prog.progress(90)
            status.text("Finalizando Dossiê...")
            
            st.session_state.report_data = full_data # Sobrescreve o Lite pelo Full
            st.session_state.stage = 'paid'
            st.rerun()
            
        except Exception as e:
            st.error(f"Erro na geração premium: {e}")            

# --- STAGE 4: PAID (FULL ACCESS) ---
elif st.session_state.stage == 'paid':
    main_stage.empty()
    # st.balloons() # Opcional: Removido para dar um tom mais sério se a nota for baixa, ou manter se preferir
    
    data = st.session_state.report_data
    if not data:
        st.error("Dados da sessão perdidos. Por favor, reinicie.")
        if st.button("Reiniciar"): st.session_state.stage = 'hero'; st.rerun()
        st.stop()

    credits_label = str(int(st.session_state.credits_remaining or 0))
    st.caption(f"Créditos nesta sessão: {credits_label}")
    if st.session_state.credits_remaining != 0:
        if st.button("Nova otimização", use_container_width=True):
            st.session_state.report_data = None
            st.session_state.saved_file = None
            st.session_state.competitor_files = None
            st.session_state.last_uploaded_cv_hash = None
            st.session_state.stage = 'hero'
            st.rerun()

    comp_data = data.get("analise_comparativa", {})
    
    # Cálculo Gamificação & Cores Dinâmicas
    nota_inicial = data.get('nota_ats', 0)
    completed_count = len(st.session_state.completed_tasks)
    xp_atual = min(100, nota_inicial + (completed_count * 5))
    
    # [UX REFINEMENT] Lógica de Cor e Label (Externalização da Culpa)
    if xp_atual < 60:
        nivel_label = "FORMATADO COMO JÚNIOR 🧱"
        # Vermelho Alerta (mas elegante, não agressivo)
        bar_color = "#EF4444" 
        bg_glow = "rgba(239, 68, 68, 0.2)"
        msg_ego = "Seu currículo está escondendo sua senioridade real."
    elif xp_atual < 85:
        nivel_label = "FORMATADO COMO PLENO ⚔️"
        # Laranja Atenção
        bar_color = "#F59E0B"
        bg_glow = "rgba(245, 158, 11, 0.2)"
        msg_ego = "Bom potencial, mas a formatação limita seu salário."
    else:
        nivel_label = "FORMATADO COMO SÊNIOR 👑"
        # Verde Sucesso
        bar_color = "#10B981"
        bg_glow = "rgba(16, 185, 129, 0.2)"
        msg_ego = "Documento alinhado com sua experiência real."
    
    with main_stage.container():
        # Dashboard de XP (Visual Corrigido)
        st.html(f"""
        <div style="background: linear-gradient(90deg, rgba(15,23,42,1) 0%, rgba(30,41,59,1) 100%); padding: 25px; border-radius: 16px; border: 1px solid {bar_color}40; margin-bottom: 30px; box-shadow: 0 4px 20px {bg_glow};">
            
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
                <div>
                    <div style="color: #94A3B8; font-size: 0.8rem; font-weight: 600; letter-spacing: 1px; margin-bottom: 4px;">DIAGNÓSTICO TÉCNICO</div>
                    <div style="color: {bar_color}; font-weight: 800; font-size: 1.4rem;">{nivel_label}</div>
                    <div style="color: #CBD5E1; font-size: 0.9rem; margin-top: 4px; font-style: italic;">"{msg_ego}"</div>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 2rem; font-weight: 800; color: #F8FAFC; line-height: 1;">{xp_atual}<span style="font-size: 1rem; color: #64748B;">/100</span></div>
                    <div style="font-size: 0.75rem; color: {bar_color}; font-weight: bold;">SCORE ATS</div>
                </div>
            </div>

            <div style="width: 100%; background: rgba(0,0,0,0.6); height: 14px; border-radius: 10px; overflow: hidden; border: 1px solid rgba(255,255,255,0.05);">
                <div style="width: {xp_atual}%; background: {bar_color}; height: 100%; transition: width 1.5s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 0 15px {bar_color};"></div>
            </div>
            
            <div style="display: flex; justify-content: space-between; margin-top: 10px; font-size: 0.8rem; color: #64748B;">
                <span>Análise Estrutural: <strong style="color: #E2E8F0;">Concluída</strong></span>
                <span>Otimização Semântica: <strong style="color: #E2E8F0;">Aplicada</strong></span>
            </div>
        </div>
        """)
        
        # Logo após o dashboard de XP, adicione:
        st.html(f"""
        <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(56, 189, 248, 0.1); border-radius: 12px; padding: 20px; margin-bottom: 25px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <span style="color: #94A3B8; font-size: 0.85rem; font-weight: 600;">PROGRESSO DO DOSSIÊ</span>
                <span style="color: #10B981; font-size: 0.9rem; font-weight: 700;">5/5 SEÇÕES ✓</span>
            </div>
            <div style="display: flex; gap: 8px;">
                <div style="flex: 1; height: 6px; background: #10B981; border-radius: 3px;" title="Diagnóstico"></div>
                <div style="flex: 1; height: 6px; background: #10B981; border-radius: 3px;" title="CV Otimizado"></div>
                <div style="flex: 1; height: 6px; background: #10B981; border-radius: 3px;" title="Concorrência"></div>
                <div style="flex: 1; height: 6px; background: #10B981; border-radius: 3px;" title="Simulador"></div>
                <div style="flex: 1; height: 6px; background: #10B981; border-radius: 3px;" title="Biblioteca"></div>
            </div>
            <p style="color: #64748B; font-size: 0.75rem; margin-top: 10px; margin-bottom: 0;">
                🎉 Dossiê completo gerado! Explore todas as abas acima.
            </p>
        </div>
        """)
        
        # [REFACTOR] Abas Reorganizadas (Roadmap Removido, X-Ray movido para Diagnóstico)
        # --- VERSÃO ORIGINAL (5 ABAS) - COMENTADA PARA MVP ---
        # tabs = ["📊 DIAGNÓSTICO E AÇÃO", "📝 CV OTIMIZADO", "⚔️ CONCORRÊNCIA", "🎤 SIMULADOR", "📚 BIBLIOTECA"]
        # t1, t2, t3, t4, t5 = st.tabs(tabs)
        
        # --- VERSÃO MVP (3 ABAS) ---
        tabs = ["📊 DIAGNÓSTICO E AÇÃO", "📄 CV OTIMIZADO", "📚 BIBLIOTECA"]
        t1, t2, t3 = st.tabs(tabs)
        
        # 1. DIAGNÓSTICO + PLANO TÁTICO
        with t1:
            st.subheader("1. Plano de Correção Imediata")
            
            # --- MICRO-FUNÇÃO LOCAL PARA RESOLVER O PROBLEMA ---
            def fmt_diag(text):
                if not text: return ""
                # Transforma **texto** em <strong style="color:#38BDF8">texto</strong>
                # Força a cor diretamente no HTML (inquebrável)
                import re
                return re.sub(r'\*\*(.*?)\*\*', r'<strong style="color:#38BDF8!important">\1</strong>', text)

            for gap in data.get('gaps_fatais', []):
                # Usa a nova função que garante o azul
                correcao_html = fmt_diag(gap.get('correcao_sugerida'))
                evidencia_html = fmt_diag(gap.get('evidencia')) 
                
                st.html(f"""
                <div class="opportunity-box">
                    <div class="opportunity-title">⚡ {gap.get('erro')}</div>
                    
                    <div class="evidence-box">Evidência: "{evidencia_html}"</div>
                    
                    <div class="solution-box">💡 {correcao_html}</div>
                </div>
                """)
                
            st.markdown("---")
            render_copyable_section("💼 Headline LinkedIn", data.get('linkedin_headline', ''), is_headline=True)
            render_copyable_section("📝 Resumo Profissional Otimizado", data.get('resumo_otimizado', ''))

            # [UPGRADE UX] X-RAY SEARCH INTERATIVO (1-CLICK ACTION)
            st.markdown("---")
            st.subheader("🎯 X-Ray Search (Acesso ao Mercado Oculto)")
            
            # 1. Preparação dos Dados
            kit = data.get('kit_hacker', {})
            raw_string = kit.get('boolean_string', 'site:linkedin.com/in')
            
            # Codifica a string para URL (ex: " " vira "%20") para o Google entender
            encoded_query = urllib.parse.quote(raw_string)
            google_link = f"https://www.google.com/search?q={encoded_query}"
            
            # 2. Renderização do Card de Ação
            st.html(f"""
            <div style="background: linear-gradient(135deg, rgba(15, 23, 42, 0.6) 0%, rgba(56, 189, 248, 0.1) 100%); 
                        border: 1px solid #38BDF8; border-radius: 12px; padding: 20px; position: relative; overflow: hidden;">
                
                <div style="position: absolute; top: -20px; right: -20px; width: 80px; height: 80px; background: #38BDF8; filter: blur(50px); opacity: 0.2;"></div>

                <div style="margin-bottom: 15px;">
                    <strong style="color: #F8FAFC; font-size: 1.05rem;">Como encontrar os Recrutadores dessa vaga?</strong>
                    <p style="color: #94A3B8; font-size: 0.9rem; margin-top: 5px; line-height: 1.5;">
                        Não espere eles te acharem. Nossa IA gerou um código de busca avançada (Google Dorking) para filtrar Gestores, Recrutadores e Pares Sêniores (para pedir indicação).
                    </p>
                </div>

                <a href="{google_link}" target="_blank" style="text-decoration: none;">
                    <div style="background: #38BDF8; color: #0F172A; text-align: center; padding: 12px; border-radius: 8px; font-weight: 800; font-size: 1rem; transition: transform 0.2s; box-shadow: 0 4px 15px rgba(56, 189, 248, 0.3);">
                        🔍 CLIQUE PARA RODAR A BUSCA NO GOOGLE
                    </div>
                </a>

                <div style="margin-top: 20px;">
                    <p style="font-size: 0.75rem; color: #64748B; margin-bottom: 5px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
                        CÓDIGO GERADO PELA IA:
                    </p>
                    <div style="background: rgba(0,0,0,0.3); padding: 10px; border-radius: 6px; border-left: 2px solid #64748B; font-family: monospace; font-size: 0.75rem; color: #CBD5E1; word-break: break-all;">
                        {raw_string}
                    </div>
                </div>
            </div>
            """)

            # [MOVED] PROJETO PRÁTICO AGORA AQUI
            st.markdown("---")
            st.subheader("🏆 Projeto Prático (Diferencial)")
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

        # 2. CV OTIMIZADO
        with t2:
            st.subheader("🚀 Currículo Reestruturado Integralmente")
            
            # --- CSS V13: FINAL BLINDADO (SCOPED + TIMELINE + SKILLS) ---
            st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

    /* --- 1. ESTRUTURA GERAL --- */
    .stApp { background-color: #f8fafc; }

    .cv-paper-sheet {
        background-color: #ffffff;
        width: 100%;
        max-width: 820px;
        margin: 2rem auto;
        padding: 4rem 4.5rem;
        box-shadow: 0 1px 3px rgba(0,0,0,0.02), 0 10px 40px -10px rgba(0,0,0,0.08);
        border-radius: 4px;
        color: #334155; 
        font-family: 'Inter', sans-serif;
        border-top: 6px solid #10B981;
    }
    
    .cv-paper-sheet {
    --space-1: 4px;
    --space-2: 8px;
    --space-3: 16px;
    --space-4: 24px;
    --space-5: 32px;
}

    .cv-paper-sheet h1, .cv-paper-sheet h2, .cv-paper-sheet p, .cv-paper-sheet span {
        font-family: 'Inter', sans-serif !important;
    }

    /* --- 2. HEADER --- */
    .cv-paper-sheet .vant-cv-name {
        font-size: 2.5rem;
        font-weight: 900;
        text-align: center;
        margin-bottom: 0.5rem;
        text-transform: uppercase;
        letter-spacing: -0.02em;
        color: #0f172a;
    }

    .cv-paper-sheet .vant-cv-contact-line {
        font-size: 0.9rem;
        color: #64748B;
        text-align: center;
        margin-bottom: 3rem;
    }

    /* --- 3. TÍTULOS DE SEÇÃO --- */
    .cv-paper-sheet .vant-cv-section {
        font-size: 0.85rem;
        font-weight: 800;
        color: #0f172a;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        border-bottom: 1px solid #e2e8f0;
        margin-top: 2rem;
        margin-bottom: 1.5rem;
        padding-bottom: 0.5rem;
        display: flex;
        align-items: center;
    }

    .cv-paper-sheet .vant-cv-section + .vant-cv-job-container {
        margin-top: var(--space-4);
    }

    .cv-paper-sheet .vant-cv-section + * {
    margin-top: var(--space-3);
}

    .cv-paper-sheet .vant-cv-section::before {
        content: '';
        display: inline-block;
        width: 12px;
        height: 4px;
        background-color: #10B981;
        margin-right: 10px;
        border-radius: 2px;
    }

    /* --- 4. EXPERIÊNCIA (Layout Otimizado) --- */
    
    /* Container Principal (Empresa) */
    .cv-paper-sheet .vant-cv-job-container {
        position: relative;
        /* Espaço para separar EMPRESAS diferentes, não cargos */
        margin-bottom: var(--space-4); 
        padding-left: 0;
        border-left: 3px solid transparent; 
        transition: all 0.2s ease;
        margin-top: var(--space-4);
    }

    .cv-paper-sheet .vant-cv-job-container:hover {
        border-left-color: #10B981;
        padding-left: 12px;
    }

    /* Título do Cargo */
    .cv-paper-sheet .vant-job-title {
        font-size: 1.1rem;
        font-weight: 700;
        color: #0f172a;
        margin-top: 0;
        margin-bottom: var(--space-1);
        line-height: 1.2;
    }

    .cv-paper-sheet .vant-job-company {
        font-size: 1rem;
        font-weight: 600;
        color: #059669;
        margin-left: 6px;
    }

    /* Data - Compacta */
    .cv-paper-sheet .vant-job-date {
        font-size: 0.8rem;
        color: #64748B;
        font-weight: 500;
        display: block;
        margin-top: 0;
        margin-bottom: var(--space-2);
    }

    /* --- 5. TIMELINE DE PROMOÇÃO (Ajuste Fino) --- */
    /* Este bloco puxa o cargo antigo para perto do novo */
    .cv-paper-sheet .vant-promo-child {
        margin-top: var(--space-3);
        margin-bottom: var(--space-3);
        margin-left: 4px; /* Alinhamento visual */
        padding-left: 18px; /* Recuo para hierarquia */
        border-left: 2px solid #e2e8f0; /* A linha conectora */
        position: relative;
    }
    
    .cv-paper-sheet .vant-promo-child .vant-job-title {
        font-size: 1rem;
        font-weight: 600;
        color: #1f2937;
    }

    .cv-paper-sheet .vant-cv-section ~ .vant-cv-job-container:first-of-type .vant-job-title {
        margin-top: var(--space-4);
    }

    .cv-paper-sheet .vant-promo-child .vant-job-date {
        color: #94a3b8;
    }
    
    /* A bolinha na linha do tempo */
    .cv-paper-sheet .vant-promo-child::before {
        content: '';
        position: absolute;
        left: -5px;
        top: 5px;
        width: 8px;
        height: 8px;
        background-color: #fff;
        border: 2px solid #cbd5e1;
        border-radius: 50%;
    }

    /* Badge de Promoção */
    .cv-paper-sheet .vant-promo-indicator {
        font-size: 0.6rem;
        font-weight: 700;
        color: #059669;
        text-transform: uppercase;
        background: #ecfdf5;
        border: 1px solid #6ee7b7;
        padding: 2px 6px;
        border-radius: 4px;
        margin-left: 8px;
        vertical-align: middle;
        display: inline-block;
        transform: translateY(-2px);
    }

    /* --- 6. TEXTO E BULLETS --- */
    .cv-paper-sheet .vant-cv-grid-row {
        display: grid;
        grid-template-columns: 12px 1fr; /* Bullet mais próximo do texto */
        gap: 6px;
        margin-bottom: var(--space-2);
    }
    
    .vant-cv-grid-row:first-child {
    margin-top: var(--space-2);
}

    .cv-paper-sheet .vant-cv-bullet-col {
        color: #10B981; 
        font-size: 1rem; /* Bullet um pouco maior para destaque */
        line-height: 1.2;
        padding-top: 2px;
    }

    .cv-paper-sheet .vant-cv-text-col {
        font-size: 0.92rem;
        line-height: 1.45;
        color: #334155; 
        text-align: left;
    }

    /* --- 7. SKILLS --- */
    .cv-paper-sheet .vant-skills-container {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 1rem;
    }

    .cv-paper-sheet .vant-skill-chip {
        font-size: 0.75rem;
        font-weight: 600;
        color: #334155;
        background-color: #fff;
        padding: 4px 12px;
        border-radius: 6px;
        border: 1px solid #e2e8f0;
    }
    
    /* Mobile */
    @media (max-width: 600px) {
        .cv-paper-sheet { padding: 2rem; margin: 0.5rem; }
        .cv-paper-sheet .vant-cv-name { font-size: 1.8rem; }
    }
</style>
""", unsafe_allow_html=True)

            # Recupera o texto atual do estado
            current_cv_text = data.get('cv_otimizado_completo', '')

            # --- EDITOR COM BOTÃO DE SALVAR ---
            with st.expander("✏️ ENCONTROU UM ERRO? CLIQUE PARA EDITAR O TEXTO", expanded=False):
                st.info("💡 Edite o texto abaixo e clique em SALVAR para atualizar o PDF, o Word e a visualização.")
                
                edited_text = st.text_area(
                    "Editor de Conteúdo (Markdown)",
                    value=current_cv_text,
                    height=300,
                    key="editor_cv_manual",
                    help="Edite o texto aqui. Use ** para negrito, ### para títulos."
                )
                
                if st.button("💾 SALVAR ALTERAÇÕES", type="primary", use_container_width=True):
                    # 1. Atualiza o objeto de dados principal
                    data['cv_otimizado_completo'] = edited_text
                    st.session_state.report_data = data 
                    st.toast("✅ Alterações aplicadas!", icon="💾")
                    time.sleep(0.5)
                    st.rerun()

            # --- RENDERIZAÇÃO VISUAL (PREVIEW) ---
            final_cv_text = data.get('cv_otimizado_completo', '')
            
            # Aqui assume-se que você atualizou o logic.py com o novo format_text_to_html
            cv_cleaned_html = format_text_to_html(final_cv_text)
            b64_cv = base64.b64encode(final_cv_text.encode('utf-8')).decode('utf-8')

            st.html(f"""
            <div class="cv-preview-container">
                <div class="paper-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                    <span style="color:#94A3B8; font-size:0.8rem; font-weight:600;">VISUALIZAÇÃO (MODO PAPEL)</span>
                    <button class="header-copy-btn" onclick="copyFromBase64('{b64_cv}', this)" style="background:rgba(56, 189, 248, 0.1); border:1px solid #38BDF8; color:#38BDF8; padding:6px 12px; border-radius:6px; cursor:pointer; font-weight:600;">
                        COPIAR TUDO 📋
                    </button>
                </div>
                
                <div class="cv-paper-sheet">
                    {cv_cleaned_html}
                </div>
                
                <div class="paper-footer-hint" style="text-align:center; margin-top:10px; opacity:0.6; font-size:0.8rem; color: #94A3B8;">
                    💡 O visual acima simula exatamente como o recrutador verá seu arquivo.
                </div>
            </div>
            """)

            # --- BOTÕES DE DOWNLOAD ---
            st.markdown("<br>", unsafe_allow_html=True)
            try:
                # GERAÇÃO EM TEMPO REAL
                pdf_bytes = gerar_pdf_candidato(data)
                docx_bytes = gerar_word_candidato(data)
                
                c_dl_1, c_dl_2 = st.columns(2, gap="small")
                
                with c_dl_1:
                    st.download_button(
                        "📥 BAIXAR PDF (OFICIAL)", 
                        data=pdf_bytes, 
                        file_name="Curriculo_VANT.pdf", 
                        mime="application/pdf", 
                        use_container_width=True, 
                        type="primary",
                        on_click=lambda: st.toast("🎉 PDF baixado! Pronto para enviar para vagas.", icon="✅")
)
                
                with c_dl_2:
                    st.download_button(
                        "📝 BAIXAR WORD (EDITÁVEL)",
                        data=docx_bytes,
                        file_name="Curriculo_VANT_Editavel.docx",
                        mime="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                        use_container_width=True,
                        help="Baixa um arquivo .docx com formatação, títulos e negritos preservados."
                    )

            except Exception as e:
                st.warning(f"Não foi possível gerar os arquivos: {e}")

        #. CONCORRÊNCIA
        #h t3:
        # if comp_data:
        #     st.subheader("⚔️ Benchmarking Competitivo")
        #     st.caption("Comparativo direto entre seu Perfil e os Benchmarks anexados por você.")
        #     
        #     c_a, c_b = st.columns(2, gap="medium")
        #     
        #     with c_a: # Gaps
        #         items_html = ""
        #         for item in comp_data.get("vantagens_concorrentes", []):
        #             items_html += f"<li style='margin-bottom:8px; color:#CBD5E1;'>{item}</li>"
        #         
        #         st.html(f"""
        #         <div style="background: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 12px; padding: 20px; height: 100%;">
        #             <h4 style="color: #EF4444; margin-top: 0; display: flex; align-items: center; gap: 8px;">❌ GAPS DE MERCADO</h4>
        #             <ul style="padding-left: 20px; margin: 0; font-size: 0.9rem;">{items_html}</ul>
        #         </div>
        #         """)

        #     with c_b: # Diferenciais
        #         items_html_diff = ""
        #         for item in comp_data.get("seus_diferenciais", []):
        #             items_html_diff += f"<li style='margin-bottom:8px; color:#E2E8F0;'>{item}</li>"

        #         st.html(f"""
        #         <div style="background: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; padding: 20px; height: 100%;">
        #             <h4 style="color: #10B981; margin-top: 0; display: flex; align-items: center; gap: 8px;">✅ SEUS TRUNFOS</h4>
        #             <ul style="padding-left: 20px; margin: 0; font-size: 0.9rem;">{items_html_diff}</ul>
        #         </div>
        #         """)
        #     
        #     st.markdown("<br>", unsafe_allow_html=True)

        #     plano = comp_data.get('plano_de_ataque', 'Foque nos seus diferenciais.')
        #     st.html(f"""
        #     <div style="background: rgba(56, 189, 248, 0.1); border-left: 4px solid #38BDF8; padding: 15px; border-radius: 4px;">
        #         <strong style="color: #38BDF8;">💡 ESTRATÉGIA RECOMENDADA:</strong><br>
        #         <span style="color: #E2E8F0;">{plano}</span>
        #     </div>
        #     """)
        #     
        #     prob = comp_data.get("probabilidade_aprovacao", 0)
        #     bar_color = "#EF4444" if prob < 40 else "#F59E0B" if prob < 70 else "#10B981"
        #     
        #     st.markdown(f"""
        #     <div style="margin-top: 25px;">
        #         <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
        #             <span style="font-weight: bold; color: #94A3B8;">PROBABILIDADE ESTIMADA DE ENTREVISTA</span>
        #             <span style="font-weight: 800; color: {bar_color};">{prob}%</span>
        #         </div>
        #         <div style="width: 100%; background: #1E293B; height: 10px; border-radius: 5px; overflow: hidden;">
        #             <div style="width: {prob}%; background: {bar_color}; height: 100%; border-radius: 5px;"></div>
        #         </div>
        #     </div>
        #     """, unsafe_allow_html=True)

        # else:
        #     st.warning("⚠️ Esta análise requer que você envie CVs de referência na etapa inicial.")

        #. SIMULADOR
        #h t4:
        # st.subheader("🎤 Simulador de Entrevista (IA Feedback)")
        # 
        # questions = data.get('perguntas_entrevista', [])
        # 
        # # States locais para o simulador
        # if 'sim_transcript' not in st.session_state: st.session_state.sim_transcript = ""
        # if 'sim_feedback' not in st.session_state: st.session_state.sim_feedback = None
        # if 'last_audio_bytes' not in st.session_state: st.session_state.last_audio_bytes = None
        # if 'retry_count' not in st.session_state: st.session_state.retry_count = 0

        # if questions and len(questions) > 0:
        #     idx = st.session_state.interview_idx
        #     q = questions[idx % len(questions)]
        #     
        #     st.html(f"""
        #     <div class="interview-card">
        #         <div class="interview-header">
        #             <span style="color: #94A3B8; font-size: 0.85rem;">Pergunta {(idx % len(questions)) + 1} de {len(questions)}</span>
        #             <span style="color: #38BDF8; font-size: 0.85rem; font-weight: 600;">Tempo ideal: 90s</span>
        #         </div>
        #         <div class="interview-question-box">
        #             <div class="interview-bar"></div>
        #             <div class="interview-text">"{q.get('pergunta')}"</div>
        #         </div>
        #         <div class="interview-footer">
        #             <span style="color: #E2E8F0; font-weight: 600; font-size: 0.9rem;">O que o recrutador espera: </span>
        #             <span style="color: #94A3B8; font-size: 0.9rem;">{q.get('expectativa_recrutador')}</span>
        #         </div>
        #     </div>
        #     """)
        #     
        #     audio_key = f"audio_rec_{st.session_state.interview_idx}_v{st.session_state.retry_count}"
        #     audio_value = st.audio_input("Grave sua resposta", key=audio_key)

        #     if audio_value:
        #         audio_bytes = audio_value.getvalue()
        #         if st.session_state.last_audio_bytes != audio_bytes:
        #             st.session_state.last_audio_bytes = audio_bytes
        #             st.session_state.sim_transcript = "" 
        #             st.session_state.sim_feedback = None 
        #             
        #             with st.spinner("🎧 Ouvindo e analisando..."):
        #                 from llm_core import transcribe_audio_groq, analyze_interview_gemini
        #                 text = transcribe_audio_groq(audio_bytes)
        #                 st.session_state.sim_transcript = text
        #             
        #             if text and "Erro" not in text:
        #                 with st.spinner("🧠 Gerando feedback técnico..."):
        #                     job_context = st.session_state.saved_job
        #                     feedback = analyze_interview_gemini(q.get('pergunta'), text, job_context)
        #                     st.session_state.sim_feedback = feedback

        #     if st.session_state.sim_transcript:
        #         st.html(f"""
        #         <div class="transcript-box">
        #             <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
        #                 <div style="display:flex; gap:8px; align-items:center;">
        #                     <span>📝</span><span style="color: #F8FAFC; font-weight: 600;">Sua Resposta</span>
        #                 </div>
        #                 <div style="padding: 5px; opacity: 0.7;">✏️</div>
        #             </div>
        #             <div class="transcript-text">"{st.session_state.sim_transcript}"</div>
        #         </div>
        #         """)

        #     fb = st.session_state.sim_feedback
        #     if fb:
        #         score = fb.get('nota_final', 0)
        #         af = fb.get('analise_fina', {})
        #         exemplo_ideal = fb.get('exemplo_resposta_star', None)
        #         
        #         if score >= 90:
        #             score_color, badge_bg, msg_title = "#10B981", "rgba(16, 185, 129, 0.1)", "Resposta de Especialista! 🏆"
        #         elif score >= 70:
        #             score_color, badge_bg, msg_title = "#34D399", "rgba(52, 211, 153, 0.1)", "Mandou bem!"
        #         elif score >= 41:
        #             score_color, badge_bg, msg_title = "#F59E0B", "rgba(245, 158, 11, 0.1)", "Boa base, vamos refinar?"
        #         elif score > 0:
        #             score_color, badge_bg, msg_title = "#F59E0B", "rgba(245, 158, 11, 0.1)", "Vamos ajustar?"
        #         else:
        #             score_color, badge_bg, msg_title = "#EF4444", "rgba(239, 68, 68, 0.1)", "Resposta Inválida"

        #         feedback_display = fb.get('feedback_curto', '')
        #         if score == 0: feedback_display = "Não detectamos uma resposta coerente."

        #         st.html(f"""
        #             <div class="feedback-card" style="border: 1px solid {score_color}40;">
        #                 <div class="card-header-flex">
        #                     <div>
        #                         <h3 class="card-title-text">{msg_title}</h3>
        #                         <p class="card-subtitle-text">{feedback_display}</p>
        #                     </div>
        #                     <div class="score-badge" style="background: {badge_bg}; color: {score_color}; border: 1px solid {score_color};">
        #                         {score}
        #                     </div>
        #                 </div>
        #                 <div class="card-stats-grid">
        #                     {_render_progress_bar("Clareza", af.get('clareza',0))}
        #                     {_render_progress_bar("Estrutura", af.get('estrutura',0))}
        #                     {_render_progress_bar("Impacto", af.get('impacto',0))}
        #                     {_render_progress_bar("Conteúdo Técnico", af.get('conteudo_tecnico',0))}
        #                 </div>
        #                 <div class="action-plan-box">
        #                     <h4 style="color: #F59E0B; margin-top: 0; margin-bottom: 15px; font-size: 1rem; display: flex; align-items: center; gap: 8px;">
        #                         ⚡ Plano de Ação
        #                     </h4>
        #                     <ul class="action-list">
        #                         {"".join([f"<li>{p}</li>" for p in fb.get('pontos_melhoria', [])])}
        #                     </ul>
        #                 </div>
        #             </div>
        #             """)
        #         
        #         if exemplo_ideal:
        #             exemplo_html = format_text_to_html(exemplo_ideal)
        #             with st.expander("✨ Ver Exemplo de Resposta Ideal (Referência)", expanded=False):
        #                 st.html(f"<div class='ideal-answer-box'>{exemplo_html}</div>")

        #     st.markdown("<br>", unsafe_allow_html=True)
        #     c_retry, c_next = st.columns([1, 1])
        #     is_passing = fb and fb.get('nota_final', 0) >= 70
        #     
        #     with c_retry:
        #         btn_type = "secondary" if is_passing else "primary"
        #         if st.button("🔄 Tentar Novamente", use_container_width=True, type=btn_type):
        #             st.session_state.retry_count += 1
        #             st.session_state.sim_transcript = ""
        #             st.session_state.sim_feedback = None
        #             st.session_state.last_audio_bytes = None
        #             st.rerun()
        #     
        #     with c_next:
        #         btn_type = "primary" if is_passing else "secondary"
        #         btn_label = "Próxima Pergunta ➡️" if is_passing else "Pular / Próxima ⏩"
        #         if st.button(btn_label, use_container_width=True, type=btn_type):
        #             st.session_state.interview_idx += 1
        #             st.session_state.retry_count = 0
        #             st.session_state.sim_transcript = ""
        #             st.session_state.sim_feedback = None
        #             st.session_state.last_audio_bytes = None
        #             st.rerun()
        # else:
        #      st.info("💡 Realize o diagnóstico do CV na aba inicial para gerar as perguntas personalizadas.")

        # 5. BIBLIOTECA
        with t3:
            st.subheader("📚 Biblioteca Definitiva")
            for i, book in enumerate(data.get('biblioteca_tecnica', [])):
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
                
        if st.session_state.stage == 'preview':
            st.html("""
            <script>
            let exitShown = false;
            document.addEventListener('mouseout', function(e) {
                if (!exitShown && e.clientY < 50) {
                    exitShown = true;
                    alert('⚠️ Atenção: Seu diagnóstico será perdido se você sair agora. Continue para desbloquear o CV otimizado!');
                }
            });
            </script>
            """)

        st.markdown("<br>", unsafe_allow_html=True)
        if st.button("Analisar outro perfil", use_container_width=True):
            st.session_state.stage = 'hero'
            st.rerun()
            
        st.markdown("---")
        st.caption("🎁 AJUDE UM AMIGO A CONSEGUIR UMA VAGA")

        share_text = urllib.parse.quote("Acabei de otimizar meu CV com IA e aumentei minha nota em +34%! 🚀 Teste grátis: https://vant.app")
        share_url_whatsapp = f"https://wa.me/?text={share_text}"
        share_url_linkedin = f"https://www.linkedin.com/sharing/share-offsite/?url=https://vant.app"

        c1, c2, c3 = st.columns(3)
        with c1:
            st.link_button("📱 WhatsApp", share_url_whatsapp, use_container_width=True)
        with c2:
            st.link_button("💼 LinkedIn", share_url_linkedin, use_container_width=True)
        with c3:
            if st.button("📋 Copiar Link", use_container_width=True):
                st.toast("✅ Link copiado! Cole no seu navegador para compartilhar.", icon="🔗")
