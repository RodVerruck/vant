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
export interface ScoreBreakdownItem {
    label: string;
    points: number;
    description: string;
}

export function calculateScoreBreakdown(
    currentScore: number,
    gapsFatals: number = 0,
    gapsMediums: number = 0,
    formatoAts: number = 0,
    keywords: number = 0,
    impacto: number = 0
): ScoreBreakdownItem[] {
    const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

    const current = clamp(Math.round(currentScore || 0), 0, 100);
    const ats = clamp(Math.round(formatoAts || 0), 0, 100);
    const kw = clamp(Math.round(keywords || 0), 0, 100);
    const imp = clamp(Math.round(impacto || 0), 0, 100);
    const fatalGaps = Math.max(0, Math.round(gapsFatals || 0));
    const mediumGaps = Math.max(0, Math.round(gapsMediums || 0));

    const breakdown: ScoreBreakdownItem[] = [];

    // Calcular déficits
    const atsDeficit = 100 - ats;
    const kwDeficit = 100 - kw;
    const impDeficit = 100 - imp;

    // 1. Bônus por gaps críticos
    if (fatalGaps > 0) {
        const gapPoints = fatalGaps * 8;
        breakdown.push({
            label: "Problemas críticos corrigidos",
            points: gapPoints,
            description: `${fatalGaps} problema${fatalGaps > 1 ? 's' : ''} crítico${fatalGaps > 1 ? 's' : ''} identificado${fatalGaps > 1 ? 's' : ''}`
        });
    }

    // 2. Bônus por gaps médios
    if (mediumGaps > 0) {
        const mediumPoints = mediumGaps * 4;
        breakdown.push({
            label: "Problemas médios corrigidos",
            points: mediumPoints,
            description: `${mediumGaps} problema${mediumGaps > 1 ? 's' : ''} médio${mediumGaps > 1 ? 's' : ''}`
        });
    }

    // 3. Bônus por formato ATS
    if (atsDeficit >= 25) {
        const atsPoints = atsDeficit >= 40 ? 10 : 6;
        breakdown.push({
            label: "Formato ATS otimizado",
            points: atsPoints,
            description: `Formatação atual: ${ats}%`
        });
    }

    // 4. Bônus por palavras-chave
    if (kwDeficit >= 25) {
        const kwPoints = kwDeficit >= 40 ? 8 : 5;
        breakdown.push({
            label: "Palavras-chave estratégicas",
            points: kwPoints,
            description: `Cobertura atual: ${kw}%`
        });
    }

    // 5. Bônus por impacto
    if (impDeficit >= 25) {
        const impPoints = impDeficit >= 40 ? 6 : 3;
        breakdown.push({
            label: "Resultados quantificados",
            points: impPoints,
            description: `Impacto atual: ${imp}%`
        });
    }

    // 6. Ganho base garantido (se não houver outros bônus significativos)
    if (breakdown.length === 0 || breakdown.reduce((sum, item) => sum + item.points, 0) < 10) {
        let minGuaranteedGain = 15;
        if (current < 30) minGuaranteedGain = 25;
        else if (current < 50) minGuaranteedGain = 20;
        else if (current < 70) minGuaranteedGain = 15;
        else if (current < 85) minGuaranteedGain = 10;
        else minGuaranteedGain = 5;

        breakdown.push({
            label: "Otimizações gerais",
            points: minGuaranteedGain,
            description: "Estrutura e conteúdo"
        });
    }

    return breakdown;
}

export function calculateProjectedScore(
    currentScore: number,
    gapsFatals: number = 0,
    gapsMediums: number = 0,
    formatoAts: number = 0,
    keywords: number = 0,
    impacto: number = 0
): { score: number; improvement: number; percentile: string; reasoning: string; breakdown: ScoreBreakdownItem[] } {
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

    // Calcular breakdown detalhado
    let breakdown = calculateScoreBreakdown(
        currentScore,
        gapsFatals,
        gapsMediums,
        formatoAts,
        keywords,
        impacto
    );

    // AJUSTE CRÍTICO: Se o teto foi aplicado, precisamos ajustar o breakdown
    const rawTotal = breakdown.reduce((sum, item) => sum + item.points, 0);
    if (rawTotal !== improvement && breakdown.length > 0) {
        // Aplicar fator de ajuste proporcional a todos os itens
        const adjustmentFactor = improvement / rawTotal;
        breakdown = breakdown.map(item => ({
            ...item,
            points: Math.round(item.points * adjustmentFactor)
        }));

        // Corrigir arredondamento: ajustar o maior item para bater exato
        const adjustedTotal = breakdown.reduce((sum, item) => sum + item.points, 0);
        if (adjustedTotal !== improvement) {
            const diff = improvement - adjustedTotal;
            const largestIndex = breakdown.reduce((maxIdx, item, idx, arr) =>
                item.points > arr[maxIdx].points ? idx : maxIdx, 0);
            breakdown[largestIndex].points += diff;
        }
    }

    return {
        score: projectedScore,
        improvement,
        percentile,
        reasoning,
        breakdown
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
