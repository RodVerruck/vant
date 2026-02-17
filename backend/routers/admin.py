"""
Endpoints administrativos (cache stats, monitoring).
"""
from __future__ import annotations

import logging

import os

import sentry_sdk
from fastapi import APIRouter, Header
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/cache-stats")
def get_cache_stats() -> JSONResponse:
    """
    Endpoint de admin para monitorar estatísticas do cache.
    Retorna dados sobre áreas populares para análise de pre-warming.
    """
    sentry_sdk.set_tag("endpoint", "admin_cache_stats")
    
    try:
        from cache_manager import CacheManager
        
        cache_manager = CacheManager()
        stats = cache_manager.get_cache_stats()
        
        return JSONResponse(content=stats)
        
    except Exception as e:
        sentry_sdk.capture_exception(e)
        logger.error(f"❌ Erro ao buscar estatísticas do cache: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": f"{type(e).__name__}: {e}"}
        )


@router.post("/cleanup-temp-files")
def cleanup_temp_files(x_admin_token: str | None = Header(default=None)) -> JSONResponse:
    """Endpoint admin para limpar arquivos temporários expirados."""
    sentry_sdk.set_tag("endpoint", "admin_cleanup_temp_files")

    try:
        try:
            from dependencies import settings
        except Exception:
            settings = None

        expected_token = settings.ADMIN_CLEANUP_TOKEN if settings else os.getenv("ADMIN_CLEANUP_TOKEN")
        if not expected_token:
            return JSONResponse(status_code=500, content={"error": "ADMIN_CLEANUP_TOKEN não configurado"})
        if x_admin_token != expected_token:
            return JSONResponse(status_code=401, content={"error": "Token inválido"})

        from storage_manager import storage_manager

        cleaned_count = storage_manager.cleanup_expired()
        return JSONResponse(content={"cleaned": cleaned_count})

    except Exception as e:
        sentry_sdk.capture_exception(e)
        logger.error(f"❌ Erro ao limpar temp files: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": f"{type(e).__name__}: {e}"}
        )
