import os
from server_config import run_server

if __name__ == "__main__":
    # 🔥 CORREÇÃO: Forçar ambiente production no Render
    if os.getenv("RENDER"):  # Render detecta automaticamente
        environment = "production"
        print("🔥 Render detectado - Forçando ambiente production")
    else:
        # Detectar ambiente automaticamente
        environment = os.getenv("ENVIRONMENT", "development")
    
    # Sobrescrever porta se definida (para compatibilidade com Render)
    if os.getenv("PORT"):
        os.environ["PORT"] = os.getenv("PORT")
    
    # Iniciar servidor com configurações apropriadas
    run_server(environment)
