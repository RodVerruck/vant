@echo off
REM Script para executar testes Cypress de forma rápida (Windows)

echo 🚀 Iniciando testes Cypress para UX Team...

REM Verificar se o servidor está rodando
curl -s http://localhost:3000 >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Servidor não está rodando em http://localhost:3000
    echo Por favor, inicie o servidor com: npm run dev
    pause
    exit /b 1
)

echo ✅ Servidor detectado

REM Opções de execução
if "%1"=="ui" (
    echo 🖥️ Abrindo Cypress UI...
    npm run cypress:open
) else if "%1"=="screenshots" (
    echo 📸 Executando apenas testes de screenshots...
    npx cypress run --spec "cypress/e2e/screenshots-ux.cy.ts"
) else if "%1"=="fluxo" (
    echo 🔄 Executando apenas testes de fluxo principal...
    npx cypress run --spec "cypress/e2e/fluxo-principal.cy.ts"
) else if "%1"=="rapido" (
    echo ⚡ Executando testes rápidos (sem vídeos)...
    npx cypress run --config video=false,specPattern="cypress/e2e/*.cy.ts"
) else (
    echo 🎯 Executando todos os testes...
    npm run cypress:run
)

echo ✅ Testes concluídos!
echo 📁 Screenshots salvos em: cypress/screenshots/
echo 📹 Vídeos salvos em: cypress/videos/
pause
