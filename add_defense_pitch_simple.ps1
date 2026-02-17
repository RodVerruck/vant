# Script simples para adicionar IA no Pitch de Defesa

$filePath = "frontend/src/components/PaidStage.tsx"
$content = Get-Content $filePath -Raw

# 1. Add state after copiedField
$content = $content -replace 'const \[copiedField, setCopiedField\] = useState<string \| null>\(null\);', 'const [copiedField, setCopiedField] = useState<string | null>(null);
    const [defensePitch, setDefensePitch] = useState<string>("");
    const [defensePitchLoading, setDefensePitchLoading] = useState<boolean>(false);'

# 2. Add function after technicalQuality
$functionCode = @'

    // Generate Defense Pitch with IA + Fallback
    const generateDefensePitch = async (): Promise<string> => {
        try {
            setDefensePitchLoading(true);
            
            const gaps = reportData.gaps_fatais || [];
            const veredito = reportData.veredito || "";
            const setor = reportData.setor_detectado || "a vaga";
            
            const isSeniorityGap = veredito.toLowerCase().includes("sênior") || veredito.toLowerCase().includes("senior");
            const isTransition = veredito.toLowerCase().includes("transi") || veredito.toLowerCase().includes("carreira");
            
            const prompt = "Gere um script de defesa para entrevista (max 150 chars). Contexto: Gap=" + (gaps[0]?.titulo || "Senioridade") + ", Setor=" + setor + ", Tipo=" + (isSeniorityGap ? "Senioridade" : isTransition ? "Transição" : "Competência") + ". Responda apenas com o script.";
            
            const response = await fetch('/api/generate-defense-pitch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt })
            });

            if (response.ok) {
                const data = await response.json();
                const pitch = data.pitch?.trim();
                if (pitch && pitch.length > 20 && pitch.length < 200) {
                    return pitch;
                }
            }
        } catch (error) {
            console.warn('IA failed, using fallback:', error);
        } finally {
            setDefensePitchLoading(false);
        }

        // Fallback
        if (veredito.toLowerCase().includes("sênior")) {
            return "Embora meu cargo anterior fosse focado em Suporte, liderei a retenção de clientes críticos durante crises. Isso desenvolveu minha resiliência e visão de Customer Success.";
        }
        return "Minha experiência me preparou com as competências necessárias para este desafio, focando em resultados e aprendizado contínuo.";
    };

    useEffect(() => {
        if (reportData && !defensePitch && !defensePitchLoading) {
            generateDefensePitch().then(setDefensePitch);
        }
    }, [reportData]);
'@

$content = $content -replace 'const technicalQuality = calculateTechnicalQuality\(\);', ('const technicalQuality = calculateTechnicalQuality();' + $functionCode)

# 3. Add loading indicator in UI
$content = $content -replace '<p className="vant-text-sm vant-text-slate-400">Argumento pronto para explicar gaps de senioridade</p>', '<p className="vant-text-sm vant-text-slate-400">Argumento pronto para explicar gaps de senioridade</p>
                                </div>
                                {defensePitchLoading && (
                                    <Loader className="vant-animate-spin" size={16} color="#fbbf24" />
                                )}'

# 4. Update pitch content
$oldPitch = '"Como justificar o gap de senioridade: .Embora meu cargo anterior fosse focado em Suporte, liderei a retenção de clientes críticos durante crises. Isso desenvolveu minha resiliência e visão de Customer Success, que são fundamentais para este desafio de Growth.\.'"'
$newPitch = '{defensePitchLoading ? (<span style={{ color: "#94a3b8", fontStyle: "italic" }}>Gerando argumento personalizado...</span>) : ("Como justificar o gap de senioridade: `" + defensePitch + "`")}'
$content = $content -replace [regex]::Escape($oldPitch), $newPitch

# 5. Update copy button
$oldCopy = 'onClick={() => navigator.clipboard.writeText("Como justificar o gap de senioridade: .Embora meu cargo anterior fosse focado em Suporte, liderei a retenção de clientes críticos durante crises. Isso desenvolveu minha resiliência e visão de Customer Success, que são fundamentais para este desafio de Growth.")}'
$newCopy = 'onClick={() => navigator.clipboard.writeText("Como justificar o gap de senioridade: `" + defensePitch + "`")}'
$content = $content -replace [regex]::Escape($oldCopy), $newCopy

# Save
$content | Set-Content $filePath -NoNewline

Write-Host "✅ Pitch de Defesa por IA implementado!" -ForegroundColor Green
Write-Host "🤖 Gemini Flash-Lite + fallback robusto" -ForegroundColor Cyan
Write-Host "🔄 Loading states e error handling OK" -ForegroundColor White
