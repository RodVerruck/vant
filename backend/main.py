from __future__ import annotations

import io
import os
import sys
from typing import Any

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

app = FastAPI(title="Vant API", version="0.1.0")


STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")
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
        "billing": "one_time",
    },
    "premium_plus": {
        "price": 49.90,
        "name": "VANT - Pacote Premium Plus",
        "stripe_price_id": STRIPE_PRICE_ID_PREMIUM_PLUS,
        "credits": 30,
        "billing": "subscription",
    },
}

if STRIPE_SECRET_KEY:
    stripe.api_key = STRIPE_SECRET_KEY

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"] ,
    allow_headers=["*"],
)


def _upload_to_bytes_io(upload: UploadFile) -> io.BytesIO:
    b = upload.file.read()
    return io.BytesIO(b)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/analyze-lite")
def analyze_lite(file: UploadFile = File(...), job_description: str = Form(...)) -> JSONResponse:
    try:
        cv_text = extrair_texto_pdf(_upload_to_bytes_io(file))
        data = analyze_preview_lite(cv_text, job_description)
        return JSONResponse(content=data)
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
        status = _entitlements_status(user_id)
        if not status.get("payment_verified") or int(status.get("credits_remaining") or 0) <= 0:
            return JSONResponse(status_code=400, content={"error": "Você não tem créditos disponíveis."})

        _consume_one_credit(user_id)

        cv_text = extrair_texto_pdf(_upload_to_bytes_io(file))
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

            supabase_admin.table("subscriptions").upsert(
                {
                    "user_id": payload.user_id,
                    "subscription_plan": "premium_plus",
                    "stripe_subscription_id": subscription_id,
                    "subscription_status": sub.get("status"),
                    "current_period_start": cps,
                    "current_period_end": cpe,
                }
            ).execute()

            supabase_admin.table("usage").upsert(
                {"user_id": payload.user_id, "period_start": cps, "used": 0, "usage_limit": int(plan.get("credits") or 30)}
            ).execute()

            credits_remaining = int(plan.get("credits") or 30)
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
        return JSONResponse(status_code=500, content={"error": f"{type(e).__name__}: {e}"})


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
