"""
Exemplo de como usar o http_client com timeouts configurados.
Este arquivo demonstra o padrão correto para chamadas HTTP externas.
"""

from backend.http_client import (
    get_with_timeout, 
    post_with_timeout, 
    get_with_timeout_sync,
    post_with_timeout_sync,
    cleanup_http_clients
)
import logging

logger = logging.getLogger(__name__)

async def example_stripe_api_call():
    """Exemplo de chamada à API Stripe com timeout específico."""
    try:
        # Timeout específico para Stripe (60s)
        result = await post_with_timeout(
            "https://api.stripe.com/v1/checkout/sessions",
            timeout_type="stripe",
            data={"price": "price_123", "quantity": 1}
        )
        logger.info("✅ Chamada Stripe concluída com sucesso")
        return result
    except Exception as e:
        logger.error(f"❌ Erro na chamada Stripe: {e}")
        raise

async def example_file_upload():
    """Exemplo de upload de arquivo com timeout longo."""
    try:
        # Timeout longo para uploads (5 minutos)
        result = await post_with_timeout(
            "https://api.example.com/upload",
            timeout_type="upload",
            files={"file": open("large_file.pdf", "rb")}
        )
        logger.info("✅ Upload concluído com sucesso")
        return result
    except Exception as e:
        logger.error(f"❌ Erro no upload: {e}")
        raise

async def example_ia_processing():
    """Exemplo de processamento de IA com timeout muito longo."""
    try:
        # Timeout muito longo para IA (10 minutos)
        result = await post_with_timeout(
            "https://api.example.com/ai-process",
            timeout_type="ia_processing",
            json={"text": "long text to process"}
        )
        logger.info("✅ Processamento IA concluído com sucesso")
        return result
    except Exception as e:
        logger.error(f"❌ Erro no processamento IA: {e}")
        raise

def example_sync_call():
    """Exemplo de chamada síncrona com timeout."""
    try:
        # Timeout padrão para chamadas síncronas
        result = get_with_timeout_sync(
            "https://api.example.com/data",
            timeout_type="default"
        )
        logger.info("✅ Chamada síncrona concluída com sucesso")
        return result
    except Exception as e:
        logger.error(f"❌ Erro na chamada síncrona: {e}")
        raise

# Padrão para endpoints FastAPI
from fastapi import FastAPI, HTTPException

app = FastAPI()

@app.post("/api/example-external-call")
async def example_endpoint():
    """Exemplo de endpoint usando http_client."""
    try:
        # Fazer chamada externa com timeout configurado
        result = await get_with_timeout(
            "https://api.example.com/endpoint",
            timeout_type="default"
        )
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup de recursos no shutdown."""
    await cleanup_http_clients()
    logger.info("🧹 HTTP clients cleanup concluído")
