# Correção do Erro de Sessão Perdida

## Problema
Quando o usuário retorna do pagamento do Stripe, os dados (`jobDescription` e `file`) estão sendo perdidos, causando o erro:
```
[processing_premium] Dados incompletos: {}
```

## Causa Raiz
O `useEffect` do `processing_premium` executa **antes** dos dados serem restaurados do `sessionStorage`. A lógica de restauração foi removida acidentalmente na linha 632.

## Solução

Substituir as linhas 630-634 em `page.tsx`:

**ANTES:**
```typescript
if (!jobDescription.trim() || !file) {
    // Tentar restaurar do sessionStorage (caso de remontagem)
    setStage("preview");
    return;
}
```

**DEPOIS:**
```typescript
if (!jobDescription.trim() || !file) {
    // Tentar restaurar do sessionStorage (caso de remontagem)
    if (typeof window !== "undefined") {
        const savedJob = sessionStorage.getItem("vant_jobDescription");
        const savedFileB64 = sessionStorage.getItem("vant_file_b64");
        const savedFileName = sessionStorage.getItem("vant_file_name");
        const savedFileType = sessionStorage.getItem("vant_file_type");
        if (savedJob && savedFileB64 && savedFileName && savedFileType) {
            console.log("[processing_premium] Restaurando do sessionStorage...");
            setIsRestoringData(true);
            setJobDescription(savedJob);
            fetch(savedFileB64)
                .then(res => res.blob())
                .then(blob => {
                    const restoredFile = new File([blob], savedFileName, { type: savedFileType });
                    setFile(restoredFile);
                    setIsRestoringData(false);
                    console.log("[processing_premium] Dados restaurados!");
                })
                .catch(err => {
                    console.error("[processing_premium] Erro:", err);
                    setIsRestoringData(false);
                });
            return;
        }
    }
    console.error("[processing_premium] Dados incompletos:", { jobDescription: !!jobDescription, file: !!file });
    setPremiumError("Dados da sessão incompletos. Volte e envie seu CV novamente.");
    setStage("preview");
    return;
}

if (isRestoringData) {
    console.log("[processing_premium] Aguardando restauração...");
    return;
}
```

## Como Aplicar Manualmente

1. Abra o arquivo: `frontend/src/app/app/page.tsx`
2. Vá para a linha 630
3. Substitua o bloco conforme indicado acima
4. Salve o arquivo
5. O Next.js irá recarregar automaticamente

## Teste

Após aplicar a correção:
1. Faça upload de um CV
2. Cole a descrição da vaga
3. Clique em "Analisar"
4. Clique em "Desbloquear Versão Premium"
5. Preencha o email e clique em "Ir para Pagamento"
6. Você será redirecionado para o Stripe
7. Ao retornar, os dados devem ser restaurados automaticamente
8. O processamento premium deve iniciar sem erros
