@echo off
echo ========================================
echo   TESTE E2E - Upload de CV Completo
echo ========================================
echo.

REM Verificar se o servidor está rodando
echo [1/3] Verificando servidor Next.js...
curl -s http://localhost:3000 > nul
if %errorlevel% neq 0 (
    echo ERRO: Servidor Next.js nao esta rodando!
    echo Execute 'npm run dev' em outro terminal primeiro.
    pause
    exit /b 1
)
echo ✓ Servidor rodando em http://localhost:3000
echo.

REM Verificar se o backend está rodando
echo [2/3] Verificando backend...
curl -s http://127.0.0.1:8000/health > nul
if %errorlevel% neq 0 (
    echo AVISO: Backend nao esta rodando em http://127.0.0.1:8000
    echo Alguns testes podem falhar se precisarem do backend.
    echo.
)
echo.

REM Executar testes
echo [3/3] Executando testes E2E de upload...
echo.
npx cypress run --spec "cypress/e2e/upload-cv-completo.cy.ts" --browser chrome

echo.
echo ========================================
echo   Testes concluidos!
echo ========================================
echo.
echo Screenshots salvos em: cypress\screenshots\
echo Videos salvos em: cypress\videos\
echo.
pause
