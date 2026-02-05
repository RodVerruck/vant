#!/bin/bash

# Script para executar testes Cypress de forma rápida

echo "🚀 Iniciando testes Cypress para UX Team..."

# Verificar se o servidor está rodando
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "❌ Servidor não está rodando em http://localhost:3000"
    echo "Por favor, inicie o servidor com: npm run dev"
    exit 1
fi

echo "✅ Servidor detectado"

# Opções de execução
case $1 in
    "ui")
        echo "🖥️ Abrindo Cypress UI..."
        npm run cypress:open
        ;;
    "screenshots")
        echo "📸 Executando apenas testes de screenshots..."
        npx cypress run --spec "cypress/e2e/screenshots-ux.cy.ts"
        ;;
    "fluxo")
        echo "🔄 Executando apenas testes de fluxo principal..."
        npx cypress run --spec "cypress/e2e/fluxo-principal.cy.ts"
        ;;
    "rapido")
        echo "⚡ Executando testes rápidos (sem vídeos)..."
        npx cypress run --config video=false,specPattern="cypress/e2e/*.cy.ts"
        ;;
    *)
        echo "🎯 Executando todos os testes..."
        npm run cypress:run
        ;;
esac

echo "✅ Testes concluídos!"
echo "📁 Screenshots salvos em: cypress/screenshots/"
echo "📹 Vídeos salvos em: cypress/videos/"
