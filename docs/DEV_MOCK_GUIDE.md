# 🧪 Guia de Mocks para Desenvolvimento

## O Problema

Quando você está testando o app em DEV, cada vez que processa um CV, a IA consome tokens da OpenAI/Google, gerando custos desnecessários. Além disso, o processamento demora 30-60 segundos.

## A Solução

O sistema tem **modo DEV** que usa dados mockados (falsos) instantaneamente, sem gastar tokens. Mas os mocks genéricos não refletem seus dados reais.

**Solução ideal**: Processar **uma única vez** com IA real, salvar o resultado, e reutilizar sempre em DEV.

---

## 🎯 Como Usar

### Opção 1: Usar Mocks Atuais (Rápido)

Se os mocks atuais já estão bons para testar:

1. **Certifique-se que DEV_MODE está ativo** no arquivo `.env`:
   ```
   DEV_MODE=true
   ```

2. **Inicie o backend**:
   ```bash
   cd backend
   python start_server.py
   ```

3. **Teste normalmente** - todas as análises retornarão dados mockados instantaneamente, sem gastar tokens!

---

### Opção 2: Atualizar Mocks com Seus Dados Reais

Quando você quiser que os mocks reflitam **seu CV real**:

#### Passo 1: Preparar os Dados

1. Faça upload do seu CV pelo app (ou coloque manualmente em `.cache/last_cv.pdf`)
2. A descrição da vaga será salva automaticamente (ou edite `.cache/last_job.txt`)

#### Passo 2: Desativar DEV_MODE Temporariamente

Edite o arquivo `.env` e mude:
```
DEV_MODE=false
```

#### Passo 3: Gerar Mocks Reais

Execute o script gerador:
```bash
python backend/generate_mock_from_real.py
```

O script vai:
- ✅ Processar seu CV com IA real (gasta tokens, mas só uma vez!)
- ✅ Gerar análise preview e premium completas
- ✅ Salvar tudo no arquivo `backend/mock_data.py`

**Aguarde 1-2 minutos** para o processamento completo.

#### Passo 4: Reativar DEV_MODE

Edite o arquivo `.env` novamente:
```
DEV_MODE=true
```

#### Passo 5: Reiniciar o Backend

```bash
cd backend
python start_server.py
```

Pronto! Agora todos os testes usarão **seus dados reais** sem gastar tokens! 🎉

---

## 📊 Comparação

| Modo | Velocidade | Custo | Dados |
|------|-----------|-------|-------|
| **Produção** (DEV_MODE=false) | 30-60s | ~$0.05/análise | IA real |
| **DEV com mocks genéricos** | Instantâneo | $0 | Genéricos |
| **DEV com mocks reais** | Instantâneo | $0 | Seus dados reais |

---

## 🔍 Verificar Modo Atual

Ao iniciar o backend, você verá uma mensagem:

### DEV_MODE ativo:
```
============================================================
🔧 MODO DE DESENVOLVIMENTO ATIVADO
   IA será substituída por mocks instantâneos
   Nenhum token será gasto
============================================================
```

### DEV_MODE desativado:
```
============================================================
🤖 MODO DE PRODUÇÃO ATIVADO
   IA real será processada
   Tokens serão consumidos
============================================================
```

---

## 💡 Dicas

- **Atualize os mocks** sempre que fizer mudanças significativas no seu CV
- **Mantenha DEV_MODE=true** durante desenvolvimento para economizar
- **Use DEV_MODE=false** apenas quando for testar a IA real ou atualizar mocks
- Os mocks ficam salvos em `backend/mock_data.py` - você pode editá-los manualmente se quiser

---

## 🚨 Troubleshooting

### "DEV_MODE está ativado" ao tentar gerar mocks

**Solução**: Você precisa desativar DEV_MODE no `.env` antes de gerar mocks reais.

### "Arquivo de CV não encontrado"

**Solução**: Faça upload de um CV pelo app ou coloque um PDF em `.cache/last_cv.pdf`

### Mocks não estão sendo usados

**Solução**: 
1. Verifique se `DEV_MODE=true` no `.env`
2. Reinicie o servidor backend
3. Confirme a mensagem de "MODO DE DESENVOLVIMENTO ATIVADO"

---

## 📁 Arquivos Importantes

- **`.env`** - Configuração do DEV_MODE
- **`backend/mock_data.py`** - Dados mockados (gerados ou manuais)
- **`backend/generate_mock_from_real.py`** - Script gerador
- **`.cache/last_cv.pdf`** - Último CV processado
- **`.cache/last_job.txt`** - Última descrição de vaga
