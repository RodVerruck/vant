"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppStage, PlanType, PreviewData, ReportData, PilaresData, GapFatal, Book, PricesMap, HistoryItem } from "@/types";
import { PaidStage } from "@/components/PaidStage";
import { FreeAnalysisStage } from "@/components/FreeAnalysisStage";
import { AuthModal } from "@/components/AuthModal";
import { HistoryStage } from "@/components/HistoryStage";
import { PricingSimplified } from "@/components/PricingSimplified";
import { NeonOffer } from "@/components/NeonOffer";
import { NewOptimizationModal } from "@/components/NewOptimizationModal";
import { HeroHeader } from "@/components/sections/HeroHeader";
import { ValueProp } from "@/components/sections/ValueProp";
import { AnalysisCard } from "@/components/sections/AnalysisCard";
import { TrustBar } from "@/components/sections/TrustBar";
import { calcPotencial, calculateProjectedScore } from "@/lib/helpers";
import { getSupabaseClient } from "@/lib/supabaseClient";
import {
    HERO_HEADER_HTML,
    TRUST_BAR_HTML,
    VALUE_PROP_HTML,
    ANALYSIS_CARD_HTML,
    LINKEDIN_INSTRUCTIONS_HTML
} from "@/components/StaticContent";

type JsonObject = Record<string, unknown>;

// Helper para garantir compatibilidade com navegadores que não suportam AbortSignal.timeout
function getSafeSignal(ms: number): AbortSignal {
    if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
        return AbortSignal.timeout(ms);
    }
    // Fallback manual
    const controller = new AbortController();
    setTimeout(() => controller.abort(), ms);
    return controller.signal;
}

function CheckCircle2Icon({ color = "#9CA3AF", size = 16 }: { color?: string; size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
            <path d="M9 12l2 2 4-4" />
            <circle cx="12" cy="12" r="9" />
        </svg>
    );
}

function AlertCircleIcon({ color = "#9CA3AF", size = 16 }: { color?: string; size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="9" />
            <line x1="12" y1="8" x2="12" y2="13" />
            <circle cx="12" cy="16" r="1" />
        </svg>
    );
}

function LockIcon({ color = "#9CA3AF", size = 16 }: { color?: string; size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
            <rect x="3" y="11" width="18" height="10" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
    );
}

function FileTextIcon({ color = "#9CA3AF", size = 16 }: { color?: string; size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M14 2v6h6" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <line x1="10" y1="9" x2="8" y2="9" />
        </svg>
    );
}

// IndexedDB helpers for file storage (localStorage has 5MB limit, IndexedDB doesn't)
const IDB_NAME = "vant_files";
const IDB_STORE = "files";

function openIDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(IDB_NAME, 1);
        req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function saveFileToIDB(file: File): Promise<void> {
    const db = await openIDB();
    const tx = db.transaction(IDB_STORE, "readwrite");
    tx.objectStore(IDB_STORE).put({ blob: file, name: file.name, type: file.type }, "pending_cv");
    return new Promise((resolve, reject) => {
        tx.oncomplete = () => { db.close(); resolve(); };
        tx.onerror = () => { db.close(); reject(tx.error); };
    });
}

async function getFileFromIDB(): Promise<File | null> {
    try {
        const db = await openIDB();
        const tx = db.transaction(IDB_STORE, "readonly");
        const req = tx.objectStore(IDB_STORE).get("pending_cv");
        return new Promise((resolve) => {
            req.onsuccess = () => {
                db.close();
                const data = req.result;
                if (data?.blob) {
                    resolve(new File([data.blob], data.name || "cv.pdf", { type: data.type || "application/pdf" }));
                } else {
                    resolve(null);
                }
            };
            req.onerror = () => { db.close(); resolve(null); };
        });
    } catch { return null; }
}

async function clearFileFromIDB(): Promise<void> {
    try {
        const db = await openIDB();
        const tx = db.transaction(IDB_STORE, "readwrite");
        tx.objectStore(IDB_STORE).delete("pending_cv");
        return new Promise((resolve) => {
            tx.oncomplete = () => { db.close(); resolve(); };
            tx.onerror = () => { db.close(); resolve(); };
        });
    } catch { /* ignore */ }
}

// Detecta se está em desenvolvimento (localhost) e usa backend local
// Chamada em cada requisição para garantir que window existe
function getApiUrl(): string {
    if (typeof window !== "undefined") {
        const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
        if (isLocalhost) {
            console.log("[getApiUrl] Ambiente LOCAL detectado, usando http://127.0.0.1:8000");
            return "http://127.0.0.1:8000";
        }
    }
    const url = process.env.NEXT_PUBLIC_API_URL || "https://vant-vlgn.onrender.com";
    console.log("[getApiUrl] Ambiente PRODUÇÃO, usando", url);
    return url;
}

// V3 Layout: Split into separate sections for above-the-fold CRO optimization
// HTML constants moved to src/components/StaticContent.ts for better maintainability
const USE_JSX_SECTIONS = process.env.NEXT_PUBLIC_USE_JSX_SECTIONS === "true";





function calculateDynamicCvCount(): number {
    const now = new Date();
    const baseCount = 12;
    const ratePerHour = 14;
    const currentCount = baseCount + now.getHours() * ratePerHour + Math.floor(now.getMinutes() / 4);
    const daySeed = now.getDate() * 3;
    return currentCount + daySeed;
}

// Função auxiliar para polling do progressive loading
async function pollAnalysisProgress(
    sessionId: string,
    updateStatus: (text: string, percent: number) => Promise<void>,
    setReportData: (data: any) => void,
    setStage: (stage: AppStage) => void,
    setCreditsRemaining: (credits: number) => void,
    abortSignal?: AbortSignal
) {
    const apiUrl = getApiUrl();
    const maxAttempts = 60; // ~2.5 minutos com polling a cada 2.5s
    let attempts = 0;

    while (attempts < maxAttempts) {
        // Verificar se o polling foi cancelado
        if (abortSignal?.aborted) {
            console.log("[Polling] Interrompido pelo usuário");
            return;
        }

        try {
            const response = await fetch(`${apiUrl}/api/analysis/status/${sessionId}`, {
                signal: abortSignal
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${data.error || 'Erro desconhecido'}`);
            }

            const { status, current_step, result_data } = data;

            console.log(`[Polling] Status: ${status}, Step: ${current_step}`);

            // Atualizar UI baseado no step
            switch (current_step) {
                case 'starting':
                    await updateStatus("🔒 PAGAMENTO VERIFICADO. INICIANDO IA GENERATIVA...", 10);
                    break;
                case 'extracting_text':
                    await updateStatus("📄 EXTRAINDO TEXTO DO PDF...", 15);
                    break;
                case 'diagnostico_pronto':
                    await updateStatus("🔍 DIAGNÓSTICO CONCLUÍDO!", 25);
                    // Mostrar diagnóstico parcial e mudar para paid
                    if (result_data && typeof result_data === 'object') {
                        console.log("[Polling] Atualizando com diagnóstico parcial:", result_data);
                        setReportData(result_data);
                        setStage("paid"); // Mudar para paid para mostrar resultados
                    }
                    break;
                case 'cv_pronto':
                    await updateStatus("✍️ CV OTIMIZADO PRONTO!", 50);
                    // Adicionar CV otimizado aos dados existentes
                    if (result_data && typeof result_data === 'object') {
                        console.log("[Polling] Atualizando com CV parcial:", result_data);
                        setReportData((prev: any) => ({ ...prev, ...result_data }));
                    }
                    break;
                case 'library_pronta':
                    await updateStatus("📚 BIBLIOTECA PRONTA!", 75);
                    // Adicionar biblioteca aos dados existentes
                    if (result_data && typeof result_data === 'object') {
                        console.log("[Polling] Atualizando com biblioteca parcial:", result_data);
                        setReportData((prev: any) => ({ ...prev, ...result_data }));
                    }
                    break;
                case 'tactical_pronto':
                    await updateStatus("🎯 ESTRATÉGIAS PRONTAS!", 85);
                    // Adicionar tactical aos dados existentes
                    if (result_data && typeof result_data === 'object') {
                        console.log("[Polling] Atualizando com tactical parcial:", result_data);
                        setReportData((prev: any) => ({ ...prev, ...result_data }));
                    }
                    break;
                case 'completed':
                    await updateStatus("🎉 ANÁLISE CONCLUÍDA!", 100);
                    // Processar resultado final
                    if (result_data && typeof result_data === 'object') {
                        // Atualizar estado com resultado completo
                        const report = result_data as any;
                        console.log("[Polling] Análise concluída com sucesso:", report);

                        // Atualizar estado do frontend com os dados completos
                        setReportData(report);
                        setStage("paid");

                        // Atualizar créditos se disponível
                        if (report.credits_remaining !== undefined) {
                            setCreditsRemaining(report.credits_remaining);
                        }
                    }
                    return;
                case 'failed':
                    throw new Error(result_data?.error || 'Falha no processamento');
            }

            // Esperar antes do próximo polling (respeitando abort)
            await new Promise((resolve, reject) => {
                const timeoutId = setTimeout(resolve, 2500);

                if (abortSignal) {
                    abortSignal.addEventListener('abort', () => {
                        clearTimeout(timeoutId);
                        reject(new DOMException('Polling abortado', 'AbortError'));
                    }, { once: true });
                }
            });
            attempts++;

        } catch (error) {
            // Se foi abortado, não tratar como erro
            if (error instanceof DOMException && error.name === 'AbortError') {
                console.log("[Polling] Abortado silenciosamente");
                return;
            }

            console.error("[Polling] Erro:", error);
            throw error;
        }
    }

    throw new Error('Timeout: Análise demorou mais de 2 minutos');
}

export default function AppPage() {
    // AbortController para cancelar requisições ao navegar
    const abortControllerRef = useRef<AbortController | null>(null);
    const isPollingActive = useRef(false);
    const smartRedirectHandledRef = useRef(false);
    const storageHydratedRef = useRef(false);

    // Estados principais
    const [stage, setStage] = useState<AppStage>("hero");
    // Flag para evitar flicker ao verificar autenticação/redirecionamento
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    // Flag para evitar flash do hero ao abrir item do histórico vindo do Dashboard
    const [loadingHistoryItem, setLoadingHistoryItem] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<PlanType>("credit_1");
    const [jobDescription, setJobDescription] = useState("");
    const [useGenericJob, setUseGenericJob] = useState(false);
    const [selectedArea, setSelectedArea] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [competitorFiles, setCompetitorFiles] = useState<File[]>([]);

    const [authEmail, setAuthEmail] = useState("");
    const [authPassword, setAuthPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [authUserId, setAuthUserId] = useState<string | null>(null);
    const [stripeSessionId, setStripeSessionId] = useState<string | null>(null);
    const [checkoutError, setCheckoutError] = useState<string | null>(null);
    const [showProCreditNotice, setShowProCreditNotice] = useState(false);
    const [showUseCreditPrompt, setShowUseCreditPrompt] = useState(false);
    const [creditsRemaining, setCreditsRemaining] = useState(0);
    const [creditsLoading, setCreditsLoading] = useState(false);
    const [needsActivation, setNeedsActivation] = useState(false);
    const [isActivating, setIsActivating] = useState(false);
    const [isLoginMode, setIsLoginMode] = useState(true);  // ← NOVO (true = login, false = cadastro)
    const [isAuthenticating, setIsAuthenticating] = useState(false);  // ← NOVO
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [showNewOptimizationModal, setShowNewOptimizationModal] = useState(false);
    const [lastCVData, setLastCVData] = useState<{
        has_last_cv: boolean;
        filename?: string;
        time_ago?: string;
        is_recent?: boolean;
        analysis_id?: string;
        job_description?: string;
    } | null>(null);
    const [timeRemaining, setTimeRemaining] = useState({ hours: 23, minutes: 45, seconds: 12 });
    const [emailSent, setEmailSent] = useState(false);
    const [resendCountdown, setResendCountdown] = useState(0);

    // Cleanup ao desmontar componente
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    // Cancelar polling quando o usuário navegar para outra tela durante processamento
    // useEffect para cancelar polling premium apenas
    useEffect(() => {
        // Se não está mais em processing_premium, cancelar polling ativo
        // EXCETO quando está mudando para paid no fluxo normal (diagnostico_pronto)
        if (stage !== "processing_premium" && stage !== "paid" && abortControllerRef.current && isPollingActive.current) {
            console.log("[Polling] Cancelado por mudança de stage");
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
            isPollingActive.current = false;
        }
    }, [stage]);



    // Estados de processamento
    const [progress, setProgress] = useState(0);
    const [statusText, setStatusText] = useState("");
    const [apiError, setApiError] = useState("");
    const [previewData, setPreviewData] = useState<PreviewData | null>(null);
    const [reportData, setReportData] = useState<ReportData | null>(null);
    const [selectedHistoryItem, setSelectedHistoryItem] = useState<HistoryItem | null>(null);
    const [premiumError, setPremiumError] = useState("");
    const [isRestoringData, setIsRestoringData] = useState(false);
    const [pdfMetadata, setPdfMetadata] = useState<{ pages?: number; text?: string; candidateName?: string } | null>(null);
    const [processingStartTime] = useState(Date.now());
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState(60); // segundos
    const [sessionId, setSessionId] = useState<string | null>(null); // ← Progressive loading
    const ANALYZING_TOTAL_MS = 8000; // 8 segundos até 90%
    const ANALYZING_PHASE_1_MS = 2666; // 33.3% do tempo (0-35% progresso)
    const ANALYZING_PHASE_2_MS = 2667; // 33.3% do tempo (35-75% progresso)

    function getAnalyzingPhaseByElapsed(elapsedMs: number): 1 | 2 | 3 {
        if (elapsedMs < ANALYZING_PHASE_1_MS) return 1;
        if (elapsedMs < ANALYZING_PHASE_1_MS + ANALYZING_PHASE_2_MS) return 2;
        return 3;
    }

    function getAnalyzingProgressByElapsed(elapsedMs: number): number {
        if (elapsedMs <= ANALYZING_PHASE_1_MS) {
            return (elapsedMs / ANALYZING_PHASE_1_MS) * 35;
        }

        const phase2Start = ANALYZING_PHASE_1_MS;
        const phase2End = ANALYZING_PHASE_1_MS + ANALYZING_PHASE_2_MS;
        if (elapsedMs <= phase2End) {
            return 35 + ((elapsedMs - phase2Start) / ANALYZING_PHASE_2_MS) * 40;
        }

        const phase3Duration = ANALYZING_TOTAL_MS - phase2End;
        return Math.min(100, 75 + ((elapsedMs - phase2End) / phase3Duration) * 25);
    }

    // Mensagens dinâmicas para o processamento premium
    const premiumMessages = [
        "Conectando aos servidores de IA...",
        "Analisando estrutura do CV...",
        "Identificando palavras-chave da vaga...",
        "Comparando com padrões de mercado...",
        "Otimizando semântica e impacto...",
        "Reestruturando experiências profissionais...",
        "Gerando headline para LinkedIn...",
        "Criando biblioteca técnica personalizada...",
        "Desenvolvendo projeto prático de diferencial...",
        "Finalizando dossiê profissional...",
        "Preparando entrega dos resultados..."
    ];

    // Mensagem de loading simples - sem barra de progresso inconsistente
    useEffect(() => {
        if (stage !== "processing_premium") return;
        setStatusText("Iniciando análise...");
    }, [stage]);

    const uploaderInputRef = useRef<HTMLInputElement | null>(null);
    const competitorUploaderInputRef = useRef<HTMLInputElement | null>(null);

    type PreviewSnapshot = {
        jobDescription?: string;
        previewData?: PreviewData;
        useGenericJob?: boolean;
        selectedArea?: string;
        selectedPlan?: PlanType;
        fileName?: string;
        fileType?: string;
        fileB64?: string;
        cvTextPreextracted?: string;
        createdAt?: number;
    };

    const parsePreviewSnapshot = (): PreviewSnapshot | null => {
        if (typeof window === "undefined") return null;
        const raw = localStorage.getItem("vant_preview_snapshot");
        if (!raw) return null;
        try {
            const parsed = JSON.parse(raw) as PreviewSnapshot;
            return parsed && typeof parsed === "object" ? parsed : null;
        } catch (error) {
            console.warn("[Smart Redirect] Snapshot inválido, ignorando:", error);
            return null;
        }
    };

    const restorePendingAnalysisFromSnapshot = async (snapshot: PreviewSnapshot): Promise<boolean> => {
        const storageJob = localStorage.getItem("vant_jobDescription") || "";
        const storageFileName = localStorage.getItem("vant_file_name") || "";
        const storageFileType = localStorage.getItem("vant_file_type") || "";
        const storageFileB64 = localStorage.getItem("vant_file_b64") || "";

        const finalJob = (snapshot.jobDescription || storageJob || "").trim();
        if (!finalJob) {
            console.warn("[Smart Redirect] Snapshot sem job_description válido.");
            return false;
        }

        if (finalJob !== jobDescription) {
            setJobDescription(finalJob);
            localStorage.setItem("vant_jobDescription", finalJob);
        }

        if (!previewData && snapshot.previewData && typeof snapshot.previewData === "object") {
            setPreviewData(snapshot.previewData);
        }

        if (typeof snapshot.useGenericJob === "boolean") {
            setUseGenericJob(snapshot.useGenericJob);
            localStorage.setItem("vant_use_generic_job", String(snapshot.useGenericJob));
        }

        if (typeof snapshot.selectedArea === "string") {
            setSelectedArea(snapshot.selectedArea);
            localStorage.setItem("vant_area_of_interest", snapshot.selectedArea);
        }

        if (snapshot.cvTextPreextracted && snapshot.cvTextPreextracted.trim()) {
            const fallbackName = snapshot.fileName || storageFileName || "cv.pdf";
            localStorage.setItem("vant_cv_text_preextracted", snapshot.cvTextPreextracted);
            localStorage.setItem("vant_file_name", fallbackName);
            localStorage.setItem("vant_file_type", "text/plain");
            if (!file) {
                setFile(new File(["placeholder"], fallbackName, { type: "text/plain" }));
            }
            return true;
        }

        if (file) return true;

        const finalFileName = snapshot.fileName || storageFileName;
        const finalFileType = snapshot.fileType || storageFileType || "application/pdf";
        const finalFileB64 = snapshot.fileB64 || storageFileB64;

        if (!finalFileName || !finalFileB64) {
            console.warn("[Smart Redirect] Snapshot sem arquivo restaurável.");
            return false;
        }

        try {
            const blob = await fetch(finalFileB64).then((res) => res.blob());
            const restoredFile = new File([blob], finalFileName, { type: finalFileType });
            setFile(restoredFile);
            localStorage.setItem("vant_file_name", finalFileName);
            localStorage.setItem("vant_file_type", finalFileType);
            localStorage.setItem("vant_file_b64", finalFileB64);
            return true;
        } catch (error) {
            console.error("[Smart Redirect] Falha ao restaurar arquivo do snapshot:", error);
            return false;
        }
    };

    const supabase = useMemo((): SupabaseClient | null => getSupabaseClient(), []);

    // Hook do Next.js para capturar parâmetros da URL de forma robusta
    const searchParams = useSearchParams();

    // Carregar estado do localStorage após montagem no cliente (evitar problemas de hidratação)
    useEffect(() => {
        // Verificar se há item do histórico para carregar do Dashboard
        if (localStorage.getItem("vant_dashboard_open_history_id")) {
            setLoadingHistoryItem(true);
        }
    }, []);

    // NOVO: useEffect dedicado para capturar parâmetros do Stripe via useSearchParams
    // Isso é mais robusto que window.location no Next.js App Router
    useEffect(() => {
        const payment = searchParams.get("payment");
        const sessionId = searchParams.get("session_id");

        console.log("[DEBUG URL - useSearchParams] Params encontrados:", { payment, sessionId: sessionId?.slice(0, 20) });

        if (payment === "success" && sessionId) {
            console.log("[DEBUG URL] Pagamento detectado! Setando estado...");
            setStripeSessionId(sessionId);
            setNeedsActivation(true);
            setStage("activating_payment");
            setIsCheckingAuth(false); // Liberar renderização imediatamente para mostrar loading
            setCheckoutError("Pagamento confirmado. Ativando seu plano...");
        }
    }, [searchParams]);

    function getErrorMessage(e: unknown, fallback: string): string {
        // Ignorar AbortError (cancelamento intencional)
        if (e instanceof Error && e.name === 'AbortError') {
            console.log('Requisição cancelada pelo usuário');
            return '';
        }

        if (e instanceof Error && e.message) {
            return String(e.message);
        }
        if (typeof e === "string" && e.trim()) {
            return e;
        }
        return fallback;
    }

    // Função para abrir o Stripe Customer Portal
    const openCustomerPortal = async () => {
        if (!authUserId) {
            console.error('Usuário não autenticado');
            return;
        }

        try {
            const response = await fetch(`${getApiUrl()}/api/stripe/create-portal-session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ user_id: authUserId }),
            });

            if (!response.ok) {
                const error = await response.json();
                console.error('Erro ao criar portal session:', error);
                alert('Não foi possível abrir o portal de gerenciamento. Tente novamente ou entre em contato com o suporte.');
                return;
            }

            const data = await response.json();

            // Redirecionar para o portal do Stripe
            window.location.href = data.portal_url;
        } catch (error) {
            console.error('Erro ao abrir portal:', error);
            alert('Erro ao abrir o portal de gerenciamento. Tente novamente.');
        }
    };

    // Função para extrair metadados do PDF
    async function extractPdfMetadata(file: File): Promise<{ pages?: number; text?: string; candidateName?: string }> {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);
            const text = new TextDecoder('utf-8').decode(uint8Array);

            // Extrair número de páginas procurando por /Type /Page no PDF
            const pageMatches = text.match(/\/Type\s*\/Page[^s]/g);
            const pages = pageMatches ? pageMatches.length : undefined;

            // Extrair texto visível do PDF (entre streams)
            // PDFs armazenam texto em streams BT...ET
            const textStreams: string[] = [];
            const btPattern = /BT\s+([\s\S]*?)\s+ET/g;
            let match;

            while ((match = btPattern.exec(text)) !== null) {
                const streamContent = match[1];
                // Extrair strings entre parênteses ou colchetes
                const strings = streamContent.match(/\((.*?)\)/g);
                if (strings) {
                    strings.forEach(str => {
                        const cleaned = str.replace(/[()]/g, '').trim();
                        if (cleaned.length > 0) {
                            textStreams.push(cleaned);
                        }
                    });
                }
            }

            const extractedText = textStreams.join(' ');

            // Tentar extrair nome do candidato (primeiras palavras capitalizadas)
            let candidateName: string | undefined;
            if (extractedText) {
                // Limpar o texto de caracteres especiais de PDF
                const cleanText = extractedText
                    .replace(/\\[0-9]{3}/g, ' ') // Remove códigos octais
                    .replace(/[^\w\sÀ-ÿ]/g, ' ') // Mantém apenas letras, números e acentos
                    .replace(/\s+/g, ' ') // Normaliza espaços
                    .trim();

                // Procurar por padrões de nome em todo o texto (não só no início)
                const namePatterns = [
                    // Nome completo com 2-4 partes
                    /\b([A-ZÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜ][a-zàáâãäåçèéêëìíîïñòóôõöùúûü]{2,}(?:\s+(?:da|de|do|dos|das|e)\s+|\s+)[A-ZÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜ][a-zàáâãäåçèéêëìíîïñòóôõöùúûü]{2,}(?:\s+(?:da|de|do|dos)\s+[A-ZÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜ][a-zàáâãäåçèéêëìíîïñòóôõöùúûü]{2,})?)\b/,
                    // Nome simples (2 partes)
                    /\b([A-ZÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜ][a-zàáâãäåçèéêëìíîïñòóôõöùúûü]{2,}\s+[A-ZÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜ][a-zàáâãäåçèéêëìíîïñòóôõöùúûü]{2,})\b/
                ];

                // Palavras a ignorar
                const ignoreWords = ['curriculum', 'vitae', 'resume', 'professional', 'profile',
                    'objetivo', 'formacao', 'experiencia', 'habilidades', 'contato',
                    'telefone', 'email', 'endereco', 'linkedin', 'github'];

                for (const pattern of namePatterns) {
                    const matches = cleanText.match(pattern);
                    if (matches) {
                        // Pegar os primeiros matches e validar
                        for (let i = 0; i < Math.min(matches.length, 5); i++) {
                            const potentialName = matches[i]?.trim();
                            if (potentialName && potentialName.length >= 5 && potentialName.length <= 60) {
                                const lowerName = potentialName.toLowerCase();
                                const hasIgnoredWord = ignoreWords.some(word => lowerName.includes(word));

                                if (!hasIgnoredWord) {
                                    candidateName = potentialName;
                                    break;
                                }
                            }
                        }
                        if (candidateName) break;
                    }
                }
            }

            return {
                pages,
                text: extractedText.substring(0, 200),
                candidateName
            };
        } catch (error) {
            console.error("Erro ao extrair metadados do PDF:", error);
            return {};
        }
    }

    // Flag para auto-start vindo do Dashboard modal
    const pendingAutoStart = useRef(false);
    const pendingSkipPreview = useRef(false);
    const userStatusFetched = useRef(false);
    const [hasActiveHistoryFlow, setHasActiveHistoryFlow] = useState(false);

    // Restaurar jobDescription e file do localStorage ao montar
    useEffect(() => {
        if (typeof window !== "undefined") {
            const savedJob = localStorage.getItem("vant_jobDescription");
            const savedFileName = localStorage.getItem("vant_file_name");
            const savedFileType = localStorage.getItem("vant_file_type");
            const savedFileB64 = localStorage.getItem("vant_file_b64");

            // Restaurar flags de vaga genérica (vindas do modal do Dashboard)
            const savedGeneric = localStorage.getItem("vant_use_generic_job");
            const savedArea = localStorage.getItem("vant_area_of_interest");
            if (savedGeneric === "true") {
                setUseGenericJob(true);
                if (savedArea) setSelectedArea(savedArea);
            }

            // Detectar auto-start flag (modal do Dashboard)
            const autoStart = localStorage.getItem("vant_auto_start");
            if (autoStart === "true") {
                pendingAutoStart.current = true;
                localStorage.removeItem("vant_auto_start");
                localStorage.removeItem("vant_use_generic_job");
                localStorage.removeItem("vant_area_of_interest");
            }

            // Só restaurar se for a primeira montagem (estado ainda vazio)
            if (savedJob && jobDescription === "") {
                setJobDescription(savedJob);
            }

            // Verificar se há cv_text pré-extraído (último CV reutilizado do Dashboard)
            const savedCvText = localStorage.getItem("vant_cv_text_preextracted");
            if (savedCvText && savedFileName && !file) {
                // Criar File placeholder para a UI
                const placeholder = new File(["placeholder"], savedFileName, { type: "text/plain" });
                setFile(placeholder);
            } else if (savedFileName && savedFileType && savedFileB64 && !file) {
                fetch(savedFileB64)
                    .then(res => res.blob())
                    .then(blob => {
                        const restoredFile = new File([blob], savedFileName, { type: savedFileType });
                        setFile(restoredFile);
                    });
            }

            storageHydratedRef.current = true;
        }
    }, []); // Removido jobDescription e file das dependências

    // Auto-start: dispara onStart() quando dados estão prontos (vindo do Dashboard modal)
    useEffect(() => {
        if (pendingAutoStart.current && jobDescription.trim() && file && stage === "hero") {
            pendingAutoStart.current = false;

            // Verificar se deve pular preview (vindo do modal do Dashboard)
            const shouldSkip = localStorage.getItem("vant_skip_preview") === "true";
            if (shouldSkip) {
                localStorage.removeItem("vant_skip_preview");
                pendingSkipPreview.current = true;
                console.log("[AutoStart] skipPreview=true, vai pular preview após lite...");
            } else {
                console.log("[AutoStart] Fluxo normal (com preview)...");
            }
            const timer = setTimeout(() => onStart(), 300);
            return () => clearTimeout(timer);
        }
    }, [jobDescription, file, stage]);

    // Salvar jobDescription e file em localStorage quando mudarem
    useEffect(() => {
        if (!storageHydratedRef.current) return;
        if (typeof window !== "undefined") {
            if (jobDescription) {
                localStorage.setItem("vant_jobDescription", jobDescription);
            } else {
                localStorage.removeItem("vant_jobDescription");
            }
        }
    }, [jobDescription]);

    useEffect(() => {
        if (typeof window !== "undefined") {
            if (file) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    localStorage.setItem("vant_file_b64", reader.result as string);
                    localStorage.setItem("vant_file_name", file.name);
                    localStorage.setItem("vant_file_type", file.type);
                };
                reader.readAsDataURL(file);

                // Extrair metadados do PDF
                extractPdfMetadata(file).then(metadata => {
                    setPdfMetadata(metadata);
                });
            } else {
                localStorage.removeItem("vant_file_b64");
                localStorage.removeItem("vant_file_name");
                localStorage.removeItem("vant_file_type");
                setPdfMetadata(null);
            }
        }
    }, [file]);

    // Persistir snapshot do preview para retomada inteligente pós-login
    useEffect(() => {
        if (typeof window === "undefined") return;
        if (stage !== "preview" || !previewData) return;

        const snapshot: PreviewSnapshot = {
            jobDescription,
            previewData,
            useGenericJob,
            selectedArea,
            selectedPlan,
            fileName: file?.name || localStorage.getItem("vant_file_name") || undefined,
            fileType: file?.type || localStorage.getItem("vant_file_type") || undefined,
            fileB64: localStorage.getItem("vant_file_b64") || undefined,
            cvTextPreextracted: localStorage.getItem("vant_cv_text_preextracted") || undefined,
            createdAt: Date.now(),
        };

        localStorage.setItem("vant_preview_snapshot", JSON.stringify(snapshot));
    }, [stage, previewData, jobDescription, useGenericJob, selectedArea, selectedPlan, file]);

    const trustFooterHtml = useMemo(() => {
        const cvCount = calculateDynamicCvCount();
        return `
    <style>
        @keyframes pulse-animation {
            0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
            70% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
            100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
        .live-dot {
            width: 8px;
            height: 8px;
            background-color: #10B981;
            border-radius: 50%;
            display: inline-block;
            margin-right: 6px;
            animation: pulse-animation 2s infinite;
        }
    </style>

    <div class="trust-footer">
        <div class="footer-stat">
            <div class="live-dot"></div>
            <span><strong>${cvCount}</strong> CVs Otimizados Hoje</span>
        </div>

        <div style="width: 1px; height: 15px; background: rgba(255,255,255,0.1); display: inline-block;"></div>

        <div class="footer-stat">
            <span class="footer-icon">📈</span>
            <span>+34% Score Médio</span>
        </div>

        <div style="width: 1px; height: 15px; background: rgba(255,255,255,0.1); display: inline-block;"></div>

        <div class="footer-stat">
            <span class="footer-icon">🤖</span>
            <span>50k+ Padrões Analisados</span>
        </div>
    </div>
    `;
    }, []);

    // Timer de urgência
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeRemaining(prev => {
                let { hours, minutes, seconds } = prev;

                if (seconds > 0) {
                    seconds--;
                } else if (minutes > 0) {
                    minutes--;
                    seconds = 59;
                } else if (hours > 0) {
                    hours--;
                    minutes = 59;
                    seconds = 59;
                } else {
                    hours = 23;
                    minutes = 59;
                    seconds = 59;
                }

                return { hours, minutes, seconds };
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        console.log("[useEffect URL params] Rodou.");
        if (typeof window === "undefined") {
            return;
        }

        const initSession = async () => {
            if (!supabase) {
                return;
            }

            // Verificação de tipo explícita para evitar never
            const client = supabase as SupabaseClient;

            const { data } = await client.auth.getSession();
            const session = data?.session;
            const user = session?.user;
            if (user?.id) {
                setAuthUserId(user.id);
                if (user.email) {
                    setAuthEmail(user.email);
                }
            }
        };

        initSession();

        // Adicionar listener para mudanças de autenticação em tempo real
        if (supabase) {
            // Verificação de tipo explícita para evitar never
            const client = supabase as SupabaseClient;

            const { data: { subscription } } = client.auth.onAuthStateChange(
                (event, session) => {
                    console.log("[AuthStateChange] Event:", event, "User:", session?.user?.email);

                    if (event === 'SIGNED_IN' && session?.user) {
                        setAuthUserId(session.user.id);
                        setAuthEmail(session.user.email || "");
                        setCheckoutError("");
                        userStatusFetched.current = false; // Resetar para permitir nova chamada

                        // Cache imediato de créditos para resposta instantânea
                        const cachedCredits = localStorage.getItem('vant_cached_credits');
                        if (cachedCredits) {
                            const credits = parseInt(cachedCredits);
                            setCreditsRemaining(credits);
                            console.log("[AuthStateChange] Usando cache de créditos:", credits);
                        } else {
                            setCreditsLoading(true);
                            console.log("[AuthStateChange] Sem cache, carregando créditos...");
                        }
                    } else if (event === 'SIGNED_OUT') {
                        setAuthUserId(null);
                        setAuthEmail("");
                        setCreditsRemaining(0);
                        setCreditsLoading(false);
                        smartRedirectHandledRef.current = false;
                        userStatusFetched.current = false; // Resetar ref no logout
                        // Limpar cache ao fazer logout
                        localStorage.removeItem('vant_cached_credits');
                        // Resetar estado de ativação ao fazer logout
                        activationAttempted.current = false;
                    }
                }
            );

            // Cleanup do listener ao desmontar
            return () => subscription.unsubscribe();
        }

        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        const payment = url.searchParams.get("payment");
        const sessionId = url.searchParams.get("session_id") || "";

        if (code) {
            (async () => {
                if (!supabase) return;

                // Verificação de tipo explícita para evitar never
                const client = supabase as SupabaseClient;

                try {
                    const { data, error } = await client.auth.exchangeCodeForSession(code);
                    if (error) {
                        // Ignora erro se for "code already used" em dev, pois o usuário pode já estar logado
                        console.warn("Erro na troca de código (possível duplicidade em dev):", error.message);
                        // throw new Error(error.message); // <-- Comente ou remova o throw para não travar a UI
                    }

                    const user = data?.session?.user;
                    if (user?.id) {
                        setAuthUserId(user.id);
                        if (user.email) {
                            setAuthEmail(user.email);
                        }
                        setCheckoutError("");

                        // A restauração agora é feita pelo novo useEffect
                    }
                } catch (e: unknown) {
                    setCheckoutError(getErrorMessage(e, "Falha ao fazer login com Google"));
                }
            })();
            url.searchParams.delete("code");
            window.history.replaceState({}, "", url.toString());
        }

        // Verificar se há sessão pendente de ativação
        const pendingSid = window.localStorage.getItem("vant_pending_stripe_session_id") || "";
        if (pendingSid && authUserId) {
            // Se tem sessão pendente E usuário logado, ativar via useEffect needsActivation
            setStripeSessionId(pendingSid);
            setNeedsActivation(true);
        } else if (pendingSid && !authUserId) {
            // Se tem sessão pendente mas SEM usuário, abrir modal de auth
            setStripeSessionId(pendingSid);
            setNeedsActivation(true);
            setShowAuthModal(true);
            setCheckoutError("✅ Pagamento confirmado! Crie sua conta para acessar seus créditos.");
        }

        // Retorno do Stripe após pagamento
        if (payment === "success" && sessionId) {
            setStage("checkout");
            setCheckoutError("");

            (async () => {
                try {
                    const resp = await fetch(`${getApiUrl()}/api/stripe/verify-checkout-session`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ session_id: sessionId }),
                    });

                    const payload = (await resp.json()) as JsonObject;
                    if (!resp.ok) {
                        const err = typeof payload.error === "string" ? payload.error : `HTTP ${resp.status} `;
                        throw new Error(err);
                    }

                    if (payload.paid === true) {
                        if (typeof payload.plan_id === "string") {
                            setSelectedPlan(payload.plan_id as PlanType);
                        }

                        // Salvar sessão e delegar ativação para useEffect needsActivation
                        setStripeSessionId(sessionId);

                        if (!authUserId) {
                            // Sem usuário: salvar sessão e abrir modal de auth para vincular créditos
                            window.localStorage.setItem("vant_pending_stripe_session_id", sessionId);
                            setNeedsActivation(true);
                            setShowAuthModal(true);
                            setCheckoutError("✅ Pagamento confirmado! Crie sua conta para acessar seus créditos.");
                        } else {
                            // Com usuário: ativar imediatamente via useEffect
                            setNeedsActivation(true);
                        }
                    } else {
                        setCheckoutError("Pagamento não confirmado ainda. Tente novamente em alguns segundos.");
                    }
                } catch (e: unknown) {
                    setCheckoutError(getErrorMessage(e, "Falha ao validar pagamento"));
                }
            })();

            url.searchParams.delete("payment");
            url.searchParams.delete("session_id");
            window.history.replaceState({}, "", url.toString());
        }

        if (payment === "cancel") {
            setCheckoutError("Pagamento cancelado.");
            setStage("preview");
            url.searchParams.delete("payment");
            window.history.replaceState({}, "", url.toString());
        }
    }, [authUserId, supabase]);

    // NOVO: useEffect dedicado para restaurar o estado após login (Google/Email)
    // Isso funciona independente se o exchangeCode falhar no Strict Mode
    useEffect(() => {
        if (!authUserId || typeof window === "undefined") return;
        if (userStatusFetched.current) return; // Evitar chamadas duplicadas

        console.log("[UserStatus] Iniciando busca de status para usuário:", authUserId);
        console.log("[UserStatus] userStatusFetched.current:", userStatusFetched.current);

        // Abortar Smart Redirect se estivermos processando um cancelamento de pagamento
        // Isso evita que o usuário seja jogado de volta para o checkout
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get("payment") === "cancel") {
            console.log("[Smart Redirect] Pagamento cancelado detectado, abortando redirecionamento automático.");
            return;
        }

        userStatusFetched.current = true; // Marcar que já buscou

        (async () => {
            const returnStage = localStorage.getItem("vant_auth_return_stage");
            let returnPlan = localStorage.getItem("vant_auth_return_plan");
            const previewSnapshot = parsePreviewSnapshot();
            const isEligibleSmartRedirectStage = stage === "hero" || stage === "checkout" || showAuthModal;

            // Smart Redirect: intenção de análise pendente após login
            // Só ativar se não houver fluxo ativo (sem jobDescription e file)
            if (!smartRedirectHandledRef.current && isEligibleSmartRedirectStage && !needsActivation && previewSnapshot && !jobDescription.trim() && !file) {
                smartRedirectHandledRef.current = true;

                const restored = await restorePendingAnalysisFromSnapshot(previewSnapshot);
                if (!restored) {
                    console.warn("[Smart Redirect] Snapshot encontrado, mas dados incompletos. Mantendo fluxo padrão.");
                } else {
                    // Buscar créditos com cache primeiro, mas sempre confirmar plano ativo via API
                    let credits = 0;
                    const cachedCredits = localStorage.getItem('vant_cached_credits');
                    if (cachedCredits) {
                        credits = parseInt(cachedCredits, 10) || 0;
                    }

                    let hasPlan = false;
                    try {
                        const resp = await fetch(`${getApiUrl()}/api/user/status/${authUserId}`, {
                            signal: getSafeSignal(10000), // 10s timeout
                        });
                        if (resp.ok) {
                            const data = await resp.json();
                            credits = Number(data.credits_remaining || 0);
                            hasPlan = !!data.plan; // Verificar se tem plano ativo (trial, pro, etc)
                            localStorage.setItem('vant_cached_credits', String(credits));
                            if (data.plan) {
                                localStorage.setItem('vant_cached_plan', String(data.plan));
                            } else {
                                localStorage.removeItem('vant_cached_plan');
                            }
                        } else {
                            console.warn("[Smart Redirect] API respondeu com status:", resp.status);
                        }
                    } catch (error) {
                        console.warn("[Smart Redirect] Falha ao buscar créditos/plano via API:", error);
                        hasPlan = !!localStorage.getItem('vant_cached_plan');
                    }

                    setCreditsRemaining(credits);
                    setShowAuthModal(false);
                    setApiError("");
                    setPremiumError("");
                    setCheckoutError("");

                    // Usuário é premium se tem créditos OU tem plano ativo (mesmo com 0 créditos no período)
                    if (credits > 0 || hasPlan) {
                        if (credits > 0) {
                            setSelectedPlan("pro_monthly_early_bird");
                            console.log("[Smart Redirect] Usuário Pro detectado com análise pendente. Solicitando confirmação para usar crédito.");
                            setShowUseCreditPrompt(true);
                            setStage("checkout");
                        } else {
                            setSelectedPlan("credit_1");
                            console.log("[Smart Redirect] Usuário com assinatura ativa mas sem créditos disponíveis no período. Indo para checkout de crédito avulso.");
                            setCheckoutError("Você já é usuário Pro! Como não há créditos disponíveis no período, mudamos para a compra de Crédito Avulso para você usar agora.");
                            setShowProCreditNotice(true);
                            setStage("checkout");
                        }
                    } else {
                        if (previewSnapshot.selectedPlan) {
                            const raw = previewSnapshot.selectedPlan as string;
                            const normalizedPlan = raw === "basico"
                                ? "credit_1"
                                : raw === "premium_plus"
                                    ? "pro_monthly_early_bird"
                                    : raw;
                            setSelectedPlan(normalizedPlan as PlanType);
                        }
                        console.log("[Smart Redirect] Usuário Free detectado com análise pendente. Enviando para checkout...");
                        setStage("checkout");
                    }
                    return;
                }
            }

            // CRITICAL: Se returnStage é "hero" ou ausente, qualquer returnPlan é stale
            // (o usuário estava no hero, não num fluxo de checkout real)
            if (!returnStage || returnStage === "hero") {
                if (returnPlan) {
                    console.log("[Auth] Limpando returnPlan stale (stage era hero):", returnPlan);
                    localStorage.removeItem("vant_auth_return_plan");
                    returnPlan = null;
                }
                localStorage.removeItem("vant_auth_return_stage");
            }

            // Verificar se há fluxo ativo que impede redirect ao Dashboard
            // Verificar também se há historyId na URL (vindo do dashboard)
            const urlHistoryId = searchParams.get('historyId');
            const localHistoryId = localStorage.getItem("vant_dashboard_open_history_id");
            const historyId = urlHistoryId || localHistoryId;

            if (!historyId) return;

            // Limpar flag imediatamente para evitar loop
            localStorage.removeItem("vant_dashboard_open_history_id");

            // Marcar que temos fluxo de histórico ativo
            setHasActiveHistoryFlow(true);
            setLoadingHistoryItem(true);

            console.log("[Dashboard→App] Abrindo item do histórico:", historyId, "(via URL:", !!urlHistoryId, ")");

            (async () => {
                try {
                    const response = await fetch(`${getApiUrl()}/api/user/history/detail?id=${historyId}`, {
                        signal: getSafeSignal(15000), // 15s timeout
                    });
                    if (!response.ok) throw new Error(`Erro ${response.status}`);

                    const fullResult = await response.json();
                    if (fullResult.data) {
                        const fullData = fullResult.data as ReportData;
                        setReportData(fullData);
                        setPreviewData((fullData as unknown as { preview_data?: PreviewData })?.preview_data ?? null);
                        setNeedsActivation(false);

                        // job_description comes from the API response
                        if (fullResult.job_description) {
                            setJobDescription(fullResult.job_description);
                        }
                        setStage("paid");

                        // Limpar URL após carregar com sucesso (opcional, mas elegante)
                        if (urlHistoryId) {
                            window.history.replaceState({}, '', '/app');
                        }
                    }
                } catch (err) {
                    console.error("[Dashboard→App] Erro ao carregar histórico:", err);
                } finally {
                    setLoadingHistoryItem(false);
                    setHasActiveHistoryFlow(false); // Finalizar fluxo de histórico
                }
            })();
        })();
    }, [authUserId]); // Depender apenas do authUserId

    // -------------------------------------------------------------------------
    // DEBUG: Restauração do Contexto de Reset de Senha
    // -------------------------------------------------------------------------
    useEffect(() => {
        console.log("🔍 [RESTORE DEBUG] useEffect de restauração foi chamado!");

        // Leitura "crua" do LocalStorage para debug
        const storedStage = typeof window !== 'undefined' ? localStorage.getItem("vant_reset_return_to") : null;
        const storedPlan = typeof window !== 'undefined' ? localStorage.getItem("vant_reset_return_plan") : null;

        console.log("🕵️ [RESTORE DEBUG] Rodou o efeito de restauração.");
        console.log("🕵️ [RESTORE DEBUG] LocalStorage cru:", {
            vant_reset_return_to: storedStage,
            vant_reset_return_plan: storedPlan,
            authUserId: authUserId,
            currentStage: stage
        });

        if (storedStage === "checkout") {
            console.log("✅ [RESTORE DEBUG] Contexto de checkout encontrado!");

            if (storedPlan) {
                console.log(`🔄 [RESTORE DEBUG] Restaurando plano: ${storedPlan}`);
                setSelectedPlan(storedPlan as PlanType);
            }

            console.log("🚀 [RESTORE DEBUG] Forçando stage para 'checkout'");
            setStage("checkout");

            if (authUserId) {
                console.log("🧹 [RESTORE DEBUG] Usuário autenticado, limpando flags de reset.");
                localStorage.removeItem("vant_reset_return_to");
                localStorage.removeItem("vant_reset_return_plan");
            }
        } else {
            console.log("ℹ️ [RESTORE DEBUG] Nenhum contexto de retorno encontrado.");
        }
    }, [authUserId]); // Re-rodar quando authUserId mudar

    // Smallpdf flow: quando auth completa durante checkout, ir direto pro Stripe
    const checkoutAuthPending = useRef(false);
    useEffect(() => {
        if (authUserId && stage === "checkout" && isAuthenticating === false && checkoutAuthPending.current) {
            checkoutAuthPending.current = false;
            console.log("[CheckoutAuth] Auth completa no checkout, chamando startCheckout...");
            startCheckout();
            setHasActiveHistoryFlow(false); // Finalizar fluxo de histórico
        }
    }, [authUserId, stage, isAuthenticating, startCheckout]);

    // useRef para controlar se ativação já foi tentada
    const activationAttempted = useRef(false);

    // Função para resetar estado de ativação
    const resetActivationState = () => {
        activationAttempted.current = false;
        setStripeSessionId(null);
        setNeedsActivation(false);
        setCheckoutError("");
    };

    useEffect(() => {
        console.log("[useEffect needsActivation] Rodou.");
        if (!needsActivation || !authUserId || !stripeSessionId || isActivating) {
            return;
        }

        (async () => {
            // Marcar que ativação foi tentada ANTES da chamada
            activationAttempted.current = true;
            setIsActivating(true);

            // Limpar needsActivation imediatamente para evitar re-renderizações
            setNeedsActivation(false);

            try {
                console.log("[needsActivation] Chamando /api/entitlements/activate...");
                const resp = await fetch(`${getApiUrl()}/api/entitlements/activate`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        session_id: stripeSessionId,
                        user_id: authUserId,
                        plan_id: selectedPlan || "credit_1"
                    }),
                });
                let data: JsonObject = {};
                try {
                    data = await resp.json();
                } catch (e) {
                    console.warn('Resposta da ativação não é JSON válido, mas status é', resp.status);
                }

                if (!resp.ok) {
                    const err = typeof data.error === "string" ? data.error : `HTTP ${resp.status} `;
                    throw new Error(err);
                }

                // Sucesso!
                console.log("[needsActivation] Ativação bem-sucedida! Status:", resp.status, "Data:", data);

                // Limpar sessão pendente após ativação bem-sucedida
                window.localStorage.removeItem("vant_pending_stripe_session_id");
                setCheckoutError("");

                // Atualizar créditos com valor retornado pelo backend
                if (typeof data.credits_remaining === "number") {
                    setCreditsRemaining(data.credits_remaining as number);
                    localStorage.setItem('vant_cached_credits', String(data.credits_remaining));
                    console.log("[needsActivation] Créditos cacheados:", data.credits_remaining);
                }

                // Sincronizar entitlements para garantir (não bloquear redirect em caso de falha)
                if (authUserId) {
                    try {
                        await syncEntitlements(authUserId);
                    } catch (error) {
                        console.warn("[needsActivation] Falha ao sincronizar entitlements, seguindo fluxo:", error);
                    }
                }

                // Sinalizar que acabou de pagar (dashboard vai detectar)
                localStorage.setItem('vant_just_paid', 'true');

                // Redirecionar para dashboard — créditos já estão no cache
                console.log("[needsActivation] Redirecionando para /dashboard...");

                // Usar setTimeout para garantir que o redirecionamento aconteça
                setTimeout(() => {
                    console.log("[needsActivation] Executando redirecionamento agora...");
                    window.location.href = "/dashboard";
                }, 500);
            } catch (e: unknown) {
                setCheckoutError(getErrorMessage(e, "Falha ao ativar plano"));
                // Em caso de erro, resetar o flag para permitir nova tentativa
                activationAttempted.current = false;
            } finally {
                setIsActivating(false);
            }
        })();
    }, [authUserId, needsActivation]); // Removido stripeSessionId e isActivating das dependências

    // Carrossel automático de depoimentos
    useEffect(() => {
        if (typeof window === "undefined") return;

        const initCarousel = () => {
            const slides = document.querySelectorAll('.testimonial-slide');
            const dots = document.querySelectorAll('.carousel-dot');
            let currentSlide = 0;

            const showSlide = (index: number) => {
                slides.forEach((slide, i) => {
                    (slide as HTMLElement).style.display = i === index ? 'block' : 'none';
                });
                dots.forEach((dot, i) => {
                    (dot as HTMLElement).style.background = i === index ? '#3b82f6' : 'rgba(148, 163, 184, 0.3)';
                });
            };

            const nextSlide = () => {
                currentSlide = (currentSlide + 1) % slides.length;
                showSlide(currentSlide);
            };

            // Configurar cliques nos dots
            dots.forEach((dot, index) => {
                dot.addEventListener('click', () => {
                    currentSlide = index;
                    showSlide(currentSlide);
                });
            });

            // Iniciar o carrossel automático
            const interval = setInterval(nextSlide, 4000); // Muda a cada 4 segundos

            // Limpar o interval quando o componente for desmontado
            return () => clearInterval(interval);
        };

        // Pequeno delay para garantir que o DOM foi renderizado
        const timer = setTimeout(initCarousel, 100);

        return () => clearTimeout(timer);
    }, [stage]);

    const showProNoCreditsNotice = () => {
        setShowProCreditNotice(true);
    };

    async function startCheckout() {
        setCheckoutError("");

        // Resetar estado de ativação ao iniciar novo checkout
        activationAttempted.current = false;

        const rawPlanId = (selectedPlan || "credit_1").trim() as string;
        const planId = rawPlanId === "basico"
            ? "credit_1"
            : rawPlanId === "premium_plus"
                ? "pro_monthly_early_bird"
                : rawPlanId;

        // Verificar se usuário tem plano ativo antes de permitir checkout de assinatura
        const subscriptionPlans = ["pro_monthly", "pro_monthly_early_bird", "pro_annual", "trial"];
        if (subscriptionPlans.includes(planId) && authUserId) {
            try {
                const statusResp = await fetch(`${getApiUrl()}/api/user/status/${authUserId}`, {
                    signal: getSafeSignal(10000), // 10s timeout
                });
                if (statusResp.ok) {
                    const statusData = await statusResp.json();
                    const hasPlan = !!statusData.plan;
                    const credits = Number(statusData.credits_remaining || 0);

                    if (hasPlan) {
                        // Usuário tem assinatura ativa
                        if (credits > 0) {
                            setCheckoutError("Você já possui uma assinatura ativa com créditos disponíveis. Use seus créditos ou escolha um pacote avulso.");
                        } else {
                            setCheckoutError("Você já é usuário Pro! Como não há créditos disponíveis no período, escolha Crédito Avulso para usar agora.");
                            showProNoCreditsNotice();
                        }
                        return;
                    }
                } else {
                    console.warn("[startCheckout] API respondeu com status:", statusResp.status);
                }
            } catch (error) {
                console.warn("[startCheckout] Falha ao verificar status do usuário:", error);
            }
        }

        try {
            const body: Record<string, unknown> = {
                plan_id: planId,
                score: typeof previewData?.nota_ats === "number" ? previewData.nota_ats : 0,
            };
            if (authEmail && authEmail.includes("@")) {
                body.customer_email = authEmail;
            }
            if (authUserId) {
                body.client_reference_id = authUserId;
            }

            const resp = await fetch(`${getApiUrl()}/api/stripe/create-checkout-session`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const payload = (await resp.json()) as JsonObject;
            if (!resp.ok) {
                const err = typeof payload.error === "string" ? payload.error : `HTTP ${resp.status} `;

                // Tratar erro específico de assinatura ativa
                if (err.includes("assinatura ativa") || err.includes("ACTIVE_SUBSCRIPTION_EXISTS")) {
                    setCheckoutError("Você já é usuário Pro! Para análises adicionais, escolha Crédito Avulso.");
                    showProNoCreditsNotice();
                    return;
                }

                throw new Error(err);
            }
            if (typeof payload.id === "string") {
                setStripeSessionId(payload.id);
            }
            const checkoutUrl = typeof payload.url === "string" ? payload.url : "";
            if (!checkoutUrl) {
                throw new Error("URL de checkout não retornada pelo backend");
            }

            // Salvar dados antes de redirecionar para o pagamento
            if (typeof window !== "undefined" && jobDescription && file) {
                console.log("[startCheckout] Salvando dados antes do pagamento...");
                localStorage.setItem("vant_jobDescription", jobDescription);
                localStorage.setItem("vant_file_name", file.name);
                localStorage.setItem("vant_file_type", file.type);

                // Salvar arquivo no IndexedDB (sem limite de tamanho)
                try {
                    await saveFileToIDB(file);
                    console.log("[startCheckout] Arquivo salvo no IndexedDB. Redirecionando...");
                } catch (err) {
                    console.warn("[startCheckout] Falha ao salvar arquivo no IndexedDB:", err);
                }
                window.location.href = checkoutUrl;
            } else {
                window.location.href = checkoutUrl;
            }
            return; // Evita que o redirecionamento abaixo execute antes da hora
        } catch (e: unknown) {
            setCheckoutError(getErrorMessage(e, "Erro ao iniciar checkout"));
        }
    }

    // Smallpdf approach: auth inline no checkout — tenta login, se não existe cria conta, depois vai direto pro Stripe
    async function handleCheckoutWithAuth() {
        // Limpar erros anteriores
        setCheckoutError("");

        // Validações melhoradas
        if (!supabase) {
            setCheckoutError("Erro de configuração. Tente recarregar a página.");
            return;
        }

        // Validação de email mais robusta
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!authEmail || !emailRegex.test(authEmail)) {
            setCheckoutError("Digite um e-mail válido (ex: nome@dominio.com).");
            return;
        }

        // Validação de senha mais específica
        if (!authPassword) {
            setCheckoutError("Digite uma senha.");
            return;
        }

        if (authPassword.length < 6) {
            setCheckoutError("A senha deve ter no mínimo 6 caracteres.");
            return;
        }

        if (authPassword.length > 72) {
            setCheckoutError("Senha muito longa. Use no máximo 72 caracteres.");
            return;
        }

        // Verificar se a senha é apenas números (fraca)
        if (/^\d+$/.test(authPassword)) {
            setCheckoutError("Use uma senha com letras e números para mais segurança.");
            return;
        }

        setIsAuthenticating(true);
        checkoutAuthPending.current = true;
        const client = supabase as SupabaseClient;

        try {
            // 1. Tentar criar conta primeiro (caso seja usuário novo)
            console.log("[CheckoutAuth] Tentando criar conta para:", authEmail);
            const { data: signupData, error: signupError } = await client.auth.signUp({
                email: authEmail.trim().toLowerCase(), // Normalizar email
                password: authPassword,
            });

            if (!signupError && signupData.user && signupData.user.identities && signupData.user.identities.length > 0) {
                // Conta criada com sucesso — usuário novo
                setAuthUserId(signupData.user.id);
                setAuthEmail(signupData.user.email || authEmail);
                setAuthPassword("");
                console.log("[CheckoutAuth] ✅ Conta criada com sucesso, ID:", signupData.user.id);
                return;
            }

            // 2. Signup falhou ou usuário já existe — tentar login
            console.log("[CheckoutAuth] Usuário já existe, tentando login...");
            const { data: loginData, error: loginError } = await client.auth.signInWithPassword({
                email: authEmail.trim().toLowerCase(),
                password: authPassword,
            });

            if (!loginError && loginData.user) {
                // Login OK
                setAuthUserId(loginData.user.id);
                setAuthEmail(loginData.user.email || authEmail);
                setAuthPassword("");
                console.log("[CheckoutAuth] ✅ Login realizado com sucesso, ID:", loginData.user.id);
                return;
            }

            // 3. Login falhou — analisar o erro específico
            throw loginError;

        } catch (e: unknown) {
            checkoutAuthPending.current = false;

            // Tratamento de erros mais específico
            if (e instanceof Error) {
                const errorMsg = e.message.toLowerCase();

                if (errorMsg.includes("invalid login credentials") || errorMsg.includes("wrong password")) {
                    setCheckoutError("__WRONG_PASSWORD__");
                } else if (errorMsg.includes("email not confirmed") || errorMsg.includes("email confirmation")) {
                    setCheckoutError("Por favor, confirme seu e-mail antes de continuar. Verifique sua caixa de entrada.");
                } else if (errorMsg.includes("too many requests") || errorMsg.includes("rate limit")) {
                    setCheckoutError("Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.");
                } else if (errorMsg.includes("user already registered") || errorMsg.includes("already registered")) {
                    // Este caso já é tratado no fluxo de login, mas mantemos como fallback
                    setCheckoutError("Este e-mail já está cadastrado. Tente fazer login.");
                } else if (errorMsg.includes("invalid email") || errorMsg.includes("email format")) {
                    setCheckoutError("Formato de e-mail inválido. Verifique o endereço digitado.");
                } else if (errorMsg.includes("weak password") || errorMsg.includes("password should be")) {
                    setCheckoutError("Senha muito fraca. Use letras, números e pelo menos 6 caracteres.");
                } else {
                    // Erro genérico mas mais amigável
                    console.error("[CheckoutAuth] Erro não tratado:", e);
                    setCheckoutError("Ocorreu um erro na autenticação. Tente novamente em alguns instantes.");
                }
            } else {
                // Erro que não é instância de Error
                console.error("[CheckoutAuth] Erro desconhecido:", e);
                setCheckoutError("Erro inesperado. Tente novamente ou entre em contato com o suporte.");
            }
        } finally {
            setIsAuthenticating(false);
        }
    }

    // Login com Email + Senha
    async function handleEmailPasswordAuth() {
        setCheckoutError("");

        if (!supabase) {
            setCheckoutError("Supabase não configurado.");
            return;
        }

        if (!authEmail || !authEmail.includes("@")) {
            setCheckoutError("Digite um e-mail válido.");
            return;
        }

        if (!authPassword || authPassword.length < 6) {
            setCheckoutError("A senha deve ter no mínimo 6 caracteres.");
            return;
        }

        setIsAuthenticating(true);

        // Verificação de tipo explícita para evitar never
        const client = supabase as SupabaseClient;

        try {
            if (isLoginMode) {
                // LOGIN
                const { data, error } = await client.auth.signInWithPassword({
                    email: authEmail,
                    password: authPassword,
                });

                if (error) throw error;

                if (data.user) {
                    setAuthUserId(data.user.id);
                    setAuthEmail(data.user.email || authEmail);
                    setCheckoutError("");
                    setAuthPassword(""); // Limpar senha
                }
            } else {
                // CADASTRO
                const { data, error } = await client.auth.signUp({
                    email: authEmail,
                    password: authPassword,
                });

                if (error) throw error;

                if (data.user) {
                    setAuthUserId(data.user.id);
                    setAuthEmail(data.user.email || authEmail);
                    setCheckoutError("✅ Conta criada com sucesso!");
                    setAuthPassword(""); // Limpar senha
                }
            }
        } catch (e: unknown) {
            setCheckoutError(getErrorMessage(e, isLoginMode ? "Erro ao fazer login" : "Erro ao criar conta"));
        } finally {
            setIsAuthenticating(false);
        }
    }

    // Login com Google OAuth
    async function handleGoogleLogin() {
        setCheckoutError("");

        if (!supabase) {
            setCheckoutError("Supabase não configurado.");
            return;
        }

        setIsAuthenticating(true);

        try {
            // Salvar o stage e plano atual para restaurar após o login
            // Só salvar plano se NÃO estiver no hero (evitar redirect indevido ao checkout)
            if (typeof window !== "undefined") {
                localStorage.setItem("vant_auth_return_stage", stage);
                if (selectedPlan && stage !== "hero") {
                    localStorage.setItem("vant_auth_return_plan", selectedPlan);
                }
                console.log("[DEBUG] handleGoogleLogin page.tsx - Salvando stage:", stage, "plano:", selectedPlan, "salvouPlano:", stage !== "hero");
            }

            // Verificação de tipo explícita para evitar never
            const client = supabase as SupabaseClient;

            const { error } = await client.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: typeof window !== "undefined"
                        ? `${window.location.origin}/app`
                        : undefined,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    },
                },
            });

            if (error) throw error;

            // O redirecionamento acontece automaticamente
        } catch (e: unknown) {
            setCheckoutError(getErrorMessage(e, "Erro ao fazer login com Google"));
            setIsAuthenticating(false);
        }
    }

    function sleep(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    async function syncEntitlements(userId: string) {
        const resp = await fetch(`${getApiUrl()}/api/entitlements/status`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: userId }),
            signal: getSafeSignal(10000), // 10s timeout
        });
        const payload = (await resp.json()) as JsonObject;
        if (!resp.ok) {
            const err = typeof payload.error === "string" ? payload.error : `HTTP ${resp.status}`;
            throw new Error(err);
        }
        if (typeof payload.credits_remaining === "number") {
            setCreditsRemaining(payload.credits_remaining);
            // Salvar no cache para próximos logins
            localStorage.setItem('vant_cached_credits', payload.credits_remaining.toString());
            console.log("[syncEntitlements] Créditos atualizados e cacheados:", payload.credits_remaining);
        }
        setCreditsLoading(false);
    }

    // useEffect dedicado para verificação inicial de autenticação e redirecionamento
    useEffect(() => {
        console.log("[useEffect initialAuthCheck] Iniciando verificação inicial...");

        // Função assíncrona para verificação
        const performInitialCheck = async () => {
            try {
                // Verificação rápida: se há pagamento pendente, não fazer nada (deixar o useEffect do payment lidar)
                const urlPayment = searchParams.get("payment");
                const urlSessionId = searchParams.get("session_id");
                if (urlPayment === "success" && urlSessionId) {
                    console.log("[initialAuthCheck] Pagamento pendente detectado, ignorando verificação");
                    return;
                }

                // Verificação rápida: se não há usuário, liberar renderização imediatamente
                if (!authUserId) {
                    console.log("[initialAuthCheck] Sem authUserId, liberando renderização do hero");
                    setIsCheckingAuth(false);
                    return;
                }

                // Verificar se há fluxo ativo que impede redirect ao Dashboard
                // 1. Ler a URL diretamente (Mais rápido que router ou state)
                const urlParams = new URLSearchParams(window.location.search);
                const urlHistoryId = urlParams.get('historyId');

                // 2. Verificar LocalStorage
                const localHistoryId = localStorage.getItem("vant_dashboard_open_history_id");

                // 3. Definir se existe um fluxo ativo (AGORA COM A URL)
                const hasHistoryItem = !!urlHistoryId || !!localHistoryId || hasActiveHistoryFlow;

                const hasReturnStage = !!localStorage.getItem("vant_auth_return_stage");
                const checkoutPending = localStorage.getItem("checkout_pending");
                const hasCheckoutPending = !!checkoutPending;
                const hasAutoProcess = !!localStorage.getItem("vant_auto_process");
                const hasAutoStartFlag = !!localStorage.getItem("vant_auto_start");
                const hasSkipPreviewFlag = !!localStorage.getItem("vant_skip_preview");
                const hasSavedDraft = !!localStorage.getItem("vant_jobDescription") && (
                    !!localStorage.getItem("vant_file_b64") || !!localStorage.getItem("vant_cv_text_preextracted")
                );
                // Se stage não é hero, usuário está em fluxo ativo (preview, checkout, analyzing, etc.)
                const hasNonHeroStage = stage !== "hero";
                const hasActiveFlow =
                    hasReturnStage ||
                    hasHistoryItem ||
                    hasActiveHistoryFlow || // Adicionar esta linha
                    hasCheckoutPending ||
                    hasNonHeroStage ||
                    hasAutoProcess ||
                    hasAutoStartFlag ||
                    hasSkipPreviewFlag ||
                    hasSavedDraft;

                console.log("[initialAuthCheck] Verificando fluxo:", {
                    urlHistoryId,
                    localHistoryId,
                    hasHistoryItem: !!hasHistoryItem,
                    hasActiveHistoryFlow: !!hasActiveHistoryFlow,
                    hasReturnStage,
                    hasCheckoutPending,
                    hasNonHeroStage,
                    hasAutoProcess,
                    hasAutoStartFlag,
                    hasSkipPreviewFlag,
                    hasSavedDraft,
                    stage
                });

                // Se não há fluxo ativo, verificar créditos e decidir redirecionamento
                console.log("[initialAuthCheck] hasActiveFlow final:", hasActiveFlow);
                if (!hasActiveFlow) {
                    console.log("[initialAuthCheck] Sem fluxo ativo, verificando créditos...");

                    // Verificar créditos rapidamente (usar cache primeiro)
                    const cachedCredits = localStorage.getItem('vant_cached_credits');
                    let credits = 0;

                    if (cachedCredits) {
                        credits = parseInt(cachedCredits, 10);
                        console.log("[initialAuthCheck] Usando créditos cacheados:", credits);
                    } else {
                        // Se não tem cache, buscar da API (mas com timeout curto)
                        try {
                            const controller = new AbortController();
                            const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout

                            const resp = await fetch(`${getApiUrl()}/api/user/status/${authUserId}`, {
                                signal: controller.signal
                            });
                            clearTimeout(timeoutId);

                            if (resp.ok) {
                                const data = await resp.json();
                                credits = data.credits_remaining || 0;
                                setCreditsRemaining(credits);
                                localStorage.setItem('vant_cached_credits', credits.toString());
                                console.log("[initialAuthCheck] Créditos buscados da API:", credits);
                            }
                        } catch (error) {
                            console.log("[initialAuthCheck] Erro ao buscar créditos, assumindo 0:", error);
                            credits = 0;
                        }
                    }

                    // Se tem créditos, redirecionar para dashboard mantendo loading
                    console.log("[initialAuthCheck] Verificando redirecionamento:", {
                        credits,
                        pathname: window.location.pathname,
                        condition: credits > 0 && window.location.pathname !== "/dashboard"
                    });
                    if (credits > 0 && window.location.pathname !== "/dashboard") {
                        console.log("[initialAuthCheck] Usuário tem créditos, redirecionando para dashboard...");
                        window.location.href = "/dashboard";
                        return; // Manter isCheckingAuth como true durante redirect
                    }
                }

                // Se chegou aqui, pode liberar renderização
                console.log("[initialAuthCheck] Verificação concluída, liberando renderização");
                setIsCheckingAuth(false);

            } catch (error) {
                console.error("[initialAuthCheck] Erro na verificação inicial:", error);
                // Em caso de erro, liberar renderização para não bloquear indefinidamente
                setIsCheckingAuth(false);
            }
        };

        // Executar verificação
        performInitialCheck();

        // Timeout de segurança: se demorar mais de 5s, liberar renderização
        const safetyTimeout = setTimeout(() => {
            if (isCheckingAuth) {
                console.log("[initialAuthCheck] Timeout de segurança, liberando renderização");
                setIsCheckingAuth(false);
            }
        }, 5000);

        return () => clearTimeout(safetyTimeout);
    }, [authUserId, stage, hasActiveHistoryFlow]); // Re-executar quando hasActiveHistoryFlow mudar

    useEffect(() => {
        console.log("[useEffect syncEntitlements] Rodou.");
        if (!authUserId) {
            return;
        }
        (async () => {
            try {
                await syncEntitlements(authUserId);

                // Se usuário tem créditos e está na página de planos (preview), NÃO mover para hero automaticamente
                // Usuário pode querer ver planos mesmo tendo créditos
                if (creditsRemaining > 0 && stage === "preview") {
                    console.log("[syncEntitlements] Usuário tem créditos mas está em preview - mantendo em preview para ver planos");
                    // Não mover para hero - deixar usuário decidir
                }

                // Se usuário tem créditos e está no hero (tela inicial), mostrar mensagem
                if (creditsRemaining > 0 && stage === "hero") {
                    console.log("[syncEntitlements] Usuário com créditos detectado no hero");
                    // O botão "Começar Agora" já vai chamar onStart() que vai usar os créditos
                }
            } catch {
                return;
            }
        })();
    }, [authUserId, creditsRemaining, stage]);

    // Função para lidar com seleção de item do histórico
    const handleSelectHistory = async (item: HistoryItem) => {
        try {
            // Se já temos o resultado completo, apenas definimos
            if (item.full_result) {
                setReportData(item.full_result);
                setSelectedHistoryItem(item);
                setStage("paid");
                return;
            }

            // Caso contrário, precisamos buscar o resultado completo
            setApiError("");

            const response = await fetch(`${getApiUrl()}/api/user/history/detail?id=${item.id}`, {
                signal: getSafeSignal(15000), // 15s timeout
            });

            if (!response.ok) {
                throw new Error(`Erro ${response.status}: ${response.statusText}`);
            }

            const fullResult = await response.json();

            // Atualiza o item com o resultado completo
            const updatedItem = { ...item, full_result: fullResult.data };
            setSelectedHistoryItem(updatedItem);
            setReportData(fullResult.data);
            setStage("paid");
        } catch (err) {
            console.error("Erro ao carregar detalhe do histórico:", err);
            setApiError(err instanceof Error ? err.message : "Erro ao carregar análise");
        }
    };

    const handleBackFromHistory = () => {
        setSelectedHistoryItem(null);
        setStage("hero");
    };

    useEffect(() => {
        if (stage === "paid") {
            console.log("[useEffect processing_premium] Já estamos em paid, abortando processamento premium.");
            return;
        }

        console.log("[useEffect processing_premium] Entrou. Estado atual:", { stage, jobDescription: !!jobDescription, file: !!file, authUserId });
        if (stage !== "processing_premium") {
            console.log("[useEffect processing_premium] Stage não é processing_premium, saindo.");
            return;
        }
        if (!authUserId) {
            setPremiumError("Faça login para continuar.");
            setStage("checkout");
            return;
        }
        if (!jobDescription.trim() || !file) {
            // Tentar restaurar do localStorage (caso de remontagem)
            if (typeof window !== "undefined") {
                const savedJob = localStorage.getItem("vant_jobDescription");
                const savedFileB64 = localStorage.getItem("vant_file_b64");
                const savedFileName = localStorage.getItem("vant_file_name");
                const savedFileType = localStorage.getItem("vant_file_type");
                if (savedJob && savedFileB64 && savedFileName && savedFileType) {
                    console.log("[processing_premium] Restaurando do localStorage...");
                    setIsRestoringData(true);
                    setJobDescription(savedJob);
                    fetch(savedFileB64)
                        .then(res => res.blob())
                        .then(blob => {
                            const restoredFile = new File([blob], savedFileName, { type: savedFileType });
                            setFile(restoredFile);
                            setIsRestoringData(false);
                            console.log("[processing_premium] Dados restaurados!");
                        })
                        .catch(err => {
                            console.error("[processing_premium] Erro:", err);
                            setIsRestoringData(false);
                        });
                    return;
                }
            }
            console.log("[processing_premium] Usuário comprou créditos, redirecionando para hero para usar créditos...");
            // setPremiumError("Para usar seus créditos, envie seu CV primeiro."); // Removido para não assustar usuário
            setStage("hero");
            return;
        }

        if (isRestoringData) {
            console.log("[processing_premium] Aguardando restauração...");
            return;
        }

        // Persistir dados essenciais em localStorage para evitar perda em recarregamentos
        if (typeof window !== "undefined") {
            if (jobDescription) localStorage.setItem("vant_jobDescription", jobDescription);
            // Não armazenamos o File em localStorage (muito grande), mas podemos avisar se ele foi perdido
        }
    }, [stage, authUserId, jobDescription, file, isRestoringData]);

    // Derivar previewPillarItems dos dados reais de previewData
    const previewPillarSource = !Array.isArray(previewData?.pilares) && previewData?.pilares
        ? previewData.pilares
        : previewData?.analise_por_pilares ?? {};

    const previewPillarItems = [
        { nome: "ATS", pontos: typeof previewPillarSource.ats === "number" ? previewPillarSource.ats : 0 },
        { nome: "Keywords", pontos: typeof previewPillarSource.keywords === "number" ? previewPillarSource.keywords : 0 },
        { nome: "Impacto", pontos: typeof previewPillarSource.impacto === "number" ? previewPillarSource.impacto : 0 },
    ];

    // Função para recuperação de senha
    const handleForgotPassword = async () => {
        if (!authEmail.trim()) {
            setApiError("Digite seu email primeiro.");
            return;
        }
        try {
            const { error } = await supabase!.auth.resetPasswordForEmail(authEmail.trim());
            if (error) throw error;
            setEmailSent(true);
            setResendCountdown(60);
        } catch (err: any) {
            setApiError(err?.message || "Erro ao enviar email de recuperação.");
        }
    };

    // Função para iniciar análise
    const onStart = async () => {
        if (!file || !jobDescription.trim()) {
            setApiError("Por favor, envie seu CV e descreva a vaga.");
            return;
        }
        setApiError("");
        setStage("analyzing");
    };

    // Função para abrir dialog de upload de CV
    const openFileDialog = () => {
        uploaderInputRef.current?.click();
    };

    // Função para abrir dialog de arquivos concorrentes
    const openCompetitorFileDialog = () => {
        competitorUploaderInputRef.current?.click();
    };

    // useEffect para iniciar análise quando stage muda para "analyzing"
    useEffect(() => {
        if (stage !== "analyzing" || !file || !jobDescription.trim()) return;

        let progressInterval: NodeJS.Timeout;
        const startTime = Date.now();

        const startAnalysis = async () => {
            setProgress(0);
            setStatusText("Iniciando análise...");
            setApiError("");

            // Animação de progresso suave baseada em tempo decorrido (8 segundos até 100%)
            progressInterval = setInterval(() => {
                const elapsed = Date.now() - startTime;
                const calculatedProgress = getAnalyzingProgressByElapsed(elapsed);
                setProgress(calculatedProgress);

                // Atualizar mensagem baseado no progresso
                if (calculatedProgress < 35) {
                    setStatusText("Extraindo texto do CV...");
                } else if (calculatedProgress < 75) {
                    setStatusText("Analisando compatibilidade com a vaga...");
                } else if (calculatedProgress < 100) {
                    setStatusText("Identificando pontos de melhoria...");
                } else {
                    setStatusText("Finalizando análise...");
                }
            }, 50); // Atualiza a cada 50ms para animação suave

            const formData = new FormData();
            formData.append("file", file);
            formData.append("job_description", jobDescription);

            // Enviar área de interesse se selecionada (vaga genérica)
            if (useGenericJob && selectedArea) {
                formData.append("area_of_interest", selectedArea);
                console.log("[Analyzing] Área selecionada:", selectedArea);
            }

            try {
                const response = await fetch(`${getApiUrl()}/api/analyze-free`, {
                    method: "POST",
                    body: formData,
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || `HTTP ${response.status}`);
                }

                const data = await response.json();
                console.log("[Analyzing] Análise concluída:", data);

                // Aguardar animação chegar a 100% se ainda não chegou
                const elapsed = Date.now() - startTime;
                if (elapsed < 8000) {
                    // Esperar até completar 8 segundos
                    setTimeout(() => {
                        clearInterval(progressInterval);
                        setProgress(100);
                        setStatusText("Análise concluída!");
                        setTimeout(() => {
                            setPreviewData(data);
                            setStage("preview");
                        }, 500);
                    }, 8000 - elapsed);
                } else {
                    // Já passou 8 segundos, mostrar resultado imediatamente
                    clearInterval(progressInterval);
                    setProgress(100);
                    setStatusText("Análise concluída!");
                    setTimeout(() => {
                        setPreviewData(data);
                        setStage("preview");
                    }, 500);
                }
            } catch (error: any) {
                console.error("[Analyzing] Erro na análise:", error);
                clearInterval(progressInterval);
                setApiError(error.message || "Erro ao analisar CV");
                setStage("hero");
            }
        };

        startAnalysis();

        // Cleanup: limpar interval se componente desmontar
        return () => {
            if (progressInterval) clearInterval(progressInterval);
        };
    }, [stage, file, jobDescription]);

    // Renderização condicional baseada no estado de verificação
    if (isCheckingAuth || loadingHistoryItem) {
        return (
            <div style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#0f172a"
            }}>
                <div style={{ textAlign: "center" }}>
                    <div style={{
                        width: "48px",
                        height: "48px",
                        border: "3px solid rgba(56, 189, 248, 0.3)",
                        borderTopColor: "#38BDF8",
                        borderRadius: "50%",
                        animation: "spin 0.8s linear infinite",
                        margin: "0 auto 16px"
                    }} />
                    <p style={{ color: "#94A3B8", fontSize: "0.875rem" }}>
                        {loadingHistoryItem ? "Carregando análise..." : "Verificando autenticação..."}
                    </p>
                </div>
                <style>{`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }

    return (
        <main style={{ minHeight: "100vh", background: "#0f172a" }}>
            {stage === "hero" && (
                <div className="hero-container">
                    {/* V4 Split-Screen: 2-column grid */}
                    <div className="hero-split-grid">

                        {/* ===== LEFT COLUMN: Text + Trust ===== */}
                        <div className="hero-left-col">
                            <div>
                                {USE_JSX_SECTIONS ? (
                                    <HeroHeader />
                                ) : (
                                    <div dangerouslySetInnerHTML={{ __html: HERO_HEADER_HTML }} />
                                )}
                                {USE_JSX_SECTIONS ? (
                                    <TrustBar />
                                ) : (
                                    <div dangerouslySetInnerHTML={{ __html: TRUST_BAR_HTML }} />
                                )}
                            </div>
                            <div
                                className="scroll-indicator"
                                onClick={() => document.getElementById('por-que-funciona')?.scrollIntoView({ behavior: 'smooth' })}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => { if (e.key === 'Enter') document.getElementById('por-que-funciona')?.scrollIntoView({ behavior: 'smooth' }); }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: 16, height: 16 }}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                                <span>Veja por que funciona</span>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="#4ADE80" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14, marginLeft: 4 }}><polygon points="5 3 19 12 5 21 5 3" /></svg>
                            </div>
                        </div>

                        {/* ===== RIGHT COLUMN: Form ===== */}
                        <div className="hero-right-col">
                            <div className="action-island-container">
                                {/* Tab Switcher: Com Vaga / Análise Geral */}
                                <div style={{
                                    display: "flex",
                                    background: "rgba(15, 23, 42, 0.6)",
                                    borderRadius: 8,
                                    padding: 3,
                                    marginBottom: 16,
                                    border: "1px solid rgba(255,255,255,0.06)"
                                }}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setUseGenericJob(false);
                                            setJobDescription("");
                                            setSelectedArea("");
                                        }}
                                        style={{
                                            flex: 1,
                                            padding: "7px 12px",
                                            borderRadius: 6,
                                            border: "none",
                                            cursor: "pointer",
                                            fontSize: "0.8rem",
                                            fontWeight: 600,
                                            letterSpacing: "0.2px",
                                            transition: "all 0.2s ease",
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            gap: 1,
                                            background: !useGenericJob ? "rgba(56, 189, 248, 0.15)" : "rgba(255, 255, 255, 0.04)",
                                            color: !useGenericJob ? "#38BDF8" : "#CBD5E1",
                                            boxShadow: !useGenericJob ? "0 1px 3px rgba(0,0,0,0.2)" : "none"
                                        }}
                                    >
                                        <span>Tenho uma vaga</span>
                                        <span style={{ fontSize: "0.6rem", opacity: 0.5, fontWeight: 400 }}>colar descrição</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setUseGenericJob(true);
                                            setJobDescription("Busco oportunidades profissionais que valorizem minhas habilidades e experiência. Estou aberto a posições desafiadoras que permitam meu crescimento e contribuição para os objetivos da empresa, com foco em resultados e inovação.");
                                        }}
                                        style={{
                                            flex: 1,
                                            padding: "7px 12px",
                                            borderRadius: 6,
                                            border: "none",
                                            cursor: "pointer",
                                            fontSize: "0.8rem",
                                            fontWeight: 600,
                                            letterSpacing: "0.2px",
                                            transition: "all 0.2s ease",
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            gap: 1,
                                            background: useGenericJob ? "rgba(16, 185, 129, 0.15)" : "rgba(255, 255, 255, 0.04)",
                                            color: useGenericJob ? "#10B981" : "#CBD5E1",
                                            boxShadow: useGenericJob ? "0 1px 3px rgba(0,0,0,0.2)" : "none"
                                        }}
                                    >
                                        <span>Não tenho uma vaga</span>
                                        <span style={{ fontSize: "0.6rem", opacity: 0.5, fontWeight: 400 }}>selecionar área</span>
                                    </button>
                                </div>

                                {/* Vaga textarea — hidden when useGenericJob */}
                                {!useGenericJob && (
                                    <div style={{ marginBottom: 16 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                                            <span style={{ color: "#38BDF8", fontSize: "0.75rem", fontWeight: 700, background: "rgba(56, 189, 248, 0.1)", borderRadius: "50%", width: 20, height: 20, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>1</span>
                                            <span style={{ color: "#94A3B8", fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase" }}>Cole a descrição da vaga</span>
                                        </div>
                                        <div className="stTextArea">
                                            <textarea
                                                value={jobDescription}
                                                onChange={(e) => setJobDescription(e.target.value)}
                                                placeholder="Cole a descrição da vaga aqui..."
                                                disabled={useGenericJob}
                                                style={{
                                                    height: 100,
                                                    width: "100%",
                                                    boxSizing: "border-box"
                                                }}
                                            />
                                        </div>
                                        <div style={{
                                            marginTop: 4,
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            color: jobDescription && jobDescription.length >= 500 ? "#10B981" : "#64748B",
                                            fontSize: "0.75rem"
                                        }}>
                                            <span>{jobDescription ? jobDescription.length : 0}/5000</span>
                                            <span style={{ color: "#94A3B8", fontSize: "0.7rem" }}>
                                                Descrição completa = melhor resultado
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Area selector — only when generic job */}
                                {useGenericJob && (
                                    <div style={{ marginBottom: 16 }}>
                                        <label style={{ display: "block", marginBottom: 6, fontSize: "0.8rem", color: "#CBD5E1", fontWeight: 500 }}>
                                            Área de interesse (opcional):
                                        </label>
                                        <select
                                            value={selectedArea}
                                            onChange={(e) => setSelectedArea(e.target.value)}
                                            style={{
                                                width: "100%",
                                                padding: "8px 12px",
                                                backgroundColor: "#1E293B",
                                                border: "1px solid rgba(255, 255, 255, 0.1)",
                                                borderRadius: "6px",
                                                color: "#E2E8F0",
                                                fontSize: "0.85rem"
                                            }}
                                        >
                                            <option value="">Selecione uma área...</option>
                                            <option value="ti_dados_ai">Tecnologia/Dados/IA</option>
                                            <option value="ti_dev_gen">Desenvolvimento de Software</option>
                                            <option value="ti_suporte">TI/Suporte Técnico</option>
                                            <option value="produto_agil">Produto/Agile</option>
                                            <option value="marketing_growth">Marketing/Growth</option>
                                            <option value="vendas_cs">Vendas/Customer Success</option>
                                            <option value="rh_lideranca">RH/Liderança</option>
                                            <option value="financeiro_corp">Financeiro/Corporativo</option>
                                            <option value="global_soft_skills">Geral/Soft Skills</option>
                                        </select>
                                    </div>
                                )}

                                {/* CV Upload */}
                                <div style={{ marginBottom: 14 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                                        <span style={{ color: "#10B981", fontSize: "0.75rem", fontWeight: 700, background: "rgba(16, 185, 129, 0.1)", borderRadius: "50%", width: 20, height: 20, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{useGenericJob ? "1" : "2"}</span>
                                        <span style={{ color: "#94A3B8", fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase" }}>Seu Currículo (PDF)</span>
                                    </div>
                                    {file ? (
                                        <div style={{ background: "rgba(16, 185, 129, 0.1)", border: "1px solid #10B981", borderRadius: 8, padding: 12, textAlign: "center" }}>
                                            <div style={{ color: "#10B981", fontSize: "0.85rem", fontWeight: 600, marginBottom: 4 }}>✅ Arquivo carregado</div>
                                            <div style={{ color: "#E2E8F0", fontSize: "0.8rem" }}>{file.name}</div>
                                            {pdfMetadata && (
                                                <div style={{ background: "rgba(245, 158, 11, 0.08)", border: "1px solid rgba(245, 158, 11, 0.25)", borderRadius: 6, padding: 8, marginTop: 6 }}>
                                                    <div style={{ color: "#F59E0B", fontSize: "0.7rem", fontWeight: 700, marginBottom: 2 }}>📊 DETALHES:</div>
                                                    {pdfMetadata.pages && (
                                                        <div style={{ color: "#E2E8F0", fontSize: "0.8rem" }}>
                                                            <strong>Páginas:</strong> {pdfMetadata.pages}
                                                            {pdfMetadata.pages > 3 && <span style={{ marginLeft: 6, color: "#10B981" }}>- Otimizaremos para 1-2 ✓</span>}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            <button type="button" onClick={() => setFile(null)} style={{ marginTop: 8, fontSize: "0.7rem", color: "#94A3B8", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                                                Remover
                                            </button>
                                        </div>
                                    ) : (
                                        <div data-testid="stFileUploader" data-cy="cv-upload-area">
                                            <section
                                                onClick={openFileDialog}
                                                data-cy="cv-upload-section"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                        e.preventDefault();
                                                        openFileDialog();
                                                    }
                                                }}
                                                style={{ cursor: "pointer" }}
                                                tabIndex={0}
                                            >
                                                <div>
                                                    <div><span>Arraste ou clique para enviar</span></div>
                                                    <small>✓ PDF ou DOCX • Máx. 10MB</small>
                                                    <button type="button" onClick={openFileDialog} style={{ marginTop: "6px", fontSize: "0.8rem", opacity: 0.7 }}>Escolher arquivo</button>
                                                    <input ref={uploaderInputRef} type="file" accept="application/pdf" data-cy="cv-file-input" style={{ display: "none" }} onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                                                </div>
                                            </section>
                                        </div>
                                    )}
                                </div>

                                {/* Trust badge — privacy signal near upload */}
                                <div style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    padding: "8px 12px",
                                    borderRadius: 8,
                                    background: "rgba(16, 185, 129, 0.06)",
                                    border: "1px solid rgba(16, 185, 129, 0.12)",
                                    marginBottom: 12,
                                    marginTop: 4
                                }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                                    <span style={{ color: "#94A3B8", fontSize: "0.7rem", lineHeight: 1.4 }}>
                                        <span style={{ color: "#4ADE80", fontWeight: 600 }}>Seus dados não são salvos</span> · Privacidade total garantida
                                    </span>
                                </div>

                                {/* Advanced Options: Referência Ideal (hidden by default) */}
                                <details className="advanced-options-toggle">
                                    <summary>Configurações Avançadas (Opcional)</summary>
                                    <div className="details-content">
                                        <div style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            gap: 12,
                                            marginBottom: competitorFiles.length > 0 ? 12 : 0
                                        }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
                                                <div style={{ fontSize: "1.4rem" }}>📑</div>
                                                <div>
                                                    <div style={{ color: "#F8FAFC", fontSize: "0.85rem", fontWeight: 700 }}>
                                                        Comparar com outro CV
                                                    </div>
                                                    <div style={{ color: "#94A3B8", fontSize: "0.75rem", marginTop: 2 }}>
                                                        {competitorFiles.length > 0 ? `${competitorFiles.length} comparativo(s)` : "Tem uma referência? Suba para ver quem vence."}
                                                    </div>
                                                </div>
                                            </div>
                                            {competitorFiles.length > 0 ? (
                                                <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#10B981", fontWeight: 700, fontSize: "0.8rem" }}>
                                                    <span>✓</span> Pronto
                                                </div>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={openCompetitorFileDialog}
                                                    style={{
                                                        background: "transparent", color: "#94A3B8",
                                                        border: "1px solid rgba(148, 163, 184, 0.4)",
                                                        borderRadius: 16, padding: "6px 12px",
                                                        fontSize: "0.75rem", fontWeight: 600, cursor: "pointer",
                                                        whiteSpace: "nowrap", transition: "all 0.2s ease"
                                                    }}
                                                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#10B981"; e.currentTarget.style.color = "#10B981"; }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(148, 163, 184, 0.4)"; e.currentTarget.style.color = "#94A3B8"; }}
                                                >
                                                    + Adicionar Comparativo
                                                </button>
                                            )}
                                            <input ref={competitorUploaderInputRef} type="file" accept="application/pdf" multiple style={{ display: "none" }} onChange={(e) => setCompetitorFiles(Array.from(e.target.files ?? []))} />
                                        </div>
                                        {competitorFiles.length > 0 && (
                                            <div style={{ background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: 8, padding: 10, marginTop: 8 }}>
                                                <div style={{ color: "#E2E8F0", fontSize: "0.75rem" }}>
                                                    {competitorFiles.map((f, i) => (
                                                        <div key={i} style={{ marginBottom: 2, display: "flex", alignItems: "center", gap: 6 }}>
                                                            <span style={{ color: "#64748B" }}>📄</span>{f.name}
                                                        </div>
                                                    ))}
                                                </div>
                                                <button type="button" onClick={() => setCompetitorFiles([])} style={{ marginTop: 6, fontSize: "0.7rem", color: "#94A3B8", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                                                    Remover
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </details>

                                {/* Credits indicator */}
                                {authUserId && creditsRemaining > 0 && (
                                    <div style={{
                                        background: "linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(56, 189, 248, 0.1))",
                                        border: "1px solid rgba(16, 185, 129, 0.3)",
                                        borderRadius: 8, padding: "10px", marginTop: 14, textAlign: "center"
                                    }}>
                                        <div style={{ color: "#10B981", fontSize: "0.85rem", fontWeight: 700 }}>
                                            ✅ {creditsRemaining} crédito(s) disponível(is)
                                        </div>
                                    </div>
                                )}

                                {/* CTA Button */}
                                <div data-testid="stButton" className="stButton" style={{ width: "100%", marginTop: 14 }}>
                                    <button
                                        type="button"
                                        data-kind="primary"
                                        data-cy="main-cta"
                                        onClick={onStart}
                                        style={{
                                            width: "100%",
                                            transition: "all 0.2s ease",
                                            cursor: "pointer",
                                            background: "linear-gradient(to bottom, #FFD54F 0%, #FF8F00 50%, #EF6C00 100%)",
                                            boxShadow: "inset 0 2px 1px rgba(255, 255, 255, 0.6), 0 4px 20px rgba(255, 143, 0, 0.5), 0 2px 5px rgba(255, 87, 34, 0.4)",
                                            fontWeight: 600, letterSpacing: "1px", color: "#210B00",
                                            border: "none", borderRadius: "50px", padding: "12px 20px", fontSize: "1rem"
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = "translateY(-2px)";
                                            e.currentTarget.style.boxShadow = "inset 0 2px 1px rgba(255, 255, 255, 0.6), 0 8px 30px rgba(255, 143, 0, 0.7), 0 4px 10px rgba(255, 87, 34, 0.6)";
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = "translateY(0)";
                                            e.currentTarget.style.boxShadow = "inset 0 2px 1px rgba(255, 255, 255, 0.6), 0 4px 20px rgba(255, 143, 0, 0.5), 0 2px 5px rgba(255, 87, 34, 0.4)";
                                        }}
                                        onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.98)"; }}
                                        onMouseUp={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; }}
                                    >
                                        {authUserId && creditsRemaining > 0 ? "OTIMIZAR MEU CV" : "ANALISAR CV GRÁTIS"}
                                    </button>
                                </div>

                                {/* Trust signal — no credit card required */}
                                <div style={{
                                    textAlign: "center",
                                    marginTop: 8
                                }}>
                                    <span style={{
                                        color: "#E2E8F0",
                                        fontSize: "0.75rem",
                                        fontWeight: 600,
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 5
                                    }}>
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                        Sem cartão de crédito
                                    </span>
                                </div>
                            </div>
                        </div>

                    </div>{/* end hero-split-grid */}

                    {/* Full-width sections below the fold */}
                    <div id="por-que-funciona">
                        {USE_JSX_SECTIONS ? (
                            <ValueProp />
                        ) : (
                            <div dangerouslySetInnerHTML={{ __html: VALUE_PROP_HTML }} />
                        )}
                    </div>
                    <div>
                        {USE_JSX_SECTIONS ? (
                            <AnalysisCard />
                        ) : (
                            <div dangerouslySetInnerHTML={{ __html: ANALYSIS_CARD_HTML }} />
                        )}
                    </div>
                </div>
            )}

            {stage === "paid" && (
                <PaidStage
                    reportData={reportData}
                    authUserId={authUserId}
                    creditsRemaining={creditsRemaining}
                    onNewOptimization={async () => {
                        // Buscar último CV antes de abrir o modal
                        if (authUserId) {
                            try {
                                console.log("[LastCV] Buscando último CV para usuário:", authUserId);
                                const resp = await fetch(`${getApiUrl()}/api/user/last-cv/${authUserId}`);
                                if (resp.ok) {
                                    const data = await resp.json();
                                    console.log("[LastCV] Dados recebidos:", data);
                                    setLastCVData(data);
                                } else {
                                    console.error("[LastCV] Erro na resposta:", resp.status);
                                }
                            } catch (error) {
                                console.error("[LastCV] Erro ao buscar último CV:", error);
                            }
                        }
                        setShowNewOptimizationModal(true);
                    }}
                    onUpdateReport={(updated) => setReportData(updated)}
                    onViewHistory={() => setStage("history")}
                />
            )}

            {stage === "history" && (
                <HistoryStage
                    authUserId={authUserId}
                    onSelectHistory={handleSelectHistory}
                    onBack={handleBackFromHistory}
                />
            )}

            {stage === "pricing" && (
                <div className="hero-container">
                    <div className="action-island-container">
                        <NeonOffer
                            onSelectPlan={(planId) => setSelectedPlan(planId)}
                            onCheckout={(planId) => {
                                setSelectedPlan(planId);
                                setStage("checkout");
                            }}
                            authUserId={authUserId}
                            creditsRemaining={creditsRemaining}
                            timeRemaining={timeRemaining}
                            showHeader={true}
                        />
                    </div>
                    <div style={{ textAlign: "center", marginTop: 16 }}>
                        <button
                            type="button"
                            onClick={() => setStage("hero")}
                            style={{
                                background: "none",
                                border: "none",
                                color: "#475569",
                                fontSize: "0.85rem",
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 6,
                                padding: "10px"
                            }}
                        >
                            ← Voltar
                        </button>
                    </div>
                </div>
            )}

            {stage === "analyzing" && (
                <div className="hero-container">
                    {(() => {
                        const activePhase = progress < 35 ? 1 : progress < 75 ? 2 : 3;
                        const phaseLabel =
                            activePhase === 1
                                ? "Etapa 1 de 3"
                                : activePhase === 2
                                    ? "Etapa 2 de 3"
                                    : "Etapa 3 de 3";

                        return (
                            <>
                                <style>{`
                                    @keyframes fadeInUp {
                                        from { opacity: 0; transform: translateY(12px); }
                                        to { opacity: 1; transform: translateY(0); }
                                    }
                                    .analyzing-card-enter {
                                        animation: fadeInUp 0.45s ease-out;
                                    }
                                    @keyframes shimmerMove {
                                        0% { background-position: 0% 50%; }
                                        100% { background-position: 100% 50%; }
                                    }
                                    .analyzing-shell {
                                        width: 100%;
                                        max-width: 760px;
                                        margin: 0 auto;
                                        padding: 0 20px;
                                    }
                                    .analyzing-header {
                                        text-align: center;
                                        margin-bottom: 28px;
                                    }
                                    .analyzing-phase-grid {
                                        display: grid;
                                        grid-template-columns: repeat(3, 1fr);
                                        gap: 10px;
                                        margin-top: 14px;
                                    }
                                    .analyzing-tip-card {
                                        margin-top: 40px;
                                        border-radius: 18px;
                                        padding: 26px 24px;
                                    }
                                    @media (max-width: 768px) {
                                        .analyzing-shell {
                                            padding: 0 16px;
                                        }
                                        .analyzing-header {
                                            margin-bottom: 24px;
                                        }
                                        .analyzing-phase-grid {
                                            gap: 8px;
                                            margin-top: 12px;
                                        }
                                        .analyzing-tip-card {
                                            margin-top: 28px;
                                            padding: 22px 18px;
                                            border-radius: 16px;
                                        }
                                    }
                                    @media (max-width: 480px) {
                                        .analyzing-shell {
                                            padding: 0 12px;
                                        }
                                        .analyzing-header {
                                            margin-bottom: 20px;
                                        }
                                        .analyzing-tip-card {
                                            margin-top: 22px;
                                            padding: 18px 14px;
                                        }
                                    }
                                `}</style>

                                <div className="analyzing-shell">
                                    <div className="analyzing-header">
                                        <h2
                                            style={{
                                                marginTop: 0,
                                                marginBottom: 10,
                                                color: "#F8FAFC",
                                                fontSize: "clamp(1.5rem, 3.8vw, 2.35rem)",
                                                fontWeight: 800,
                                                letterSpacing: "-0.02em",
                                                lineHeight: 1.2,
                                            }}
                                        >
                                            Analisando seu perfil com IA
                                        </h2>
                                        <p
                                            style={{
                                                margin: 0,
                                                color: "#D8E1F3",
                                                fontSize: "clamp(1rem, 2.3vw, 1.2rem)",
                                                fontWeight: 700,
                                                lineHeight: 1.4,
                                            }}
                                        >
                                            {statusText}
                                        </p>
                                    </div>

                                    <div style={{ height: 10, background: "rgba(148, 163, 184, 0.2)", borderRadius: 999, overflow: "hidden" }}>
                                        <div
                                            style={{
                                                width: `${Math.max(0, Math.min(100, progress))}%`,
                                                height: "100%",
                                                background: "linear-gradient(90deg, #3B5BDB, #4F46E5, #3B5BDB)",
                                                backgroundSize: "200% 100%",
                                                animation: "shimmerMove 1.8s linear infinite",
                                                transition: "width 0.2s linear",
                                                boxShadow: "0 0 12px rgba(79, 70, 229, 0.35)",
                                            }}
                                        />
                                    </div>

                                    <div
                                        style={{
                                            textAlign: "center",
                                            marginTop: 12,
                                            color: "rgba(167, 180, 222, 0.7)",
                                            fontSize: "0.72rem",
                                            fontWeight: 600,
                                            letterSpacing: "0.1em",
                                            textTransform: "uppercase",
                                        }}
                                    >
                                        {phaseLabel}
                                    </div>

                                    <div className="analyzing-phase-grid">
                                        {[1, 2, 3].map((step) => {
                                            const isDone = step < activePhase;
                                            const isActive = step === activePhase;
                                            return (
                                                <div
                                                    key={`analyzing-step-${step}`}
                                                    style={{
                                                        height: 6,
                                                        borderRadius: 999,
                                                        background: isDone || isActive ? "linear-gradient(90deg, #415CCF, #4F46E5)" : "rgba(148, 163, 184, 0.25)",
                                                        boxShadow: isActive ? "0 0 10px rgba(79, 70, 229, 0.3)" : "none",
                                                        transition: "all 0.25s ease",
                                                    }}
                                                />
                                            );
                                        })}
                                    </div>

                                    <div
                                        className="analyzing-phase-container analyzing-tip-card"
                                        style={{
                                            background: "rgba(255, 255, 255, 0.05)",
                                            border: "1px solid rgba(255, 255, 255, 0.1)",
                                            backdropFilter: "blur(10px)",
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                        }}
                                    >
                                        <style dangerouslySetInnerHTML={{
                                            __html: `
                                                .analyzing-phase-container .metric-hint-lite { position: relative; display: flex; flex-direction: column; width: 100%; outline: none; cursor: help; }
                                                .analyzing-phase-container .metric-tooltip-lite { position: absolute; left: 50%; top: calc(100% + 8px); transform: translateX(-50%) translateY(4px); width: 280px; padding: 10px 12px; border-radius: 8px; background: rgba(15, 23, 42, 0.96); border: 1px solid rgba(56, 189, 248, 0.28); color: #E2E8F0; font-size: 0.72rem; font-weight: 500; line-height: 1.45; box-shadow: 0 10px 24px -10px rgba(0,0,0,0.65), 0 0 20px -10px rgba(56,189,248,0.35); opacity: 0; transition: opacity 0.16s ease, transform 0.16s ease; pointer-events: none; z-index: 20; }
                                                .analyzing-phase-container .metric-hint-lite:hover .metric-tooltip-lite, .analyzing-phase-container .metric-hint-lite:focus-visible .metric-tooltip-lite { opacity: 1; transform: translateX(-50%) translateY(0); }
                                            `
                                        }} />
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 16, width: "100%" }}>
                                            <div style={{ fontSize: "1.5rem", display: "flex", alignItems: "center" }}>💡</div>
                                            <div>
                                                <div style={{ color: "#C7D4FF", fontSize: "0.88rem", fontWeight: 700 }}>
                                                    Você sabia?
                                                </div>
                                                <div style={{ color: "rgba(159, 176, 220, 0.85)", fontSize: "0.76rem", marginTop: 2 }}>
                                                    Insights do mercado enquanto avaliamos seu CV
                                                </div>
                                            </div>
                                        </div>

                                        {activePhase === 1 && (
                                            <div style={{ color: "#E6ECFF", fontSize: "0.95rem", lineHeight: 1.65, textAlign: "center", maxWidth: 640, margin: "0 auto" }}>
                                                <strong style={{ color: "#F8FAFC" }}>75% dos CVs são rejeitados antes de chegar ao recrutador.</strong>
                                                <br /><br />
                                                Sistemas ATS filtram automaticamente currículos com base em palavras-chave, estrutura e legibilidade.
                                                Um ajuste técnico bem feito aumenta muito a chance de avançar para a entrevista.
                                            </div>
                                        )}

                                        {activePhase === 2 && (
                                            <div style={{ color: "#E6ECFF", fontSize: "0.95rem", lineHeight: 1.65, textAlign: "center", maxWidth: 640, margin: "0 auto" }}>
                                                <strong style={{ color: "#F8FAFC" }}>Checklist de compatibilidade que mais pesa no ATS:</strong>
                                                <div style={{ margin: "12px auto 0", display: "grid", gap: 8, maxWidth: 520, textAlign: "left" }}>
                                                    <div className="metric-hint-lite" tabIndex={0} aria-label="Por que palavras-chave são importantes">
                                                        <div style={{ display: "flex", alignItems: "start", gap: 8 }}>
                                                            <CheckCircle2Icon color="#9CA3AF" />
                                                            <span><strong>Palavras-chave estratégicas</strong> da vaga distribuídas no CV</span>
                                                        </div>
                                                        <div className="metric-tooltip-lite">Sistemas ATS buscam termos exatos da vaga. Incluir palavras-chave em cargos, competências e resultados aumenta drasticamente a compatibilidade.</div>
                                                    </div>
                                                    <div className="metric-hint-lite" tabIndex={0} aria-label="Por que resultados com números são importantes">
                                                        <div style={{ display: "flex", alignItems: "start", gap: 8 }}>
                                                            <CheckCircle2Icon color="#9CA3AF" />
                                                            <span><strong>Resultados com números</strong> para comprovar impacto</span>
                                                        </div>
                                                        <div className="metric-tooltip-lite">Métricas como &ldquo;aumentei 34%&rdquo; ou &ldquo;gerenciei 150+&rdquo; demonstram impacto real e são priorizadas por algoritmos e recrutadores.</div>
                                                    </div>
                                                    <div className="metric-hint-lite" tabIndex={0} aria-label="Por que clareza e escaneabilidade são importantes">
                                                        <div style={{ display: "flex", alignItems: "start", gap: 8 }}>
                                                            <CheckCircle2Icon color="#9CA3AF" />
                                                            <span><strong>Clareza e escaneabilidade</strong> para leitura automática</span>
                                                        </div>
                                                        <div className="metric-tooltip-lite">Formatação limpa e sem tabelas/imagens permite que o ATS leia corretamente seu conteúdo. Layouts complexos causam erros de parsing.</div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {activePhase === 3 && (
                                            <div style={{ color: "#E6ECFF", fontSize: "0.95rem", lineHeight: 1.6, maxWidth: 640, margin: "0 auto", width: "100%" }}>
                                                <div
                                                    style={{
                                                        background: "rgba(15, 23, 42, 0.78)",
                                                        border: "1px solid rgba(239, 68, 68, 0.3)",
                                                        borderLeft: "2px solid #EF4444",
                                                        borderRadius: 10,
                                                        padding: 12,
                                                        marginBottom: 12,
                                                    }}
                                                >
                                                    <div style={{ color: "#FCA5A5", fontSize: "0.78rem", fontWeight: 600, marginBottom: 6 }}>
                                                        Antes (Score: 42/100)
                                                    </div>
                                                    <div style={{ color: "#CBD5E1", fontSize: "0.85rem", fontStyle: "italic" }}>
                                                        &ldquo;Trabalhei com vendas e atendimento ao cliente&rdquo;
                                                    </div>
                                                </div>
                                                <div
                                                    style={{
                                                        background: "rgba(15, 23, 42, 0.78)",
                                                        border: "1px solid rgba(16, 185, 129, 0.35)",
                                                        borderLeft: "2px solid #10B981",
                                                        borderRadius: 10,
                                                        padding: 12,
                                                    }}
                                                >
                                                    <div style={{ color: "#34D399", fontSize: "0.78rem", fontWeight: 600, marginBottom: 6 }}>
                                                        Depois (Score: 87/100)
                                                    </div>
                                                    <div style={{ color: "#E2E8F0", fontSize: "0.85rem" }}>
                                                        &ldquo;Profissional com <strong style={{ background: "rgba(34, 197, 94, 0.2)", borderRadius: 4, padding: "0 4px" }}>análise de dados</strong> aplicada ao funil comercial,
                                                        com foco em <strong style={{ background: "rgba(34, 197, 94, 0.2)", borderRadius: 4, padding: "0 4px" }}>eficiência operacional</strong> e expansão de contas.
                                                        Liderei carteira de <strong>150+ clientes B2B</strong> e aumentei retenção em <strong>34%</strong>
                                                        com estratégias de <strong>onboarding estruturado</strong> e <strong>upsell</strong>.&rdquo;
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        );
                    })()}
                </div>
            )}

            {stage === "processing_premium" && (
                <>
                    {/* UI de Erro Premium */}
                    {premiumError && (
                        <div className="hero-container" style={{ textAlign: "center" }}>
                            <div style={{
                                background: "rgba(15, 23, 42, 0.7)",
                                border: "1px solid rgba(239, 68, 68, 0.35)",
                                borderLeft: "2px solid #EF4444",
                                borderRadius: 12,
                                padding: "40px",
                                margin: "20px auto",
                                maxWidth: "100%"
                            }}>
                                <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
                                    <AlertCircleIcon color="#EF4444" size={24} />
                                </div>
                                <div style={{ color: "#EF4444", fontSize: "1.5rem", fontWeight: 700, marginBottom: "12px" }}>
                                    Dados da sessão perdidos
                                </div>
                                <div style={{ color: "#94A3B8", fontSize: "1rem", marginBottom: "24px" }}>
                                    Por favor, reinicie o processo.
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setPremiumError("");
                                        setStage("hero");
                                        setJobDescription("");
                                        setFile(null);
                                        setPreviewData(null);
                                        setReportData(null);
                                    }}
                                    style={{
                                        background: "linear-gradient(135deg, #10B981, #059669)",
                                        color: "#fff",
                                        border: "none",
                                        padding: "16px 32px",
                                        borderRadius: 8,
                                        fontSize: "1rem",
                                        fontWeight: 700,
                                        cursor: "pointer",
                                        boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
                                        transition: "all 0.2s"
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = "translateY(-2px)";
                                        e.currentTarget.style.boxShadow = "0 6px 16px rgba(16, 185, 129, 0.4)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = "translateY(0)";
                                        e.currentTarget.style.boxShadow = "0 4px 12px rgba(16, 185, 129, 0.3)";
                                    }}
                                >
                                    Reiniciar
                                </button>
                            </div>
                        </div>
                    )}

                    {!premiumError && (
                        <div className="hero-container" style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <style>{`
                                @keyframes pulse-glow {
                                    0% { text-shadow: 0 0 10px rgba(16, 185, 129, 0.3); opacity: 0.85; transform: scale(1); }
                                    50% { text-shadow: 0 0 25px rgba(16, 185, 129, 0.8), 0 0 5px rgba(255,255,255,0.4); opacity: 1; transform: scale(1.02); }
                                    100% { text-shadow: 0 0 10px rgba(16, 185, 129, 0.3); opacity: 0.85; transform: scale(1); }
                                }
                                @keyframes spin-smooth {
                                    from { transform: rotate(0deg); }
                                    to { transform: rotate(360deg); }
                                }
                                @keyframes dots {
                                    0%, 20% { content: '.'; }
                                    40% { content: '..'; }
                                    60%, 100% { content: '...'; }
                                }
                            `}</style>

                            <div style={{ textAlign: "center", maxWidth: 600 }}>
                                {/* Logo com pulse */}
                                <div style={{
                                    fontSize: "2rem",
                                    fontWeight: 900,
                                    letterSpacing: "3px",
                                    color: "#10B981",
                                    marginBottom: 40,
                                    animation: "pulse-glow 2.5s ease-in-out infinite"
                                }}>
                                    vant.core premium
                                </div>

                                {/* Spinner animado */}
                                <div style={{
                                    width: 60,
                                    height: 60,
                                    margin: "0 auto 32px",
                                    border: "4px solid rgba(16, 185, 129, 0.1)",
                                    borderTop: "4px solid #10B981",
                                    borderRadius: "50%",
                                    animation: "spin-smooth 1s linear infinite"
                                }} />

                                {/* Mensagem principal */}
                                <div style={{
                                    color: "#E2E8F0",
                                    fontSize: "1.1rem",
                                    fontWeight: 600,
                                    marginBottom: 16
                                }}>
                                    Iniciando análise
                                    <span style={{ display: "inline-block", width: 24, textAlign: "left" }}>
                                        <span style={{ animation: "dots 1.5s steps(3, end) infinite" }}>...</span>
                                    </span>
                                </div>

                                {/* Descrição */}
                                <div style={{
                                    color: "#94A3B8",
                                    fontSize: "0.9rem",
                                    lineHeight: 1.6,
                                    maxWidth: 480,
                                    margin: "0 auto"
                                }}>
                                    Nossa IA está analisando seu CV. Os resultados começarão a aparecer em instantes.
                                </div>

                                {/* Info adicional */}
                                <div style={{
                                    marginTop: 40,
                                    padding: 20,
                                    background: "rgba(15, 23, 42, 0.5)",
                                    border: "1px solid rgba(255, 255, 255, 0.1)",
                                    borderRadius: 12,
                                    backdropFilter: "blur(10px)"
                                }}>
                                    <div style={{ color: "#64748B", fontSize: "0.85rem", marginBottom: 12 }}>
                                        💡 <strong style={{ color: "#94A3B8" }}>Dica:</strong> A análise é progressiva
                                    </div>
                                    <div style={{ color: "#64748B", fontSize: "0.8rem", lineHeight: 1.5 }}>
                                        Você verá primeiro o diagnóstico e depois os demais resultados aparecerão gradualmente.
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            {stage === "preview" && previewData && (
                <FreeAnalysisStage
                    previewData={previewData}
                    onUpgrade={() => {
                        setSelectedPlan("credit_1");
                        setStage("checkout");
                    }}
                    onTryAnother={() => setStage("hero")}
                />
            )}

            {stage === "diagnostico_pronto" && previewData && (
                <div style={{
                    minHeight: "100vh",
                    background: "linear-gradient(135deg, #020617 0%, #0f172a 50%, #020617 100%)",
                    padding: "2rem 1rem",
                    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                }}>
                    <style jsx>{`
                        @keyframes pulse {
                            0%, 100% {
                                transform: scale(1);
                                opacity: 0.9;
                            }
                            50% {
                                transform: scale(1.02);
                                opacity: 1;
                            }
                        }
                    `}</style>
                    <div style={{ maxWidth: "1150px", margin: "0 auto" }}>

                        {/* Header */}
                        <div style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "2rem"
                        }}>
                            <div>
                                <h1 style={{
                                    fontSize: "3rem",
                                    fontWeight: 300,
                                    color: "white",
                                    margin: 0,
                                    lineHeight: 1.1
                                }}>Seu Diagnóstico</h1>
                                <p style={{
                                    fontSize: "1.125rem",
                                    fontWeight: 300,
                                    color: "#94a3b8",
                                    marginTop: "0.5rem"
                                }}>Análise gratuita do seu currículo</p>
                            </div>
                            <div style={{
                                background: "rgba(15, 23, 42, 0.6)",
                                border: "1px solid rgba(255,255,255,0.1)",
                                padding: "0.5rem 1rem",
                                borderRadius: "99px",
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5rem",
                                fontSize: "0.875rem",
                                color: "#94a3b8"
                            }}>
                                <div style={{
                                    background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                                    color: "white",
                                    fontSize: "0.85rem",
                                    fontWeight: 700,
                                    padding: "6px 16px",
                                    borderRadius: "20px",
                                    letterSpacing: "0.5px"
                                }}>✨ ANÁLISE GRATUITA</div>
                            </div>
                        </div>

                        {/* Meta de Pontuação */}
                        <div style={{
                            background: "rgba(15, 23, 42, 0.6)",
                            backdropFilter: "blur(20px) saturate(180%)",
                            border: "1px solid rgba(255, 255, 255, 0.08)",
                            boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.3)",
                            borderRadius: "1.5rem",
                            padding: "2rem",
                            marginBottom: "2rem",
                            transition: "transform 0.2s ease, border-color 0.2s ease"
                        }}>
                            <h2 style={{
                                fontSize: "1.5rem",
                                fontWeight: 600,
                                color: "white",
                                margin: "0 0 1.5rem 0"
                            }}>🎯 Meta de Pontuação</h2>
                            <div style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "2rem"
                            }}>
                                <div style={{ textAlign: "center" }}>
                                    <div style={{
                                        fontSize: "3rem",
                                        fontWeight: 300,
                                        color: "#10b981",
                                        lineHeight: 1
                                    }}>{previewData?.projected_score || 94}</div>
                                    <div style={{
                                        fontSize: "0.875rem",
                                        color: "#94a3b8"
                                    }}>Score Alvo</div>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{
                                        color: "#94a3b8",
                                        marginBottom: "1rem"
                                    }}>
                                        Com as otimizações completas, seu score pode chegar a <strong style={{ color: "#10b981" }}>{previewData?.projected_score || 94}/100</strong>.
                                        Isso coloca você no <strong style={{ color: "#10b981" }}>Top {previewData?.percentile || "15%"} dos candidatos</strong>.
                                    </div>
                                    <div style={{
                                        height: "0.5rem",
                                        background: "rgba(255,255,255,0.1)",
                                        borderRadius: "99px",
                                        overflow: "hidden",
                                        marginTop: "1rem"
                                    }}>
                                        <div style={{
                                            height: "100%",
                                            width: `${previewData?.projected_score || 94}%`,
                                            background: "linear-gradient(90deg, #10b981 0%, #059669 100%)",
                                            borderRadius: "99px"
                                        }} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Diagnóstico Inicial */}
                        <div style={{
                            background: "rgba(15, 23, 42, 0.6)",
                            backdropFilter: "blur(20px) saturate(180%)",
                            border: "1px solid rgba(255, 255, 255, 0.08)",
                            boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.3)",
                            borderRadius: "1.5rem",
                            padding: "2rem",
                            marginBottom: "2rem"
                        }}>
                            <div style={{
                                display: "grid",
                                gridTemplateColumns: "1fr auto 1fr",
                                gap: "2rem",
                                alignItems: "center",
                                marginBottom: "2rem"
                            }}>
                                {/* Score ATS Atual */}
                                <div style={{
                                    background: previewData?.nota < 50 ? "rgba(239, 68, 68, 0.2)" :
                                        previewData?.nota < 70 ? "rgba(251, 146, 60, 0.2)" :
                                            "rgba(56, 189, 248, 0.2)",
                                    border: previewData?.nota < 50 ? "2px solid rgba(239, 68, 68, 0.5)" :
                                        previewData?.nota < 70 ? "2px solid rgba(251, 146, 60, 0.5)" :
                                            "2px solid rgba(56, 189, 248, 0.5)",
                                    borderRadius: "1rem",
                                    padding: "1.5rem",
                                    textAlign: "center",
                                    position: "relative",
                                    boxShadow: previewData?.nota < 50 ? "0 0 20px rgba(239, 68, 68, 0.3)" :
                                        previewData?.nota < 70 ? "0 0 20px rgba(251, 146, 60, 0.3)" :
                                            "0 0 20px rgba(56, 189, 248, 0.3)"
                                }}>
                                    <div style={{
                                        fontSize: "0.875rem",
                                        color: previewData?.nota < 50 ? "#f87171" :
                                            previewData?.nota < 70 ? "#fbbf24" :
                                                "#38bdf8",
                                        marginBottom: "0.5rem",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.05em",
                                        fontWeight: 600
                                    }}>SCORE ATS ATUAL</div>
                                    <div style={{
                                        fontSize: "3.5rem",
                                        fontWeight: 300,
                                        color: previewData?.nota < 50 ? "#ef4444" :
                                            previewData?.nota < 70 ? "#f59e0b" :
                                                "#38bdf8",
                                        lineHeight: 1,
                                        marginBottom: "0.5rem"
                                    }}>{previewData?.nota || 0}</div>
                                    <div style={{
                                        fontSize: "1rem",
                                        color: previewData?.nota < 50 ? "#fca5a5" :
                                            previewData?.nota < 70 ? "#fcd34d" :
                                                "#7dd3fc"
                                    }}>de 100 pontos</div>
                                </div>

                                {/* Seta Visual */}
                                <div style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "2rem",
                                    color: "#94a3b8"
                                }}>
                                    <div style={{
                                        width: "60px",
                                        height: "2px",
                                        background: "linear-gradient(90deg, #94a3b8 0%, transparent 100%)",
                                        position: "relative"
                                    }}>
                                        <div style={{
                                            position: "absolute",
                                            right: "-8px",
                                            top: "-4px",
                                            width: "0",
                                            height: "0",
                                            borderLeft: "8px solid transparent",
                                            borderRight: "8px solid transparent",
                                            borderTop: "2px solid #94a3b8"
                                        }} />
                                    </div>
                                </div>

                                {/* Score Projetado */}
                                <div style={{
                                    background: "linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.2) 100%)",
                                    border: "2px solid rgba(16, 185, 129, 0.5)",
                                    borderRadius: "1rem",
                                    padding: "1.5rem",
                                    textAlign: "center",
                                    position: "relative",
                                    boxShadow: "0 0 30px rgba(16, 185, 129, 0.4)",
                                    animation: "pulse 2s ease-in-out infinite"
                                }}>
                                    <div style={{
                                        fontSize: "0.875rem",
                                        color: "#34d399",
                                        marginBottom: "0.5rem",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.05em",
                                        fontWeight: 600
                                    }}>SCORE PROJETADO</div>
                                    <div style={{
                                        fontSize: "3.5rem",
                                        fontWeight: 300,
                                        background: "linear-gradient(to right, #34d399, #2dd4bf)",
                                        WebkitBackgroundClip: "text",
                                        WebkitTextFillColor: "transparent",
                                        lineHeight: 1,
                                        marginBottom: "0.5rem"
                                    }}>{previewData?.projected_score || 94}</div>
                                    <div style={{
                                        fontSize: "1rem",
                                        color: "#7dd3fc"
                                    }}>de 100 pontos</div>

                                    {/* Efeito Neon/Glow */}
                                    <div style={{
                                        position: "absolute",
                                        inset: "-2px",
                                        borderRadius: "1rem",
                                        background: "linear-gradient(135deg, rgba(16, 185, 129, 0.3) 0%, rgba(5, 150, 105, 0.3) 100%)",
                                        zIndex: -1,
                                        filter: "blur(8px)"
                                    }} />
                                </div>
                            </div>

                            {/* Barras de Progresso */}
                            <div style={{ display: "grid", gap: "1rem" }}>
                                {previewPillarItems.map((pilar: { nome: string; pontos: number }, idx: number) => (
                                    <div key={idx}>
                                        <div style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            marginBottom: "0.5rem"
                                        }}>
                                            <span style={{ color: "white", fontSize: "0.875rem" }}>{pilar.nome}</span>
                                            <span style={{ color: "#94a3b8", fontSize: "0.875rem" }}>{pilar.pontos}%</span>
                                        </div>
                                        <div style={{
                                            height: "0.5rem",
                                            background: "rgba(255,255,255,0.1)",
                                            borderRadius: "99px",
                                            overflow: "hidden"
                                        }}>
                                            <div style={{
                                                height: "100%",
                                                width: `${pilar.pontos}%`,
                                                background: pilar.pontos >= 70 ? "linear-gradient(90deg, #10b981 0%, #059669 100%)" :
                                                    pilar.pontos >= 50 ? "linear-gradient(90deg, #f59e0b 0%, #d97706 100%)" :
                                                        "linear-gradient(90deg, #ef4444 0%, #dc2626 100%)",
                                                borderRadius: "99px"
                                            }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Análise Básica Completa */}
                        <div style={{
                            background: "rgba(15, 23, 42, 0.85)",
                            backdropFilter: "blur(24px)",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                            borderRadius: "1.5rem",
                            padding: "2rem",
                            marginBottom: "2rem"
                        }}>
                            <h2 style={{
                                fontSize: "1.5rem",
                                fontWeight: 600,
                                color: "white",
                                margin: "0 0 1rem 0",
                                textAlign: "center"
                            }}>📊 Análise Básica Completa</h2>

                            <p style={{
                                color: "#94a3b8",
                                textAlign: "center",
                                marginBottom: "1.5rem",
                                fontSize: "1.1rem"
                            }}>
                                Nossa IA identificou problemas críticos que estão impedindo seu CV de passar nos filtros ATS.
                            </p>

                            <div style={{
                                background: "rgba(251, 146, 60, 0.1)",
                                border: "1px solid rgba(251, 146, 60, 0.3)",
                                borderRadius: "12px",
                                padding: "1rem",
                                marginBottom: "2rem",
                                textAlign: "center"
                            }}>
                                <span style={{ color: "#fbbf24", fontSize: "0.9rem" }}>
                                    ⚠️ Visão parcial do diagnóstico - Abaixo mostramos 2 exemplos do que nossa IA detectou...
                                </span>
                            </div>

                            {/* Card Problema #1 */}
                            {previewData?.gap_1 && (
                                <div style={{
                                    background: "rgba(15, 23, 42, 0.4)",
                                    border: "1px solid rgba(255, 255, 255, 0.1)",
                                    borderRadius: "12px",
                                    padding: "1.5rem",
                                    marginBottom: "1.5rem"
                                }}>
                                    <h3 style={{
                                        fontSize: "1.25rem",
                                        fontWeight: 600,
                                        color: "white",
                                        margin: "0 0 1rem 0"
                                    }}>PROBLEMA #1</h3>
                                    <p style={{
                                        color: "#94a3b8",
                                        marginBottom: "1rem",
                                        fontSize: "1.1rem",
                                        fontWeight: 500
                                    }}>{previewData.gap_1.titulo}</p>

                                    <div style={{
                                        display: "grid",
                                        gridTemplateColumns: "1fr 1fr",
                                        gap: "1rem",
                                        marginBottom: "1rem"
                                    }}>
                                        <div style={{
                                            background: "rgba(15, 23, 42, 0.6)",
                                            border: "1px solid rgba(255, 255, 255, 0.1)",
                                            borderRadius: "8px",
                                            padding: "1rem"
                                        }}>
                                            <h4 style={{
                                                fontSize: "0.875rem",
                                                fontWeight: 500,
                                                color: "#94a3b8",
                                                marginBottom: "0.5rem"
                                            }}>VERSÃO ATUAL</h4>
                                            <div style={{
                                                color: "#f87171",
                                                fontSize: "0.95rem",
                                                lineHeight: 1.6
                                            }}>{previewData.gap_1.exemplo_atual}</div>
                                        </div>
                                        <div style={{
                                            background: "rgba(15, 23, 42, 0.6)",
                                            border: "1px solid rgba(16, 185, 129, 0.3)",
                                            borderRadius: "8px",
                                            padding: "1rem"
                                        }}>
                                            <h4 style={{
                                                fontSize: "0.875rem",
                                                fontWeight: 500,
                                                color: "#34d399",
                                                marginBottom: "0.5rem"
                                            }}>VERSÃO OTIMIZADA</h4>
                                            <div style={{
                                                color: "white",
                                                fontSize: "0.95rem",
                                                lineHeight: 1.6,
                                                marginBottom: "0.5rem"
                                            }}>{previewData.gap_1.exemplo_otimizado}</div>
                                            <span style={{
                                                background: "rgba(16, 185, 129, 0.2)",
                                                color: "#34d399",
                                                padding: "0.25rem 0.75rem",
                                                borderRadius: "99px",
                                                fontSize: "0.75rem",
                                                fontWeight: 600
                                            }}>+{previewData.gap_1.pontos || 15} pts</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Card Problema #2 */}
                            {previewData?.gap_2 && (
                                <div style={{
                                    background: "rgba(15, 23, 42, 0.4)",
                                    border: "1px solid rgba(255, 255, 255, 0.1)",
                                    borderRadius: "12px",
                                    padding: "1.5rem",
                                    marginBottom: "1.5rem"
                                }}>
                                    <h3 style={{
                                        fontSize: "1.25rem",
                                        fontWeight: 600,
                                        color: "white",
                                        margin: "0 0 1rem 0"
                                    }}>PROBLEMA #2</h3>
                                    <p style={{
                                        color: "#94a3b8",
                                        marginBottom: "1rem",
                                        fontSize: "1.1rem",
                                        fontWeight: 500
                                    }}>{previewData.gap_2.titulo}</p>

                                    <div style={{
                                        display: "grid",
                                        gridTemplateColumns: "1fr 1fr",
                                        gap: "1rem",
                                        marginBottom: "1rem"
                                    }}>
                                        <div style={{
                                            background: "rgba(15, 23, 42, 0.6)",
                                            border: "1px solid rgba(255, 255, 255, 0.1)",
                                            borderRadius: "8px",
                                            padding: "1rem"
                                        }}>
                                            <h4 style={{
                                                fontSize: "0.875rem",
                                                fontWeight: 500,
                                                color: "#94a3b8",
                                                marginBottom: "0.5rem"
                                            }}>TERMOS FALTANDO NO SEU CV</h4>
                                            <div style={{
                                                color: "#f87171",
                                                fontSize: "0.95rem",
                                                lineHeight: 1.6
                                            }}>
                                                {previewData.gap_2.termos_faltando?.map((item: string | { termo: string; frequencia: string }, idx: number) => {
                                                    const termo = typeof item === 'string' ? item : item.termo;
                                                    return (
                                                        <div key={idx} style={{ marginBottom: "0.25rem" }}>• {termo}</div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                        <div style={{
                                            background: "rgba(15, 23, 42, 0.6)",
                                            border: "1px solid rgba(16, 185, 129, 0.3)",
                                            borderRadius: "8px",
                                            padding: "1rem"
                                        }}>
                                            <h4 style={{
                                                fontSize: "0.875rem",
                                                fontWeight: 500,
                                                color: "#34d399",
                                                marginBottom: "0.5rem"
                                            }}>VERSÃO OTIMIZADA</h4>
                                            <div style={{
                                                color: "white",
                                                fontSize: "0.95rem",
                                                lineHeight: 1.6,
                                                marginBottom: "0.5rem"
                                            }}>{previewData.gap_2.exemplo_otimizado}</div>
                                            <span style={{
                                                background: "rgba(16, 185, 129, 0.2)",
                                                color: "#34d399",
                                                padding: "0.25rem 0.75rem",
                                                borderRadius: "99px",
                                                fontSize: "0.75rem",
                                                fontWeight: 600
                                            }}>+{previewData.gap_2.pontos || 12} pts</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Grid "Na versão premium você recebe" */}
                        <div style={{
                            background: "rgba(15, 23, 42, 0.6)",
                            backdropFilter: "blur(20px) saturate(180%)",
                            border: "1px solid rgba(255, 255, 255, 0.08)",
                            boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.3)",
                            borderRadius: "1.5rem",
                            padding: "2rem",
                            marginBottom: "2rem"
                        }}>
                            <h2 style={{
                                fontSize: "1.5rem",
                                fontWeight: 600,
                                color: "white",
                                margin: "0 0 1.5rem 0",
                                textAlign: "center"
                            }}>Na versão premium você recebe:</h2>

                            <div style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(2, 1fr)",
                                gap: "1rem"
                            }}>
                                {[
                                    { icon: "📄", title: "CV reescrito com palavras-chave" },
                                    { icon: "💼", title: "Headline LinkedIn otimizada" },
                                    { icon: "🎯", title: "Projeto prático para seu portfólio" },
                                    { icon: "📊", title: "Análise de todos critérios ATS" },
                                    { icon: "📚", title: "Biblioteca técnica recomendada" },
                                    { icon: "🎙️", title: "Simulador de entrevista" }
                                ].map((item, idx) => (
                                    <div key={idx} style={{
                                        background: "rgba(255, 255, 255, 0.05)",
                                        border: "1px solid rgba(255, 255, 255, 0.1)",
                                        borderRadius: "12px",
                                        padding: "1rem",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "0.75rem",
                                        transition: "all 0.2s ease"
                                    }}>
                                        <div style={{
                                            fontSize: "1.5rem",
                                            width: "2.5rem",
                                            height: "2.5rem",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            background: "rgba(16, 185, 129, 0.1)",
                                            borderRadius: "8px"
                                        }}>{item.icon}</div>
                                        <div style={{
                                            color: "white",
                                            fontSize: "0.9rem",
                                            fontWeight: 500
                                        }}>{item.title}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Seção de Preços */}
                        <div style={{
                            textAlign: "center",
                            marginBottom: "3rem"
                        }}>
                            <h2 style={{
                                fontSize: "2rem",
                                fontWeight: 600,
                                color: "white",
                                margin: "0 0 1rem 0"
                            }}>Alcance o Score 94/100 agora. Desbloqueie seu CV Otimizado em 1 clique.</h2>
                            <p style={{
                                color: "#94a3b8",
                                fontSize: "1.1rem",
                                marginBottom: "2rem"
                            }}>Transforme seu currículo em uma máquina de conseguir entrevistas...</p>

                            <div style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
                                gap: "2rem",
                                maxWidth: "800px",
                                margin: "0 auto"
                            }}>
                                {/* Plano Avulso */}
                                <div style={{
                                    background: "rgba(15, 23, 42, 0.6)",
                                    backdropFilter: "blur(20px)",
                                    border: "1px solid rgba(255, 255, 255, 0.08)",
                                    borderRadius: "1rem",
                                    padding: "2rem",
                                    textAlign: "center"
                                }}>
                                    <h3 style={{
                                        color: "white",
                                        fontSize: "1.25rem",
                                        fontWeight: 600,
                                        marginBottom: "1rem"
                                    }}>Crédito Avulso</h3>
                                    <div style={{
                                        fontSize: "2.5rem",
                                        fontWeight: 300,
                                        color: "#38bdf8",
                                        marginBottom: "0.5rem"
                                    }}>R$ 12,90</div>
                                    <div style={{
                                        color: "#94a3b8",
                                        marginBottom: "1.5rem"
                                    }}>Pagamento único</div>
                                    <button style={{
                                        background: "rgba(56, 189, 248, 0.1)",
                                        color: "#38bdf8",
                                        border: "1px solid rgba(56, 189, 248, 0.3)",
                                        padding: "0.75rem 1.5rem",
                                        borderRadius: "0.5rem",
                                        fontWeight: 500,
                                        cursor: "pointer",
                                        width: "100%"
                                    }}>
                                        Liberar CV Otimizado (R$ 12,90)
                                    </button>
                                </div>

                                {/* Plano Pro Mensal - Destacado */}
                                <div style={{
                                    background: "rgba(15, 23, 42, 0.8)",
                                    backdropFilter: "blur(20px)",
                                    border: "2px solid #10b981",
                                    borderRadius: "1rem",
                                    padding: "2rem",
                                    textAlign: "center",
                                    position: "relative",
                                    boxShadow: "0 0 30px rgba(16, 185, 129, 0.3)"
                                }}>
                                    <div style={{
                                        position: "absolute",
                                        top: "-12px",
                                        left: "50%",
                                        transform: "translateX(-50%)",
                                        background: "#10b981",
                                        color: "white",
                                        padding: "0.25rem 1rem",
                                        borderRadius: "99px",
                                        fontSize: "0.75rem",
                                        fontWeight: 600
                                    }}>Recomendado</div>

                                    <h3 style={{
                                        color: "white",
                                        fontSize: "1.25rem",
                                        fontWeight: 600,
                                        marginBottom: "1rem"
                                    }}>Vant Pro Mensal</h3>

                                    <div style={{
                                        color: "#fbbf24",
                                        fontSize: "0.875rem",
                                        fontWeight: 600,
                                        marginBottom: "1rem"
                                    }}>Oferta por tempo limitado</div>

                                    <div style={{
                                        fontSize: "2.5rem",
                                        fontWeight: 300,
                                        color: "#10b981",
                                        marginBottom: "0.5rem"
                                    }}>7 dias por R$ 1,99</div>

                                    <div style={{
                                        color: "#94a3b8",
                                        marginBottom: "1.5rem"
                                    }}>Depois R$ 27,90/mês</div>

                                    <div style={{ textAlign: "left", marginBottom: "1.5rem" }}>
                                        <div style={{ color: "white", marginBottom: "0.5rem" }}>✓ CV otimizado</div>
                                        <div style={{ color: "white", marginBottom: "0.5rem" }}>✓ Simulador de entrevista</div>
                                        <div style={{ color: "white", marginBottom: "0.5rem" }}>✓ Biblioteca técnica</div>
                                        <div style={{ color: "white", marginBottom: "0.5rem" }}>✓ Análise ATS completa</div>
                                    </div>

                                    <button
                                        onClick={() => {
                                            setSelectedPlan("trial");
                                            setStage("checkout");
                                        }}
                                        style={{
                                            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                                            color: "white",
                                            border: "none",
                                            padding: "1rem 2rem",
                                            borderRadius: "0.5rem",
                                            fontWeight: 600,
                                            cursor: "pointer",
                                            width: "100%",
                                            fontSize: "1.1rem",
                                            boxShadow: "0 4px 15px rgba(16, 185, 129, 0.3)",
                                            transition: "transform 0.2s, box-shadow 0.2s"
                                        }}
                                    >
                                        COMEÇAR AGORA
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Rodapé */}
                        <div style={{
                            background: "rgba(15, 23, 42, 0.85)",
                            backdropFilter: "blur(24px)",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                            borderRadius: "1.5rem",
                            padding: "1.5rem",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center"
                        }}>
                            <div>
                                <div style={{
                                    color: "white",
                                    fontWeight: 500,
                                    marginBottom: "0.25rem"
                                }}>🎉 Análise gratuita concluída!</div>
                                <div style={{
                                    color: "#cbd5e1",
                                    fontSize: "0.875rem",
                                    fontWeight: 500
                                }}>Você tem 1 análise gratuita disponível</div>
                            </div>
                            <div style={{ display: "flex", gap: "1rem" }}>
                                <button
                                    onClick={() => setStage("hero")}
                                    style={{
                                        background: "transparent",
                                        color: "#cbd5e1",
                                        border: "1px solid rgba(255,255,255,0.1)",
                                        padding: "0.75rem 1.5rem",
                                        borderRadius: "0.5rem",
                                        fontWeight: 500,
                                        cursor: "pointer"
                                    }}
                                >
                                    Voltar para edição
                                </button>
                                <button
                                    onClick={() => {
                                        setSelectedPlan("trial");
                                        setStage("checkout");
                                    }}
                                    style={{
                                        background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                                        color: "white",
                                        border: "none",
                                        padding: "0.75rem 1.5rem",
                                        borderRadius: "0.5rem",
                                        fontWeight: 600,
                                        cursor: "pointer"
                                    }}
                                >
                                    Ver Planos PRO
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {stage === "activating_payment" && (
                <div style={{
                    minHeight: "100vh",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
                    padding: "2rem"
                }}>
                    <div style={{
                        background: "rgba(15, 23, 42, 0.8)",
                        backdropFilter: "blur(20px)",
                        border: "1px solid rgba(56, 189, 248, 0.2)",
                        borderRadius: "24px",
                        padding: "3rem 2rem",
                        maxWidth: "500px",
                        width: "100%",
                        textAlign: "center",
                        boxShadow: "0 20px 60px rgba(0, 0, 0, 0.4)"
                    }}>
                        {/* Spinner animado */}
                        <div style={{
                            width: "80px",
                            height: "80px",
                            margin: "0 auto 2rem",
                            border: "4px solid rgba(56, 189, 248, 0.1)",
                            borderTop: "4px solid #38BDF8",
                            borderRadius: "50%",
                            animation: "spin 1s linear infinite"
                        }} />

                        <h2 style={{
                            fontSize: "1.75rem",
                            fontWeight: 700,
                            color: "#F8FAFC",
                            marginBottom: "1rem"
                        }}>
                            Processando Pagamento
                        </h2>

                        <p style={{
                            fontSize: "1rem",
                            color: "#94A3B8",
                            lineHeight: 1.6,
                            marginBottom: "0.5rem"
                        }}>
                            Estamos ativando seu crédito...
                        </p>

                        <p style={{
                            fontSize: "0.875rem",
                            color: "#64748B",
                            lineHeight: 1.5
                        }}>
                            Você será redirecionado automaticamente em instantes.
                        </p>
                    </div>

                    <style>{`
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    `}</style>
                </div>
            )}

            {stage === "checkout" && (
                <div className="hero-container checkout-hero-container">
                    <div className="action-island-container checkout-island-container">
                        {(() => {
                            const rawPlanId = (selectedPlan || "credit_1").trim() as string;
                            const planId = rawPlanId === "basico"
                                ? "credit_1"
                                : rawPlanId === "premium_plus"
                                    ? "pro_monthly_early_bird"
                                    : rawPlanId;

                            const prices: any = {
                                credit_1: {
                                    price: 12.90,
                                    name: "1 Crédito Avulso",
                                    billing: "one_time",
                                    desc: "Otimização pontual"
                                },
                                pro_monthly: {
                                    price: 27.90,
                                    name: "VANT Pro Mensal",
                                    billing: "subscription",
                                    desc: "Otimizações ilimitadas"
                                },
                                pro_monthly_early_bird: {
                                    price: 19.90,
                                    name: "VANT Pro Mensal (Early Bird)",
                                    billing: "subscription",
                                    desc: "Preço vitalício especial"
                                },
                                pro_annual: {
                                    price: 239.00,
                                    name: "VANT Pro Anual",
                                    billing: "subscription",
                                    desc: "Economize 29% vs mensal"
                                },
                                trial: {
                                    price: 1.99,
                                    name: "Trial 7 Dias",
                                    billing: "trial",
                                    desc: "Teste PRO por 7 dias"
                                }
                            };

                            const plan = prices[planId] || prices.pro_monthly_early_bird || prices.credit_1;
                            // CORREÇÃO: Trial também é um fluxo de assinatura/recorrência
                            const isSubscription = plan.billing === "subscription" || plan.billing === "trial";

                            let billingLine = "✅ Pagamento único · Acesso vitalício aos créditos";
                            // CORREÇÃO: Melhorar o texto de billing para trial
                            if (plan.billing === "trial") {
                                billingLine = "✅ 7 dias de teste por R$ 1,99, depois assinatura mensal";
                            } else if (plan.billing === "subscription") {
                                billingLine = "✅ Assinatura mensal · Cancele quando quiser";
                            }

                            const boxHtml = `
                            <div style="background: rgba(15, 23, 42, 0.6); padding: 24px; border-radius: 12px; margin-bottom: 20px; border: 1px solid rgba(56, 189, 248, 0.2);">
                                <div style="display:flex; justify-content: space-between; align-items:start; margin-bottom: 12px;">
                                    <div>
                                        <div style="color:#94A3B8; font-size: 0.85rem; text-transform:uppercase; letter-spacing:1px; margin-bottom:4px;">Resumo do Pedido</div>
                                        <strong style="color:#F8FAFC; font-size: 1.1rem;">${plan.name}</strong>
                                        <div style="color:#64748B; font-size: 0.85rem; margin-top:4px;">${plan.desc}</div>
                                    </div>
                                    <div style="text-align:right;">
                                        <div style="color:#10B981; font-size: 1.5rem; font-weight:800;">R$ ${plan.price.toFixed(2).replace('.', ',')}</div>
                                        ${isSubscription ? '<div style="color:#94A3B8; font-size:0.75rem;">/mês</div>' : ''}
                                    </div>
                                </div>
                                <div style="height:1px; background:rgba(255,255,255,0.1); margin:16px 0;"></div>
                                <div style="color:#E2E8F0; font-size: 0.85rem; display:flex; align-items:center; gap:8px;">
                                    ${billingLine}
                                </div>
                            </div>
                            `;

                            return (
                                <>
                                    <div className="checkout-header">
                                        <div className="checkout-title">
                                            Finalizar Compra
                                        </div>
                                        <div className="checkout-subtitle">
                                            Ambiente seguro e criptografado
                                        </div>
                                    </div>

                                    {showUseCreditPrompt && authUserId && creditsRemaining > 0 && (
                                        <div style={{ marginTop: 10, marginBottom: 26, padding: "18px 20px", background: "rgba(16, 185, 129, 0.12)", border: "1px solid rgba(16, 185, 129, 0.35)", borderRadius: 12 }}>
                                            <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 14 }}>
                                                <div style={{ fontSize: "1.25rem", marginTop: 2 }}>✅</div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ color: "#E2E8F0", fontSize: "0.95rem", fontWeight: 600, marginBottom: 4 }}>
                                                        Você já tem créditos disponíveis
                                                    </div>
                                                    <div style={{ color: "#94A3B8", fontSize: "0.85rem", lineHeight: 1.5 }}>
                                                        Créditos atuais: <strong style={{ color: "#F8FAFC" }}>{creditsRemaining}</strong>. Deseja usar 1 crédito agora e iniciar a análise premium?
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setShowUseCreditPrompt(false);
                                                        pendingSkipPreview.current = true;
                                                        setStage("processing_premium");
                                                    }}
                                                    style={{
                                                        flex: "1 1 200px",
                                                        background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                                                        border: "none",
                                                        color: "white",
                                                        padding: "10px 14px",
                                                        borderRadius: 10,
                                                        fontWeight: 700,
                                                        cursor: "pointer"
                                                    }}
                                                >
                                                    Usar 1 crédito agora
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setShowUseCreditPrompt(false);
                                                        setSelectedPlan("credit_1");
                                                        setShowProCreditNotice(true);
                                                    }}
                                                    style={{
                                                        flex: "1 1 200px",
                                                        background: "transparent",
                                                        border: "1px solid rgba(56, 189, 248, 0.4)",
                                                        color: "#7dd3fc",
                                                        padding: "10px 14px",
                                                        borderRadius: 10,
                                                        fontWeight: 600,
                                                        cursor: "pointer"
                                                    }}
                                                >
                                                    Comprar 1 crédito avulso
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {showProCreditNotice && authUserId && (
                                        <div style={{ marginTop: 10, marginBottom: 26, padding: "18px 20px", background: "rgba(14, 165, 233, 0.12)", border: "1px solid rgba(56, 189, 248, 0.4)", borderRadius: 12, display: "flex", alignItems: "flex-start", gap: 16 }}>
                                            <div style={{ fontSize: "1.25rem", marginTop: 2 }}>💡</div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ color: "#E2E8F0", fontSize: "0.95rem", fontWeight: 600, marginBottom: 4 }}>
                                                    Você já é Pro — estamos ajustando para crédito avulso
                                                </div>
                                                <div style={{ color: "#94A3B8", fontSize: "0.85rem", lineHeight: 1.5 }}>
                                                    Seus créditos atuais: <strong style={{ color: "#F8FAFC" }}>{creditsRemaining}</strong>. Como não há créditos disponíveis no período, esta compra é de Crédito Avulso para você usar agora.
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setShowProCreditNotice(false)}
                                                style={{ background: "none", border: "none", color: "#94A3B8", fontSize: "0.9rem", cursor: "pointer", padding: 0 }}
                                                aria-label="Fechar aviso"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    )}

                                    <div className="checkout-order-summary">
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "12px" }}>
                                            <div>
                                                <div style={{ color: "#94A3B8", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Resumo do Pedido</div>
                                                <strong style={{ color: "#F8FAFC", fontSize: "1.1rem" }}>{plan.name}</strong>
                                                <div style={{ color: "#64748B", fontSize: "0.85rem", marginTop: "4px" }}>{plan.desc}</div>
                                            </div>
                                            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
                                                <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                                                    <div style={{ color: "#10B981", fontSize: "1.5rem", fontWeight: "700", lineHeight: "1" }}>
                                                        R$ {plan.price.toFixed(2).replace(".", ",")}
                                                    </div>
                                                    {/* Mostrar botão Alterar apenas se não for crédito avulso (credit_1) */}
                                                    {planId !== "credit_1" && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setStage("preview")}
                                                            style={{
                                                                background: "none",
                                                                border: "none",
                                                                color: "#94A3B8",
                                                                fontSize: "0.75rem",
                                                                cursor: "pointer",
                                                                padding: "2px 4px",
                                                                borderRadius: "4px",
                                                                textDecoration: "underline",
                                                                transition: "all 0.2s ease",
                                                                whiteSpace: "nowrap",
                                                                marginLeft: "8px"
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                e.currentTarget.style.color = "#F8FAFC";
                                                                e.currentTarget.style.background = "rgba(148, 163, 184, 0.1)";
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.color = "#94A3B8";
                                                                e.currentTarget.style.background = "none";
                                                            }}
                                                        >
                                                            Alterar
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ height: "1px", background: "rgba(255,255,255,0.1)", margin: "16px 0" }}></div>
                                        <div style={{ color: "#E2E8F0", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "8px" }}>
                                            {billingLine}
                                        </div>
                                    </div>

                                    {emailSent ? (
                                        /* ESTADO DE ESPERA ATIVA - EMAIL ENVIADO */
                                        <div className="checkout-email-sent">
                                            <div className="checkout-email-card">
                                                <div className="checkout-email-icon">
                                                    📬
                                                </div>

                                                <h2 style={{
                                                    color: "#F8FAFC",
                                                    fontSize: "1.5rem",
                                                    fontWeight: 600,
                                                    marginBottom: 8
                                                }}>
                                                    Enviamos um e-mail para você!
                                                </h2>

                                                <p style={{
                                                    color: "#94A3B8",
                                                    fontSize: "0.95rem",
                                                    lineHeight: 1.5,
                                                    marginBottom: 24
                                                }}>
                                                    Para sua segurança, enviamos um link de recuperação para <strong>{authEmail}</strong>.<br />
                                                    Clique no link do e-mail e nós traremos você de volta para finalizar sua compra automaticamente.
                                                </p>

                                                <div style={{
                                                    background: "rgba(16, 185, 129, 0.1)",
                                                    border: "1px solid #10B981",
                                                    borderRadius: 8,
                                                    padding: 12,
                                                    color: "#10B981",
                                                    fontSize: "0.9rem",
                                                    marginBottom: 20
                                                }}>
                                                    ✅ Link enviado com sucesso!
                                                </div>

                                                {resendCountdown > 0 ? (
                                                    <p style={{
                                                        color: "#64748B",
                                                        fontSize: "0.8rem",
                                                        margin: 0
                                                    }}>
                                                        Não recebeu? Reenviar em {resendCountdown}s
                                                    </p>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setEmailSent(false);
                                                            setResendCountdown(0);
                                                            handleForgotPassword();
                                                        }}
                                                        style={{
                                                            background: "rgba(59, 130, 246, 0.1)",
                                                            border: "1px solid rgba(59, 130, 246, 0.3)",
                                                            borderRadius: 8,
                                                            color: "#3B82F6",
                                                            fontSize: "0.9rem",
                                                            fontWeight: 500,
                                                            cursor: "pointer",
                                                            padding: "8px 16px",
                                                            transition: "all 0.2s"
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.background = "rgba(59, 130, 246, 0.15)";
                                                            e.currentTarget.style.borderColor = "rgba(59, 130, 246, 0.5)";
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.background = "rgba(59, 130, 246, 0.1)";
                                                            e.currentTarget.style.borderColor = "rgba(59, 130, 246, 0.3)";
                                                        }}
                                                    >
                                                        🔄 Reenviar e-mail
                                                    </button>
                                                )}

                                                <button
                                                    type="button"
                                                    onClick={() => setEmailSent(false)}
                                                    style={{
                                                        background: "none",
                                                        border: "none",
                                                        color: "#94A3B8",
                                                        fontSize: "0.8rem",
                                                        cursor: "pointer",
                                                        textDecoration: "underline",
                                                        marginTop: 16,
                                                        padding: 0
                                                    }}
                                                >
                                                    ← Voltar para o formulário
                                                </button>
                                            </div>
                                        </div>
                                    ) : authUserId ? (
                                        <>
                                            <div style={{ marginBottom: 16, padding: "12px 16px", background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: 8, display: "flex", alignItems: "center", gap: 10 }}>
                                                <div style={{ fontSize: "1.2rem" }}>👤</div>
                                                <div style={{ overflow: "hidden" }}>
                                                    <div style={{ color: "#10B981", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase" }}>Logado como</div>
                                                    <div style={{ color: "#E2E8F0", fontSize: "0.9rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{authEmail}</div>
                                                </div>
                                            </div>
                                            <div data-testid="stButton" className="stButton" style={{ width: "100%" }}>
                                                <button type="button" data-kind="primary" onClick={startCheckout} style={{ width: "100%", height: 56, fontSize: "1.1rem", background: "#10B981", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 12px rgba(16, 185, 129, 0.4)" }}>
                                                    IR PARA PAGAMENTO SEGURO
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <form onSubmit={(e) => { e.preventDefault(); handleCheckoutWithAuth(); }} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                            <div style={{ color: "#94A3B8", fontSize: "0.8rem", textAlign: "center", marginBottom: 16, marginTop: 8 }}>
                                                Crie sua conta ou faça login para salvar seus créditos
                                            </div>
                                            <div>
                                                <label style={{
                                                    display: "block",
                                                    color: "#94A3B8",
                                                    fontSize: "0.75rem",
                                                    fontWeight: 600,
                                                    marginBottom: "6px",
                                                    letterSpacing: "0.5px",
                                                    textTransform: "uppercase"
                                                }}>
                                                    E-mail
                                                </label>
                                                <input
                                                    type="email"
                                                    placeholder="seu@email.com"
                                                    value={authEmail}
                                                    onChange={(e) => setAuthEmail(e.target.value)}
                                                    autoComplete="email"
                                                    style={{
                                                        width: "100%", padding: "14px 16px", background: "rgba(15, 23, 42, 0.8)",
                                                        border: "1px solid rgba(148, 163, 184, 0.3)", borderRadius: 8,
                                                        color: "#F8FAFC", fontSize: "1rem", outline: "none",
                                                        boxSizing: "border-box",
                                                    }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{
                                                    display: "block",
                                                    color: "#94A3B8",
                                                    fontSize: "0.75rem",
                                                    fontWeight: 600,
                                                    marginBottom: "6px",
                                                    letterSpacing: "0.5px",
                                                    textTransform: "uppercase"
                                                }}>
                                                    Senha
                                                </label>
                                                <div style={{ position: "relative", width: "100%" }}>
                                                    <input
                                                        type={showPassword ? "text" : "password"}
                                                        placeholder="mínimo 6 caracteres"
                                                        value={authPassword}
                                                        onChange={(e) => setAuthPassword(e.target.value)}
                                                        autoComplete="new-password"
                                                        style={{
                                                            width: "100%",
                                                            padding: "14px 48px 14px 16px",
                                                            background: "rgba(15, 23, 42, 0.8)",
                                                            border: `1px solid ${checkoutError === "__WRONG_PASSWORD__" ? "#EF4444" : "rgba(148, 163, 184, 0.3)"}`,
                                                            borderRadius: 8,
                                                            color: "#F8FAFC",
                                                            fontSize: "1rem",
                                                            outline: "none",
                                                            boxSizing: "border-box",
                                                        }}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        style={{
                                                            position: "absolute",
                                                            right: "12px",
                                                            top: "50%",
                                                            transform: "translateY(-50%)",
                                                            background: "none",
                                                            border: "none",
                                                            color: "#94A3B8",
                                                            cursor: "pointer",
                                                            padding: "4px",
                                                            borderRadius: "4px",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            transition: "all 0.2s ease"
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.color = "#CBD5E1";
                                                            e.currentTarget.style.background = "rgba(148, 163, 184, 0.1)";
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.color = "#94A3B8";
                                                            e.currentTarget.style.background = "none";
                                                        }}
                                                    >
                                                        {showPassword ? (
                                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                                                <line x1="1" y1="1" x2="23" y2="23"></line>
                                                            </svg>
                                                        ) : (
                                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                                                <circle cx="12" cy="12" r="3"></circle>
                                                            </svg>
                                                        )}
                                                    </button>
                                                </div>
                                                {checkoutError === "__WRONG_PASSWORD__" && (
                                                    <div style={{ marginTop: 8 }}>
                                                        <div style={{
                                                            padding: 12,
                                                            background: "rgba(239, 68, 68, 0.1)",
                                                            border: "1px solid rgba(239, 68, 68, 0.3)",
                                                            borderRadius: 8,
                                                            marginBottom: 8,
                                                            display: "flex",
                                                            justifyContent: "space-between",
                                                            alignItems: "center"
                                                        }}>
                                                            <p style={{
                                                                color: "#EF4444",
                                                                fontSize: "0.85rem",
                                                                margin: 0,
                                                                lineHeight: 1.4,
                                                                flex: 1
                                                            }}>
                                                                😅 Ops! Essa não é a senha correta para este e-mail.
                                                            </p>
                                                            <button
                                                                type="button"
                                                                onClick={handleForgotPassword}
                                                                disabled={isAuthenticating}
                                                                style={{
                                                                    background: "none",
                                                                    border: "none",
                                                                    color: "#3B82F6",
                                                                    fontSize: "0.8rem",
                                                                    cursor: isAuthenticating ? "wait" : "pointer",
                                                                    textDecoration: "underline",
                                                                    padding: "2px 4px",
                                                                    borderRadius: "4px",
                                                                    transition: "all 0.2s",
                                                                    whiteSpace: "nowrap"
                                                                }}
                                                                onMouseEnter={(e) => {
                                                                    if (!isAuthenticating) {
                                                                        e.currentTarget.style.color = "#2563EB";
                                                                        e.currentTarget.style.background = "rgba(59, 130, 246, 0.1)";
                                                                    }
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    e.currentTarget.style.color = "#3B82F6";
                                                                    e.currentTarget.style.background = "none";
                                                                }}
                                                            >
                                                                Esqueci minha senha
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            {checkoutError && checkoutError !== "__WRONG_PASSWORD__" && (
                                                <div style={{ padding: 10, background: checkoutError.startsWith("✅") ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)", border: `1px solid ${checkoutError.startsWith("✅") ? "#10B981" : "#EF4444"}`, borderRadius: 8, color: checkoutError.startsWith("✅") ? "#10B981" : "#EF4444", fontSize: "0.85rem", textAlign: "center" }}>
                                                    {checkoutError}

                                                    {/* Mostrar botão de crédito avulso se erro for de créditos esgotados */}
                                                    {checkoutError.includes("créditos do período") && (
                                                        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                                                            <div style={{ color: "#94A3B8", fontSize: "0.75rem", marginBottom: 4 }}>
                                                                💡 Compre crédito avulso para continuar:
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setSelectedPlan("credit_1");
                                                                    setCheckoutError("");
                                                                }}
                                                                style={{
                                                                    width: "100%",
                                                                    padding: "14px",
                                                                    background: "rgba(16, 185, 129, 0.15)",
                                                                    border: "2px solid rgba(16, 185, 129, 0.5)",
                                                                    borderRadius: 8,
                                                                    color: "#10B981",
                                                                    fontSize: "0.95rem",
                                                                    fontWeight: 700,
                                                                    cursor: "pointer",
                                                                    transition: "all 0.2s"
                                                                }}
                                                                onMouseEnter={(e) => {
                                                                    e.currentTarget.style.background = "rgba(16, 185, 129, 0.25)";
                                                                    e.currentTarget.style.borderColor = "rgba(16, 185, 129, 0.7)";
                                                                    e.currentTarget.style.transform = "translateY(-2px)";
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    e.currentTarget.style.background = "rgba(16, 185, 129, 0.15)";
                                                                    e.currentTarget.style.borderColor = "rgba(16, 185, 129, 0.5)";
                                                                    e.currentTarget.style.transform = "translateY(0)";
                                                                }}
                                                            >
                                                                ✨ Comprar 1 Crédito Avulso<br />
                                                                <span style={{ fontSize: "0.8rem", opacity: 0.9 }}>R$ 12,90 · Pagamento único</span>
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            <button
                                                type="submit"
                                                disabled={isAuthenticating}
                                                style={{
                                                    width: "100%", height: 56, fontSize: "1.1rem",
                                                    background: isAuthenticating ? "#64748B" : "#10B981",
                                                    color: "#fff", border: "none", borderRadius: 10,
                                                    fontWeight: 700, cursor: isAuthenticating ? "wait" : "pointer",
                                                    boxShadow: "0 4px 12px rgba(16, 185, 129, 0.4)",
                                                    transition: "all 0.2s",
                                                }}
                                            >
                                                {isAuthenticating ? "Processando..." : "IR PARA PAGAMENTO SEGURO"}
                                            </button>

                                            <div style={{ color: "#64748B", fontSize: "0.7rem", textAlign: "center", lineHeight: 1.4 }}>
                                                Ao continuar, você concorda com nossos <a href="/termos" target="_blank" style={{ color: "#94A3B8", textDecoration: "underline" }}>Termos de Uso</a> e <a href="/privacidade" target="_blank" style={{ color: "#94A3B8", textDecoration: "underline" }}>Política de Privacidade</a>. Uma conta será criada automaticamente se você ainda não tiver uma.
                                            </div>

                                            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "4px 0" }}>
                                                <div style={{ flex: 1, height: 1, background: "rgba(148, 163, 184, 0.2)" }} />
                                                <span style={{ color: "#64748B", fontSize: "0.8rem" }}>ou</span>
                                                <div style={{ flex: 1, height: 1, background: "rgba(148, 163, 184, 0.2)" }} />
                                            </div>

                                            <button
                                                type="button"
                                                onClick={handleGoogleLogin}
                                                disabled={isAuthenticating}
                                                style={{
                                                    width: "100%", height: 48, background: "#fff", color: "#1f2937",
                                                    border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8,
                                                    fontSize: "0.95rem", fontWeight: 600, display: "flex",
                                                    alignItems: "center", justifyContent: "center", gap: 10,
                                                    cursor: isAuthenticating ? "not-allowed" : "pointer",
                                                    opacity: isAuthenticating ? 0.6 : 1,
                                                }}
                                            >
                                                <svg width="18" height="18" viewBox="0 0 18 18">
                                                    <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" />
                                                    <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" />
                                                    <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z" />
                                                    <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" />
                                                </svg>
                                                Continuar com Google
                                            </button>
                                        </form>
                                    )}

                                    <div className="payment-methods-section" style={{ marginTop: "24px", padding: "24px" }}>
                                        <div className="payment-icons-container">
                                            <img src="/icons/pix.svg" alt="Pix" style={{ height: "24px", width: "auto", opacity: "0.8" }} />
                                            <img src="/icons/visa.svg" alt="Visa" style={{ height: "24px", width: "auto", opacity: "0.8" }} />
                                            <img src="/icons/mastercard.svg" alt="Mastercard" style={{ height: "24px", width: "auto", opacity: "0.8" }} />
                                            <img src="/icons/amex.svg" alt="American Express" style={{ height: "24px", width: "auto", opacity: "0.8" }} />
                                        </div>
                                    </div>

                                    <div className="trust-signals-section">
                                        <div className="trust-security-text">
                                            <span style={{ fontSize: "0.9rem" }}>🔒</span>
                                            <span>
                                                Pagamento processado via Stripe • Dados Criptografados
                                            </span>
                                        </div>
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                </div>
            )}

            <AuthModal
                isOpen={showAuthModal}
                selectedPlan={selectedPlan}
                supabase={supabase}
                stage={stage}
                onSuccess={(userId, email) => {
                    setAuthUserId(userId);
                    setAuthEmail(email);
                    setShowAuthModal(false);
                    // Não forçar checkout - deixar useEffect decidir baseado no status do usuário
                }}
                onClose={() => setShowAuthModal(false)}
            />

            <NewOptimizationModal
                isOpen={showNewOptimizationModal}
                onClose={() => setShowNewOptimizationModal(false)}
                creditsRemaining={creditsRemaining}
                authUserId={authUserId}
                lastCV={lastCVData}
            />
        </main>
    );
}
