# 🔧 Modo de Desenvolvimento (DEV_MODE)

## 📋 O que é?

O **Modo de Desenvolvimento** permite testar o fluxo completo da aplicação **sem processar IA** e **sem gastar tokens**. 

Quando ativado, o backend retorna dados mockados instantaneamente, simulando as respostas da IA.

---

## ✅ Vantagens

- ⚡ **Testes instantâneos** (sem esperar processamento de IA)
- 💰 **Zero custo** (não consome tokens do Google/Groq)
- 🔄 **Fluxo completo** (testa autenticação, pagamento, UI, etc.)
- 🎯 **Dados consistentes** (sempre retorna o mesmo mock)

---

## 🚀 Como Ativar

### 1. No arquivo `.env` (Backend):

```bash
# Modo de Desenvolvimento (true = usa mock de IA, false = usa IA real)
DEV_MODE=true
```

### 2. Reinicie o backend:

```bash
# Se estiver rodando com uvicorn
uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000

# Ou se estiver rodando com python
python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```

### 3. Teste o fluxo:

1. Faça upload de **qualquer PDF** (não importa o conteúdo)
2. Digite **qualquer descrição de vaga** (não importa o texto)
3. Clique em **"ANALISAR MEU CV"**
4. ✅ Receberá o mock instantaneamente!

---

## 🔒 Como Desativar (Produção)

### 1. No arquivo `.env`:

```bash
# Modo de Desenvolvimento (true = usa mock de IA, false = usa IA real)
DEV_MODE=false
```

### 2. Reinicie o backend

### 3. Agora a IA real será processada

---

## 📊 O que é Mockado?

### **Análise Lite** (`/api/analyze-lite`):
- Score ATS: 78/100
- 3 pilares com feedback
- 1 gap fatal
- Preview HTML

### **Análise Premium** (`/api/analyze-premium-paid`):
- 4 pilares otimizados (scores 88-95)
- Análise comparativa completa
- Projetos práticos sugeridos
- Perguntas de entrevista
- Simulação de entrevista
- Livros recomendados
- Kit Hacker (X-Ray searches)
- **CV otimizado em HTML** (pronto para download)

---

## ⚠️ Importante

### **Em Desenvolvimento (DEV_MODE=true):**
- ✅ Use para testar autenticação
- ✅ Use para testar fluxo de pagamento
- ✅ Use para testar UI/UX
- ✅ Use para testar downloads de PDF/Word
- ❌ **NÃO** use para testar qualidade da IA

### **Em Produção (DEV_MODE=false):**
- ✅ IA real processa os CVs
- ✅ Consome tokens (Google/Groq)
- ✅ Demora ~30-60 segundos
- ✅ Resultados personalizados

---

## 🎯 Exemplo de Uso

```bash
# 1. Ative o modo dev
echo "DEV_MODE=true" >> .env

# 2. Reinicie o backend
uvicorn backend.main:app --reload

# 3. Teste o fluxo completo
# - Upload de CV
# - Análise (instantânea!)
# - Checkout
# - Login com Google
# - Pagamento
# - Processamento premium (instantâneo!)
# - Download de PDF/Word

# 4. Quando terminar os testes, desative
echo "DEV_MODE=false" >> .env

# 5. Reinicie o backend
uvicorn backend.main:app --reload
```

---

## 🔍 Como Saber se Está Ativado?

Quando o backend processa uma requisição em modo dev, você verá no console:

```
🔧 [DEV MODE] Retornando mock de análise lite (sem processar IA)
🔧 [DEV MODE] Retornando mock de análise premium (sem processar IA)
```

---

## 📝 Notas

- O modo dev **NÃO afeta** o Stripe (pagamentos reais ainda funcionam)
- O modo dev **NÃO afeta** o Supabase (autenticação real ainda funciona)
- O modo dev **APENAS** substitui as chamadas de IA por mocks
- Os dados mockados estão em `backend/mock_data.py`
- Você pode editar os mocks para testar diferentes cenários

---

## 🚀 Deploy em Produção

**IMPORTANTE:** Sempre configure `DEV_MODE=false` no Render (produção)!

1. Acesse o dashboard do Render
2. Vá em **Environment Variables**
3. Adicione: `DEV_MODE=false`
4. Salve e faça redeploy

Ou simplesmente **não adicione** a variável `DEV_MODE` no Render (o padrão é `false`).
