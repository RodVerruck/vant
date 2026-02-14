"""
Endpoints de análise de CV (lite, free, premium-paid, generate-pdf/word, status).
"""
from __future__ import annotations

import io
import logging
from datetime import datetime
from typing import Any

import sentry_sdk
from fastapi import APIRouter, File, Form, UploadFile, Request, BackgroundTasks, Response
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel

from dependencies import (
    supabase_admin,
    DEV_MODE,
    validate_user_id,
    _entitlements_status,
    _consume_one_credit,
    settings,
    IS_DEV,
)
from logic import analyze_preview_lite, extrair_texto_pdf, gerar_pdf_candidato, gerar_word_candidato
from mock_data import MOCK_PREVIEW_DATA, MOCK_PREMIUM_DATA

from slowapi import Limiter
from slowapi.util import get_remote_address

logger = logging.getLogger(__name__)

limiter = Limiter(key_func=get_remote_address)

router = APIRouter(prefix="/api", tags=["analysis"])


@router.get("/analysis/status/{session_id}")
def get_analysis_status(session_id: str) -> JSONResponse:
    """Endpoint para polling do status da análise com progressive loading."""
    sentry_sdk.set_tag("endpoint", "get_analysis_status")
    
    if not supabase_admin:
        return JSONResponse(
            status_code=500,
            content={"error": "Supabase não configurado. Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY."},
        )
    
    try:
        response = supabase_admin.table("analysis_sessions").select(
            "status, current_step, result_data, created_at, updated_at"
        ).eq("id", session_id).limit(1).execute()
        
        if not response.data:
            return JSONResponse(
                status_code=404,
                content={"error": "Sessão não encontrada."}
            )
        
        session = response.data[0]
        
        return JSONResponse(content={
            "session_id": session_id,
            "status": session["status"],
            "current_step": session["current_step"],
            "result_data": session["result_data"],
            "created_at": session["created_at"],
            "updated_at": session["updated_at"]
        })
        
    except Exception as e:
        sentry_sdk.capture_exception(e)
        return JSONResponse(status_code=500, content={"error": f"{type(e).__name__}: {e}"})


@router.post("/analyze-lite")
@limiter.limit("5/minute")
def analyze_lite(request: Request, file: UploadFile = File(...), job_description: str = Form(...), area_of_interest: str = Form("")) -> JSONResponse:
    try:
        sentry_sdk.set_tag("endpoint", "analyze_lite")
        
        file_bytes = file.file.read()
        from storage_manager import storage_manager
        storage_manager.save_temp_files(file_bytes, job_description)
        
        if DEV_MODE:
            print("🔧 [DEV MODE] Retornando mock de análise lite (sem processar IA)")
            return JSONResponse(content=MOCK_PREVIEW_DATA)
        
        cv_text = extrair_texto_pdf(io.BytesIO(file_bytes))

        # Determinismo: mesmo CV + mesma vaga + mesma área retorna o mesmo resultado (cache de preview)
        from cache_manager import CacheManager
        cache_manager = CacheManager()
        cache_job_key = f"{job_description.strip()}\n[AREA]{(area_of_interest or '').strip().lower()}"
        preview_hash = cache_manager.generate_input_hash(cv_text, cache_job_key, model_version="preview-lite-v1")
        cached_preview = cache_manager.check_cache(preview_hash)
        if cached_preview:
            return JSONResponse(content=cached_preview)
        
        if area_of_interest:
            data = analyze_preview_lite(cv_text, job_description, forced_area=area_of_interest)
        else:
            data = analyze_preview_lite(cv_text, job_description)

        cache_manager.save_to_cache(
            input_hash=preview_hash,
            user_id=None,
            cv_text=cv_text,
            job_description=cache_job_key,
            result_json=data,
            model_version="preview-lite-v1",
            original_filename=file.filename if file and file.filename else None,
        )
        
        return JSONResponse(content=data)
    except Exception as e:
        sentry_sdk.capture_exception(e)
        return JSONResponse(status_code=500, content={"error": f"{type(e).__name__}: {e}"})


@router.post("/analyze-free")
@limiter.limit("5/minute")
def analyze_free(
    request: Request,
    file: UploadFile = File(...), 
    job_description: str = Form(...),
    area_of_interest: str = Form(""),
    user_id: str = Form(None)
) -> JSONResponse:
    """
    Análise gratuita (primeira análise sem paywall).
    Retorna diagnóstico básico com problemas identificados e 2 sugestões.
    """
    if user_id:
        sentry_sdk.set_context("user", {"id": user_id})
    sentry_sdk.set_tag("endpoint", "analyze_free")
    
    if user_id and not validate_user_id(user_id):
        return JSONResponse(
            status_code=400, 
            content={"error": "user_id inválido. Deve ser um UUID válido."}
        )
    
    try:
        file_bytes = file.file.read()
        from storage_manager import storage_manager
        storage_manager.save_temp_files(file_bytes, job_description, user_id)
        
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
        
        if DEV_MODE:
            print("🔧 [DEV MODE] Retornando mock de análise gratuita (sem processar IA)")
            limited_data = MOCK_PREVIEW_DATA.copy()
            return JSONResponse(content=limited_data)
        
        cv_text = extrair_texto_pdf(io.BytesIO(file_bytes))

        # Determinismo: mesmo CV + mesma vaga + mesma área retorna o mesmo resultado (cache de preview)
        from cache_manager import CacheManager
        cache_manager = CacheManager()
        cache_job_key = f"{job_description.strip()}\n[AREA]{(area_of_interest or '').strip().lower()}"
        preview_hash = cache_manager.generate_input_hash(cv_text, cache_job_key, model_version="preview-lite-v1")
        cached_preview = cache_manager.check_cache(preview_hash)
        if cached_preview:
            return JSONResponse(content=cached_preview)
        
        if area_of_interest:
            data = analyze_preview_lite(cv_text, job_description, forced_area=area_of_interest)
        else:
            data = analyze_preview_lite(cv_text, job_description)

        cache_manager.save_to_cache(
            input_hash=preview_hash,
            user_id=user_id,
            cv_text=cv_text,
            job_description=cache_job_key,
            result_json=data,
            model_version="preview-lite-v1",
            original_filename=file.filename if file and file.filename else None,
        )
        
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
        sentry_sdk.capture_exception(e)
        return JSONResponse(status_code=500, content={"error": f"{type(e).__name__}: {e}"})


class GeneratePdfRequest(BaseModel):
    data: dict[str, Any]
    user_id: str | None = None


@router.post("/generate-pdf")
def generate_pdf(request: GeneratePdfRequest) -> Response:
    try:
        pdf_bytes = gerar_pdf_candidato(request.data)
        
        if not pdf_bytes or len(pdf_bytes) == 0:
            return JSONResponse(
                status_code=500,
                content={"error": "Falha ao gerar PDF: arquivo vazio"}
            )
        
        if len(pdf_bytes) < 1024:
            return JSONResponse(
                status_code=500,
                content={"error": f"PDF gerado é muito pequeno ({len(pdf_bytes)} bytes)"}
            )
        
        if not pdf_bytes.startswith(b'%PDF'):
            return JSONResponse(
                status_code=500,
                content={"error": "PDF gerado é inválido: cabeçalho ausente"}
            )
        
        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={
                "Content-Disposition": "attachment; filename=Curriculo_VANT.pdf",
                "Content-Length": str(len(pdf_bytes))
            }
        )
        
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": f"{type(e).__name__}: {e}"})


class GenerateWordRequest(BaseModel):
    data: dict[str, Any]
    user_id: str | None = None


@router.post("/generate-word")
def generate_word(request: GenerateWordRequest) -> Response:
    try:
        word_bytes_io = gerar_word_candidato(request.data)
        
        if not word_bytes_io:
            return JSONResponse(
                status_code=500,
                content={"error": "Falha ao gerar Word: arquivo nulo"}
            )
        
        word_bytes_io.seek(0)
        word_bytes = word_bytes_io.read()
        
        if not word_bytes or len(word_bytes) == 0:
            return JSONResponse(
                status_code=500,
                content={"error": "Falha ao gerar Word: arquivo vazio"}
            )
        
        if len(word_bytes) < 2048:
            return JSONResponse(
                status_code=500,
                content={"error": f"Word gerado é muito pequeno ({len(word_bytes)} bytes)"}
            )
        
        if not word_bytes.startswith(b'PK'):
            return JSONResponse(
                status_code=500,
                content={"error": "Word gerado é inválido: não é um formato DOCX válido"}
            )
        
        word_bytes_io.seek(0)
        
        return StreamingResponse(
            word_bytes_io,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={
                "Content-Disposition": "attachment; filename=Curriculo_VANT_Editavel.docx",
                "Content-Length": str(len(word_bytes))
            }
        )
        
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": f"{type(e).__name__}: {e}"})


@router.post("/analyze-premium-paid")
@limiter.limit("10/minute")
def analyze_premium_paid(
    request: Request,
    background_tasks: BackgroundTasks,
    user_id: str = Form(...),
    file: UploadFile | None = File(None),
    job_description: str = Form(...),
    cv_text: str = Form(""),
    area_of_interest: str = Form(""),
    competitor_files: list[UploadFile] | None = File(None),
) -> JSONResponse:
    sentry_sdk.set_context("user", {"id": user_id})
    sentry_sdk.set_tag("endpoint", "analyze_premium_paid")
    
    if not supabase_admin:
        return JSONResponse(
            status_code=500,
            content={"error": "Supabase não configurado. Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY."},
        )
    
    if user_id and not validate_user_id(user_id):
        return JSONResponse(
            status_code=400, 
            content={"error": "user_id inválido. Deve ser um UUID válido."}
        )
    
    try:
        # Se cv_text foi fornecido (reutilização de CV), não precisa de file
        file_bytes = None
        if file and file.filename:
            file_bytes = file.file.read()
            from storage_manager import storage_manager
            storage_manager.save_temp_files(file_bytes, job_description, user_id)
        elif not cv_text:
            return JSONResponse(status_code=400, content={"error": "Envie um arquivo PDF/DOCX ou forneça cv_text."})
        
        # Verificar créditos (tanto em DEV quanto em produção)
        status = _entitlements_status(user_id)
        if not status.get("payment_verified") or int(status.get("credits_remaining") or 0) <= 0:
            return JSONResponse(status_code=400, content={"error": "Você não tem créditos disponíveis."})

        # Consumir crédito
        _consume_one_credit(user_id)
        
        # Criar sessão de análise para progressive loading
        import uuid
        session_id = str(uuid.uuid4())
        
        try:
            supabase_admin.table("analysis_sessions").insert({
                "id": session_id,
                "user_id": user_id,
                "status": "processing",
                "current_step": "starting",
                "result_data": {},
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            }).execute()
            
            logger.info(f"✅ Sessão de análise criada: {session_id}")
        except Exception as e:
            logger.error(f"❌ Erro ao criar sessão: {e}")
            return JSONResponse(status_code=500, content={"error": f"Erro ao criar sessão: {e}"})
        
        # Ler bytes dos competidores se existirem
        competitors_bytes = None
        if competitor_files:
            competitors_bytes = []
            for cf in competitor_files:
                cf_bytes = cf.file.read()
                if cf_bytes:
                    competitors_bytes.append(cf_bytes)
        
        # Modo DEV: retorna mock instantaneamente
        if DEV_MODE:
            print("🔧 [DEV MODE] Retornando mock de análise premium (sem processar IA)")
            
            supabase_admin.table("analysis_sessions").update({
                "status": "completed",
                "current_step": "completed",
                "result_data": MOCK_PREMIUM_DATA,
                "updated_at": datetime.now().isoformat()
            }).eq("id", session_id).execute()
            
            # Salvar no histórico (cached_analyses) para aparecer no Dashboard
            try:
                import hashlib
                from cache_manager import CacheManager
                cache_manager = CacheManager()
                input_hash = hashlib.sha256(
                    f"{job_description}{session_id}dev".encode()
                ).hexdigest()
                cache_manager.save_to_cache(
                    input_hash=input_hash,
                    user_id=user_id,
                    cv_text="[DEV MODE]",
                    job_description=job_description,
                    result_json=MOCK_PREMIUM_DATA
                )
                print("💾 [DEV MODE] Mock salvo no histórico (cached_analyses)")
            except Exception as cache_err:
                print(f"⚠️ [DEV MODE] Erro ao salvar no histórico: {cache_err}")
            
            return JSONResponse(content={
                "session_id": session_id,
                "status": "completed",
                "message": "Análise mock concluída (DEV MODE)"
            })
        
        # Modo PRODUÇÃO: processar em background
        from dependencies import _process_analysis_background
        background_tasks.add_task(
            _process_analysis_background,
            session_id,
            user_id,
            file_bytes,
            job_description,
            area_of_interest,
            competitors_bytes,
            file.filename if file and file.filename else "cv_reused.pdf",
            cv_text if cv_text else None  # Texto pré-extraído do CV
        )
        
        return JSONResponse(content={
            "session_id": session_id,
            "status": "processing",
            "message": "Análise iniciada. Use /api/analysis/status/{session_id} para acompanhar."
        })
        
    except Exception as e:
        sentry_sdk.capture_exception(e)
        return JSONResponse(status_code=500, content={"error": f"{type(e).__name__}: {e}"})
