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

    // Base de melhoria garantida
    const baseImprovement = 15;

    // Bônus baseado nos gaps identificados
    const gapBonus = (gapsFatals * 12) + (gapsMediums * 6);

    // Bônus baseado nas métricas atuais (quanto pior, maior o potencial)
    const formatBonus = formatoAts < 60 ? 15 : formatoAts < 80 ? 8 : 3;
    const keywordBonus = keywords < 60 ? 12 : keywords < 80 ? 6 : 2;
    const impactBonus = impacto < 60 ? 10 : impacto < 80 ? 5 : 2;

    // Cálculo do score projetado
    const totalImprovement = baseImprovement + gapBonus + formatBonus + keywordBonus + impactBonus;
    const projectedScore = Math.min(92, Math.max(currentScore + 10, currentScore + totalImprovement));
    const improvement = projectedScore - currentScore;

    // Cálculo de percentil realista
    let percentile = "Top 25%";
    if (projectedScore >= 85) percentile = "Top 15%";
    if (projectedScore >= 90) percentile = "Top 10%";

    // Geração de justificativa
    const reasons = [];
    if (gapBonus > 0) reasons.push(`${gapsFatals + gapsMediums} gaps críticos identificados`);
    if (formatBonus > 10) reasons.push("formatação ATS abaixo do ideal");
    if (keywordBonus > 8) reasons.push("palavras-chave insuficientes");
    if (impactBonus > 8) reasons.push("métricas de impacto ausentes");

    const reasoning = reasons.length > 0
        ? `Baseado em: ${reasons.join(", ")}`
        : "Com otimizações estratégicas no currículo";

    return {
        score: projectedScore,
        improvement: improvement,
        percentile: percentile,
        reasoning: reasoning
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
