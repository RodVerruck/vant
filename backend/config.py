"""
Configurações centralizadas - Ambiente de Desenvolvimento
DEV ONLY: Não afeta produção (Render usa environment variables diretas)
"""
from pydantic_settings import BaseSettings
from pydantic import Field
import os


class Settings(BaseSettings):
    """Configurações validadas com type hints para DEV."""
    
    # Supabase
    SUPABASE_URL: str = Field(..., description="URL do Supabase")
    SUPABASE_SERVICE_ROLE_KEY: str = Field(..., description="Service Role Key do Supabase")
    
    # Stripe
    STRIPE_SECRET_KEY: str = Field(..., description="Secret Key do Stripe")
    STRIPE_WEBHOOK_SECRET: str = Field(default="", description="Webhook Secret do Stripe")
    
    # Price IDs
    STRIPE_PRICE_ID_PRO_MONTHLY: str = Field(default="", description="Price ID PRO Mensal")
    STRIPE_PRICE_ID_PRO_MONTHLY_EARLY_BIRD: str = Field(default="", description="Price ID PRO Mensal Early Bird")
    STRIPE_PRICE_ID_PRO_ANNUAL: str = Field(default="", description="Price ID PRO Anual")

    STRIPE_PRICE_ID_CREDIT_1: str = Field(default="", description="Price ID Crédito 1")
    STRIPE_PRICE_ID_CREDIT_3: str = Field(default="", description="Price ID Crédito 3")
    STRIPE_PRICE_ID_CREDIT_5: str = Field(default="", description="Price ID Crédito 5")
    
    # Frontend URLs
    FRONTEND_CHECKOUT_RETURN_URL: str = Field(default="http://localhost:3000/app", description="URL de retorno do checkout")
    
    # APIs
    GOOGLE_API_KEY: str = Field(..., description="API Key do Google")
    GROQ_API_KEY: str = Field(..., description="API Key do Groq")
    
    # File Size Limits (novas configurações centralizadas)
    MAX_AUDIO_SIZE_MB: int = Field(default=10, description="Tamanho máximo de áudio em MB")
    MAX_PDF_SIZE_MB: int = Field(default=5, description="Tamanho máximo de PDF em MB")
    MAX_FILE_SIZE_MB: int = Field(default=15, description="Tamanho máximo de arquivo em MB")
    
    # Debug
    DEBUG_API_SECRET: str = Field(default="vant_debug_2026_secure_key", description="Secret para endpoints de debug")
    
    # Rate Limiting
    RATE_LIMIT_ANALYZE_LITE: str = Field(default="5/minute", description="Rate limit para analyze-lite")
    RATE_LIMIT_ANALYZE_PAID: str = Field(default="10/minute", description="Rate limit para analyze-paid")
    RATE_LIMIT_INTERVIEW: str = Field(default="10/minute", description="Rate limit para interview")
    
    # Timeouts (segundos)
    REQUEST_TIMEOUT_GLOBAL: int = Field(default=180, description="Timeout global em segundos")
    REQUEST_TIMEOUT_INDIVIDUAL: int = Field(default=120, description="Timeout individual em segundos")
    
    model_config = {"env_file": ".env.local", "case_sensitive": True, "extra": "ignore"}


# Instância global para uso em toda aplicação
try:
    settings = Settings()
    print("✅ Configurações centralizadas carregadas com sucesso")
except Exception as e:
    print(f"❌ Erro ao carregar configurações: {e}")
    settings = None


# Funções de conveniência para validação
def validate_critical_settings() -> list[str]:
    """Verifica se configurações críticas estão presentes."""
    if not settings:
        return ["config_not_loaded"]
    
    critical_vars = [
        "SUPABASE_URL",
        "SUPABASE_SERVICE_ROLE_KEY", 
        "GOOGLE_API_KEY",
        "STRIPE_SECRET_KEY"
    ]
    
    missing = []
    for var in critical_vars:
        if not getattr(settings, var, None):
            missing.append(var)
    
    return missing


def get_size_limit_bytes(size_mb: int) -> int:
    """Converte MB para bytes."""
    return size_mb * 1024 * 1024


# Configurações de ambiente
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
IS_DEV = ENVIRONMENT == "development"
IS_PROD = ENVIRONMENT == "production"


if __name__ == "__main__":
    # Teste de configurações em DEV
    print("🔧 Testando configurações...")
    print(f"Environment: {ENVIRONMENT}")
    print(f"Is DEV: {IS_DEV}")
    print(f"Is PROD: {IS_PROD}")
    
    if settings:
        # Validar configurações críticas
        missing = validate_critical_settings()
        if missing:
            print(f"❌ Variáveis faltando: {', '.join(missing)}")
        else:
            print("✅ Todas configurações críticas presentes")
        
        # Mostrar limits (sem expor secrets)
        print(f"📁 Max Audio Size: {settings.MAX_AUDIO_SIZE_MB}MB")
        print(f"📄 Max PDF Size: {settings.MAX_PDF_SIZE_MB}MB")
        print(f"⏱️ Global Timeout: {settings.REQUEST_TIMEOUT_GLOBAL}s")
    else:
        print("❌ Configurações não carregadas")
