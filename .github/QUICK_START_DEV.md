# Quick Start - Desenvolvimento Local

## Setup Inicial (Primeira Vez)

### 1. Clone e Configure
```bash
# Se ainda não clonou
git clone <url-do-repositorio>
cd Vant

# Mude para a branch dev
git checkout dev
```

### 2. Configure Variáveis de Ambiente

**Frontend** (`frontend/.env.local`):
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=<sua_url_supabase>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<sua_chave_supabase>
NEXT_PUBLIC_SUPABASE_REDIRECT_URL=http://localhost:3000/app
```

**Backend** (`backend/.env`):
```bash
GOOGLE_API_KEY=<sua_chave>
GROQ_API_KEY=<sua_chave>
STRIPE_SECRET_KEY=<sua_chave>
STRIPE_PRICE_ID_BASIC=<id>
STRIPE_PRICE_ID_PRO=<id>
STRIPE_PRICE_ID_PREMIUM_PLUS=<id>
FRONTEND_CHECKOUT_RETURN_URL=http://localhost:3000/app
SUPABASE_URL=<sua_url>
SUPABASE_SERVICE_ROLE_KEY=<sua_chave>
```

### 3. Instale Dependências

**Backend**:
```bash
cd backend
pip install -r requirements.txt
```

**Frontend**:
```bash
cd frontend
npm install
```

## Uso Diário

### Iniciar Desenvolvimento

**Terminal 1 - Backend**:
```bash
cd backend
python start_server.py
```
✅ Backend rodando em http://localhost:8000

**Terminal 2 - Frontend**:
```bash
cd frontend
npm run dev
```
✅ Frontend rodando em http://localhost:3000

### Fazer Alterações

```bash
# Certifique-se de estar na branch dev
git checkout dev

# Faça suas alterações nos arquivos...

# Veja o que mudou
git status

# Adicione as mudanças
git add .

# Commit
git commit -m "feat: descrição da melhoria"

# Envie para o GitHub
git push origin dev
```

### Subir para Produção

Quando estiver satisfeito com os testes:

```bash
# Volte para main
git checkout main

# Atualize
git pull origin main

# Merge da dev
git merge dev

# Envie (dispara deploy automático!)
git push origin main
```

## Comandos Rápidos

| Comando | Descrição |
|---------|-----------|
| `git checkout dev` | Vai para branch de desenvolvimento |
| `git checkout main` | Vai para branch de produção |
| `git status` | Ver arquivos modificados |
| `git add .` | Adicionar todas as mudanças |
| `git commit -m "msg"` | Fazer commit |
| `git push origin dev` | Enviar para dev |
| `git push origin main` | Enviar para produção (cuidado!) |
| `git pull origin dev` | Baixar atualizações da dev |

## Dicas

- 💡 **Sempre trabalhe na branch `dev`**
- 🧪 **Teste localmente antes de subir para `main`**
- 📝 **Use commits descritivos** (feat:, fix:, refactor:)
- 🔄 **Faça commits pequenos e frequentes**
- ⚠️ **Push para `main` = deploy automático em produção!**

## Troubleshooting

### Backend não inicia
```bash
cd backend
pip install -r requirements.txt --upgrade
```

### Frontend não inicia
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Erro de CORS
Verifique se `NEXT_PUBLIC_API_URL=http://localhost:8000` no `.env.local`

### Mudanças não aparecem
- Limpe o cache do navegador (Ctrl+Shift+R)
- Reinicie o servidor de desenvolvimento
