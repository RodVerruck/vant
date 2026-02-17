# Script para ajustar o limite mínimo do score de 70 para 85

$filePath = "frontend/src/components/PaidStage.tsx"
$content = Get-Content $filePath -Raw

# Ajustar o limite mínimo de 70 para 85 (já que sempre tem +15 de bônus)
$content = $content -replace 'Math\.min\(98, Math\.max\(70,', 'Math.min(98, Math.max(85,'

# Salvar
$content | Set-Content $filePath -NoNewline

Write-Host "✅ Limite mínimo ajustado de 70 para 85!" -ForegroundColor Green
Write-Host "📊 Range final: 85-98 pontos" -ForegroundColor Cyan
