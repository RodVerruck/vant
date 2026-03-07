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

// 🎯 FUNÇÃO DE SCORE PROJETADO - SEMPRE MAIOR QUE O ATUAL
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

    // GARANTIA: Ganho mínimo baseado na faixa do score atual
    let minGuaranteedGain = 15; // Padrão para scores médios
    if (current < 30) minGuaranteedGain = 25; // CVs muito ruins: ganho maior
    else if (current < 50) minGuaranteedGain = 20; // CVs ruins: ganho alto
    else if (current < 70) minGuaranteedGain = 15; // CVs médios: ganho médio
    else if (current < 85) minGuaranteedGain = 10; // CVs bons: ganho moderado
    else minGuaranteedGain = 5; // CVs excelentes: ganho pequeno

    // Cálculo de potencial baseado em déficits reais
    const atsDeficit = 100 - ats;
    const kwDeficit = 100 - kw;
    const impDeficit = 100 - imp;
    const weightedDeficit = (atsDeficit * 0.45) + (kwDeficit * 0.35) + (impDeficit * 0.2);

    // Bônus por gaps identificados
    const gapBonus = (fatalGaps * 8) + (mediumGaps * 4);

    // Bônus por déficit nos pilares
    let pillarBonus = 0;
    if (atsDeficit >= 40) pillarBonus += 10;
    else if (atsDeficit >= 25) pillarBonus += 6;

    if (kwDeficit >= 40) pillarBonus += 8;
    else if (kwDeficit >= 25) pillarBonus += 5;

    if (impDeficit >= 40) pillarBonus += 6;
    else if (impDeficit >= 25) pillarBonus += 3;

    // Ganho total = mínimo garantido + bônus
    const totalGain = minGuaranteedGain + gapBonus + pillarBonus;

    // Teto máximo realista por faixa
    let maxRealisticScore = 94;
    if (current < 30) maxRealisticScore = 70; // CVs muito ruins: até 70
    else if (current < 50) maxRealisticScore = 80; // CVs ruins: até 80
    else if (current < 70) maxRealisticScore = 90; // CVs médios: até 90
    else maxRealisticScore = 96; // CVs bons: até 96

    // Score projetado = atual + ganho (limitado pelo teto)
    const projectedScore = Math.min(current + totalGain, maxRealisticScore);
    const improvement = projectedScore - current;

    // Percentis REALISTAS baseados no score projetado
    let percentile = "Top 70%";
    if (projectedScore < 40) percentile = "Top 80%"; // Scores muito baixos
    else if (projectedScore < 50) percentile = "Top 70%";
    else if (projectedScore < 60) percentile = "Top 60%";
    else if (projectedScore < 65) percentile = "Top 50%";
    else if (projectedScore < 70) percentile = "Top 40%";
    else if (projectedScore < 75) percentile = "Top 30%";
    else if (projectedScore < 80) percentile = "Top 25%";
    else if (projectedScore < 85) percentile = "Top 20%";
    else if (projectedScore < 90) percentile = "Top 15%";
    else if (projectedScore < 95) percentile = "Top 10%";
    else percentile = "Top 5%";

    // Justificativa baseada nos fatores
    const reasons: string[] = [];
    if (fatalGaps > 0) reasons.push(`${fatalGaps} gaps críticos`);
    if (mediumGaps > 0) reasons.push(`${mediumGaps} gaps médios`);
    if (atsDeficit >= 25) reasons.push("formatação ATS abaixo do ideal");
    if (kwDeficit >= 25) reasons.push("palavras-chave insuficientes");
    if (impDeficit >= 25) reasons.push("baixo impacto nas descrições");

    const reasoning = reasons.length > 0
        ? `Baseado em: ${reasons.join(", ")}`
        : "Otimizações gerais de estrutura e conteúdo";

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
