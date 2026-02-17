# Script para limpar formatação incorreta

$filePath = "frontend/src/components/PaidStage.tsx"
$content = Get-Content $filePath -Raw

# Remover os `n literais e substituir por quebras de linha corretas
$content = $content -replace '<div className="vant-grid-3 vant-mb-12 vant-animate-fade" style=\{\{ animationDelay: ''0\.1s'' \}\}>``n\s+\{/\* Card Otimização Técnica', "<div className=`"vant-grid-3 vant-mb-12 vant-animate-fade`" style={{ animationDelay: '0.1s' }}>`n`n                    {/* Card Otimização Técnica"

$content = $content -replace '``n\s+<div className="vant-glass-dark" style=', "`n                    <div className=`"vant-glass-dark`" style="

# Salvar
$content | Set-Content $filePath -NoNewline

Write-Host "✅ Formatação limpa!" -ForegroundColor Green
