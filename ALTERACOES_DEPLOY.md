# Alterações para Deploy em Produção

## Resumo das Alterações

Este documento lista todas as alterações feitas no projeto para preparar o deploy em produção com arquitetura separada (Frontend na Vercel + Backend no Render).

## 📁 Arquivos Criados

### Backend
- **`start_server.py`** - Script de inicialização que lê a variável `PORT` do ambiente
- **`.env.example`** - Template de variáveis de ambiente para o backend
- **`render.yaml`** - Configuração opcional para deploy automático no Render

### Frontend
- **`frontend/.env.local.example`** - Template de variáveis de ambiente para o frontend

### Documentação
- **`DEPLOY.md`** - Guia completo de deploy em produção

## 🔧 Arquivos Modificados

### Backend (`backend/main.py`)
**Linha 69-75**: CORS atualizado para permitir todas as origens
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Alterado de lista específica para "*"
    allow_credentials=False,  # Alterado de True para False
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Linha 86-88**: Endpoint `/health` já existia (sem alterações necessárias)
```python
@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
```

### Frontend

#### `frontend/src/app/app/page.tsx`
Substituídas **7 ocorrências** de URLs hardcoded por variável de ambiente:

- Linha 315: `activateEntitlements` function
- Linha 351: `verify-checkout-session` 
- Linha 423: `needsActivation` useEffect
- Linha 470: `create-checkout-session`
- Linha 590: `syncEntitlements` function
- Linha 697: `analyze-premium-paid`
- Linha 761: `analyze-lite`

**Antes:**
```typescript
const resp = await fetch("http://127.0.0.1:8000/api/...", {
```

**Depois:**
```typescript
const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/...`, {
```

#### `frontend/src/components/PaidStage.tsx`
Substituídas **2 ocorrências**:

- Linha 74: `handleDownloadPdf`
- Linha 96: `handleDownloadWord`

### Arquivos .gitignore

#### Raiz (`.gitignore`)
**Linha 9**: Adicionada exceção para arquivo de exemplo
```
!.env.local.example
```

#### Frontend (`frontend/.gitignore`)
**Linha 35**: Adicionada exceção para arquivo de exemplo
```
!.env.local.example
```

## 🌍 Variáveis de Ambiente

### Backend (Render)
```
GOOGLE_API_KEY=...
GROQ_API_KEY=...
STRIPE_SECRET_KEY=...
STRIPE_PRICE_ID_BASIC=...
STRIPE_PRICE_ID_PRO=...
STRIPE_PRICE_ID_PREMIUM_PLUS=...
FRONTEND_CHECKOUT_RETURN_URL=https://seu-app.vercel.app/app
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
PORT=8000  # Definido automaticamente pelo Render
```

### Frontend (Vercel)
```
NEXT_PUBLIC_API_URL=https://vant-backend.onrender.com
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_SUPABASE_REDIRECT_URL=https://seu-app.vercel.app/app
```

## ✅ Checklist de Deploy

### Antes do Deploy
- [ ] Criar conta na Vercel
- [ ] Criar conta no Render
- [ ] Configurar projeto no Supabase
- [ ] Configurar produtos no Stripe
- [ ] Obter API keys (Google Gemini, Groq)

### Backend (Render)
- [ ] Fazer push do código para repositório Git
- [ ] Criar Web Service no Render
- [ ] Configurar variáveis de ambiente
- [ ] Aguardar build e deploy
- [ ] Testar endpoint `/health`

### Frontend (Vercel)
- [ ] Importar repositório na Vercel
- [ ] Configurar Root Directory como `frontend`
- [ ] Configurar variáveis de ambiente
- [ ] Aguardar build e deploy
- [ ] Atualizar `FRONTEND_CHECKOUT_RETURN_URL` no backend

### Pós-Deploy
- [ ] Configurar URLs de redirect no Supabase
- [ ] Testar fluxo completo da aplicação
- [ ] Configurar monitoramento (opcional)
- [ ] Configurar ping service para manter backend acordado (opcional)

## 🔄 Compatibilidade com Desenvolvimento Local

Todas as alterações são compatíveis com desenvolvimento local. Basta:

1. Copiar `.env.example` para `.env` e preencher as chaves
2. Copiar `frontend/.env.local.example` para `frontend/.env.local` e usar:
   ```
   NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
   ```

## 📝 Notas Importantes

1. **CORS**: Configurado para `allow_origins=["*"]` por simplicidade. Em produção avançada, considere restringir para domínios específicos.

2. **Render Free Tier**: O servidor entra em "sleep" após 15 minutos de inatividade. Primeiro request pode levar 30-60s.

3. **Variáveis de Ambiente**: Todas as chaves sensíveis foram movidas para variáveis de ambiente. Nunca commite arquivos `.env`.

4. **Health Check**: Use `https://seu-backend.onrender.com/health` para verificar se o servidor está funcionando.

## 🐛 Troubleshooting Rápido

- **Erro de CORS**: Verifique se o backend está usando `allow_origins=["*"]`
- **Backend não responde**: Pode estar em sleep (Render free), aguarde 30-60s
- **Erro 404 nas APIs**: Verifique se `NEXT_PUBLIC_API_URL` está correto
- **Erro de autenticação**: Verifique URLs de redirect no Supabase
