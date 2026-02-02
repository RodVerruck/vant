# Vant - Otimizador de CVs com IA

Sistema de otimização de currículos usando IA (Google Gemini) para aumentar aprovação em sistemas ATS.

## 📁 Estrutura do Projeto

```
Vant/
├── backend/              # API FastAPI + Lógica de IA
│   ├── main.py          # Endpoints da API
│   ├── logic.py         # Lógica de negócio
│   ├── llm_core.py      # Integração com IA
│   ├── prompts.py       # Prompts da IA
│   ├── mock_data.py     # Dados mock para DEV
│   └── start_server.py  # Inicializador do servidor
├── frontend/            # Interface Next.js
├── tests/               # Testes automatizados
├── docs/                # Documentação
├── scripts/             # Scripts utilitários
└── .cache/              # Cache temporário (gitignored)
```

## 🚀 Quick Start

### Backend (Desenvolvimento)
```bash
cd backend
pip install -r requirements.txt
python start_server.py
```
Backend rodará em: `http://127.0.0.1:8000`

### Frontend (Desenvolvimento)
```bash
cd frontend
npm install
npm run dev
```
Frontend rodará em: `http://localhost:3000`

## 📚 Documentação

- **[DEPLOY.md](docs/DEPLOY.md)** - Guia de deploy em produção
- **[DEV_MODE.md](docs/DEV_MODE.md)** - Sistema de mocks para desenvolvimento
- **[STRIPE_SETUP_GUIDE.md](docs/STRIPE_SETUP_GUIDE.md)** - Configuração de pagamentos
- **[WORKFLOW_DEV.md](docs/WORKFLOW_DEV.md)** - Workflow Git (branches dev/main)

## 🔧 Variáveis de Ambiente

### Backend (.env na raiz)
```env
# IA
GOOGLE_API_KEY=sua_chave_aqui

# Stripe
STRIPE_SECRET_KEY=sk_...

# Supabase
SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...

# Modo de desenvolvimento (true = usa mocks, false = usa IA real)
DEV_MODE=true

# Frontend URL (produção)
FRONTEND_CHECKOUT_RETURN_URL=https://vant.app.br/app
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_API_URL=https://vant-vlgn.onrender.com
```

## 🌐 Produção

- **Frontend**: Vercel → `vant.app.br`
- **Backend**: Render → `vant-vlgn.onrender.com`
- **Database**: Supabase

## 📝 Scripts Úteis

```bash
# Verificar modelos disponíveis da Google AI
python scripts/check_models.py

# Gerar contexto do projeto para IA
python scripts/generate_context.py
```

## 🧪 Testes

```bash
cd tests
python run_tests.py
```

## 📦 Tecnologias

- **Backend**: FastAPI, Google Gemini AI, Stripe, Supabase
- **Frontend**: Next.js, React, TypeScript
- **Deploy**: Vercel (frontend) + Render (backend)
