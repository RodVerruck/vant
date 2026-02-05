@echo off
REM Script para executar testes Cypress de forma rápida (Windows)

echo 🚀 TESTES AUTOMÁTICOS - VANT
echo ========================

REM Verificar se o servidor está rodando
curl -s http://localhost:3000 >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Servidor não está rodando em http://localhost:3000
    echo 💡 Inicie o servidor com: npm run dev
    pause
    exit /b 1
)

echo ✅ Servidor detectado

REM Opções de execução
if "%1"=="tudo" (
    echo 🎯 Executando todos os fluxos automáticos...
    npx cypress run --spec "cypress/e2e/fluxos-automaticos.cy.ts"
) else if "%1"=="ux" (
    echo 📸 Executando apenas screenshots para UX...
    npx cypress run --spec "cypress/e2e/screenshots-ux.cy.ts"
) else if "%1"=="fluxo" (
    echo 🔄 Executando apenas fluxo principal...
    npx cypress run --spec "cypress/e2e/fluxo-principal.cy.ts"
) else if "%1"=="ui" (
    echo 🖥️ Abrindo Cypress UI...
    npm run cypress:open
) else (
    echo 🎯 Executando teste automático completo...
    npx cypress run --spec "cypress/e2e/fluxos-automaticos.cy.ts"
)

echo ✅ Testes concluídos!
echo 📁 Screenshots salvos em: cypress/screenshots/
echo 📹 Vídeos: DESATIVADOS
echo pause
