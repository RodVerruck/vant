# Script para corrigir o Card de Otimização Técnica

$filePath = "frontend/src/components/PaidStage.tsx"
$content = Get-Content $filePath -Raw

# Corrigir o problema do `n que apareceu literalmente
$content = $content -replace '``n\s+\{/\* Card Otimização Técnica', "`n`n                    {/* Card Otimização Técnica"
$content = $content -replace '``n\s+<div className="vant-glass-dark" style=', "`n                    <div className=`"vant-glass-dark`" style="

# Atualizar o ícone e label do card
$content = $content -replace '<div className="vant-icon-circle"><Target size=\{20\} color="#cbd5e1" /></div>\s+<span className="vant-text-sm vant-font-medium vant-text-slate-400" style=\{\{ textTransform: ''uppercase'', letterSpacing: ''0\.05em'' \}\}>Atual</span>', '<div className="vant-icon-circle" style={{ background: technicalQuality >= 90 ? ''linear-gradient(135deg, #10b981 0%, #059669 100%)'' : ''linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)'' }}>
                                <CheckCircle2 size={20} color="white" />
                            </div>
                            <div>
                                <span className="vant-text-sm vant-font-medium" style={{ color: technicalQuality >= 90 ? ''#34d399'' : ''#38bdf8'', textTransform: ''uppercase'', letterSpacing: ''0.05em'' }}>Otimização Técnica (IA)</span>
                                <div className="vant-text-xs vant-text-slate-400">Qualidade do Documento</div>
                            </div>'

# Salvar
$content | Set-Content $filePath -NoNewline

Write-Host "✅ Card de Otimização Técnica corrigido!" -ForegroundColor Green
