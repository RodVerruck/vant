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
