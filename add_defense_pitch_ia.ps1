# Script para adicionar geração de Pitch de Defesa por IA com fallback

$filePath = "frontend/src/components/PaidStage.tsx"
$content = Get-Content $filePath -Raw

# Add state for defense pitch
$content = $content -replace 'const \[copiedField, setCopiedField\] = useState<string \| null>\(null\);', @'
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [defensePitch, setDefensePitch] = useState<string>("");
    const [defensePitchLoading, setDefensePitchLoading] = useState<boolean>(false);
'@

# Add generateDefensePitch function after technicalQuality
$content = $content -replace 'const technicalQuality = calculateTechnicalQuality\(\);', @'
    const technicalQuality = calculateTechnicalQuality();

    // Generate Defense Pitch with IA + Fallback
    const generateDefensePitch = async (): Promise<string> => {
        try {
            setDefensePitchLoading(true);
            
            // Get relevant data
            const gaps = reportData.gaps_fatais || [];
            const veredito = reportData.veredito || "";
            const setor = reportData.setor_detectado || "a vaga";
            const experiencia = reportData.experiencia || "";
            
            // Identify gap type
            const isSeniorityGap = veredito.toLowerCase().includes("sênior") || veredito.toLowerCase().includes("senior") || veredito.toLowerCase().includes("pleno");
            const isTransition = veredito.toLowerCase().includes("transi") || veredito.toLowerCase().includes("carreira");
            
            // Prepare prompt for IA
            const prompt = `Gere um script de defesa para entrevista de emprego (máximo 150 caracteres) que ajude o candidato a explicar seu gap profissional.

Contexto:
- Gap principal: ${gaps[0]?.titulo || "Gap de senioridade"}
- Setor da vaga: ${setor}
- Tipo de gap: ${isSeniorityGap ? "Senioridade" : isTransition ? "Transição de carreira" : "Competência técnica"}
- Veredito: ${veredito}

Regras:
1. Seja direto e profissional
2. Transforme o "problema" em "força"
3. Use linguagem corporativa
4. Máximo 150 caracteres no script final
5. Foque em skills transferíveis e resultados

Responda apenas com o script, sem explicações adicionais.`;

            // Call IA API (using Gemini Flash-Lite)
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
            console.warn('IA generation failed, using fallback:', error);
        } finally {
            setDefensePitchLoading(false);
        }

        // Fallback templates based on gap type
        const vereditoText = (reportData.veredito || "").toLowerCase();
        const isCareerTransition = vereditoText.includes("transi") || vereditoText.includes("carreira");
        const isSeniorityGap = vereditoText.includes("sênior") || vereditoText.includes("senior") || vereditoText.includes("pleno");

        if (isSeniorityGap) {
            return "Embora meu cargo anterior fosse focado em Suporte, liderei a retenção de clientes críticos durante crises. Isso desenvolveu minha resiliência e visão de Customer Success.";
        }

        if (isCareerTransition) {
            return "Minha trajetória em [área anterior] me deu habilidades transferíveis que são diretamente aplicáveis em [setor da vaga], especialmente em [habilidade chave].";
        }

        return "Minha experiência me preparou com as competências necessárias para este desafio, focando em resultados e aprendizado contínuo.";
    };

    // Generate pitch on component mount
    useEffect(() => {
        if (reportData && !defensePitch && !defensePitchLoading) {
            generateDefensePitch().then(setDefensePitch);
        }
    }, [reportData]);
'@

# Update UI to use dynamic pitch
$content = $content -replace '<h3 className="vant-h3">💡 Sua Estratégia de Defesa na Entrevista</h3>\s*<p className="vant-text-sm vant-text-slate-400">Argumento pronto para explicar gaps de senioridade</p>', @'
                                    <h3 className="vant-h3">💡 Sua Estratégia de Defesa na Entrevista</h3>
                                    <p className="vant-text-sm vant-text-slate-400">Argumento pronto para explicar gaps de senioridade</p>
                                    </div>
                                    {defensePitchLoading && (
                                        <Loader className="vant-animate-spin" size={16} color="#fbbf24" />
                                    )}
'@

# Update pitch content
$content = $content -replace '"Como justificar o gap de senioridade: .Embora meu cargo anterior fosse focado em Suporte, liderei a retenção de clientes críticos durante crises. Isso desenvolveu minha resiliência e visão de Customer Success, que são fundamentais para este desafio de Growth.\.'"', @'
                                        {defensePitchLoading ? (
                                            <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Gerando argumento personalizado...</span>
                                        ) : (
                                            `"Como justificar o gap de senioridade: '${defensePitch}'"`
                                        )}
'@

# Update copy button
$content = $content -replace 'onClick=\(\(\) => navigator\.clipboard\.writeText\("Como justificar o gap de senioridade: .Embora meu cargo anterior fosse focado em Suporte, liderei a retenção de clientes críticos durante crises. Isso desenvolveu minha resiliência e visão de Customer Success, que são fundamentais para este desafio de Growth.\."\)\)', @'
                                        onClick={() => navigator.clipboard.writeText(`Como justificar o gap de senioridade: '${defensePitch}'`)}
'@

# Save
$content | Set-Content $filePath -NoNewline

Write-Host "✅ Pitch de Defesa por IA adicionado com fallback!" -ForegroundColor Green
Write-Host "🤖 Usa Gemini Flash-Lite com templates fallback" -ForegroundColor Cyan
Write-Host "🔄 Loading state e error handling implementados" -ForegroundColor White
