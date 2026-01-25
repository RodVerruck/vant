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

PRICING: dict[str, dict[str, Any]] = {
    "basico": {
        "price": 29.90,
        "name": "1 Otimização",
        "stripe_price_id": STRIPE_PRICE_ID_BASIC,
        "billing": "one_time",
    },
    "pro": {
        "price": 69.90,
        "name": "Pacote 3 Vagas",
        "stripe_price_id": STRIPE_PRICE_ID_PRO,
        "billing": "one_time",
    },
    "premium_plus": {
        "price": 49.90,
        "name": "VANT - Pacote Premium Plus",
        "stripe_price_id": STRIPE_PRICE_ID_PREMIUM_PLUS,
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
