# 🏗 Arquitetura de Produção (Vant)

## 1. Frontend (Vercel)
- **Framework:** Next.js
- **Root Directory:** `frontend` 
- **Domínio Principal:** `vant.app.br` (Configurado via Vercel DNS no Registro.br)
- **Variáveis de Ambiente (Production):**
  - `NEXT_PUBLIC_API_URL`: `https://vant-vlgn.onrender.com` (Aponta para o Render)

## 2. Backend (Render)
- **Serviço:** Web Service (Python 3)
- **Root Directory:** `backend` 
- **Build Command:** `pip install -r requirements.txt` 
- **Start Command:** `python start_server.py` 
- **URL Base:** `https://vant-vlgn.onrender.com` 
- **Health Check:** `/health` 
- **Variáveis de Ambiente Críticas:**
  - `FRONTEND_CHECKOUT_RETURN_URL`: `https://vant.app.br/app` (Para retorno correto do Stripe)
  - Chaves de API (Stripe, Supabase, Google) configuradas no painel.

## 3. Estratégia de Manutenção (Keep-Alive)
- **Serviço:** cron-job.org
- **Configuração:** Ping na rota `/health` a cada 10 minutos.
- **Objetivo:** Impedir que o container Free do Render entre em suspensão (sleep mode).

## 4. Correções de Código Aplicadas
- **Frontend:** Substituição de `http://127.0.0.1:8000` por `${process.env.NEXT_PUBLIC_API_URL}` em `page.tsx` (Checkout Stripe).
- **Backend:** Arquivos `requirements.txt` e `start_server.py` movidos corretamente para dentro da pasta `backend/`.
