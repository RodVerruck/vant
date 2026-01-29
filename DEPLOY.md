# Guia de Deploy - Produção

Este guia descreve como fazer o deploy do projeto VANT em produção com arquitetura separada:
- **Frontend (Next.js)**: Vercel
- **Backend (Python/FastAPI)**: Render (plano gratuito)

## 📋 Pré-requisitos

1. Conta na [Vercel](https://vercel.com)
2. Conta no [Render](https://render.com)
3. Conta no [Supabase](https://supabase.com) (para autenticação e banco de dados)
4. Conta no [Stripe](https://stripe.com) (para pagamentos)
5. API Keys do Google Gemini e Groq

## 🚀 Deploy do Backend (Render)

### 1. Preparar o repositório

Certifique-se de que os seguintes arquivos estão no repositório:
- `requirements.txt` - Dependências Python
- `start_server.py` - Script de inicialização
- `backend/main.py` - Aplicação FastAPI

### 2. Criar Web Service no Render

1. Acesse [Render Dashboard](https://dashboard.render.com)
2. Clique em **"New +"** → **"Web Service"**
3. Conecte seu repositório GitHub/GitLab
4. Configure:
   - **Name**: `vant-backend` (ou nome de sua preferência)
   - **Region**: Escolha a região mais próxima
   - **Branch**: `main` (ou sua branch principal)
   - **Root Directory**: deixe vazio (ou `.` se necessário)
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python start_server.py`
   - **Plan**: `Free` (ou escolha um plano pago)

### 3. Configurar Variáveis de Ambiente no Render

Na seção **Environment**, adicione:

```
GOOGLE_API_KEY=sua_chave_aqui
GROQ_API_KEY=sua_chave_aqui
STRIPE_SECRET_KEY=sua_chave_aqui
STRIPE_PRICE_ID_BASIC=price_xxxxx
STRIPE_PRICE_ID_PRO=price_xxxxx
STRIPE_PRICE_ID_PREMIUM_PLUS=price_xxxxx
FRONTEND_CHECKOUT_RETURN_URL=https://seu-app.vercel.app/app
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua_chave_aqui
```

**Importante**: O Render define automaticamente a variável `PORT`, não é necessário configurá-la.

### 4. Deploy

Clique em **"Create Web Service"**. O Render fará o build e deploy automaticamente.

Após o deploy, você receberá uma URL como: `https://vant-backend.onrender.com`

⚠️ **Nota sobre plano gratuito**: O Render coloca serviços gratuitos em "sleep" após 15 minutos de inatividade. O primeiro request após o sleep pode levar 30-60 segundos. Considere usar o endpoint `/health` com um serviço de ping (como [UptimeRobot](https://uptimerobot.com)) para manter o servidor acordado.

## 🌐 Deploy do Frontend (Vercel)

### 1. Preparar o projeto

Certifique-se de que existe um arquivo `.env.local.example` no diretório `frontend/`:

```
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
NEXT_PUBLIC_SUPABASE_REDIRECT_URL=http://localhost:3000/app
```

### 2. Deploy na Vercel

1. Acesse [Vercel Dashboard](https://vercel.com/dashboard)
2. Clique em **"Add New..."** → **"Project"**
3. Importe seu repositório
4. Configure:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build` (padrão)
   - **Output Directory**: `.next` (padrão)

### 3. Configurar Variáveis de Ambiente na Vercel

Na seção **Environment Variables**, adicione:

```
NEXT_PUBLIC_API_URL=https://vant-backend.onrender.com
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon_aqui
NEXT_PUBLIC_SUPABASE_REDIRECT_URL=https://seu-app.vercel.app/app
```

**Importante**: Use a URL do seu backend no Render para `NEXT_PUBLIC_API_URL`.

### 4. Deploy

Clique em **"Deploy"**. A Vercel fará o build e deploy automaticamente.

Após o deploy, você receberá uma URL como: `https://seu-app.vercel.app`

### 5. Atualizar URL de Redirect no Backend

Volte ao Render e atualize a variável `FRONTEND_CHECKOUT_RETURN_URL` com a URL real da Vercel:

```
FRONTEND_CHECKOUT_RETURN_URL=https://seu-app.vercel.app/app
```

## 🔧 Configuração do Supabase

1. Acesse seu projeto no [Supabase Dashboard](https://app.supabase.com)
2. Vá em **Authentication** → **URL Configuration**
3. Adicione a URL da Vercel em **Site URL**: `https://seu-app.vercel.app`
4. Adicione em **Redirect URLs**: `https://seu-app.vercel.app/app`

## 🧪 Testar a Integração

1. Acesse sua aplicação na Vercel
2. Teste o fluxo completo:
   - Upload de CV
   - Análise gratuita
   - Checkout (Stripe)
   - Análise premium

## 📊 Monitoramento

### Backend (Render)
- Logs: Disponíveis no dashboard do Render
- Health check: `https://vant-backend.onrender.com/health`

### Frontend (Vercel)
- Logs: Disponíveis no dashboard da Vercel
- Analytics: Ative na seção Analytics da Vercel

## 🔄 Atualizações

### Backend
Faça push para a branch principal. O Render fará redeploy automaticamente.

### Frontend
Faça push para a branch principal. A Vercel fará redeploy automaticamente.

## 🐛 Troubleshooting

### Erro de CORS
- Verifique se `allow_origins=["*"]` está configurado no backend
- Verifique se a URL do backend está correta no frontend

### Backend em Sleep (Render Free)
- Use um serviço de ping como UptimeRobot para fazer requests periódicos ao `/health`
- Ou considere upgrade para plano pago

### Erro de Autenticação (Supabase)
- Verifique se as URLs de redirect estão configuradas corretamente
- Verifique se as chaves de API estão corretas

### Erro de Pagamento (Stripe)
- Verifique se os Price IDs estão corretos
- Verifique se a `FRONTEND_CHECKOUT_RETURN_URL` está correta
- Teste com cartões de teste do Stripe em modo de desenvolvimento

## 📝 Desenvolvimento Local

Para rodar localmente após essas mudanças:

### Backend
```bash
# Criar .env baseado no .env.example
cp .env.example .env
# Editar .env com suas chaves

# Instalar dependências
pip install -r requirements.txt

# Rodar servidor
python start_server.py
```

### Frontend
```bash
cd frontend

# Criar .env.local baseado no .env.local.example
cp .env.local.example .env.local
# Editar .env.local com suas chaves

# Instalar dependências
npm install

# Rodar dev server
npm run dev
```

## 🔐 Segurança

- ✅ Nunca commite arquivos `.env` ou `.env.local`
- ✅ Use variáveis de ambiente para todas as chaves sensíveis
- ✅ Mantenha as chaves do Supabase Service Role em segredo
- ✅ Use HTTPS em produção (Vercel e Render fazem isso automaticamente)
