from __future__ import annotations

import io
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import Any
from dotenv import load_dotenv

# Carrega variáveis de ambiente do arquivo .env na raiz do projeto
PROJECT_ROOT = Path(__file__).parent.parent
load_dotenv(PROJECT_ROOT / ".env")

import stripe
from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel
from supabase import create_client

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from logic import analyze_cv_logic, analyze_preview_lite, extrair_texto_pdf, gerar_pdf_candidato, gerar_word_candidato  # noqa: E402

try:
    from backend.mock_data import MOCK_PREVIEW_DATA, MOCK_PREMIUM_DATA
except ImportError:
    from mock_data import MOCK_PREVIEW_DATA, MOCK_PREMIUM_DATA

app = FastAPI(title="Vant API", version="0.1.0")

# Modo de desenvolvimento (true = usa mock, false = usa IA real)
DEV_MODE = os.getenv("DEV_MODE", "false").lower() == "true"

# Log de inicialização
if DEV_MODE:
    print("\n" + "="*60)
    print("🔧 MODO DE DESENVOLVIMENTO ATIVADO")
    print("   IA será substituída por mocks instantâneos")
    print("   Nenhum token será gasto")
    print("="*60 + "\n")
else:
    print("\n" + "="*60)
    print("🤖 MODO DE PRODUÇÃO ATIVADO")
    print("   IA real será processada")
    print("   Tokens serão consumidos")
    print("="*60 + "\n")

STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")

# Novos Price IDs - Modelo Simplificado
STRIPE_PRICE_ID_PRO_MONTHLY = os.getenv("STRIPE_PRICE_ID_PRO_MONTHLY")  # R$ 27,90/mês
STRIPE_PRICE_ID_PRO_ANNUAL = os.getenv("STRIPE_PRICE_ID_PRO_ANNUAL")    # R$ 239/ano
STRIPE_PRICE_ID_TRIAL = os.getenv("STRIPE_PRICE_ID_TRIAL")              # R$ 1,99 trial 7 dias
STRIPE_PRICE_ID_CREDIT_1 = os.getenv("STRIPE_PRICE_ID_CREDIT_1")        # R$ 12,90 (1 CV)
STRIPE_PRICE_ID_CREDIT_5 = os.getenv("STRIPE_PRICE_ID_CREDIT_5")        # R$ 49,90 (5 CVs)

# Legacy Price IDs (manter para usuários existentes)
STRIPE_PRICE_ID_BASIC = os.getenv("STRIPE_PRICE_ID_BASIC")
STRIPE_PRICE_ID_PRO = os.getenv("STRIPE_PRICE_ID_PRO")
STRIPE_PRICE_ID_PREMIUM_PLUS = os.getenv("STRIPE_PRICE_ID_PREMIUM_PLUS")

FRONTEND_CHECKOUT_RETURN_URL = os.getenv("FRONTEND_CHECKOUT_RETURN_URL") or "http://localhost:3000/app"

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase_admin = None
if SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY:
    supabase_admin = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

PRICING: dict[str, dict[str, Any]] = {
    # TIER GRATUITO
    "free": {
        "price": 0,
        "name": "Gratuito",
        "stripe_price_id": None,
        "credits": 1,
        "billing": "free",
        "features": [
            "1 Análise Completa",
            "Score ATS Detalhado",
            "43 Critérios Avaliados",
            "3 Sugestões de Melhoria"
        ]
    },
    
    # TIER PRO - MENSAL
    "pro_monthly": {
        "price": 27.90,
        "name": "PRO Mensal",
        "stripe_price_id": STRIPE_PRICE_ID_PRO_MONTHLY,
        "credits": 999,
        "billing": "subscription",
        "period": "monthly",
        "features": [
            "Otimizações ILIMITADAS",
            "Download de CV Otimizado (PDF + Word)",
            "Simulador de Entrevista com IA",
            "X-Ray Search - Encontre Recrutadores",
            "Biblioteca Recomendada"
        ]
    },
    
    # TIER PRO - ANUAL (29% OFF)
    "pro_annual": {
        "price": 239.00,
        "price_monthly": 19.92,
        "name": "PRO Anual",
        "stripe_price_id": STRIPE_PRICE_ID_PRO_ANNUAL,
        "credits": 999,
        "billing": "subscription",
        "period": "annual",
        "discount": "29% OFF",
        "features": [
            "Otimizações ILIMITADAS",
            "Download de CV Otimizado (PDF + Word)",
            "Simulador de Entrevista com IA",
            "X-Ray Search - Encontre Recrutadores",
            "Biblioteca Recomendada",
            "Economize 29% vs mensal"
        ]
    },
    
    # TRIAL DE 7 DIAS - R$ 1,99
    "trial": {
        "price": 1.99,
        "name": "Trial 7 Dias",
        "stripe_price_id": STRIPE_PRICE_ID_TRIAL,
        "credits": 999,
        "billing": "trial",
        "trial_days": 7,
        "converts_to": "pro_monthly",
        "features": [
            "Teste PRO por 7 dias - apenas R$ 1,99",
            "Acesso completo a todos os recursos",
            "Reembolso automático se cancelar em 48h",
            "Após 7 dias: R$ 27,90/mês"
        ]
    },
    
    # CRÉDITOS AVULSOS - 1 CV
    "credit_1": {
        "price": 12.90,
        "name": "Crédito Único",
        "stripe_price_id": STRIPE_PRICE_ID_CREDIT_1,
        "credits": 1,
        "billing": "one_time",
        "features": [
            "1 otimização completa",
            "Download de CV Otimizado",
            "Uso único, sem recorrência"
        ]
    },
    
    # CRÉDITOS AVULSOS - 5 CVs (22% OFF)
    "credit_5": {
        "price": 49.90,
        "price_per_cv": 9.98,
        "name": "Pacote 5 CVs",
        "stripe_price_id": STRIPE_PRICE_ID_CREDIT_5,
        "credits": 5,
        "billing": "one_time",
        "discount": "22% OFF",
        "features": [
            "5 otimizações completas",
            "Download de CV Otimizado",
            "Economize 22% vs crédito único",
            "Válido por 6 meses"
        ]
    },
    
    # LEGACY - Manter para usuários existentes
    "basico": {
        "price": 29.90,
        "name": "1 Otimização (Legacy)",
        "stripe_price_id": STRIPE_PRICE_ID_BASIC,
        "credits": 1,
        "billing": "one_time",
        "features": ["1 análise completa", "CV otimizado"],
        "hidden": True
    },
    "premium_plus": {
        "price": 49.90,
        "name": "Premium Plus (Legacy)",
        "stripe_price_id": STRIPE_PRICE_ID_PREMIUM_PLUS,
        "credits": 30,
        "billing": "subscription",
        "features": ["30 análises/mês"],
        "hidden": True
    },
}

if STRIPE_SECRET_KEY:
    stripe.api_key = STRIPE_SECRET_KEY

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _upload_to_bytes_io(upload: UploadFile) -> io.BytesIO:
    b = upload.file.read()
    return io.BytesIO(b)


def _save_to_cache(file_bytes: bytes, job_description: str) -> None:
    """Salva CV e job description no cache para facilitar geração de mocks."""
    try:
        cache_dir = PROJECT_ROOT / ".cache"
        cache_dir.mkdir(exist_ok=True)
        
        # Salva CV
        cv_path = cache_dir / "last_cv.pdf"
        with open(cv_path, 'wb') as f:
            f.write(file_bytes)
        
        # Salva descrição da vaga
        job_path = cache_dir / "last_job.txt"
        with open(job_path, 'w', encoding='utf-8') as f:
            f.write(job_description)
        
        print(f"💾 Cache atualizado: {cv_path.name} + job description")
    except Exception as e:
        print(f"⚠️  Erro ao salvar cache: {e}")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/pricing")
def get_pricing() -> JSONResponse:
    """Retorna informações de pricing para o frontend."""
    pricing_info = {}
    for plan_id, plan_data in PRICING.items():
        pricing_info[plan_id] = {
            "id": plan_id,
            "name": plan_data.get("name"),
            "price": plan_data.get("price"),
            "billing": plan_data.get("billing"),
            "features": plan_data.get("features", []),
        }
    return JSONResponse(content=pricing_info)


@app.post("/api/analyze-lite")
def analyze_lite(file: UploadFile = File(...), job_description: str = Form(...)) -> JSONResponse:
    try:
        # Salva no cache para facilitar geração de mocks
        file_bytes = file.file.read()
        _save_to_cache(file_bytes, job_description)
        
        # Modo de desenvolvimento: retorna mock instantaneamente
        if DEV_MODE:
            print("🔧 [DEV MODE] Retornando mock de análise lite (sem processar IA)")
            return JSONResponse(content=MOCK_PREVIEW_DATA)
        
        # Modo produção: processa com IA real
        cv_text = extrair_texto_pdf(io.BytesIO(file_bytes))
        data = analyze_preview_lite(cv_text, job_description)
        return JSONResponse(content=data)
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": f"{type(e).__name__}: {e}"})


@app.post("/api/analyze-free")
def analyze_free(
    file: UploadFile = File(...), 
    job_description: str = Form(...),
    user_id: str = Form(None)
) -> JSONResponse:
    """
    Análise gratuita (primeira análise sem paywall).
    Retorna diagnóstico básico com problemas identificados e 2 sugestões.
    """
    try:
        # Salva no cache para facilitar geração de mocks
        file_bytes = file.file.read()
        _save_to_cache(file_bytes, job_description)
        
        # Verifica se usuário já usou análise gratuita (se tiver user_id)
        if user_id and supabase_admin:
            try:
                usage = supabase_admin.table("free_usage").select("used_at").eq("user_id", user_id).limit(1).execute()
                if usage.data:
                    return JSONResponse(
                        status_code=403, 
                        content={"error": "Você já usou sua análise gratuita. Faça upgrade para continuar."}
                    )
            except Exception as e:
                print(f"⚠️ Erro ao verificar uso gratuito: {e}")
        
        # Modo de desenvolvimento: retorna mock instantaneamente
        if DEV_MODE:
            print("🔧 [DEV MODE] Retornando mock de análise gratuita (sem processar IA)")
            # Retorna versão limitada do mock (apenas 2 sugestões)
            limited_data = MOCK_PREVIEW_DATA.copy()
            return JSONResponse(content=limited_data)
        
        # Modo produção: processa com IA real
        cv_text = extrair_texto_pdf(io.BytesIO(file_bytes))
        data = analyze_preview_lite(cv_text, job_description)
        
        # Registra uso gratuito
        if user_id and supabase_admin:
            try:
                supabase_admin.table("free_usage").insert({
                    "user_id": user_id,
                    "used_at": datetime.now().isoformat()
                }).execute()
            except Exception as e:
                print(f"⚠️ Erro ao registrar uso gratuito: {e}")
        
        return JSONResponse(content=data)
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": f"{type(e).__name__}: {e}"})


class GeneratePdfRequest(BaseModel):
    data: dict[str, Any]
    user_id: str | None = None


@app.post("/api/generate-pdf")
def generate_pdf(request: GeneratePdfRequest) -> StreamingResponse:
    try:
        pdf_bytes = gerar_pdf_candidato(request.data)
        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=Curriculo_VANT.pdf"}
        )
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": f"{type(e).__name__}: {e}"})


class GenerateWordRequest(BaseModel):
    data: dict[str, Any]
    user_id: str | None = None


@app.post("/api/generate-word")
def generate_word(request: GenerateWordRequest) -> StreamingResponse:
    try:
        word_bytes_io = gerar_word_candidato(request.data)
        word_bytes_io.seek(0)
        return StreamingResponse(
            word_bytes_io,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": "attachment; filename=Curriculo_VANT_Editavel.docx"}
        )
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": f"{type(e).__name__}: {e}"})


class EntitlementsStatusRequest(BaseModel):
    user_id: str


@app.post("/api/entitlements/status")
def entitlements_status(payload: EntitlementsStatusRequest) -> JSONResponse:
    if not supabase_admin:
        return JSONResponse(
            status_code=500,
            content={"error": "Supabase não configurado. Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY."},
        )
    try:
        return JSONResponse(content=_entitlements_status(payload.user_id))
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": f"{type(e).__name__}: {e}"})


class ConsumeOneCreditRequest(BaseModel):
    user_id: str


@app.post("/api/entitlements/consume-one")
def entitlements_consume_one(payload: ConsumeOneCreditRequest) -> JSONResponse:
    if not supabase_admin:
        return JSONResponse(
            status_code=500,
            content={"error": "Supabase não configurado. Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY."},
        )
    try:
        _consume_one_credit(payload.user_id)
        return JSONResponse(content=_entitlements_status(payload.user_id))
    except Exception as e:
        return JSONResponse(status_code=400, content={"error": str(e)})


@app.post("/api/analyze-premium-paid")
def analyze_premium_paid(
    user_id: str = Form(...),
    file: UploadFile = File(...),
    job_description: str = Form(...),
    competitor_files: list[UploadFile] | None = File(None),
) -> JSONResponse:
    if not supabase_admin:
        return JSONResponse(
            status_code=500,
            content={"error": "Supabase não configurado. Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY."},
        )
    try:
        # Salva no cache para facilitar geração de mocks
        file_bytes = file.file.read()
        _save_to_cache(file_bytes, job_description)
        
        # Verificar créditos (tanto em DEV quanto em produção)
        status = _entitlements_status(user_id)
        if not status.get("payment_verified") or int(status.get("credits_remaining") or 0) <= 0:
            return JSONResponse(status_code=400, content={"error": "Você não tem créditos disponíveis."})

        # Consumir crédito
        _consume_one_credit(user_id)

        # Modo de desenvolvimento: retorna mock sem processar IA
        if DEV_MODE:
            print("🔧 [DEV MODE] Retornando mock de análise premium (sem processar IA)")
            new_status = _entitlements_status(user_id)
            return JSONResponse(content={"data": MOCK_PREMIUM_DATA, "entitlements": new_status})

        # Modo produção: processa com IA real
        cv_text = extrair_texto_pdf(io.BytesIO(file_bytes))
        competitors = []
        if competitor_files:
            for f in competitor_files:
                competitors.append(_upload_to_bytes_io(f))
        data = analyze_cv_logic(cv_text, job_description, competitors)
        new_status = _entitlements_status(user_id)
        return JSONResponse(content={"data": data, "entitlements": new_status})
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": f"{type(e).__name__}: {e}"})


class ActivateEntitlementsRequest(BaseModel):
    session_id: str
    user_id: str


def _entitlements_status(user_id: str) -> dict[str, Any]:
    if not supabase_admin or not user_id:
        return {"payment_verified": False, "credits_remaining": 0, "plan": None}

    subs = (
        supabase_admin.table("subscriptions")
        .select("subscription_plan,subscription_status,current_period_start,current_period_end")
        .eq("user_id", user_id)
        .order("current_period_end", desc=True)
        .limit(1)
        .execute()
    )
    sub = (subs.data or [None])[0]

    # Verificar se tem assinatura ativa (qualquer plano)
    if sub and sub.get("subscription_status") == "active":
        plan_name = sub.get("subscription_plan")
        period_start = sub.get("current_period_start")
        
        # Planos PRO têm créditos ilimitados (999 = flag para ilimitado)
        if plan_name in ["pro_monthly", "pro_annual", "trial"]:
            return {
                "payment_verified": True,
                "credits_remaining": 999,
                "plan": plan_name,
            }
        
        # Plano legacy premium_plus usa sistema de usage com limite mensal
        if plan_name == "premium_plus":
            usage = (
                supabase_admin.table("usage")
                .select("used,usage_limit")
                .eq("user_id", user_id)
                .eq("period_start", period_start)
                .limit(1)
                .execute()
            )
            row = (usage.data or [None])[0]
            used = int((row or {}).get("used") or 0)
            limit_val = int((row or {}).get("usage_limit") or 30)
            credits_remaining = max(0, limit_val - used)
            return {
                "payment_verified": credits_remaining > 0,
                "credits_remaining": credits_remaining,
                "plan": "premium_plus",
            }

    credits = (
        supabase_admin.table("user_credits").select("balance").eq("user_id", user_id).limit(1).execute()
    )
    row = (credits.data or [None])[0]
    balance = int((row or {}).get("balance") or 0)
    return {
        "payment_verified": balance > 0,
        "credits_remaining": max(0, balance),
        "plan": None,
    }


def _consume_one_credit(user_id: str) -> None:
    if not supabase_admin or not user_id:
        raise RuntimeError("Banco não configurado")

    subs = (
        supabase_admin.table("subscriptions")
        .select("subscription_plan,subscription_status,current_period_start,current_period_end")
        .eq("user_id", user_id)
        .order("current_period_end", desc=True)
        .limit(1)
        .execute()
    )
    sub = (subs.data or [None])[0]
    
    # Planos PRO não consomem créditos (ilimitado)
    if sub and sub.get("subscription_status") == "active":
        plan_name = sub.get("subscription_plan")
        if plan_name in ["pro_monthly", "pro_annual", "trial"]:
            return  # Não consome crédito, é ilimitado
    
    # Plano legacy premium_plus consome do sistema de usage
    if sub and (sub.get("subscription_plan") == "premium_plus") and (sub.get("subscription_status") == "active"):
        period_start = sub.get("current_period_start")
        usage = (
            supabase_admin.table("usage")
            .select("used,usage_limit")
            .eq("user_id", user_id)
            .eq("period_start", period_start)
            .limit(1)
            .execute()
        )
        row = (usage.data or [None])[0]
        used = int((row or {}).get("used") or 0)
        limit_val = int((row or {}).get("usage_limit") or 30)
        if used >= limit_val:
            raise RuntimeError("Limite mensal atingido")

        if row is None:
            supabase_admin.table("usage").insert(
                {"user_id": user_id, "period_start": period_start, "used": 1, "usage_limit": limit_val}
            ).execute()
        else:
            supabase_admin.table("usage").update({"used": used + 1}).eq("user_id", user_id).eq(
                "period_start", period_start
            ).execute()
        return

    credits = (
        supabase_admin.table("user_credits").select("balance").eq("user_id", user_id).limit(1).execute()
    )
    row = (credits.data or [None])[0]
    balance = int((row or {}).get("balance") or 0)
    if balance <= 0:
        raise RuntimeError("Sem créditos")
    supabase_admin.table("user_credits").upsert({"user_id": user_id, "balance": balance - 1}).execute()


@app.post("/api/entitlements/activate")
def activate_entitlements(payload: ActivateEntitlementsRequest) -> JSONResponse:
    if not STRIPE_SECRET_KEY:
        return JSONResponse(status_code=500, content={"error": "Stripe não configurado (STRIPE_SECRET_KEY ausente)."})
    if not supabase_admin:
        return JSONResponse(
            status_code=500,
            content={"error": "Supabase não configurado. Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY."},
        )

    try:
        session = stripe.checkout.Session.retrieve(payload.session_id)
        is_paid = bool(
            session
            and (
                session.get("payment_status") in ("paid", "no_payment_required")
                or (session.get("mode") == "subscription" and session.get("status") == "complete")
            )
        )
        if not is_paid:
            return JSONResponse(status_code=400, content={"error": "Pagamento não confirmado."})

        meta = session.get("metadata") or {}
        plan_id = (meta.get("plan") or "basico").strip()
        if plan_id not in PRICING:
            plan_id = "basico"

        plan = PRICING[plan_id]
        billing = (plan.get("billing") or "one_time").strip().lower()

        if billing == "subscription":
            subscription_id = session.get("subscription")
            if not subscription_id:
                return JSONResponse(status_code=400, content={"error": "Assinatura não encontrada nesta sessão do Stripe."})

            sub = stripe.Subscription.retrieve(subscription_id)
            cps = int(sub.get("current_period_start") or 0)
            cpe = int(sub.get("current_period_end") or 0)

            # Converter timestamps Unix para ISO format para PostgreSQL TIMESTAMPTZ
            # Stripe pode retornar em segundos ou milissegundos
            if cps > 1000000000000:  # Se for milissegundos
                cps = cps // 1000
            if cpe > 1000000000000:  # Se for milissegundos
                cpe = cpe // 1000
            
            period_start_iso = datetime.fromtimestamp(cps).isoformat()
            period_end_iso = datetime.fromtimestamp(cpe).isoformat()
            
            print(f"[DEBUG] Timestamps: raw={cps},{cpe} iso={period_start_iso},{period_end_iso}")

            # Verificar se já existe assinatura para este usuário
            existing = (
                supabase_admin.table("subscriptions")
                .select("id")
                .eq("user_id", payload.user_id)
                .limit(1)
                .execute()
            )
            
            subscription_data = {
                "user_id": payload.user_id,
                "subscription_plan": plan_id,  # Usar plan_id dinâmico, não hardcoded
                "stripe_subscription_id": subscription_id,
                "subscription_status": sub.get("status"),
                "current_period_start": period_start_iso,
                "current_period_end": period_end_iso,
            }
            
            if existing.data:
                # Update existing subscription
                supabase_admin.table("subscriptions").update(subscription_data).eq(
                    "user_id", payload.user_id
                ).execute()
            else:
                # Insert new subscription
                supabase_admin.table("subscriptions").insert(subscription_data).execute()

            # Apenas criar registro de usage para planos com limite (legacy premium_plus)
            if plan_id == "premium_plus":
                supabase_admin.table("usage").upsert(
                    {"user_id": payload.user_id, "period_start": period_start_iso, "used": 0, "usage_limit": int(plan.get("credits") or 30)}
                ).execute()

            # Para planos PRO, retornar 999 (ilimitado)
            credits_remaining = 999 if plan_id in ["pro_monthly", "pro_annual", "trial"] else int(plan.get("credits") or 30)
        else:
            purchased_credits = int(plan.get("credits") or 1)
            existing = (
                supabase_admin.table("user_credits")
                .select("balance")
                .eq("user_id", payload.user_id)
                .limit(1)
                .execute()
            )
            row = (existing.data or [None])[0]
            balance = int((row or {}).get("balance") or 0)
            new_balance = balance + purchased_credits
            print(f"[DEBUG] activate_entitlements: user_id={payload.user_id} plan={plan_id} purchased={purchased_credits} old_balance={balance} new_balance={new_balance}")
            supabase_admin.table("user_credits").upsert({"user_id": payload.user_id, "balance": new_balance}).execute()
            credits_remaining = new_balance

        return JSONResponse(
            content={
                "ok": True,
                "plan_id": plan_id,
                "credits_remaining": credits_remaining,
            }
        )
    except Exception as e:
        print(f"[ERROR] activate_entitlements: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        
        # Salvar sessão para retry posterior
        try:
            supabase_admin.table("failed_activations").insert({
                "user_id": payload.user_id,
                "session_id": payload.session_id,
                "error_message": str(e),
                "created_at": datetime.now().isoformat()
            }).execute()
        except:
            pass  # Se falhar ao salvar, não quebrar o fluxo
        
        return JSONResponse(status_code=500, content={"error": f"{type(e).__name__}: {e}"})


@app.post("/api/debug/reset-credits")
def reset_credits(payload: dict):
    """DEBUG ONLY: Reseta créditos do usuário para 3."""
    if not supabase_admin:
        raise HTTPException(status_code=500, detail="Supabase não configurado")
    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id obrigatório")
    supabase_admin.table("user_credits").upsert({"user_id": user_id, "balance": 3}).execute()
    return {"ok": True, "credits": 3}


@app.post("/api/analyze-premium")
def analyze_premium(
    file: UploadFile = File(...),
    job_description: str = Form(...),
    competitor_files: list[UploadFile] | None = File(None),
) -> JSONResponse:
    try:
        cv_text = extrair_texto_pdf(_upload_to_bytes_io(file))
        competitors = []
        if competitor_files:
            for f in competitor_files:
                competitors.append(_upload_to_bytes_io(f))
        data = analyze_cv_logic(cv_text, job_description, competitors)
        return JSONResponse(content=data)
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": f"{type(e).__name__}: {e}"})


@app.post("/api/render/pdf")
def render_pdf(payload: dict[str, Any]) -> StreamingResponse:
    pdf_bytes = gerar_pdf_candidato(payload)
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=vant.pdf"},
    )


@app.post("/api/render/docx")
def render_docx(payload: dict[str, Any]) -> StreamingResponse:
    docx_bytes = gerar_word_candidato(payload)
    if hasattr(docx_bytes, "getvalue"):
        docx_bytes = docx_bytes.getvalue()
    return StreamingResponse(
        io.BytesIO(docx_bytes),
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": "attachment; filename=vant.docx"},
    )


class StripeCreateCheckoutSessionRequest(BaseModel):
    plan_id: str
    customer_email: str | None = None
    client_reference_id: str | None = None
    score: int | None = None


@app.post("/api/stripe/create-checkout-session")
def stripe_create_checkout_session(payload: StripeCreateCheckoutSessionRequest) -> JSONResponse:
    if not STRIPE_SECRET_KEY:
        return JSONResponse(status_code=500, content={"error": "Stripe não configurado (STRIPE_SECRET_KEY ausente)."})

    plan_id = (payload.plan_id or "basico").strip()
    if plan_id not in PRICING:
        plan_id = "basico"

    price_id = PRICING[plan_id].get("stripe_price_id")
    if not price_id:
        return JSONResponse(
            status_code=500,
            content={"error": "Stripe não configurado. Defina STRIPE_PRICE_ID_BASIC/PRO/PREMIUM_PLUS."},
        )

    billing = (PRICING[plan_id].get("billing") or "one_time").strip().lower()
    is_subscription = billing == "subscription"
    success_url = f"{FRONTEND_CHECKOUT_RETURN_URL}?payment=success&session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{FRONTEND_CHECKOUT_RETURN_URL}?payment=cancel"

    try:
        session = stripe.checkout.Session.create(
            mode="subscription" if is_subscription else "payment",
            line_items=[{"price": price_id, "quantity": 1}],
            success_url=success_url,
            cancel_url=cancel_url,
            allow_promotion_codes=True,
            customer_email=payload.customer_email,
            client_reference_id=payload.client_reference_id,
            metadata={
                "plan": plan_id,
                "score": str(int(payload.score or 0)),
            },
        )
        return JSONResponse(content={"id": session.get("id"), "url": session.get("url")})
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": f"{type(e).__name__}: {e}"})


class StripeVerifyCheckoutSessionRequest(BaseModel):
    session_id: str


@app.post("/api/stripe/verify-checkout-session")
def stripe_verify_checkout_session(payload: StripeVerifyCheckoutSessionRequest) -> JSONResponse:
    if not STRIPE_SECRET_KEY:
        return JSONResponse(status_code=500, content={"error": "Stripe não configurado (STRIPE_SECRET_KEY ausente)."})

    try:
        session = stripe.checkout.Session.retrieve(payload.session_id)
        is_paid = bool(
            session
            and (
                session.get("payment_status") in ("paid", "no_payment_required")
                or (session.get("mode") == "subscription" and session.get("status") == "complete")
            )
        )
        meta = session.get("metadata") or {}
        plan_id = (meta.get("plan") or "basico").strip()
        if plan_id not in PRICING:
            plan_id = "basico"

        return JSONResponse(
            content={
                "paid": is_paid,
                "plan_id": plan_id,
                "mode": session.get("mode"),
                "payment_status": session.get("payment_status"),
                "status": session.get("status"),
                "customer_email": session.get("customer_details", {}).get("email"),
            }
        )
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": f"{type(e).__name__}: {e}"})
