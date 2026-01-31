# 🧪 Sistema de Mocks para DEV

## Como Funciona

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUXO ATUAL (DEV_MODE=true)              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Upload CV → Backend → ❌ Pula IA → ✅ Retorna Mock        │
│                                                             │
│  ⚡ Instantâneo | 💰 $0 | 📊 Dados genéricos               │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              GERAR MOCKS REAIS (uma vez)                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. DEV_MODE=false no .env                                  │
│  2. python backend/generate_mock_from_real.py               │
│  3. Aguardar processamento (1-2 min)                        │
│  4. DEV_MODE=true no .env                                   │
│  5. Reiniciar backend                                       │
│                                                             │
│  ⏱️ 1-2 min | 💰 ~$0.10 (uma vez) | 📊 Seus dados reais   │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│         DEPOIS DE GERAR MOCKS REAIS                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Upload CV → Backend → ❌ Pula IA → ✅ Retorna Mock REAL   │
│                                                             │
│  ⚡ Instantâneo | 💰 $0 | 📊 SEUS DADOS REAIS! 🎯         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Arquivos Criados

### 1. `generate_mock_from_real.py`
Script que processa seu CV com IA real e salva em `mock_data.py`

### 2. `mock_data.py` (atualizado automaticamente)
Contém os dados mockados usados em DEV_MODE

### 3. `.cache/` (auto-gerenciado)
- `last_cv.pdf` - Último CV processado
- `last_job.txt` - Última descrição de vaga

## Benefícios

✅ **Economia**: Não gasta tokens em DEV  
✅ **Velocidade**: Testes instantâneos  
✅ **Realismo**: Usa seus dados reais  
✅ **Automático**: Backend salva CVs automaticamente  

## Comandos Úteis

```bash
# Ver modo atual
cd backend
python start_server.py
# Veja a mensagem de inicialização

# Gerar mocks reais
python backend/generate_mock_from_real.py

# Editar DEV_MODE
# Edite o arquivo .env na raiz do projeto
```

## Troubleshooting

**Mocks não estão sendo usados?**
- Verifique `DEV_MODE=true` no `.env`
- Reinicie o backend

**Quer processar com IA real?**
- Mude `DEV_MODE=false` no `.env`
- Reinicie o backend

**Quer atualizar os mocks?**
- Siga o fluxo "GERAR MOCKS REAIS" acima
