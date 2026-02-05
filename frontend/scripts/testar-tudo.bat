@echo off
echo 🚀 TESTE AUTOMÁTICO DA VANT - UM COMANDO SÓ
echo ========================================

echo.
echo ⏰ Verificando servidor...
curl -s http://localhost:3000 >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Servidor não está rodando!
    echo 💡 Inicie com: npm run dev
    echo.
    pause
    exit /b 1
)

echo ✅ Servidor detectado!
echo.
echo 🎯 Executando testes automáticos...
echo 📸 Screenshots serão salvos em: cypress\screenshots\
echo 📝 Explicações aparecerão no console
echo.
echo ========================================

npm run cypress:run --spec "cypress/e2e/fluxos-automaticos.cy.ts"

echo.
echo ========================================
echo ✅ TESTES CONCLUÍDOS!
echo.
echo 📁 Resultados:
echo    📸 Screenshots: cypress\screenshots\
echo    📹 Vídeos: DESATIVADOS
echo    📝 Logs: Console acima
echo.
echo 🎯 Para UX Team:
echo    1. Abra a pasta cypress\screenshots\
echo    2. Envie as imagens numeradas
echo    3. Use as explicações do console como legenda
echo.
pause
