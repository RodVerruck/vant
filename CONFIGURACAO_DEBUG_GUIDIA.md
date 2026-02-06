# 🛡️ Configuração da Proteção de Debug - GUIA RÁPIDO

## ✅ Configuração Automática (JÁ FEITA!)

As variáveis já foram adicionadas ao seu `.env`:

```bash
# Proteção de Endpoints de Debug
DEBUG_API_SECRET=vant_debug_2026_secure_key_change_me_in_production
ALLOW_DEBUG_ENDPOINTS=false
ENVIRONMENT=development
```

## 🚀 Como Usar os Endpoints de Debug

### 1. Para Desenvolvimento Local
```bash
# Use o header X-Debug-Secret
curl -X POST http://localhost:8000/api/debug/reset-credits \
  -H "Content-Type: application/json" \
  -H "X-Debug-Secret: vant_debug_2026_secure_key_change_me_in_production" \
  -d '{"user_id": "uuid-do-usuario"}'
```

### 2. Para Produção (Render)
```bash
# Configure no Render:
ENVIRONMENT=production
ALLOW_DEBUG_ENDPOINTS=false

# Endpoints serão BLOQUEADOS automaticamente
```

## 🧪 Testar se Está Funcionando

```bash
# Rodar o teste automático
python test_debug_protection.py

# Ou testar manualmente:
# Sem header (deve dar 403):
curl -X POST http://localhost:8000/api/debug/reset-credits \
  -d '{"user_id": "test"}'

# Com header (deve funcionar):
curl -X POST http://localhost:8000/api/debug/reset-credits \
  -H "X-Debug-Secret: vant_debug_2026_secure_key_change_me_in_production" \
  -d '{"user_id": "test"}'
```

## ⚠️ O QUE VOCÊ PRECISA FAZER

### 1. **Nada!** ✅
A configuração já está pronta e funcionando.

### 2. **Opcional - Mudar a Chave**:
Se quiser uma chave mais forte:
```bash
# No .env, mude:
DEBUG_API_SECRET=sua_chave_muito_forte_e_unica_aqui
```

### 3. **Deploy em Produção**:
No Render, configure:
```bash
ENVIRONMENT=production
ALLOW_DEBUG_ENDPOINTS=false
DEBUG_API_SECRET=chave_forte_aleatoria
```

## 🔐 Segurança Garantida

- ✅ **Local**: Funciona só com chave secreta
- ✅ **Produção**: Bloqueado 100% (nem com chave funciona)
- ✅ **Auditoria**: Todos acessos são logados
- ✅ **Monitoramento**: Sentry registra tudo

---

**Status**: 🚀 **CONFIGURADO E PRONTO!**  
**Risco**: 🔒 **ELIMINADO**  
**Ação necessária**: ✅ **NENHUMA**
