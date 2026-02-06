"""
HTTP Client com timeout configurado para chamadas externas.
Este módulo gerencia todas as chamadas HTTP externas com timeouts apropriados,
evitando que uploads grandes ou processamentos demorados sejam quebrados.
"""

import httpx
import logging
from typing import Optional, Dict, Any
from contextlib import asynccontextmanager

logger = logging.getLogger(__name__)

# Timeouts configurados por tipo de operação
TIMEOUTS = {
    "default": 30.0,      # Timeout padrão para APIs rápidas
    "upload": 300.0,      # Timeout para uploads de arquivos (5 minutos)
    "ia_processing": 600.0,  # Timeout para processamento de IA (10 minutos)
    "stripe": 60.0,       # Timeout para chamadas Stripe
    "supabase": 30.0,     # Timeout para chamadas Supabase
}

class HTTPClientManager:
    """Gerenciador de cliente HTTP com timeouts configurados."""
    
    def __init__(self):
        self._client: Optional[httpx.AsyncClient] = None
        self._client_sync: Optional[httpx.Client] = None
    
    async def get_async_client(self, timeout_type: str = "default") -> httpx.AsyncClient:
        """Retorna cliente HTTP async com timeout configurado."""
        if self._client is None or self._client.is_closed:
            timeout = httpx.Timeout(TIMEOUTS.get(timeout_type, TIMEOUTS["default"]))
            self._client = httpx.AsyncClient(
                timeout=timeout,
                limits=httpx.Limits(max_keepalive_connections=20, max_connections=100)
            )
        return self._client
    
    def get_sync_client(self, timeout_type: str = "default") -> httpx.Client:
        """Retorna cliente HTTP síncrono com timeout configurado."""
        if self._client_sync is None or self._client_sync.is_closed:
            timeout = httpx.Timeout(TIMEOUTS.get(timeout_type, TIMEOUTS["default"]))
            self._client_sync = httpx.Client(
                timeout=timeout,
                limits=httpx.Limits(max_keepalive_connections=20, max_connections=100)
            )
        return self._client_sync
    
    async def close(self):
        """Fecha todos os clientes HTTP."""
        if self._client and not self._client.is_closed:
            await self._client.aclose()
        if self._client_sync and not self._client_sync.is_closed:
            self._client_sync.close()

# Instância global do gerenciador
http_manager = HTTPClientManager()

@asynccontextmanager
async def http_client(timeout_type: str = "default"):
    """Context manager para cliente HTTP com timeout."""
    client = await http_manager.get_async_client(timeout_type)
    try:
        yield client
    except httpx.TimeoutException as e:
        logger.error(f"⏱️ Timeout em chamada HTTP ({timeout_type}): {e}")
        raise
    except Exception as e:
        logger.error(f"❌ Erro em chamada HTTP: {e}")
        raise

def http_client_sync(timeout_type: str = "default"):
    """Context manager para cliente HTTP síncrono com timeout."""
    client = http_manager.get_sync_client(timeout_type)
    try:
        yield client
    except httpx.TimeoutException as e:
        logger.error(f"⏱️ Timeout em chamada HTTP síncrona ({timeout_type}): {e}")
        raise
    except Exception as e:
        logger.error(f"❌ Erro em chamada HTTP síncrona: {e}")
        raise

async def make_request(
    method: str,
    url: str,
    timeout_type: str = "default",
    **kwargs
) -> Dict[str, Any]:
    """
    Faz requisição HTTP com timeout configurado.
    
    Args:
        method: Método HTTP (GET, POST, etc.)
        url: URL da requisição
        timeout_type: Tipo de timeout (default, upload, ia_processing, etc.)
        **kwargs: Argumentos adicionais para httpx
        
    Returns:
        Dict com resposta da API
    """
    async with http_client(timeout_type) as client:
        try:
            response = await client.request(method, url, **kwargs)
            response.raise_for_status()
            
            # Tentar fazer parse JSON
            try:
                return response.json()
            except Exception:
                # Se não for JSON, retornar texto
                return {"data": response.text}
                
        except httpx.TimeoutException as e:
            logger.error(f"⏱️ Timeout na requisição {method} {url}: {e}")
            raise
        except httpx.HTTPStatusError as e:
            logger.error(f"❌ Erro HTTP {e.response.status_code} em {method} {url}: {e}")
            raise
        except Exception as e:
            logger.error(f"❌ Erro na requisição {method} {url}: {e}")
            raise

def make_request_sync(
    method: str,
    url: str,
    timeout_type: str = "default",
    **kwargs
) -> Dict[str, Any]:
    """
    Faz requisição HTTP síncrona com timeout configurado.
    
    Args:
        method: Método HTTP (GET, POST, etc.)
        url: URL da requisição
        timeout_type: Tipo de timeout
        **kwargs: Argumentos adicionais para httpx
        
    Returns:
        Dict com resposta da API
    """
    with http_client_sync(timeout_type) as client:
        try:
            response = client.request(method, url, **kwargs)
            response.raise_for_status()
            
            # Tentar fazer parse JSON
            try:
                return response.json()
            except Exception:
                # Se não for JSON, retornar texto
                return {"data": response.text}
                
        except httpx.TimeoutException as e:
            logger.error(f"⏱️ Timeout na requisição síncrona {method} {url}: {e}")
            raise
        except httpx.HTTPStatusError as e:
            logger.error(f"❌ Erro HTTP {e.response.status_code} em {method} {url}: {e}")
            raise
        except Exception as e:
            logger.error(f"❌ Erro na requisição síncrona {method} {url}: {e}")
            raise

# Funções de conveniência para tipos específicos de requisição
async def get_with_timeout(url: str, timeout_type: str = "default", **kwargs) -> Dict[str, Any]:
    """GET request com timeout configurado."""
    return await make_request("GET", url, timeout_type, **kwargs)

async def post_with_timeout(url: str, timeout_type: str = "default", **kwargs) -> Dict[str, Any]:
    """POST request com timeout configurado."""
    return await make_request("POST", url, timeout_type, **kwargs)

async def put_with_timeout(url: str, timeout_type: str = "default", **kwargs) -> Dict[str, Any]:
    """PUT request com timeout configurado."""
    return await make_request("PUT", url, timeout_type, **kwargs)

def get_with_timeout_sync(url: str, timeout_type: str = "default", **kwargs) -> Dict[str, Any]:
    """GET request síncrona com timeout configurado."""
    return make_request_sync("GET", url, timeout_type, **kwargs)

def post_with_timeout_sync(url: str, timeout_type: str = "default", **kwargs) -> Dict[str, Any]:
    """POST request síncrona com timeout configurado."""
    return make_request_sync("POST", url, timeout_type, **kwargs)

# Cleanup function para ser chamada no shutdown
async def cleanup_http_clients():
    """Limpa todos os clientes HTTP."""
    await http_manager.close()
