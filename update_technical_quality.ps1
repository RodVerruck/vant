# Script para atualizar o Card Atual para Card de Otimização Técnica com cálculo real

$filePath = "frontend/src/components/PaidStage.tsx"
$content = Get-Content $filePath -Raw

# Substituição 1: Atualizar o div do card com bordas dinâmicas
$content = $content -replace '<div className="vant-glass-dark">\s+<div className="vant-flex vant-items-center vant-gap-3 vant-mb-6">\s+<div className="vant-icon-circle"><Target size=\{20\} color="#cbd5e1" /></div>\s+<span className="vant-text-sm vant-font-medium vant-text-slate-400" style=\{\{ textTransform: ''uppercase'', letterSpacing: ''0.05em'' \}\}>Atual</span>', '<div className="vant-glass-dark" style={{ borderColor: technicalQuality >= 90 ? ''rgba(16, 185, 129, 0.4)'' : ''rgba(56, 189, 248, 0.35)'', boxShadow: technicalQuality >= 90 ? ''0 0 35px rgba(16, 185, 129, 0.15)'' : ''0 0 30px rgba(56, 189, 248, 0.12)'' }}>
                        <div className="vant-flex vant-items-center vant-gap-3 vant-mb-6">
                            <div className="vant-icon-circle" style={{ background: technicalQuality >= 90 ? ''linear-gradient(135deg, #10b981 0%, #059669 100%)'' : ''linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)'' }}>
                                <CheckCircle2 size={20} color="white" />
                            </div>
                            <div>
                                <span className="vant-text-sm vant-font-medium" style={{ color: technicalQuality >= 90 ? ''#34d399'' : ''#38bdf8'', textTransform: ''uppercase'', letterSpacing: ''0.05em'' }}>Otimização Técnica (IA)</span>
                                <div className="vant-text-xs vant-text-slate-400">Qualidade do Documento</div>
                            </div>'

# Substituição 2: Atualizar o score de xpAtual para technicalQuality
$content = $content -replace '<div style=\{\{ fontSize: ''3\.5rem'', fontWeight: 300, color: ''white'', lineHeight: 1 \}\}>\{xpAtual\}</div>\s+<div className="vant-text-sm vant-text-slate-400">de 100 pontos</div>\s+</div>\s+<div className="vant-score-bar-bg">\s+<div className="vant-score-bar-fill" style=\{\{ width: `\$\{xpAtual\}% ` \}\} />', '<div style={{ fontSize: ''3.5rem'', fontWeight: 300, color: technicalQuality >= 90 ? ''#10b981'' : ''#38bdf8'', lineHeight: 1 }}>{technicalQuality}</div>
                            <div className="vant-text-sm" style={{ color: technicalQuality >= 90 ? ''#34d399'' : ''#7dd3fc'' }}>de 100 pontos</div>
                        </div>
                        <div className="vant-score-bar-bg">
                            <div className="vant-score-bar-fill" style={{ width: `${technicalQuality}%`, background: technicalQuality >= 90 ? ''linear-gradient(90deg, #10b981 0%, #34d399 100%)'' : ''linear-gradient(90deg, #38bdf8 0%, #0ea5e9 100%)'' }} />
                        </div>
                        <p className="vant-text-xs vant-text-slate-400" style={{ marginTop: ''0.75rem'', lineHeight: 1.4 }}>
                            {technicalQuality >= 90 ? ''Seu CV está otimizado para leitura de robôs (ATS)'' : ''Formatação ATS aplicada com melhorias de estrutura''}
                        </p>'

# Substituição 3: Atualizar o comentário
$content = $content -replace '\{/\* Card Atual \*/\}', '{/* Card Otimização Técnica (IA) - CÁLCULO REAL */}'

# Salvar o arquivo
$content | Set-Content $filePath -NoNewline

Write-Host "✅ Arquivo atualizado com sucesso!" -ForegroundColor Green
Write-Host "📊 Score de Otimização Técnica agora usa cálculo real baseado em:" -ForegroundColor Cyan
Write-Host "   - ATS (40%)" -ForegroundColor White
Write-Host "   - Keywords (35%)" -ForegroundColor White
Write-Host "   - Impacto (25%)" -ForegroundColor White
Write-Host "   - Bônus por CV otimizado (+15 pontos)" -ForegroundColor White
Write-Host "   - Bônus por gaps corrigidos (até +10 pontos)" -ForegroundColor White
Write-Host "   - Range: 70-98 pontos" -ForegroundColor White
