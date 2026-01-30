# Workflow de Desenvolvimento - Vant

## Estrutura de Branches

### `main` - Produção
- Branch principal conectada aos deploys de produção
- **Frontend**: Vercel (vant.app.br)
- **Backend**: Render (vant-vlgn.onrender.com)
- Apenas código testado e aprovado deve estar aqui

### `dev` - Desenvolvimento
- Branch para desenvolvimento e testes locais
- Todas as novas features e melhorias devem ser implementadas aqui primeiro
- Após testes locais bem-sucedidos, fazer merge para `main`

## Fluxo de Trabalho

### 1. Trabalhando em Melhorias

```bash
# Certifique-se de estar na branch dev
git checkout dev

# Atualize a branch dev com as últimas mudanças
git pull origin dev

# Faça suas alterações...
# Teste localmente...

# Commit das alterações
git add .
git commit -m "feat: descrição da melhoria"

# Envie para o repositório remoto
git push origin dev
```

### 2. Testando Localmente

#### Backend (FastAPI)
```bash
cd backend
python start_server.py
# Servidor rodando em http://localhost:8000
```

#### Frontend (Next.js)
```bash
cd frontend
npm run dev
# Aplicação rodando em http://localhost:3000
```

**Importante**: Configure as variáveis de ambiente locais:
- Frontend: `NEXT_PUBLIC_API_URL=http://localhost:8000`
- Backend: Configure as variáveis necessárias no `.env` local

### 3. Subindo para Produção

Quando estiver satisfeito com as melhorias testadas na branch `dev`:

```bash
# Volte para a branch main
git checkout main

# Atualize a branch main
git pull origin main

# Faça merge da branch dev
git merge dev

# Resolva conflitos se houver
# Teste uma última vez se necessário

# Envie para produção
git push origin main
```

**Atenção**: O push para `main` irá disparar os deploys automáticos:
- Vercel rebuilda o frontend automaticamente
- Render rebuilda o backend automaticamente

### 4. Sincronizando as Branches

Após o merge para produção, mantenha a branch dev atualizada:

```bash
git checkout dev
git merge main
git push origin dev
```

## Boas Práticas

1. **Sempre trabalhe na branch `dev`** para novas features
2. **Teste localmente** antes de fazer merge para `main`
3. **Commits semânticos**: Use prefixos como `feat:`, `fix:`, `refactor:`, etc.
4. **Pequenos commits**: Faça commits frequentes com mudanças específicas
5. **Documente mudanças importantes**: Atualize READMEs quando necessário
6. **Variáveis de ambiente**: Nunca commite arquivos `.env` com credenciais reais

## Ambientes

| Ambiente | Branch | Frontend | Backend |
|----------|--------|----------|---------|
| **Produção** | `main` | https://vant.app.br | https://vant-vlgn.onrender.com |
| **Desenvolvimento** | `dev` | http://localhost:3000 | http://localhost:8000 |

## Comandos Úteis

```bash
# Ver em qual branch você está
git branch

# Ver status das alterações
git status

# Ver histórico de commits
git log --oneline

# Desfazer alterações não commitadas
git restore <arquivo>

# Voltar para um commit anterior (cuidado!)
git reset --hard <commit-hash>

# Ver diferenças entre branches
git diff main dev
```

## Troubleshooting

### Conflitos no Merge
Se houver conflitos ao fazer merge de `dev` para `main`:
1. Git irá marcar os arquivos com conflito
2. Abra os arquivos e resolva manualmente
3. Remova os marcadores de conflito (`<<<<<<<`, `=======`, `>>>>>>>`)
4. `git add <arquivos-resolvidos>`
5. `git commit -m "merge: resolve conflitos entre dev e main"`

### Reverter um Deploy com Problema
Se algo der errado em produção:
```bash
git checkout main
git revert HEAD  # Reverte o último commit
git push origin main  # Dispara novo deploy com a reversão
```

## Próximos Passos Recomendados

1. **CI/CD**: Configurar testes automatizados que rodam antes do merge
2. **Staging**: Criar uma branch `staging` e ambiente de homologação
3. **Feature Branches**: Para features grandes, criar branches específicas (`feature/nome-da-feature`)
4. **Pull Requests**: Usar PRs no GitHub/GitLab para revisão de código antes do merge
