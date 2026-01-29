# 📋 Análise de Migração: Streamlit → React/Next.js

## 🗂️ Arquivos Antigos do Streamlit Identificados

### ❅ Arquivos que podem ser REMOVIDOS:

#### 1. **Arquivo Principal Streamlit**
- `app.py` - Aplicação Streamlit completa (2009 linhas)
  - Contém toda a UI antiga
  - Usa `st.` (streamlit components)
  - **Nenhuma dependência no novo sistema**

#### 2. **Componentes UI Streamlit**
- `ui_components.py` - Funções de UI específicas do Streamlit
  - `render_dashboard_metrics()`
  - `render_locked_blur()`
  - `render_offer_card()`
  - `render_social_proof_bar()`
  - `HERO_HTML`
  - **Nenhuma dependência no novo sistema**

#### 3. **Configuração Streamlit**
- `.streamlit/config.toml` - Configurações do Streamlit
- `.streamlit/secrets.toml` - Segredos do Streamlit
  - **Ainda referenciado por variáveis de ambiente no frontend**

#### 4. **Arquivos de Teste Criados**
- `test_*.py` - Arquivos de teste que criamos
  - Podem ser mantidos em pasta `/tests`

### ⚠️ Arquivos que PRECISAM migrar antes de remover:

#### 1. **css_constants.py** - ⚠️ DEPENDÊNCIA CRÍTICA
- **Usado por**: `logic.py` (linha 548)
- **Contém**: `CSS_V13` e `CSS_PDF` para geração de PDF/Word
- **Ação**: Migrar CSS para o backend ou extrair como módulo independente

#### 2. **requirements.txt** - ⚠️ DEPENDE
- Contém `streamlit==1.40.0` que não é mais usado
- **Ação**: Remover dependências do Streamlit

## 🔄 Plano de Migração

### Fase 1: Migrar CSS Constants
```python
# Criar: backend/styles.py
CSS_V13 = """..."""  # Mover de css_constants.py
CSS_PDF = CSS_V13 + """..."""  # Migrar também
```

### Fase 2: Atualizar Imports
```python
# Em logic.py
TROCAR: from css_constants import CSS_V13, CSS_PDF
POR:    from backend.styles import CSS_V13, CSS_PDF
```

### Fase 3: Limpar Dependencies
```bash
# Remover do requirements.txt
streamlit==1.40.0  # ❌ Remover esta linha
```

### Fase 4: Remover Arquivos Antigos
```bash
rm app.py
rm ui_components.py
rm css_constants.py
rm -rf .streamlit/
```

## 📊 Status Atual

| Componente | Status | Ação Necessária |
|------------|--------|-----------------|
| Frontend React | ✅ Ativo | Nenhuma |
| Backend FastAPI | ✅ Ativo | Migrar CSS |
| CSS Constants | ⚠️ Usado | Migrar para backend |
| app.py | ❌ Obsoleto | Remover |
| ui_components.py | ❌ Obsoleto | Remover |
| .streamlit/ | ❌ Obsoleto | Remover |

## 🎯 Benefícios da Limpeza

1. **Redução de ~4000 linhas** de código obsoleto
2. **Remoção de dependência** Streamlit
3. **Clareza no projeto** - só o necessário
4. **Menos confusão** para novos desenvolvedores

## ⚡ Próximos Passos

1. ✅ Analisar dependências (feito)
2. 🔄 Migrar `css_constants.py` para `backend/styles.py`
3. 🔄 Atualizar import em `logic.py`
4. 🔄 Remover Streamlit do `requirements.txt`
5. 🗑️ Deletar arquivos obsoletos
6. ✅ Criar pasta `/tests` para organizar testes
