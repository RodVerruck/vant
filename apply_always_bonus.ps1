# Script para aplicar sempre o bônus de +15 pontos na Otimização Técnica

$filePath = "frontend/src/components/PaidStage.tsx"
$content = Get-Content $filePath -Raw

# Substituir a linha que verifica se CV existe por sempre aplicar +15
$content = $content -replace 'const hasOptimizedCV = !!reportData\.cv_otimizado_completo;\s+const optimizationBonus = hasOptimizedCV \? 15 : 0;', 'const optimizationBonus = 15; // CV sempre será gerado'

# Atualizar o comentário do range de score
$content = $content -replace '// Score final: base \+ bônus, limitado entre 70-98', '// Score final: base + bônus, limitado entre 85-98'

# Salvar
$content | Set-Content $filePath -NoNewline

Write-Host "✅ Bônus de +15 pontos agora é sempre aplicado!" -ForegroundColor Green
Write-Host "📊 Novo range de scores: 85-98 pontos" -ForegroundColor Cyan
Write-Host "🎯 Score reflete CV já otimizado pela IA" -ForegroundColor White
