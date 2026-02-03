import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
import os

def init_monitoring():
    """Inicializa Sentry para tracking de erros."""
    sentry_dsn = os.getenv("SENTRY_DSN")
    
    if sentry_dsn:
        sentry_sdk.init(
            dsn=sentry_dsn,
            integrations=[FastApiIntegration()],
            traces_sample_rate=0.1,  # 10% das requests (economiza quota)
            environment=os.getenv("ENVIRONMENT", "production"),
            before_send=sanitize_pii,  # Remove dados sensíveis
        )
        print("✅ Sentry inicializado")
    else:
        print("⚠️ SENTRY_DSN não configurado - erros não serão rastreados")

def sanitize_pii(event, hint):
    """Remove dados sensíveis dos logs."""
    # Remove emails, telefones, CPFs
    if 'request' in event:
        if 'data' in event['request']:
            event['request']['data'] = '[REDACTED]'
    return event
