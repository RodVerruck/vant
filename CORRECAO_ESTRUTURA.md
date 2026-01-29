# Correção da Estrutura para Deploy no Render

## ❌ Problema Identificado

O Render estava retornando erro **"No such file or directory"** ao tentar executar:
```
pip install -r requirements.txt
```

**Causa**: Os arquivos `requirements.txt` e `start_server.py` estavam na **raiz do projeto**, mas o Render estava configurado com **Root Directory = `backend`**, então ele procurava os arquivos dentro da pasta `backend/` e não os encontrava.

## ✅ Solução Aplicada

### Arquivos Movidos para `backend/`

1. **`backend/requirements.txt`** - Criado com todas as dependências
2. **`backend/start_server.py`** - Criado (ajustado para importar `main:app` em vez de `backend.main:app`)
3. **`backend/.env.example`** - Criado para facilitar configuração local

### Ajuste no `start_server.py`

Como agora o arquivo está **dentro** da pasta `backend/`, o import foi ajustado:

**Antes (na raiz):**
```python
uvicorn.run("backend.main:app", ...)
```

**Depois (dentro de backend/):**
```python
uvicorn.run("main:app", ...)
```

## 📁 Estrutura Final do Projeto

```
Vant/
├── backend/
│   ├── __init__.py
│   ├── main.py                 # FastAPI app
│   ├── styles.py
│   ├── requirements.txt        # ✅ MOVIDO PARA CÁ
│   ├── start_server.py         # ✅ MOVIDO PARA CÁ
│   └── .env.example            # ✅ CRIADO
├── frontend/
│   ├── src/
│   ├── package.json
│   └── .env.local.example
├── .env.example                # Template para raiz (opcional)
├── .gitignore
├── DEPLOY.md                   # ✅ ATUALIZADO
└── README.md
```

## 🚀 Configuração Correta no Render

Agora você deve configurar no Render:

- **Root Directory**: `backend` ✅
- **Build Command**: `pip install -r requirements.txt` ✅
- **Start Command**: `python start_server.py` ✅

O Render vai:
1. Entrar na pasta `backend/`
2. Encontrar o `requirements.txt` ✅
3. Instalar as dependências
4. Executar `python start_server.py` ✅

## ✅ Verificação das URLs no Frontend

Confirmado que **todas as URLs hardcoded foram substituídas** por `process.env.NEXT_PUBLIC_API_URL`:

- ✅ `page.tsx` linha 315: `activateEntitlements`
- ✅ `page.tsx` linha 351: `verify-checkout-session`
- ✅ `page.tsx` linha 423: `needsActivation`
- ✅ `page.tsx` linha 470: `create-checkout-session`
- ✅ `page.tsx` linha 590: `syncEntitlements`
- ✅ `page.tsx` linha 697: `analyze-premium-paid`
- ✅ `page.tsx` linha 761: `analyze-lite`
- ✅ `PaidStage.tsx` linha 74: `generate-pdf`
- ✅ `PaidStage.tsx` linha 96: `generate-word`

**Nenhuma URL hardcoded encontrada!** ✅

## 🧪 Próximos Passos

1. **Fazer commit das alterações:**
   ```bash
   git add .
   git commit -m "fix: mover arquivos para backend/ e corrigir estrutura para Render"
   git push
   ```

2. **No Render Dashboard:**
   - Clique em **"Manual Deploy"** → **"Clear build cache & deploy"**
   - Ou aguarde o deploy automático após o push

3. **Verificar logs no Render:**
   - O build deve encontrar o `requirements.txt` agora
   - O servidor deve iniciar sem erros

4. **Testar o endpoint:**
   ```
   https://seu-backend.onrender.com/health
   ```
   Deve retornar: `{"status": "ok"}`

## 📝 Desenvolvimento Local

Para rodar localmente agora:

```bash
cd backend
cp .env.example .env
# Editar .env com suas chaves
pip install -r requirements.txt
python start_server.py
```

O servidor vai rodar em `http://0.0.0.0:8000`
