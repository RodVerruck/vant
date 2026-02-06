# Proteção de Endpoints de Debug - Vant Backend

## 🚨 Problema Resolvido

**Risco Crítico**: Endpoints de debug como `/api/debug/create-real-customer`, `/api/debug/manual-activate` e `/api/debug/reset-credits` estavam expostos sem proteção.

**Impacto**: Qualquer pessoa que descobrisse esses URLs poderia:
- Criar usuários e assinaturas sem pagar
- Resetar créditos arbitrariamente  
- Acessar dados sensíveis de todos os usuários
- Comprometer a integridade financeira da plataforma

## 🛡️ Solução Implementada

### 1. Camada Dupla de Proteção

#### Proteção por Ambiente
```python
# Em produção, endpoints são BLOQUEADOS por padrão
if not ALLOW_DEBUG_ENDPOINTS and os.getenv("ENVIRONMENT") == "production":
    raise HTTPException(status_code=403, detail="Debug endpoints are disabled in production")
```

#### Proteção por Chave Secreta
```python
# Header obrigatório com chave secreta
if not x_debug_secret or x_debug_secret != DEBUG_API_SECRET:
    raise HTTPException(status_code=403, detail="Invalid debug secret")
```

### 2. Endpoints Protegidos

✅ **Todos endpoints `/api/debug/*` agora protegidos:**
- `POST /api/debug/create-real-customer`
- `GET /api/debug/find-user-by-email` 
- `POST /api/debug/create-supabase-user`
- `POST /api/debug/activate-by-email`
- `GET /api/debug/all-subscriptions`
- `POST /api/debug/check-subscription`
- `POST /api/debug/manual-activate`
- `POST /api/debug/reset-credits`

### 3. Auditoria e Monitoring

#### Logs de Acesso
```python
def log_debug_access(endpoint: str, user_id: str = None):
    """Registra acesso aos endpoints de debug para auditoria."""
    logger.warning(f"🔧 DEBUG ENDPOINT ACCESS: {endpoint} by user_id={user_id or 'unknown'}")
```

#### Sentry Integration
```python
sentry_sdk.set_tag("debug_endpoint", endpoint)
sentry_sdk.set_tag("debug_access", "authorized")
sentry_sdk.set_context("debug_user", {"user_id": user_id})
```

## 🔧 Configuração

### Variáveis de Ambiente

```bash
# .env
DEBUG_API_SECRET=vant_debug_2026_secure_key_change_me_in_production
ALLOW_DEBUG_ENDPOINTS=false
ENVIRONMENT=development
```

### Níveis de Segurança

#### Development (Local)
```bash
ENVIRONMENT=development
ALLOW_DEBUG_ENDPOINTS=false
# ✅ Funciona com header X-Debug-Secret
```

#### Production (Render/Heroku)
```bash
ENVIRONMENT=production  
ALLOW_DEBUG_ENDPOINTS=false
# 🔒 BLOQUEADO - nem com chave secreta funciona
```

#### Production com Debug (NÃO RECOMENDADO)
```bash
ENVIRONMENT=production
ALLOW_DEBUG_ENDPOINTS=true
# ⚠️ Funciona com header, mas não recomendado
```

## 📋 Como Usar (Apenas Dev)

### 1. Configurar Chave
```bash
# No .env local
DEBUG_API_SECRET=sua_chave_secreta_unica_e_forte
```

### 2. Fazer Request
```bash
curl -X POST http://localhost:8000/api/debug/reset-credits \
  -H "Content-Type: application/json" \
  -H "X-Debug-Secret: sua_chave_secreta_unica_e_forte" \
  -d '{"user_id": "uuid-do-usuario"}'
```

### 3. Verificar Logs
```bash
# Log aparece no console e no Sentry
🔧 DEBUG ENDPOINT ACCESS: reset-credits by user_id=uuid-do-usuario
```

## 🧪 Teste Automático

### Script de Validação
```bash
python test_debug_protection.py
```

### Testes Realizados
1. **Sem header**: ❌ Deve retornar 403
2. **Header correto**: ✅ Deve funcionar (em dev)
3. **Header incorreto**: ❌ Deve retornar 403
4. **Produção**: 🔒 Sempre bloqueado

## 🚀 Deploy em Produção

### Render Configuration
```bash
# Environment Variables
ENVIRONMENT=production
ALLOW_DEBUG_ENDPOINTS=false
DEBUG_API_SECRET=chave_forte_aleatoria
```

### Verificação
```bash
# Testar se está bloqueado
curl -X POST https://sua-api.com/api/debug/reset-credits \
  -H "X-Debug-Secret: qualquer_chave" \
  -d '{"user_id": "test"}'

# Resposta esperada:
# {"detail": "Debug endpoints are disabled in production"}
```

## 📊 Impacto na Segurança

### Antes (Vulnerável)
- ❌ Endpoints públicos sem autenticação
- ❌ Anyone could create paid users
- ❌ Free credits for anyone
- ❌ Data breach possible
- ❌ Financial damage

### Depois (Protegido)
- ✅ Double-layer protection
- ✅ Production blocking
- ✅ Secret key authentication  
- ✅ Full audit trail
- ✅ Sentry monitoring
- ✅ Rate limiting maintained

## 🔍 Monitoramento

### Sentry Dashboard
- **Tag**: `debug_endpoint`
- **Context**: `debug_user`
- **Alert**: Any access attempt

### Log Patterns
```
🔧 DEBUG ENDPOINT ACCESS: {endpoint} by user_id={user_id}
[DEBUG] Endpoint access authorized
[ERROR] Invalid debug secret attempt
```

## 🎯 Best Practices

### Development
1. Use strong secret keys
2. Never commit real secrets to repo
3. Monitor debug endpoint usage
4. Keep debug endpoints minimal

### Production  
1. Always set `ENVIRONMENT=production`
2. Never set `ALLOW_DEBUG_ENDPOINTS=true`
3. Monitor Sentry for any access attempts
4. Remove debug endpoints completely if possible

## 🔄 Future Improvements

### Short-term
- IP whitelisting for debug endpoints
- Time-based access tokens
- Request rate limiting for debug endpoints

### Long-term  
- Separate debug service
- VPN-only access
- Role-based access control
- Automatic cleanup of debug endpoints

## 📝 Checklist de Segurança

- [x] All debug endpoints protected
- [x] Production blocking implemented
- [x] Secret key authentication
- [x] Audit logging enabled
- [x] Sentry monitoring active
- [x] Rate limiting maintained
- [x] Test automation created
- [x] Documentation completed
- [x] Deployment guide updated

## 🚨 Emergência

### Se Debug For Exploited
1. Check Sentry for access logs
2. Rotate `DEBUG_API_SECRET` immediately
3. Set `ALLOW_DEBUG_ENDPOINTS=false`
4. Review user creation logs
5. Audit financial transactions

### Comando de Emergência
```bash
# Bloquear imediatamente todos endpoints
export ALLOW_DEBUG_ENDPOINTS=false
export ENVIRONMENT=production
# Restart application
```

---

**Status**: ✅ IMPLEMENTADO E TESTADO  
**Segurança**: 🔒 MÁXIMA PROTEÇÃO  
**Monitoring**: 📊 AUDITORIA COMPLETA
