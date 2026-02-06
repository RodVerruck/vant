import os
from server_config import run_server

if __name__ == "__main__":
    # Detectar ambiente automaticamente
    environment = os.getenv("ENVIRONMENT", "development")
    
    # Sobrescrever porta se definida (para compatibilidade com Render)
    if os.getenv("PORT"):
        os.environ["PORT"] = os.getenv("PORT")
    
    # Iniciar servidor com configurações apropriadas
    run_server(environment)
