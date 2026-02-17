"""
Configuração do servidor Uvicorn com timeouts apropriados.
Este módulo define configurações de timeout para diferentes tipos de operações,
evitando que uploads grandes ou processamentos demorados sejam interrompidos.
"""

import uvicorn
import os
from typing import Dict, Any

# Configurações de timeout por tipo de operação
SERVER_CONFIGS = {
    "development": {
        # Development - timeouts mais longos para debugging
        "timeout_keep_alive": 65,      # Mantém conexão viva por 65s
        "timeout_graceful_shutdown": 30, # Tempo para shutdown gracefully
        "workers": 1,                   # 1 worker para development
        "reload": True,                  # Auto-reload em development
        "log_level": "info",
    },
    
    "production": {
        # Production - timeouts otimizados para performance
        "timeout_keep_alive": 30,       # Mantém conexão viva por 30s
        "timeout_graceful_shutdown": 30, # Tempo para shutdown gracefully
        "workers": 1,                   # 🔥 CORREÇÃO: 1 worker para Render Free (512MB)
        "reload": False,                # Sem auto-reload em production
        "log_level": "warning",
        "access_log": False,            # Desabilitar access log em production
    }
}

def get_server_config(environment: str = "development") -> Dict[str, Any]:
    """
    Retorna configuração do servidor baseada no ambiente.
    
    Args:
        environment: 'development' ou 'production'
        
    Returns:
        Dict com configurações do Uvicorn
    """
    config = SERVER_CONFIGS.get(environment, SERVER_CONFIGS["development"])
    
    # Configurações padrão para ambos ambientes
    base_config = {
        "app": "main:app",
        "host": "0.0.0.0",
        "port": int(os.getenv("PORT", 8000)),  # Porta dinâmica para Render, fallback 8000 para local
        "loop": "asyncio",
        "http": "httptools",
        "ws": "websockets",
        "lifespan": "on",
        "limit_concurrency": 1000,      # Limite de conexões concorrentes
        "limit_max_requests": 10000,    # Limite de requests por worker
        "backlog": 2048,                # Tamanho do backlog
    }
    
    # Merge configurações
    return {**base_config, **config}

def run_server(environment: str = "development"):
    """
    Inicia o servidor com configurações apropriadas.
    
    Args:
        environment: 'development' ou 'production'
    """
    config = get_server_config(environment)
    
    print(f"\n{'='*60}")
    print(f"🚀 Iniciando servidor Vant API")
    print(f"📍 Ambiente: {environment}")
    print(f"⏱️ Timeout Keep-Alive: {config['timeout_keep_alive']}s")
    print(f"👥 Workers: {config['workers']}")
    print(f"🌐 Host: {config['host']}:{config['port']}")
    print(f"{'='*60}\n")
    
    # Iniciar servidor
    uvicorn.run(**config)

if __name__ == "__main__":
    import os
    env = os.getenv("ENVIRONMENT", "development")
    run_server(env)
