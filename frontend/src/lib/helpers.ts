export function calculateDynamicCvCount(): number {
    const now = new Date();
    const baseCount = 12;
    const ratePerHour = 14;
    const currentCount = baseCount + now.getHours() * ratePerHour + Math.floor(now.getMinutes() / 4);
    const daySeed = now.getDate() * 3;
    return currentCount + daySeed;
}

export function calcPotencial(nota: number): number {
    if (nota < 50) {
        return Math.min(nota + 25, 60);
    }
    if (nota < 80) {
        return Math.min(nota + 35, 95);
    }
    return Math.min(nota + 10, 99);
}

// 🎯 NOVA FUNÇÃO HÍBRIDA - Score Projetado Inteligente
export function calculateProjectedScore(
    currentScore: number,
    gapsFatals: number = 0,
    gapsMediums: number = 0,
    formatoAts: number = 0,
    keywords: number = 0,
    impacto: number = 0
): { score: number; improvement: number; percentile: string; reasoning: string } {
    const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

    const current = clamp(Math.round(currentScore || 0), 0, 100);
    const ats = clamp(Math.round(formatoAts || 0), 0, 100);
    const kw = clamp(Math.round(keywords || 0), 0, 100);
    const imp = clamp(Math.round(impacto || 0), 0, 100);
    const fatalGaps = Math.max(0, Math.round(gapsFatals || 0));
    const mediumGaps = Math.max(0, Math.round(gapsMediums || 0));

    // Potencial baseado em deficit real dos pilares (peso maior para formatação ATS e keywords)
    const atsDeficit = 100 - ats;
    const kwDeficit = 100 - kw;
    const impDeficit = 100 - imp;
    const weightedDeficit = (atsDeficit * 0.45) + (kwDeficit * 0.35) + (impDeficit * 0.2);

    // Converte déficit em potencial recuperável (conservador)
    const recoverableFromPillars = weightedDeficit * 0.24;
    const gapInfluence = (fatalGaps * 1.8) + (mediumGaps * 0.9);

    // Reforço leve para scores muito baixos (determinístico, sem inflar demais)
    const lowScoreLift = current < 40
        ? clamp(Math.round((weightedDeficit * 0.18) + (gapInfluence * 0.75)), 4, 14)
        : 0;

    const rawImprovement = recoverableFromPillars + gapInfluence + lowScoreLift;

    // Limite de ganho por faixa (evita saltos irreais em scores já altos)
    let bandGainCap = 24;
    if (current < 35) bandGainCap = 28;
    if (current >= 85) bandGainCap = 7;
    else if (current >= 75) bandGainCap = 10;
    else if (current >= 60) bandGainCap = 14;
    else if (current >= 45) bandGainCap = 19;

    const minGain = weightedDeficit >= 12 ? 1 : 0;
    const boundedImprovement = clamp(Math.round(rawImprovement), minGain, bandGainCap);

    // Teto dinâmico para preservar realismo e evitar concentração em um único valor
    let dynamicCeiling = 94;
    if (current >= 80) dynamicCeiling = 95;
    if (current >= 90) dynamicCeiling = 96;

    const projectedScore = clamp(current + boundedImprovement, current, dynamicCeiling);
    const improvement = projectedScore - current;

    let percentile = "Top 25%";
    if (projectedScore >= 80) percentile = "Top 20%";
    if (projectedScore >= 86) percentile = "Top 15%";
    if (projectedScore >= 91) percentile = "Top 10%";

    const reasons: string[] = [];
    if (fatalGaps + mediumGaps > 0) reasons.push(`${fatalGaps + mediumGaps} gaps relevantes identificados`);
    if (atsDeficit >= 25) reasons.push("estrutura ATS com alto espaço de melhoria");
    if (kwDeficit >= 25) reasons.push("baixa cobertura de palavras-chave da vaga");
    if (impDeficit >= 25) reasons.push("baixo nível de verbos de impacto e especificidade");

    const reasoning = reasons.length > 0
        ? `Projeção baseada em: ${reasons.join(", ")}`
        : "Projeção estável com ajustes finos de otimização";

    return {
        score: projectedScore,
        improvement,
        percentile,
        reasoning
    };
}

export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getErrorMessage(e: unknown, fallback: string): string {
    if (e instanceof Error && e.message) {
        return String(e.message);
    }
    if (typeof e === "string" && e.trim()) {
        return e;
    }
    return fallback;
}

export function trackEvent(eventName: string, params?: Record<string, unknown>): void {
    if (typeof window !== "undefined" && (window as any).gtag) {
        try {
            (window as any).gtag("event", eventName, params || {});
        } catch (e) {
            console.warn("GA4 tracking failed:", e);
        }
    }
}
