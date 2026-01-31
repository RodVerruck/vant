# 🚀 Quick Start: Mocks em DEV

## TL;DR

Você já tem **DEV_MODE ativado**! Todos os testes já usam mocks sem gastar tokens. 🎉

Para atualizar os mocks com seus dados reais, siga os passos abaixo.

---

## ✅ Status Atual

- ✅ `DEV_MODE=true` no `.env` (modo econômico ativo)
- ✅ Backend salva automaticamente CV e job description no `.cache/`
- ✅ Script `generate_mock_from_real.py` pronto para gerar mocks

---

## 🔄 Atualizar Mocks com Dados Reais

### 1. Processar com IA Real (uma única vez)

```bash
# 1. Desative DEV_MODE no .env
# Edite .env e mude: DEV_MODE=false

# 2. Execute o gerador
python backend/generate_mock_from_real.py

# 3. Aguarde 1-2 minutos (processamento com IA real)

# 4. Reative DEV_MODE no .env
# Edite .env e mude: DEV_MODE=true

# 5. Reinicie o backend
cd backend
python start_server.py
```

### 2. Testar Normalmente

Agora todos os testes usam **seus dados reais** sem gastar tokens! 🎯

---

## 📋 Fluxo Automático

Sempre que você fizer upload de um CV pelo app:

1. **Backend salva automaticamente** em `.cache/last_cv.pdf`
2. **Job description salva** em `.cache/last_job.txt`
3. **Você pode gerar mocks** a qualquer momento com o script

---

## 🎯 Quando Atualizar Mocks?

Atualize quando:
- ✅ Fizer mudanças significativas no seu CV
- ✅ Testar com uma vaga diferente
- ✅ Quiser dados mais realistas nos testes

---

## 💡 Dica Pro

Mantenha **sempre DEV_MODE=true** durante desenvolvimento. Só desative quando:
- Quiser atualizar os mocks
- Testar a IA real antes de deploy

---

## 📁 Arquivos

- `.env` → Configuração do DEV_MODE
- `backend/mock_data.py` → Mocks atuais
- `backend/generate_mock_from_real.py` → Gerador
- `.cache/last_cv.pdf` → Último CV processado
- `.cache/last_job.txt` → Última vaga

---

**Documentação completa**: `DEV_MOCK_GUIDE.md`
