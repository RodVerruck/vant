"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { AppStage, PlanType, PreviewData, ReportData, PilaresData, GapFatal, Book, PricesMap, HistoryItem } from "@/types";
import { PaidStage } from "@/components/PaidStage";
import { AuthModal } from "@/components/AuthModal";
import { HistoryStage } from "@/components/HistoryStage";
import { PricingSimplified } from "@/components/PricingSimplified";
import { NeonOffer } from "@/components/NeonOffer";
import { calcPotencial, calculateProjectedScore } from "@/lib/helpers";

type JsonObject = Record<string, unknown>;

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
const HERO_HEADER_HTML = `
    <div class="hero-section">
        <div class="badge-live" data-cy="main-heading">
            <span style="font-weight: 800; letter-spacing: 1.5px; color: #60A5FA;">VANT</span>
            <span style="opacity: 0.4; margin: 0 6px;">·</span>
            <span class="vant-tooltip" 
                  tabindex="0" 
                  style="border-bottom: none; cursor: help;" 
                  data-tooltip="Mais de 50.000 CVs otimizados. Taxa de sucesso comprovada em seleções de grandes empresas.">
                50K+ Currículos Otimizados
            </span>
        </div>

        <div class="headline">
            Vença o algoritmo ATS.<br>
            <span class="highlight">Chegue na mão do recrutador.</span>
        </div>

        <div class="subheadline" style="max-width: 420px;">
            IA que otimiza seu CV para passar nos filtros automáticos e chegar no recrutador.
        </div>
    </div>
`;

const TRUST_BAR_HTML = `
    <div class="hero-section" style="margin-top: 24px;">
        <div class="stats-grid">
            <div class="stat-card">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div class="stat-icon" style="background: rgba(56, 189, 248, 0.1); color: #38BDF8;">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
                    </div>
                    <div>
                        <div class="stat-number">+34%</div>
                        <div class="stat-label">
                            aprovação ATS
                            <span class="vant-tooltip" tabindex="0" data-tooltip="Aumento médio comparado ao original (Base: 50k+ processamentos)." style="margin-left: 4px; opacity: 0.6; border-bottom: 1px dotted #CBD5E1; cursor: help;"></span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="stat-card">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div class="stat-icon" style="background: rgba(16, 185, 129, 0.1); color: #10B981;">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    </div>
                    <div>
                        <div class="stat-number">3x</div>
                        <div class="stat-label">
                            mais entrevistas
                            <span class="vant-tooltip" tabindex="0" data-tooltip="Média de conversão dos últimos 3 meses." style="margin-left: 4px; opacity: 0.6; border-bottom: 1px dotted #CBD5E1; cursor: help;"></span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="stat-card">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div class="stat-icon" style="background: rgba(139, 92, 246, 0.1); color: #8B5CF6;">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    </div>
                    <div>
                        <div class="stat-number">100%</div>
                        <div class="stat-label">
                            Privado e Seguro
                            <span class="vant-tooltip" tabindex="0" data-tooltip="Processamento em memória. Seus dados são destruídos após a sessão." style="margin-left: 4px; opacity: 0.6; border-bottom: 1px dotted #CBD5E1; cursor: help;"></span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
`;

const VALUE_PROP_HTML = `
    <div class="hero-section" style="margin-top: 60px;">
        <div style="text-align: center; margin-bottom: 32px;">
            <h3 style="color: #F8FAFC; font-size: 1.5rem; font-weight: 700; margin: 0 0 8px 0;">Por que funciona</h3>
            <p style="color: #CBD5E1; font-size: 0.9rem; margin: 0;">Tecnologia baseada em dados reais de mercado</p>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; width: 100%; margin: 0 auto;">
            <div style="background: rgba(74, 158, 255, 0.08); border: 1px solid rgba(74, 158, 255, 0.2); border-left: 3px solid #4A9EFF; border-radius: 12px; padding: 24px;">
                <div style="font-size: 2.2rem; margin-bottom: 16px;">🤖</div>
                <div style="color: #F8FAFC; font-size: 1.1rem; font-weight: 700; margin-bottom: 12px; line-height: 1.3;">
                    IA Treinada com <span style="color: #4A9EFF; font-size: 1.3rem;">50K+</span> Vagas
                </div>
                <div style="color: #CBD5E1; font-size: 0.9rem; line-height: 1.6;">
                    Analisamos milhares de descrições de vagas reais para identificar padrões de sucesso
                </div>
            </div>
            
            <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.2); border-left: 3px solid #10B981; border-radius: 12px; padding: 24px;">
                <div style="font-size: 2.2rem; margin-bottom: 16px;">🎯</div>
                <div style="color: #F8FAFC; font-size: 1.1rem; font-weight: 700; margin-bottom: 12px; line-height: 1.3;">
                    <span style="color: #10B981; font-size: 1.4rem;">43</span> Critérios ATS
                </div>
                <div style="color: #CBD5E1; font-size: 0.9rem; line-height: 1.6;">
                    Verificamos todos os pontos que sistemas automáticos filtram antes do recrutador
                </div>
            </div>
            
            <div style="background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.2); border-left: 3px solid #F59E0B; border-radius: 12px; padding: 24px;">
                <div style="font-size: 2.2rem; margin-bottom: 16px;">📊</div>
                <div style="color: #F8FAFC; font-size: 1.1rem; font-weight: 700; margin-bottom: 12px; line-height: 1.3;">
                    Padrões de <span style="color: #F59E0B;">Mercado</span>
                </div>
                <div style="color: #CBD5E1; font-size: 0.9rem; line-height: 1.6;">
                    Otimização baseada em CVs aprovados em processos seletivos reais
                </div>
            </div>
        </div>
        <div style="text-align: center; margin-top: 20px; color: #94A3B8; font-size: 0.8rem; font-style: italic;">
            Baseado em 50.000+ processamentos reais
        </div>
    </div>
`;

const ANALYSIS_CARD_HTML = `
    <div class="hero-section" style="margin-top: 48px;">
        <div style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(74, 158, 255, 0.05)); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 16px; padding: 32px; text-align: center; max-width: 700px; margin: 0 auto;">
            <div style="font-size: 2rem; margin-bottom: 16px;">🎯</div>
            <h3 style="color: #F8FAFC; font-size: 1.3rem; font-weight: 700; margin: 0 0 12px 0;">Análise Instantânea</h3>
            <p style="color: #E2E8F0; font-size: 1rem; line-height: 1.6; margin: 0 0 20px 0;">
                Descubra seu score ATS e os erros que estão te eliminando.<br>
                <strong>Sem compromisso. Sem cartão.</strong>
            </p>
            <div style="display: flex; flex-direction: column; gap: 12px; align-items: center; margin-top: 24px;">
                <div style="display: flex; align-items: center; gap: 8px; color: #CBD5E1; font-size: 0.85rem;">
                    <span style="color: #10B981;">✓</span> Score ATS em segundos
                </div>
                <div style="display: flex; align-items: center; gap: 8px; color: #CBD5E1; font-size: 0.85rem;">
                    <span style="color: #10B981;">✓</span> Erros críticos detectados
                </div>
                <div style="display: flex; align-items: center; gap: 8px; color: #CBD5E1; font-size: 0.85rem;">
                    <span style="color: #10B981;">✓</span> Dados destruídos após análise
                </div>
            </div>
        </div>
    </div>
`;

const LINKEDIN_INSTRUCTIONS_HTML = `
    <div style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(56, 189, 248, 0.05)); 
                border-left: 3px solid #10B981; 
                padding: 16px; 
                margin-bottom: 12px;
                border-radius: 4px;">
        <p style="color: #E2E8F0; font-size: 0.9rem; margin: 0 0 12px 0; line-height: 1.5; font-weight: 500;">
            Quer descobrir os segredos de quem já foi contratado?
        </p>
        <p style="color: #CBD5E1; font-size: 0.85rem; margin: 0; line-height: 1.6;">
            Anexe o CV de um profissional da área e a IA fará engenharia reversa para aplicar os acertos no seu perfil.
            <br><br>
            <span style="color: #94A3B8; font-size: 0.8rem;">
                Dica: Baixe um perfil do LinkedIn em PDF (botão "Mais" → "Salvar como PDF")
            </span>
        </p>
    </div>
`;

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
    setCreditsRemaining: (credits: number) => void
) {
    const apiUrl = getApiUrl();
    const maxAttempts = 120; // 2 minutos com polling a cada 1s
    let attempts = 0;

    while (attempts < maxAttempts) {
        try {
            const response = await fetch(`${apiUrl}/api/analysis/status/${sessionId}`);
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

            // Esperar antes do próximo polling
            await new Promise(resolve => setTimeout(resolve, 1000));
            attempts++;

        } catch (error) {
            console.error("[Polling] Erro:", error);
            throw error;
        }
    }

    throw new Error('Timeout: Análise demorou mais de 2 minutos');
}

export default function AppPage() {
    // AbortController para cancelar requisições ao navegar
    const abortControllerRef = useRef<AbortController | null>(null);

    // Estados principais
    const [stage, setStage] = useState<AppStage>("hero");
    // Flag para evitar flash do hero ao abrir item do histórico vindo do Dashboard
    const [loadingHistoryItem, setLoadingHistoryItem] = useState(() => {
        if (typeof window !== "undefined" && localStorage.getItem("vant_dashboard_open_history_id")) {
            return true;
        }
        return false;
    });
    const [selectedPlan, setSelectedPlan] = useState<PlanType>("basico");
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
    const [creditsRemaining, setCreditsRemaining] = useState(0);
    const [creditsLoading, setCreditsLoading] = useState(false);
    const [needsActivation, setNeedsActivation] = useState(false);
    const [isActivating, setIsActivating] = useState(false);
    const [isLoginMode, setIsLoginMode] = useState(true);  // ← NOVO (true = login, false = cadastro)
    const [isAuthenticating, setIsAuthenticating] = useState(false);  // ← NOVO
    const [showAuthModal, setShowAuthModal] = useState(false);
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

    // Simular progressão gradual enquanto aguarda resposta do backend
    useEffect(() => {
        if (stage !== "processing_premium") return;

        const progressInterval = setInterval(() => {
            setProgress(prev => {
                // Se já atingiu 35%, manter estável até backend responder
                if (prev >= 35 && prev < 90) {
                    // Pequenas variações para mostrar atividade
                    return prev + (Math.random() > 0.7 ? 0.5 : 0);
                }
                // Se ainda não chegou em 35%, progredir gradualmente
                if (prev < 35) {
                    return Math.min(35, prev + 2);
                }
                return prev;
            });

            // Atualizar tempo estimado baseado no progresso
            setEstimatedTimeRemaining(prev => {
                const elapsed = (Date.now() - processingStartTime) / 1000; // segundos
                const avgRate = progress / Math.max(elapsed, 1); // % por segundo
                const remaining = (100 - progress) / Math.max(avgRate, 0.5); // segundos restantes

                // Não deixar ficar abaixo de 15 segundos até backend responder
                if (progress < 90) {
                    return Math.max(15, Math.min(120, Math.ceil(remaining)));
                }
                return Math.max(5, Math.ceil(remaining));
            });
        }, 800); // Atualizar a cada 800ms

        return () => clearInterval(progressInterval);
    }, [stage, progress, processingStartTime]);

    // Atualizar mensagens conforme o progresso
    useEffect(() => {
        if (stage === "processing_premium") {
            const messageIndex = Math.min(
                Math.floor((progress / 100) * premiumMessages.length),
                premiumMessages.length - 1
            );
            setStatusText(premiumMessages[messageIndex]);
        }
    }, [progress, stage]);

    const uploaderInputRef = useRef<HTMLInputElement | null>(null);
    const competitorUploaderInputRef = useRef<HTMLInputElement | null>(null);

    const supabase = useMemo((): SupabaseClient | null => {
        // Limpar instâncias antigas do Supabase para evitar conflitos
        if (typeof window !== 'undefined') {
            // Limpar localStorage com padrão mais abrangente
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('supabase.auth.')) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key));
        }

        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (!url || !key) {
            return null;
        }

        // Criar instância única com storage key customizada
        return createClient(url, key, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                storageKey: 'vant-supabase-auth', // Chave única para evitar conflitos
            }
        });
    }, []);

    // Hook do Next.js para capturar parâmetros da URL de forma robusta
    const searchParams = useSearchParams();

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
            setStage("checkout");
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

        const returnStage = localStorage.getItem("vant_auth_return_stage");
        const returnPlan = localStorage.getItem("vant_auth_return_plan");

        // Verificar se há fluxo ativo que impede redirect ao Dashboard
        const hasHistoryItem = localStorage.getItem("vant_dashboard_open_history_id");
        const hasReturnStage = !!returnStage;
        const checkoutPending = localStorage.getItem("checkout_pending");
        const hasCheckoutPending = !!checkoutPending;
        const hasAutoProcess = !!localStorage.getItem("vant_auto_process");
        // Se stage não é hero, usuário está em fluxo ativo (preview, checkout, analyzing, etc.)
        const hasNonHeroStage = stage !== "hero";
        const hasActiveFlow = returnPlan || hasReturnStage || hasHistoryItem || hasCheckoutPending || hasNonHeroStage || hasAutoProcess;

        console.log("[Auth] Verificando fluxo:", { returnPlan: !!returnPlan, hasReturnStage, hasCheckoutPending, hasNonHeroStage, stage });

        if (!hasActiveFlow) {
            console.log("[Auth] Sem fluxo ativo, redirecionando para /dashboard");
            window.location.href = "/dashboard";
            return;
        }

        // Processar fluxo ativo normalmente (pagamento, history, etc.)
        if (returnPlan) {
            console.log("[Restoration] Restaurando plano e indo para checkout...");
            setSelectedPlan(returnPlan as PlanType);
            localStorage.removeItem("vant_auth_return_plan");
            setStage("checkout");
            localStorage.removeItem("vant_auth_return_stage");
        } else if (returnStage) {
            localStorage.removeItem("vant_auth_return_stage");
            if (returnStage !== "hero") {
                console.log("[Restoration] Restaurando stage:", returnStage);
                setStage(returnStage as AppStage);
            }
        } else if (hasCheckoutPending) {
            try {
                const data = JSON.parse(checkoutPending!);
                localStorage.removeItem("checkout_pending");
                console.log("[Auth] Processando checkout_pending:", data);
                setSelectedPlan(data.plan);
                setStage("checkout");
            } catch (error) {
                console.error("[Auth] Erro ao processar checkout_pending:", error);
                localStorage.removeItem("checkout_pending");
            }
        } else if (hasAutoProcess) {
            // Veio do dashboard após pagamento — restaurar CV/vaga e iniciar processamento
            localStorage.removeItem("vant_auto_process");
            const savedJob = localStorage.getItem("vant_jobDescription");

            if (savedJob) {
                setJobDescription(savedJob);
            }

            // Restaurar arquivo do IndexedDB (async)
            (async () => {
                const restoredFile = await getFileFromIDB();
                console.log("[Auth] Auto-process: dados encontrados:", { hasJob: !!savedJob, hasFile: !!restoredFile });

                if (savedJob && restoredFile) {
                    setFile(restoredFile);
                    await clearFileFromIDB();
                    console.log("[Auth] Auto-process: arquivo restaurado do IndexedDB, iniciando processing_premium");
                    setStage("processing_premium");
                } else {
                    console.log("[Auth] Auto-process: dados incompletos, indo para hero com vaga preenchida");
                    setStage("hero");
                }
            })();
        }
        // hasHistoryItem é tratado pelo useEffect dedicado abaixo

        // Sincronizar créditos em background
        (async () => {
            try {
                const resp = await fetch(`${getApiUrl()}/api/user/status/${authUserId}`);
                if (resp.ok) {
                    const data = await resp.json();
                    if (data.credits_remaining > 0) {
                        setCreditsRemaining(data.credits_remaining);
                        localStorage.setItem('vant_cached_credits', String(data.credits_remaining));
                        setSelectedPlan("premium_plus");
                        console.log("[Auth] Créditos sincronizados:", data.credits_remaining);
                    }
                }
            } catch (e) {
                console.error("[Auth] Erro ao sincronizar créditos:", e);
            }
        })();
    }, [authUserId]);

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
        }
    }, [authUserId, stage, isAuthenticating]);

    // NOVO: useEffect para abrir item do histórico vindo do Dashboard
    useEffect(() => {
        if (!authUserId || typeof window === "undefined") return;

        const historyId = localStorage.getItem("vant_dashboard_open_history_id");
        if (!historyId) return;

        // Limpar flag imediatamente para evitar loop
        localStorage.removeItem("vant_dashboard_open_history_id");

        console.log("[Dashboard→App] Abrindo item do histórico:", historyId);

        (async () => {
            try {
                const response = await fetch(`${getApiUrl()}/api/user/history/detail?id=${historyId}`);
                if (!response.ok) throw new Error(`Erro ${response.status}`);

                const fullResult = await response.json();
                if (fullResult.data) {
                    setReportData(fullResult.data as ReportData);
                    setStage("paid");
                }
            } catch (err) {
                console.error("[Dashboard→App] Erro ao carregar histórico:", err);
            } finally {
                setLoadingHistoryItem(false);
            }
        })();
    }, [authUserId]);

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
                        plan_id: selectedPlan || "basico"
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

                // Sincronizar entitlements para garantir
                if (authUserId) {
                    await syncEntitlements(authUserId);
                }

                // Sinalizar que acabou de pagar (dashboard vai detectar)
                localStorage.setItem('vant_just_paid', 'true');

                // Redirecionar para dashboard — créditos já estão no cache
                console.log("[needsActivation] Redirecionando para /dashboard...");
                window.location.href = "/dashboard";
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

    async function startCheckout() {
        setCheckoutError("");

        // Resetar estado de ativação ao iniciar novo checkout
        activationAttempted.current = false;

        const planId = (selectedPlan || "basico").trim();

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

    // Recuperar senha inline (sem sair da página)
    async function handleForgotPassword() {
        if (!supabase) {
            setCheckoutError("Erro de configuração. Tente recarregar a página.");
            return;
        }

        // Validação de email mais robusta
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!authEmail || !emailRegex.test(authEmail)) {
            setCheckoutError("Digite um e-mail válido para receber o link de recuperação (ex: nome@dominio.com).");
            return;
        }

        try {
            setIsAuthenticating(true); // Feedback visual

            // 1. Determina a URL base correta (Localhost ou Produção)
            const origin = window.location.origin;
            const redirectUrl = new URL(`${origin}/app/reset-password`);

            // 2. Anexa o contexto do checkout (O Pulo do Gato 🐈)
            // Isso garante que o link no email já saiba para onde voltar
            if (stage === "checkout") {
                redirectUrl.searchParams.set("return_to", "checkout");
                if (selectedPlan) {
                    redirectUrl.searchParams.set("return_plan", selectedPlan);
                }
            }

            console.log("🚀 [ForgotPassword] URL Gerada para Redirect:", redirectUrl.toString());

            const client = supabase as SupabaseClient;
            const { error } = await client.auth.resetPasswordForEmail(authEmail.trim().toLowerCase(), {
                redirectTo: redirectUrl.toString(),
            });

            if (error) throw error;

            // Ativar estado de espera ativa
            setEmailSent(true);
            setCheckoutError(""); // Limpar erro anterior

            // Iniciar countdown para reenvio (30 segundos)
            setResendCountdown(30);
            const countdownInterval = setInterval(() => {
                setResendCountdown((prev: number) => {
                    if (prev <= 1) {
                        clearInterval(countdownInterval);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            console.log("✅ [ForgotPassword] Email de recuperação enviado para:", authEmail);

        } catch (e: unknown) {
            console.error("[ForgotPassword] Erro ao enviar email:", e);

            // Tratamento de erros mais específico
            if (e instanceof Error) {
                const errorMsg = e.message.toLowerCase();

                if (errorMsg.includes("too many requests") || errorMsg.includes("rate limit")) {
                    setCheckoutError("Muitas tentativas de recuperação. Aguarde 10 minutos antes de tentar novamente.");
                } else if (errorMsg.includes("user not found") || errorMsg.includes("not found")) {
                    setCheckoutError("Este e-mail não está cadastrado em nosso sistema.");
                } else if (errorMsg.includes("invalid email") || errorMsg.includes("email format")) {
                    setCheckoutError("Formato de e-mail inválido. Verifique o endereço digitado.");
                } else {
                    setCheckoutError("Erro ao enviar email de recuperação. Tente novamente em alguns instantes.");
                }
            } else {
                setCheckoutError("Erro inesperado ao enviar email. Tente novamente ou contate o suporte.");
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
            if (typeof window !== "undefined") {
                localStorage.setItem("vant_auth_return_stage", stage);
                if (selectedPlan) {
                    localStorage.setItem("vant_auth_return_plan", selectedPlan);
                }
                console.log("[DEBUG] handleGoogleLogin page.tsx - Salvando stage:", stage, "plano:", selectedPlan);
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

            const response = await fetch(`${getApiUrl()}/api/user/history/detail?id=${item.id}`);

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

        (async () => {
            setPremiumError("");
            setProgress(0);
            setStatusText("");
            try {
                const updateStatus = async (text: string, percent: number) => {
                    setStatusText(text);
                    setProgress(percent);
                    // Quando backend atualiza, zera o timer estimado
                    if (percent >= 90) {
                        setEstimatedTimeRemaining(5);
                    }
                    await sleep(220);
                };

                await updateStatus("🔒 PAGAMENTO VERIFICADO. INICIANDO IA GENERATIVA...", 10);
                await updateStatus("REESCREVENDO SEU CV (AGENT)...", 35);

                // Cancelar requisições anteriores
                if (abortControllerRef.current) {
                    abortControllerRef.current.abort();
                }
                abortControllerRef.current = new AbortController();

                const form = new FormData();
                form.append("user_id", authUserId);
                form.append("job_description", jobDescription);

                // Verificar se há cv_text pré-extraído (último CV reutilizado)
                const cvTextPreextracted = typeof window !== "undefined" ? localStorage.getItem("vant_cv_text_preextracted") : null;
                if (cvTextPreextracted) {
                    form.append("cv_text", cvTextPreextracted);
                    localStorage.removeItem("vant_cv_text_preextracted");
                    console.log("[LastCV] Enviando cv_text pré-extraído ao invés de arquivo PDF");
                } else {
                    form.append("file", file);
                }

                // Adicionar área de interesse se for vaga genérica
                if (useGenericJob && selectedArea) {
                    form.append("area_of_interest", selectedArea);
                }

                if (competitorFiles && competitorFiles.length) {
                    for (const cf of competitorFiles) {
                        form.append("competitor_files", cf);
                    }
                }

                const resp = await fetch(`${getApiUrl()}/api/analyze-premium-paid`, {
                    method: "POST",
                    body: form,
                    signal: abortControllerRef.current.signal
                });
                const payload = (await resp.json()) as JsonObject;
                if (!resp.ok) {
                    const err = typeof payload.error === "string" ? payload.error : `HTTP ${resp.status}`;
                    throw new Error(err);
                }

                // Verificar se é resposta de progressive loading
                if (payload.session_id && payload.status === "processing") {
                    console.log("[Progressive Loading] Recebido session_id:", payload.session_id);

                    // Salvar session_id no estado
                    setSessionId(payload.session_id as string);

                    // Iniciar polling para acompanhar progresso
                    await pollAnalysisProgress(
                        payload.session_id as string,
                        updateStatus,
                        setReportData,
                        setStage,
                        setCreditsRemaining
                    );
                    return;
                }

                // Sistema antigo (fallback)
                await updateStatus("FINALIZANDO DOSSIÊ...", 90);
                await sleep(350);
                await updateStatus("DOSSIÊ PRONTO.", 100);
                await sleep(200);

                const report = payload.data;
                setReportData(report && typeof report === "object" ? (report as ReportData) : null);

                const entitlements = payload.entitlements;
                if (entitlements && typeof entitlements === "object") {
                    const cr = (entitlements as JsonObject).credits_remaining;
                    if (typeof cr === "number") {
                        setCreditsRemaining(cr);
                    }
                }
                setStage("paid");
            } catch (e: unknown) {
                // Ignorar AbortError (navegação entre abas)
                if (e instanceof Error && e.name === 'AbortError') {
                    console.log('Processamento premium cancelado ao navegar');
                    return;
                }
                setPremiumError(getErrorMessage(e, "Erro na geração premium"));
                setStage("hero");
            }
        })();
    }, [authUserId, competitorFiles, stage, jobDescription, file]);

    // Ref para auto-trigger premium após lite (skip preview do modal Dashboard)
    const pendingSkipPreview = useRef(false);

    async function onStart() {
        console.log("[onStart] Chamado.");

        if (!jobDescription.trim() || !file) {
            console.warn("[onStart] Retorno antecipado: jobDescription ou file vazios.");
            return;
        }

        // Se skipPreview ativo (modal Dashboard), pular lite inteiro e ir direto para premium
        if (pendingSkipPreview.current) {
            pendingSkipPreview.current = false;
            console.log("[onStart] skipPreview ativo, pulando analyze-lite e indo direto para processing_premium...");
            setApiError("");
            setReportData(null);
            setPremiumError("");
            setProgress(0);
            setStatusText("");
            setStage("processing_premium");
            return;
        }

        console.log("[onStart] Iniciando análise (diagnóstico) para todos os usuários...");

        // 1. Resetar estados visuais
        setApiError("");
        setPreviewData(null);
        setReportData(null);
        setPremiumError("");
        setProgress(0);
        setStatusText("");
        setStage("analyzing");

        // 2. Preparar o FormData
        const form = new FormData();
        form.append("job_description", jobDescription);
        form.append("file", file);

        // Adicionar área de interesse se for vaga genérica
        if (useGenericJob && selectedArea) {
            form.append("area_of_interest", selectedArea);
        }

        try {
            // 3. Disparar a requisição em BACKGROUND (sem await imediato)
            // A API trabalha enquanto rodamos o roteiro visual

            // Cancelar requisições anteriores
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            abortControllerRef.current = new AbortController();

            const apiRequestPromise = fetch(`${getApiUrl()}/api/analyze-lite`, {
                method: "POST",
                body: form,
                signal: abortControllerRef.current.signal
            });

            // 4. Roteiro da Ansiedade (Total ~8000ms)
            // Tempos variáveis para parecer orgânico

            // 0s - 1.5s: Protocolo Inicial (Rápido)
            setStatusText("INICIANDO PROTOCOLO DE SEGURANÇA VANT...");
            setProgress(10);
            await sleep(1500);

            // 1.5s - 3.5s: Parsing (2s - Parece que está lendo o arquivo físico)
            setStatusText("LENDO ESTRUTURA DO PDF (PARSING)...");
            setProgress(30);
            await sleep(2000);

            // 3.5s - 5.0s: Extração (1.5s)
            setStatusText("EXTRAINDO PALAVRAS-CHAVE DA VAGA...");
            setProgress(55);
            await sleep(1500);

            // 5.0s - 7.0s: Cruzamento (2s - O momento "difícil/mágico")
            setStatusText("CRUZANDO DADOS: EXPERIÊNCIA vs REQUISITOS...");
            setProgress(80);
            await sleep(2000);

            // 7.0s - 8.0s: Score Final (Rápido para fechar)
            setStatusText("GERANDO SCORE DE ADERÊNCIA...");
            setProgress(95);
            await sleep(1000);

            // 5. Verificar resposta da API (Se já acabou, libera. Se não, espera o resto)
            const resp = await apiRequestPromise;

            if (!resp.ok) {
                const text = await resp.text();
                throw new Error(text || `HTTP ${resp.status}`);
            }

            const data = (await resp.json()) as unknown;

            // 6. Transição final
            setStatusText("RELATÓRIO PRONTO. CARREGANDO...");
            setProgress(100);
            await sleep(500); // Pequena pausa para ler a conclusão

            setPreviewData(data as PreviewData);
            setStage("preview");

        } catch (e: unknown) {
            // Ignorar AbortError (navegação entre abas)
            if (e instanceof Error && e.name === 'AbortError') {
                console.log('Processamento lite cancelado ao navegar');
                return;
            }

            const message = getErrorMessage(e, "Erro no Scanner Lite");
            setApiError(message);
            setStage("hero");
        }
    }
    function openFileDialog() {
        uploaderInputRef.current?.click();
    }

    function openCompetitorFileDialog() {
        competitorUploaderInputRef.current?.click();
    }

    function onUseCreditFromPreview() {
        console.log("[onUseCreditFromPreview] Usuário clicou em usar crédito a partir do diagnóstico.");

        if (!authUserId || creditsRemaining <= 0) {
            console.error("[onUseCreditFromPreview] Sem créditos ou não autenticado.");
            return;
        }

        if (!jobDescription.trim() || !file) {
            console.error("[onUseCreditFromPreview] Dados incompletos para processamento premium");
            setPremiumError("Preencha a vaga e envie seu CV antes de continuar.");
            setStage("hero");
            return;
        }

        console.log("[onUseCreditFromPreview] Dados OK, iniciando processamento premium...");
        setApiError("");
        setReportData(null);
        setPremiumError("");
        setProgress(0);
        setStatusText("");
        setStage("processing_premium");
    }

    function renderDashboardMetricsHtml(nota: number, veredito: string, potencial: number, pilares: PilaresData, gapsFatals: number = 0) {
        const getNum = (v: unknown) => (typeof v === "number" ? v : 0);
        const impacto = getNum(pilares.impacto);
        const keywords = getNum(pilares.keywords);
        const ats = getNum(pilares.ats);

        // 🎯 Cálculo inteligente do score projetado
        const projected = calculateProjectedScore(nota, gapsFatals, 0, ats, keywords, impacto);

        const row = (label: string, value: number) => `
            <div style="display:flex; justify-content:space-between; margin-bottom:6px; align-items:center;">
                <span style="color:#CBD5E1; font-size:0.75rem; font-weight:600; letter-spacing:0.5px;">${label.toUpperCase()}</span>
                <div style="display:flex; align-items:center; gap:8px;">
                    <div style="width:60px; height:4px; background:rgba(255,255,255,0.1); border-radius:2px; overflow:hidden;">
                        <div style="width:${value}%; height:100%; background:${value > 70 ? '#10B981' : value > 40 ? '#F59E0B' : '#EF4444'};"></div>
                    </div>
                    <span style="color:#F8FAFC; font-size:0.8rem; font-weight:700; font-family:monospace; width:28px; text-align:right;">${value}%</span>
                </div>
            </div>
        `;

        return `
            <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(56, 189, 248, 0.15); border-radius: 12px; padding: 16px;">
                <div style="margin-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: #94A3B8; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 1px; font-weight: 700;">DIAGNÓSTICO INICIAL</span>
                    <span style="background: rgba(56, 189, 248, 0.1); color: #38BDF8; padding: 2px 6px; border-radius: 4px; font-size: 0.65rem; font-weight: 700;">VERSÃO LITE</span>
                </div>

                <div style="display:flex; justify-content:space-between; align-items:center; gap:12px; margin-bottom: 16px;">
                    <div>
                        <div style="color:#CBD5E1; font-size:0.75rem; font-weight:600;">SCORE ATS ATUAL</div>
                        <div style="color:#E2E8F0; font-weight:900; font-size: 2rem; line-height: 1;">${nota}<span style="font-size:1rem; color:#94A3B8;">/100</span></div>
                    </div>
                    <div style="text-align:right;">
                         <div style="color:#CBD5E1; font-size:0.75rem; font-weight:600;">SCORE PROJETADO</div>
                         <div style="color:#10B981; font-weight:900; font-size: 2rem; line-height: 1;">${projected.score}<span style="font-size:1rem; color:#10B981;">/100</span></div>
                         <div style="color:#F59E0B; font-size:0.9rem; font-weight:700; margin-top:2px;">+${projected.improvement}%</div>
                    </div>
                </div>

                <div style="background: rgba(0,0,0,0.2); padding: 12px; border-radius: 8px;">
                    ${row("Impacto", impacto)}
                    ${row("Palavras-chave", keywords)}
                    ${row("Format. ATS", ats)}
                </div>
            </div>
        `;
    }

    function renderLockedBlur(title: string, subtitle: string, contentPreview: string) {
        const longContent = `${contentPreview} <br><br> ` +
            "Impacto Técnico: Implementação de rotinas de backup que reduziram incidentes em 15%. ".repeat(3) +
            "Gestão de Tickets: SLA mantido acima de 98% com ferramenta GLPI e Jira. ";

        return `
    <div class="locked-container" style="position: relative; overflow: hidden; border: 1px solid rgba(56, 189, 248, 0.2); border-radius: 12px; background: rgba(15, 23, 42, 0.6);">
        <div style="padding: 20px; border-bottom: 1px solid rgba(255,255,255,0.05);">
            <div style="color: #38BDF8; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; font-weight: 700;">
                ${title}
            </div>
            <div style="color: #CBD5E1; font-size: 0.9rem; margin-top: 5px;">
                ${subtitle}
            </div>
        </div>

        <div style="padding: 20px; filter: blur(6px); user-select: none; opacity: 0.5; height: 180px; overflow: hidden;">
            <p style="color: #E2E8F0; line-height: 1.6;">${longContent}</p>
        </div>

        <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: rgba(15, 23, 42, 0.1); backdrop-filter: blur(2px);">
            <div style="background: rgba(15, 23, 42, 0.9); padding: 15px 25px; border-radius: 30px; border: 1px solid #38BDF8; box-shadow: 0 0 20px rgba(56, 189, 248, 0.2); display: flex; gap: 10px; align-items: center;">
                <span style="font-size: 1.2rem;">🔒</span>
                <span style="color: #F8FAFC; font-weight: 600; font-size: 0.9rem;">Versão Otimizada Oculta</span>
            </div>
        </div>
    </div>
    `;
    }

    function renderOfferCard(itensChecklist: string[]) {
        let listaHtml = "";
        for (const item of itensChecklist) {
            listaHtml += `
        <li style="margin-bottom:12px; display:flex; align-items:start; gap:10px; line-height:1.4;">
            <div style="
                min-width: 20px; height: 20px; 
                background: rgba(74, 222, 128, 0.2); 
                color: #4ADE80; 
                border-radius: 50%; 
                display:flex; align-items:center; justify-content:center; 
                font-size:0.75rem; font-weight:bold; flex-shrink: 0;
            ">✓</div>
            <span style="color:#E2E8F0; font-size:0.9rem;">${item}</span>
        </li>
        `;
        }

        return `
    <div style="
        background: rgba(15, 23, 42, 0.8);
        background-image: linear-gradient(160deg, rgba(56, 189, 248, 0.05), rgba(129, 140, 248, 0.05));
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-bottom: none; 
        border-top-left-radius: 16px;
        border-top-right-radius: 16px;
        border-bottom-left-radius: 0; 
        border-bottom-right-radius: 0; 
        padding: 24px;
        backdrop-filter: blur(12px);
        box-shadow: 0 -10px 40px rgba(0,0,0,0.2); 
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        margin-bottom: -5px; 
    ">
        <div>
            <div style="text-align:center; margin-bottom:20px; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:15px;">
                <h3 style="margin:0; color:#F8FAFC; font-size:1.1rem; font-weight:700; letter-spacing:0.5px;">DOSSIÊ PROFISSIONAL</h3>
                <p style="margin:4px 0 0 0; color:#CBD5E1; font-size:0.75rem;">Acesso Vitalício • VANT-PRO</p>
            </div>
            <ul style="list-style:none; padding:0; margin:0;">
                ${listaHtml}
            </ul>
        </div>

        <div style="text-align:center; margin-top: 20px;">
            <div style="display:flex; align-items:center; justify-content:center; gap:8px;">
                <span style="text-decoration: line-through; color: #94A3B8; font-size: 0.8rem;">R$ 97,90</span>
                <span style="background:#10B981; color:#fff; font-size:0.6rem; padding:2px 6px; border-radius:4px; font-weight:700;">-70% OFF</span>
            </div>
            <div style="font-size: 3rem; font-weight: 800; color: #fff; line-height:1; margin-bottom: 5px;">
                <span style="font-size:1.5rem; vertical-align:top; color:#CBD5E1;">R$</span>29<span style="font-size:1rem; color:#CBD5E1;">,90</span>
            </div>
        </div>
    </div>
    `;
    }

    // Componente visual de créditos
    const renderCreditsIndicator = () => {
        if (!authUserId) return null;

        const isLow = creditsRemaining > 0 && creditsRemaining < 3;
        const isHigh = creditsRemaining >= 20;
        const isLoading = creditsLoading;

        return (
            <div style={{
                position: 'fixed',
                top: 20,
                right: 20,
                zIndex: 1000,
                background: 'rgba(15, 23, 42, 0.95)',
                border: `2px solid ${isLoading ? '#F59E0B' : isHigh ? '#10B981' : isLow ? '#F59E0B' : '#38BDF8'}`,
                borderRadius: 12,
                padding: '12px 16px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                backdropFilter: 'blur(8px)',
                transition: 'all 0.3s ease',
                minWidth: '120px'
            }}>
                <div style={{
                    color: '#94A3B8',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                    marginBottom: 2
                }}>
                    {isLoading ? 'Carregando...' : 'Créditos'}
                </div>
                <div style={{
                    color: isLoading ? '#F59E0B' : isHigh ? '#10B981' : isLow ? '#F59E0B' : '#F8FAFC',
                    fontSize: '1.2rem',
                    fontWeight: 900,
                    lineHeight: 1,
                    fontFamily: 'monospace',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                }}>
                    {isLoading && (
                        <div style={{
                            width: '12px',
                            height: '12px',
                            border: '2px solid #F59E0B',
                            borderTop: '2px solid transparent',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                        }} />
                    )}
                    {!isLoading && creditsRemaining}
                </div>
                {!isLoading && creditsRemaining > 0 && (
                    <div style={{ marginTop: '8px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '8px' }}>
                        <button
                            onClick={openCustomerPortal}
                            style={{
                                background: 'rgba(139, 92, 246, 0.2)',
                                border: '1px solid #8B5CF6',
                                borderRadius: 6,
                                padding: '6px 12px',
                                color: '#8B5CF6',
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                whiteSpace: 'nowrap',
                                width: '100%',
                                textAlign: 'center'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(139, 92, 246, 0.3)';
                                e.currentTarget.style.transform = 'scale(1.02)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(139, 92, 246, 0.2)';
                                e.currentTarget.style.transform = 'scale(1)';
                            }}
                            title="Gerenciar assinatura, cancelar ou alterar plano"
                        >
                            ⚙️ Gerenciar
                        </button>
                    </div>
                )}
                {!isLoading && (
                    <div>
                        {creditsRemaining > 0 ? (
                            <>
                                <button
                                    onClick={() => setStage("pricing")}
                                    data-cy="see-plans-button"
                                    style={{
                                        background: 'rgba(34, 197, 94, 0.2)',
                                        border: '1px solid #22C55E',
                                        borderRadius: 6,
                                        padding: '6px 12px',
                                        color: '#22C55E',
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        whiteSpace: 'nowrap',
                                        marginRight: '6px'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'rgba(34, 197, 94, 0.3)';
                                        e.currentTarget.style.transform = 'scale(1.05)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'rgba(34, 197, 94, 0.2)';
                                        e.currentTarget.style.transform = 'scale(1)';
                                    }}
                                    title="Ver planos disponíveis"
                                >
                                    Ver planos
                                </button>
                                <button
                                    onClick={() => setStage("pricing")}
                                    style={{
                                        background: 'rgba(59, 130, 246, 0.2)',
                                        border: '1px solid #3B82F6',
                                        borderRadius: 6,
                                        padding: '6px 12px',
                                        color: '#3B82F6',
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        whiteSpace: 'nowrap'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'rgba(59, 130, 246, 0.3)';
                                        e.currentTarget.style.transform = 'scale(1.05)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)';
                                        e.currentTarget.style.transform = 'scale(1)';
                                    }}
                                    title="Comprar mais créditos"
                                >
                                    + Comprar
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => setStage("pricing")}
                                style={{
                                    background: 'rgba(59, 130, 246, 0.2)',
                                    border: '1px solid #3B82F6',
                                    borderRadius: 6,
                                    padding: '6px 12px',
                                    color: '#3B82F6',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    whiteSpace: 'nowrap'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.3)';
                                    e.currentTarget.style.transform = 'scale(1.05)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)';
                                    e.currentTarget.style.transform = 'scale(1)';
                                }}
                                title="Comprar créditos"
                            >
                                + Comprar
                            </button>
                        )}
                    </div>
                )}
            </div>
        );
    };

    if (loadingHistoryItem) {
        return (
            <main>
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: "100vh",
                    background: "#0F172A",
                    color: "#94A3B8",
                    fontSize: "1rem",
                    fontFamily: "'Outfit', sans-serif",
                }}>
                    <div style={{ textAlign: "center" }}>
                        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
                        <div style={{
                            width: 36,
                            height: 36,
                            border: "3px solid rgba(56, 189, 248, 0.2)",
                            borderTop: "3px solid #38BDF8",
                            borderRadius: "50%",
                            animation: "spin 0.8s linear infinite",
                            margin: "0 auto 16px",
                        }} />
                        Carregando análise...
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main>
            {renderCreditsIndicator()}
            {stage === "hero" && (
                <>
                    {/* Indicador de Status do Usuário */}
                    {authUserId && (
                        <div style={{
                            background: "linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(56, 189, 248, 0.1))",
                            border: "1px solid rgba(16, 185, 129, 0.3)",
                            borderRadius: 12,
                            padding: "16px 20px",
                            margin: "0 auto 20px",
                            maxWidth: "100%",
                            textAlign: "center"
                        }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
                                <div style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: "50%",
                                    background: "rgba(16, 185, 129, 0.2)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "1.2rem"
                                }}>
                                    ✅
                                </div>
                                <div style={{ flex: 1, textAlign: "left" }}>
                                    <div style={{ color: "#10B981", fontSize: "0.9rem", fontWeight: 700, marginBottom: 2 }}>
                                        Logado como {authEmail}
                                    </div>
                                    <div style={{ color: "#94A3B8", fontSize: "0.8rem" }}>
                                        {creditsRemaining > 0
                                            ? `Você tem ${creditsRemaining} crédito(s) disponível(is)`
                                            : "Pronto para analisar seu CV"
                                        }
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={async () => {
                                        if (supabase) {
                                            // Verificação de tipo explícita para evitar never
                                            const client = supabase as SupabaseClient;

                                            await client.auth.signOut();
                                        }
                                    }}
                                    style={{
                                        background: "none",
                                        border: "1px solid rgba(239, 68, 68, 0.3)",
                                        color: "#EF4444",
                                        borderRadius: 6,
                                        padding: "6px 12px",
                                        fontSize: "0.75rem",
                                        cursor: "pointer",
                                        transition: "all 0.2s"
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = "none";
                                    }}
                                >
                                    Sair
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Botão de Login para Usuários Não Logados */}
                    {!authUserId && (
                        <div style={{
                            background: "linear-gradient(135deg, rgba(56, 189, 248, 0.1), rgba(99, 102, 241, 0.1))",
                            border: "1px solid rgba(56, 189, 248, 0.3)",
                            borderRadius: 12,
                            padding: "16px 20px",
                            margin: "0 auto 20px",
                            maxWidth: "100%",
                            textAlign: "center"
                        }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
                                <div style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: "50%",
                                    background: "rgba(56, 189, 248, 0.2)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "1.2rem"
                                }}>
                                    🔐
                                </div>
                                <div style={{ flex: 1, textAlign: "left" }}>
                                    <div style={{ color: "#38BDF8", fontSize: "0.9rem", fontWeight: 700, marginBottom: 2 }}>
                                        Faça login para salvar suas análises
                                    </div>
                                    <div style={{ color: "#94A3B8", fontSize: "0.8rem" }}>
                                        Acesse seu histórico e acompanhe suas otimizações
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowAuthModal(true)}
                                    data-cy="login-button"
                                    style={{
                                        background: "linear-gradient(135deg, #38BDF8, #6366F1)",
                                        color: "#fff",
                                        border: "none",
                                        borderRadius: 6,
                                        padding: "8px 16px",
                                        fontSize: "0.8rem",
                                        fontWeight: 600,
                                        cursor: "pointer",
                                        transition: "all 0.2s"
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = "translateY(-2px)";
                                        e.currentTarget.style.boxShadow = "0 4px 12px rgba(56, 189, 248, 0.3)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = "translateY(0)";
                                        e.currentTarget.style.boxShadow = "none";
                                    }}
                                >
                                    Entrar
                                </button>
                            </div>
                        </div>
                    )}

                    {/* UI de Erro Premium (também aparece no hero) */}
                    {premiumError && (
                        <div style={{
                            background: "rgba(239, 68, 68, 0.1)",
                            border: "2px solid #EF4444",
                            borderRadius: 12,
                            padding: "20px",
                            margin: "0 auto 20px",
                            maxWidth: "100%",
                            textAlign: "center"
                        }}>
                            <div style={{ fontSize: "2rem", marginBottom: "12px" }}>⚠️</div>
                            <div style={{ color: "#EF4444", fontSize: "1.1rem", fontWeight: 700, marginBottom: "8px" }}>
                                {premiumError}
                            </div>
                            <button
                                type="button"
                                onClick={() => setPremiumError("")}
                                style={{
                                    background: "none",
                                    border: "1px solid rgba(239, 68, 68, 0.3)",
                                    color: "#EF4444",
                                    borderRadius: 6,
                                    padding: "6px 12px",
                                    fontSize: "0.8rem",
                                    cursor: "pointer",
                                    marginTop: "8px"
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = "none";
                                }}
                            >
                                Entendido
                            </button>
                        </div>
                    )}

                    <div className="hero-container">
                        {/* V4 Split-Screen: 2-column grid */}
                        <div className="hero-split-grid">

                            {/* ===== LEFT COLUMN: Text + Trust ===== */}
                            <div className="hero-left-col">
                                <div>
                                    <div dangerouslySetInnerHTML={{ __html: HERO_HEADER_HTML }} />
                                    <div dangerouslySetInnerHTML={{ __html: TRUST_BAR_HTML }} />
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
                                                background: !useGenericJob ? "rgba(56, 189, 248, 0.15)" : "transparent",
                                                color: !useGenericJob ? "#38BDF8" : "#94A3B8",
                                                boxShadow: !useGenericJob ? "0 1px 3px rgba(0,0,0,0.2)" : "none"
                                            }}
                                        >
                                            <span>Tenho uma vaga</span>
                                            <span style={{ fontSize: "0.6rem", opacity: 0.6, fontWeight: 400 }}>colar descrição</span>
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
                                                background: useGenericJob ? "rgba(16, 185, 129, 0.15)" : "transparent",
                                                color: useGenericJob ? "#10B981" : "#94A3B8",
                                                boxShadow: useGenericJob ? "0 1px 3px rgba(0,0,0,0.2)" : "none"
                                            }}
                                        >
                                            <span>Não tenho uma vaga</span>
                                            <span style={{ fontSize: "0.6rem", opacity: 0.6, fontWeight: 400 }}>selecionar área</span>
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
                                                    <div style={{ fontSize: "1.4rem" }}>🎯</div>
                                                    <div>
                                                        <div style={{ color: "#F8FAFC", fontSize: "0.85rem", fontWeight: 700 }}>
                                                            Referência Ideal
                                                        </div>
                                                        <div style={{ color: "#94A3B8", fontSize: "0.75rem", marginTop: 2 }}>
                                                            {competitorFiles.length > 0 ? `${competitorFiles.length} referência(s)` : "Padrão automático"}
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
                                                        + Adicionar
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
                                </div>
                            </div>

                        </div>{/* end hero-split-grid */}

                        {/* Full-width sections below the fold */}
                        <div id="por-que-funciona" dangerouslySetInnerHTML={{ __html: VALUE_PROP_HTML }} />
                        <div dangerouslySetInnerHTML={{ __html: ANALYSIS_CARD_HTML }} />
                    </div>

                </>

            )}

            {stage === "paid" && (
                <PaidStage
                    reportData={reportData}
                    authUserId={authUserId}
                    onNewOptimization={() => setStage("hero")}
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
                    {/* Estilos locais para animação e cursor */}
                    <style>{`
                        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
                        .cursor-block {
                            display: inline-block;
                            width: 10px;
                            height: 18px;
                            background-color: #38BDF8;
                            animation: blink 0.8s step-end infinite;
                            vertical-align: text-bottom;
                            margin-left: 6px;
                        }
                        @keyframes pulse-glow {
                            0% { text-shadow: 0 0 10px rgba(56, 189, 248, 0.3); opacity: 0.85; transform: scale(1); }
                            50% { text-shadow: 0 0 25px rgba(56, 189, 248, 0.8), 0 0 5px rgba(255,255,255,0.4); opacity: 1; transform: scale(1.02); }
                            100% { text-shadow: 0 0 10px rgba(56, 189, 248, 0.3); opacity: 0.85; transform: scale(1); }
                        }
                        .logo-pulse {
                            animation: pulse-glow 2.5s ease-in-out infinite;
                        }
                        @keyframes gradient-move {
                            0% { background-position: 0% 50%; }
                            50% { background-position: 100% 50%; }
                            100% { background-position: 0% 50%; }
                        }
                        @keyframes fadeIn {
                            from { opacity: 0; transform: translateY(10px); }
                            to { opacity: 1; transform: translateY(0); }
                        }
                        .edu-card {
                            animation: fadeIn 0.5s ease-out;
                        }
                    `}</style>

                    <div className="loading-logo logo-pulse">vant.core scanner</div>

                    <div style={{ width: "100%", margin: "0 auto" }}>
                        <div style={{ height: 10, background: "rgba(255,255,255,0.08)", borderRadius: 999, overflow: "hidden", boxShadow: "0 0 10px rgba(0,0,0,0.3) inset" }}>
                            <div
                                style={{
                                    width: `${Math.max(0, Math.min(100, progress))}%`,
                                    height: "100%",
                                    background: "linear-gradient(90deg, #38BDF8, #818CF8, #38BDF8)",
                                    backgroundSize: "200% 100%",
                                    animation: "gradient-move 2s linear infinite",
                                    transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                    boxShadow: "0 0 15px rgba(56, 189, 248, 0.6)"
                                }}
                            />
                        </div>

                        <div style={{ marginTop: 24, minHeight: "40px" }}>
                            <div className="terminal-log" style={{ color: "#38BDF8", fontFamily: "monospace", fontSize: "1.1rem", textShadow: "0 0 5px rgba(56, 189, 248, 0.3)" }}>
                                &gt;&gt; {statusText}<span className="cursor-block"></span>
                            </div>
                        </div>

                        {/* Conteúdo Educativo sobre ATS */}
                        <div className="edu-card" style={{
                            marginTop: 40,
                            background: "linear-gradient(135deg, rgba(56, 189, 248, 0.08), rgba(129, 140, 248, 0.08))",
                            border: "1px solid rgba(56, 189, 248, 0.2)",
                            borderRadius: 16,
                            padding: 24,
                            backdropFilter: "blur(10px)"
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                                <div style={{ fontSize: "1.8rem" }}>💡</div>
                                <div>
                                    <div style={{ color: "#38BDF8", fontSize: "0.9rem", fontWeight: 700, letterSpacing: "0.5px" }}>
                                        VOCÊ SABIA?
                                    </div>
                                    <div style={{ color: "#94A3B8", fontSize: "0.75rem", marginTop: 2 }}>
                                        Enquanto analisamos seu CV...
                                    </div>
                                </div>
                            </div>

                            {progress < 35 && (
                                <div style={{ color: "#E2E8F0", fontSize: "0.95rem", lineHeight: 1.6 }}>
                                    <strong style={{ color: "#F8FAFC" }}>75% dos CVs são rejeitados antes de chegar no recrutador.</strong>
                                    <br /><br />
                                    Sistemas ATS (Applicant Tracking System) filtram automaticamente currículos usando palavras-chave,
                                    formatação e estrutura. Se seu CV não está otimizado, ele nunca chega aos olhos humanos.
                                </div>
                            )}

                            {progress >= 35 && progress < 70 && (
                                <div style={{ color: "#E2E8F0", fontSize: "0.95rem", lineHeight: 1.6 }}>
                                    <div style={{
                                        background: "rgba(239, 68, 68, 0.1)",
                                        border: "1px solid rgba(239, 68, 68, 0.3)",
                                        borderRadius: 8,
                                        padding: 12,
                                        marginBottom: 12
                                    }}>
                                        <div style={{ color: "#EF4444", fontSize: "0.8rem", fontWeight: 700, marginBottom: 6 }}>
                                            ❌ ANTES (Score: 42/100)
                                        </div>
                                        <div style={{ color: "#CBD5E1", fontSize: "0.85rem", fontStyle: "italic" }}>
                                            "Trabalhei com vendas e atendimento ao cliente"
                                        </div>
                                    </div>
                                    <div style={{
                                        background: "rgba(16, 185, 129, 0.1)",
                                        border: "1px solid rgba(16, 185, 129, 0.3)",
                                        borderRadius: 8,
                                        padding: 12
                                    }}>
                                        <div style={{ color: "#10B981", fontSize: "0.8rem", fontWeight: 700, marginBottom: 6 }}>
                                            ✅ DEPOIS (Score: 87/100)
                                        </div>
                                        <div style={{ color: "#E2E8F0", fontSize: "0.85rem" }}>
                                            "Especialista em <strong>Customer Success</strong> com <strong>+3 anos</strong> gerenciando
                                            carteira de <strong>150+ clientes B2B</strong>. Aumentei retenção em <strong>34%</strong>
                                            através de estratégias de <strong>upsell</strong> e <strong>onboarding estruturado</strong>."
                                        </div>
                                    </div>
                                </div>
                            )}

                            {progress >= 70 && (
                                <div style={{ color: "#E2E8F0", fontSize: "0.95rem", lineHeight: 1.6 }}>
                                    <strong style={{ color: "#F8FAFC" }}>O que o ATS procura:</strong>
                                    <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
                                        <div style={{ display: "flex", alignItems: "start", gap: 8 }}>
                                            <span style={{ color: "#10B981", fontSize: "1.2rem" }}>✓</span>
                                            <span><strong>Palavras-chave</strong> da descrição da vaga</span>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "start", gap: 8 }}>
                                            <span style={{ color: "#10B981", fontSize: "1.2rem" }}>✓</span>
                                            <span><strong>Números e resultados</strong> quantificáveis</span>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "start", gap: 8 }}>
                                            <span style={{ color: "#10B981", fontSize: "1.2rem" }}>✓</span>
                                            <span><strong>Formatação limpa</strong> sem tabelas ou colunas</span>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "start", gap: 8 }}>
                                            <span style={{ color: "#10B981", fontSize: "1.2rem" }}>✓</span>
                                            <span><strong>Verbos de ação</strong> e linguagem técnica</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {stage === "processing_premium" && (
                <>
                    {/* UI de Erro Premium */}
                    {premiumError && (
                        <div className="hero-container" style={{ textAlign: "center" }}>
                            <div style={{
                                background: "rgba(239, 68, 68, 0.1)",
                                border: "2px solid #EF4444",
                                borderRadius: 12,
                                padding: "40px",
                                margin: "20px auto",
                                maxWidth: "100%"
                            }}>
                                <div style={{ fontSize: "3rem", marginBottom: "16px" }}>❌</div>
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
                        <div className="hero-container">
                            {/* Estilos locais para animação e cursor */}
                            <style>{`
                        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
                        .cursor-block {
                            display: inline-block;
                            width: 10px;
                            height: 18px;
                            background-color: #10B981;
                            animation: blink 0.8s step-end infinite;
                            vertical-align: text-bottom;
                            margin-left: 6px;
                        }
                        @keyframes pulse-glow {
                            0% { text-shadow: 0 0 10px rgba(16, 185, 129, 0.3); opacity: 0.85; transform: scale(1); }
                            50% { text-shadow: 0 0 25px rgba(16, 185, 129, 0.8), 0 0 5px rgba(255,255,255,0.4); opacity: 1; transform: scale(1.02); }
                            100% { text-shadow: 0 0 10px rgba(16, 185, 129, 0.3); opacity: 0.85; transform: scale(1); }
                        }
                        .logo-pulse {
                            animation: pulse-glow 2.5s ease-in-out infinite;
                        }
                        @keyframes gradient-move {
                            0% { background-position: 0% 50%; }
                            50% { background-position: 100% 50%; }
                            100% { background-position: 0% 50%; }
                        }
                    `}</style>

                            <div className="loading-logo logo-pulse">vant.core premium</div>

                            <div style={{ width: "100%", margin: "0 auto" }}>
                                <div style={{ height: 10, background: "rgba(255,255,255,0.08)", borderRadius: 999, overflow: "hidden", boxShadow: "0 0 10px rgba(0,0,0,0.3) inset" }}>
                                    <div
                                        className="progress-bar-glow"
                                        style={{
                                            width: `${Math.max(0, Math.min(100, progress))}%`,
                                            height: "100%",
                                            background: "linear-gradient(90deg, #10B981, #34D399, #10B981)",
                                            backgroundSize: "200% 100%",
                                            animation: "gradient-move 2s linear infinite, progress-pulse 2s ease-in-out infinite",
                                            transition: "width 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
                                            boxShadow: "0 0 15px rgba(16, 185, 129, 0.6)"
                                        }}
                                    /></div>

                                <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div style={{ color: "#94A3B8", fontSize: "0.8rem" }}>
                                        {progress < 20 ? "Iniciando análise..." :
                                            progress < 40 ? "Analisando estrutura..." :
                                                progress < 60 ? "Otimizando conteúdo..." :
                                                    progress < 80 ? "Gerando relatórios..." :
                                                        progress < 95 ? "Finalizando dossiê..." : "Concluindo processo"}
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                        <div style={{ color: "#64748B", fontSize: "0.75rem" }}>
                                            ~{Math.ceil(estimatedTimeRemaining / 60)}:{String(estimatedTimeRemaining % 60).padStart(2, '0')}
                                        </div>
                                        <div style={{ color: "#10B981", fontSize: "0.9rem", fontWeight: 600 }}>
                                            {Math.round(progress)}%
                                        </div>
                                    </div>
                                </div>

                                <div style={{
                                    background: "linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(6, 78, 59, 0.4))",
                                    border: "1px solid rgba(16, 185, 129, 0.2)",
                                    borderRadius: 16,
                                    padding: 24,
                                    backdropFilter: "blur(10px)"
                                }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                                        <div style={{ fontSize: "1.8rem" }}>🚀</div>
                                        <div>
                                            <div style={{ color: "#10B981", fontSize: "0.9rem", fontWeight: 700, letterSpacing: "0.5px" }}>
                                                DOSSIÊ PROFISSIONAL EM CONSTRUÇÃO
                                            </div>
                                            <div style={{ color: "#94A3B8", fontSize: "0.75rem", marginTop: 2 }}>
                                                Nossa IA está trabalhando para você...
                                            </div>
                                        </div>
                                    </div>

                                    {progress < 35 && (
                                        <div style={{ color: "#E2E8F0", fontSize: "0.95rem", lineHeight: 1.6 }}>
                                            <strong style={{ color: "#F8FAFC" }}>Analisando 43 critérios ATS avançados.</strong>
                                            <br /><br />
                                            Verificamos alinhamento semântico, estrutura de impacto, palavras-chave da vaga,
                                            e comparando com padrões de profissionais que foram contratados.
                                        </div>
                                    )}

                                    {progress >= 35 && progress < 70 && (
                                        <div style={{ color: "#E2E8F0", fontSize: "0.95rem", lineHeight: 1.6 }}>
                                            <div style={{
                                                background: "rgba(16, 185, 129, 0.1)",
                                                border: "1px solid rgba(16, 185, 129, 0.3)",
                                                borderRadius: 8,
                                                padding: 12,
                                                marginBottom: 12
                                            }}>
                                                <div style={{ color: "#10B981", fontSize: "0.8rem", fontWeight: 700, marginBottom: 6 }}>
                                                    ✅ ANÁLISE ESTRUTURAL CONCLUÍDA
                                                </div>
                                                <div style={{ color: "#E2E8F0", fontSize: "0.85rem" }}>
                                                    Identificamos os pontos exatos que impedem seu CV de passar nos filtros automáticos.
                                                </div>
                                            </div>
                                            <div style={{
                                                background: "rgba(56, 189, 248, 0.1)",
                                                border: "1px solid rgba(56, 189, 248, 0.3)",
                                                borderRadius: 8,
                                                padding: 12,
                                                marginBottom: 12
                                            }}>
                                                <div style={{ color: "#38BDF8", fontSize: "0.8rem", fontWeight: 700, marginBottom: 6 }}>
                                                    🔄 REESCREVENDO CONTEÚDO
                                                </div>
                                                <div style={{ color: "#E2E8F0", fontSize: "0.85rem" }}>
                                                    Aplicando otimizações semânticas e reestruturando experiências com métricas de impacto.
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {progress >= 70 && (
                                        <div style={{ color: "#E2E8F0", fontSize: "0.95rem", lineHeight: 1.6 }}>
                                            <strong style={{ color: "#F8FAFC" }}>Seu dossiê profissional está quase pronto!</strong>
                                            <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
                                                <div style={{ display: "flex", alignItems: "start", gap: 8 }}>
                                                    <span style={{ color: "#10B981", fontSize: "1.2rem" }}>✓</span>
                                                    <span>CV reestruturado com <strong>palavras-chave da vaga</strong></span>
                                                </div>
                                                <div style={{ display: "flex", alignItems: "start", gap: 8 }}>
                                                    <span style={{ color: "#10B981", fontSize: "1.2rem" }}>✓</span>
                                                    <span><strong>Headline LinkedIn</strong> otimizada para recrutadores</span>
                                                </div>
                                                <div style={{ display: "flex", alignItems: "start", gap: 8 }}>
                                                    <span style={{ color: "#10B981", fontSize: "1.2rem" }}>✓</span>
                                                    <span><strong>Biblioteca técnica</strong> personalizada para seu cargo</span>
                                                </div>
                                                <div style={{ display: "flex", alignItems: "start", gap: 8 }}>
                                                    <span style={{ color: "#10B981", fontSize: "1.2rem" }}>✓</span>
                                                    <span><strong>Projeto prático</strong> para diferencial em entrevistas</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            {stage === "preview" && (
                <div className="hero-container">
                    {(() => {
                        const data: Partial<PreviewData> = previewData ?? {};
                        const nota = typeof data.nota_ats === "number" ? data.nota_ats : 0;
                        const pilares = data.analise_por_pilares || {};
                        const veredito = data.veredito || "ANÁLISE CONCLUÍDA";
                        const potencial = calcPotencial(nota);

                        let texto_destaque = "Recrutadores e Gestores";
                        const jobText = (jobDescription || "").toLowerCase();
                        if (jobText.includes("nubank")) texto_destaque += " do Nubank";
                        else if (jobText.includes("google")) texto_destaque += " do Google";
                        else if (jobText.includes("amazon")) texto_destaque += " da Amazon";
                        else if (jobText.includes("itaú") || jobText.includes("itau")) texto_destaque += " do Itaú";

                        // 🎯 Calcular score projetado inteligente
                        const impacto = typeof pilares.impacto === "number" ? pilares.impacto : 0;
                        const keywords = typeof pilares.keywords === "number" ? pilares.keywords : 0;
                        const ats = typeof pilares.ats === "number" ? pilares.ats : 0;

                        // Contar gaps baseado nos gaps identificados no preview
                        const gapsCount = (data.gap_1 ? 1 : 0) + (data.gap_2 ? 1 : 0);

                        const projected = calculateProjectedScore(nota, gapsCount, 0, ats, keywords, impacto);

                        const metaHtml = `
    <div style="background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(16, 185, 129, 0.1)); 
                border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 12px; padding: 20px; margin-top: 20px;">
        <div style="display: flex; align-items: center; gap: 15px;">
            <div style="font-size: 2.5rem;">🎯</div>
            <div>
                <div style="color: #F59E0B; font-weight: 800; font-size: 1.1rem;">META DE PONTUAÇÃO</div>
                <div style="color: #E2E8F0; font-size: 0.9rem; margin-top: 5px;">
                    Com as otimizações completas, seu score pode chegar a <strong style="color: #10B981;">${projected.score}/100</strong>
                    <br>Isso coloca você no <strong>${projected.percentile}</strong> dos candidatos.
                </div>
            </div>
        </div>
    </div>
    `;

                        const dashHtml = renderDashboardMetricsHtml(nota, veredito, potencial, pilares, gapsCount);

                        const setorDetectado = typeof pilares.setor_detectado === "string" ? pilares.setor_detectado : "Gestão Estratégica";
                        const exemploMelhoria = `Especialista em ${setorDetectado} com histórico de ` +
                            "liderança em projetos de alta complexidade. Otimizou o budget operacional em 22%..." +
                            "Implementação de frameworks ágeis e reestruturação de governança corporativa.";

                        const xrayHtml = `
        <div style='background: rgba(15, 23, 42, 0.4); border: 1px solid rgba(56, 189, 248, 0.2); padding: 16px; border-radius: 12px; position: relative; overflow: hidden; margin-top: 20px;'>
            <div style="position: absolute; top: -20px; right: -20px; background: #38BDF8; width: 60px; height: 60px; filter: blur(40px); opacity: 0.1;"></div>
            
            <div style="display: flex; gap: 12px; align-items: start;">
                <div style="font-size: 1.2rem; background: rgba(56, 189, 248, 0.1); width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 8px;">🕵️</div>
                <div style="flex: 1;">
                    <h3 style='color: #E2E8F0; margin: 0 0 4px 0; font-size: 0.95rem; font-weight: 600;'>
                        Radar de Recrutadores Ativo
                    </h3>
                    <p style='color: #94A3B8; font-size: 0.8rem; margin: 0 0 10px 0; line-height: 1.4;'>
                        Detectamos padrões para localizar <strong>${texto_destaque}</strong>.
                    </p>
                    
                    <div style='background: rgba(0,0,0,0.3); padding: 8px 10px; border-radius: 4px; border-left: 2px solid #38BDF8; font-family: monospace; font-size: 0.7rem; color: #38BDF8; overflow-x: hidden; white-space: nowrap; opacity: 0.8;'>
                        site:linkedin.com/in/ "hiring" "${jobText.split(' ')[0]}..."
                    </div>
                </div>
            </div>
        </div>
        `;

                        return (
                            <>
                                <div dangerouslySetInnerHTML={{ __html: metaHtml }} />

                                <div className="action-island-container" style={{ textAlign: "left", marginTop: 18 }}>
                                    <div dangerouslySetInnerHTML={{ __html: dashHtml }} />

                                    {/* PRÉVIA DE VALOR - Sugestões Concretas da IA */}
                                    {data.gap_1 && data.gap_2 && (
                                        <div style={{ marginTop: 24, marginBottom: 32 }}>
                                            <div style={{ textAlign: "center", marginBottom: 20, padding: "16px", background: "linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(56, 189, 248, 0.05))", borderRadius: 12, border: "1px solid rgba(16, 185, 129, 0.3)" }}>
                                                <div style={{ fontSize: "1.5rem", marginBottom: 8 }}>✨</div>
                                                <div style={{ color: "#10B981", fontSize: "1.1rem", fontWeight: 700, marginBottom: 4 }}>
                                                    PRÉVIA GRATUITA
                                                </div>
                                                <div style={{ color: "#E2E8F0", fontSize: "0.9rem" }}>
                                                    Nossa IA analisou seu CV e identificou 2 problemas críticos
                                                </div>
                                            </div>

                                            {/* Gap 1 - Dados reais da IA */}
                                            <div style={{
                                                background: "rgba(15, 23, 42, 0.6)",
                                                border: "1px solid rgba(239, 68, 68, 0.3)",
                                                borderLeft: "4px solid #EF4444",
                                                borderRadius: 12,
                                                padding: 20,
                                                marginBottom: 16
                                            }}>
                                                <div style={{ display: "flex", alignItems: "start", gap: 12, marginBottom: 12 }}>
                                                    <div style={{
                                                        background: "rgba(239, 68, 68, 0.2)",
                                                        borderRadius: "50%",
                                                        width: 32,
                                                        height: 32,
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        fontSize: "1rem",
                                                        flexShrink: 0
                                                    }}>⚠️</div>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ color: "#EF4444", fontSize: "0.85rem", fontWeight: 700, marginBottom: 4 }}>
                                                            PROBLEMA #1: {data.gap_1.titulo || "Falta de Resultados Quantificáveis"}
                                                        </div>
                                                        <div style={{ color: "#94A3B8", fontSize: "0.85rem", lineHeight: 1.5 }}>
                                                            {data.gap_1.explicacao || "Seu CV usa descrições genéricas sem números ou impacto mensurável."}
                                                        </div>
                                                    </div>
                                                </div>

                                                {data.gap_1.exemplo_atual && (
                                                    <div style={{
                                                        background: "transparent",
                                                        borderLeft: "2px solid #EF4444",
                                                        borderRadius: 6,
                                                        padding: "12px 0 12px 16px",
                                                        marginBottom: 12,
                                                        position: "relative",
                                                        opacity: 0.7
                                                    }}>
                                                        <div style={{
                                                            position: "absolute",
                                                            left: "-8px",
                                                            top: "12px",
                                                            color: "#EF4444",
                                                            fontSize: "0.7rem",
                                                            fontWeight: 700
                                                        }}>❌</div>
                                                        <div style={{ color: "#94A3B8", fontSize: "0.75rem", fontWeight: 600, marginBottom: 4 }}>
                                                            VERSÃO ATUAL (Score: {nota}/100)
                                                        </div>
                                                        <div style={{
                                                            color: "#475569",
                                                            fontSize: "0.85rem",
                                                            fontStyle: "italic",
                                                            lineHeight: 1.5,
                                                            textDecoration: "line-through"
                                                        }}>
                                                            "{data.gap_1.exemplo_atual}"
                                                        </div>
                                                    </div>
                                                )}

                                                {data.gap_1.exemplo_otimizado && (
                                                    <div style={{
                                                        background: "rgba(34, 197, 94, 0.18)",
                                                        border: "1px solid rgba(34, 197, 94, 0.35)",
                                                        borderRadius: 10,
                                                        padding: 14,
                                                        boxShadow: "0 0 15px rgba(34, 197, 94, 0.15)"
                                                    }}>
                                                        <div style={{
                                                            display: "flex",
                                                            justifyContent: "space-between",
                                                            alignItems: "center",
                                                            marginBottom: 4,
                                                            gap: 8
                                                        }}>
                                                            <div style={{ color: "#10B981", fontSize: "0.8rem", fontWeight: 700 }}>
                                                                ✅ VERSÃO OTIMIZADA (Score: 94/100)
                                                            </div>
                                                            <div style={{
                                                                background: "#10B981",
                                                                color: "#fff",
                                                                fontSize: "0.65rem",
                                                                fontWeight: 700,
                                                                padding: "3px 10px",
                                                                borderRadius: 999
                                                            }}>
                                                                +{94 - nota} pts
                                                            </div>
                                                        </div>
                                                        <div style={{ color: "#FFFFFF", fontSize: "0.9rem", fontWeight: 500, lineHeight: 1.6 }}
                                                            dangerouslySetInnerHTML={{ __html: data.gap_1.exemplo_otimizado.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                                                    </div>
                                                )}

                                                <div style={{
                                                    marginTop: 12,
                                                    padding: 10,
                                                    background: "rgba(56, 189, 248, 0.1)",
                                                    borderRadius: 6,
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 8
                                                }}>
                                                    <span style={{ fontSize: "1rem" }}>💡</span>
                                                    <span style={{ color: "#38BDF8", fontSize: "0.8rem", fontWeight: 600 }}>
                                                        Impacto: +{94 - nota} pontos no score ATS
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Gap 2 - Dados reais da IA */}
                                            <div style={{
                                                background: "rgba(15, 23, 42, 0.6)",
                                                border: "1px solid rgba(245, 158, 11, 0.3)",
                                                borderLeft: "4px solid #F59E0B",
                                                borderRadius: 12,
                                                padding: 20
                                            }}>
                                                <div style={{ display: "flex", alignItems: "start", gap: 12, marginBottom: 12 }}>
                                                    <div style={{
                                                        background: "rgba(245, 158, 11, 0.2)",
                                                        borderRadius: "50%",
                                                        width: 32,
                                                        height: 32,
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        fontSize: "1rem",
                                                        flexShrink: 0
                                                    }}>🎯</div>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ color: "#F59E0B", fontSize: "0.85rem", fontWeight: 700, marginBottom: 4 }}>
                                                            PROBLEMA #2: {data.gap_2.titulo || "Palavras-Chave da Vaga Ausentes"}
                                                        </div>
                                                        <div style={{ color: "#94A3B8", fontSize: "0.85rem", lineHeight: 1.5 }}>
                                                            {data.gap_2.explicacao || "Termos críticos da vaga não aparecem no seu CV."}
                                                        </div>
                                                    </div>
                                                </div>

                                                {data.gap_2.termos_faltando && data.gap_2.termos_faltando.length > 0 && (
                                                    <div style={{
                                                        background: "transparent",
                                                        padding: "12px 0",
                                                        marginBottom: 8
                                                    }}>
                                                        <div style={{ color: "#FCD34D", fontSize: "0.75rem", fontWeight: 600, marginBottom: 8 }}>
                                                            🔍 TERMOS FALTANDO NO SEU CV:
                                                        </div>
                                                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                                            {data.gap_2.termos_faltando.slice(0, 5).map((term: string, i: number) => (
                                                                <span
                                                                    key={i}
                                                                    style={{
                                                                        background: "transparent",
                                                                        color: "#FCD34D",
                                                                        padding: "4px 10px",
                                                                        borderRadius: 16,
                                                                        fontSize: "0.75rem",
                                                                        fontWeight: 600,
                                                                        border: "1px dashed rgba(252, 211, 77, 0.6)",
                                                                        transition: "all 0.2s",
                                                                        cursor: "pointer"
                                                                    }}
                                                                    onMouseEnter={(e) => {
                                                                        e.currentTarget.style.background = "rgba(252, 211, 77, 0.12)";
                                                                        e.currentTarget.style.borderStyle = "solid";
                                                                    }}
                                                                    onMouseLeave={(e) => {
                                                                        e.currentTarget.style.background = "transparent";
                                                                        e.currentTarget.style.borderStyle = "dashed";
                                                                    }}
                                                                >
                                                                    {term}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                <div style={{
                                                    marginTop: 12,
                                                    padding: 16,
                                                    background: "linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(56, 189, 248, 0.1))",
                                                    borderRadius: 10,
                                                    border: "2px solid rgba(16, 185, 129, 0.4)",
                                                    boxShadow: "0 4px 12px rgba(16, 185, 129, 0.2)"
                                                }}>
                                                    <div style={{ color: "#10B981", fontSize: "1rem", fontWeight: 800, marginBottom: 8, textAlign: "center", textTransform: "uppercase", letterSpacing: "1px" }}>
                                                        🎁 NA VERSÃO PREMIUM VOCÊ RECEBE:
                                                    </div>
                                                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                                            <div style={{
                                                                minWidth: "28px",
                                                                height: "28px",
                                                                background: "linear-gradient(135deg, #10B981, #059669)",
                                                                borderRadius: "50%",
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                                fontSize: "1rem",
                                                                flexShrink: 0,
                                                                boxShadow: "0 2px 8px rgba(16, 185, 129, 0.4)"
                                                            }}>✓</div>
                                                            <span style={{ color: "#F8FAFC", fontSize: "0.95rem", fontWeight: 600, lineHeight: 1.4 }}>
                                                                <strong>CV reescrito</strong> com todas as palavras-chave integradas naturalmente
                                                            </span>
                                                        </div>
                                                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                                            <div style={{
                                                                minWidth: "28px",
                                                                height: "28px",
                                                                background: "linear-gradient(135deg, #10B981, #059669)",
                                                                borderRadius: "50%",
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                                fontSize: "1rem",
                                                                flexShrink: 0,
                                                                boxShadow: "0 2px 8px rgba(16, 185, 129, 0.4)"
                                                            }}>✓</div>
                                                            <span style={{ color: "#F8FAFC", fontSize: "0.95rem", fontWeight: 600, lineHeight: 1.4 }}>
                                                                Análise completa de <strong>43 critérios ATS</strong> (não apenas 2)
                                                            </span>
                                                        </div>
                                                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                                            <div style={{
                                                                minWidth: "28px",
                                                                height: "28px",
                                                                background: "linear-gradient(135deg, #10B981, #059669)",
                                                                borderRadius: "50%",
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                                fontSize: "1rem",
                                                                flexShrink: 0,
                                                                boxShadow: "0 2px 8px rgba(16, 185, 129, 0.4)"
                                                            }}>✓</div>
                                                            <span style={{ color: "#F8FAFC", fontSize: "0.95rem", fontWeight: 600, lineHeight: 1.4 }}>
                                                                <strong>Headline do LinkedIn</strong> otimizada para recrutadores
                                                            </span>
                                                        </div>
                                                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                                            <div style={{
                                                                minWidth: "28px",
                                                                height: "28px",
                                                                background: "linear-gradient(135deg, #10B981, #059669)",
                                                                borderRadius: "50%",
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                                fontSize: "1rem",
                                                                flexShrink: 0,
                                                                boxShadow: "0 2px 8px rgba(16, 185, 129, 0.4)"
                                                            }}>✓</div>
                                                            <span style={{ color: "#F8FAFC", fontSize: "0.95rem", fontWeight: 600, lineHeight: 1.4 }}>
                                                                <strong>Biblioteca técnica</strong> personalizada para seu cargo
                                                            </span>
                                                        </div>
                                                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                                            <div style={{
                                                                minWidth: "28px",
                                                                height: "28px",
                                                                background: "linear-gradient(135deg, #10B981, #059669)",
                                                                borderRadius: "50%",
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                                fontSize: "1rem",
                                                                flexShrink: 0,
                                                                boxShadow: "0 2px 8px rgba(16, 185, 129, 0.4)"
                                                            }}>✓</div>
                                                            <span style={{ color: "#F8FAFC", fontSize: "0.95rem", fontWeight: 600, lineHeight: 1.4 }}>
                                                                <strong>Projeto prático</strong> para diferencial em entrevistas
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* RODAPÉ CONDICIONAL: Créditos vs Oferta de Venda */}
                                    {authUserId && creditsRemaining > 0 ? (
                                        <div style={{ marginTop: 32 }}>
                                            <div style={{
                                                background: "linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(56, 189, 248, 0.1))",
                                                border: "2px solid #10B981",
                                                borderRadius: 16,
                                                padding: "28px",
                                                textAlign: "center",
                                                boxShadow: "0 0 30px rgba(16, 185, 129, 0.2)"
                                            }}>
                                                <div style={{ fontSize: "2rem", marginBottom: 12 }}>⚡</div>
                                                <div style={{ color: "#10B981", fontSize: "1.2rem", fontWeight: 800, marginBottom: 8 }}>
                                                    Você tem {creditsRemaining} crédito(s) disponível(is)!
                                                </div>
                                                <div style={{ color: "#E2E8F0", fontSize: "0.95rem", marginBottom: 20, lineHeight: 1.5 }}>
                                                    Use 1 crédito agora para desbloquear a análise completa,<br />
                                                    CV otimizado e todas as ferramentas premium.
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => onUseCreditFromPreview()}
                                                    style={{
                                                        width: "100%",
                                                        maxWidth: 420,
                                                        background: "linear-gradient(135deg, #10B981, #059669)",
                                                        color: "#fff",
                                                        border: "none",
                                                        padding: "20px",
                                                        borderRadius: 12,
                                                        fontSize: "1.15rem",
                                                        fontWeight: 800,
                                                        cursor: "pointer",
                                                        boxShadow: "0 6px 20px rgba(16, 185, 129, 0.5)",
                                                        transition: "all 0.2s",
                                                        textTransform: "uppercase",
                                                        letterSpacing: "0.5px"
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.transform = "translateY(-2px)";
                                                        e.currentTarget.style.boxShadow = "0 8px 25px rgba(16, 185, 129, 0.6)";
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.transform = "translateY(0)";
                                                        e.currentTarget.style.boxShadow = "0 6px 20px rgba(16, 185, 129, 0.5)";
                                                    }}
                                                    onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.98)"}
                                                    onMouseUp={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
                                                >
                                                    ⚡ USAR 1 CRÉDITO E DESBLOQUEAR
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ marginTop: 32 }}>
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
                                    )}

                                    {/* Botão Voltar Discreto */}
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
                                            ← Voltar para edição
                                        </button>
                                    </div>
                                </div>
                            </>
                        );
                    })()}
                </div>
            )
            }

            {
                stage === "checkout" && (
                    <div className="hero-container">
                        <div className="action-island-container">
                            {(() => {
                                const planId = (selectedPlan || "premium_plus").trim();

                                const prices: any = {
                                    credit_1: {
                                        price: 12.90,
                                        name: "1 Crédito Avulso",
                                        billing: "one_time",
                                        desc: "Otimização pontual"
                                    },
                                    credit_3: {
                                        price: 29.90,
                                        name: "Pacote 3 Créditos",
                                        billing: "one_time",
                                        desc: "3 otimizações completas"
                                    },
                                    pro_monthly: {
                                        price: 27.90,
                                        name: "VANT Pro Mensal",
                                        billing: "subscription",
                                        desc: "Otimizações ilimitadas"
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
                                    },
                                    premium_plus: {
                                        price: 29.90,
                                        name: "VANT Pro Mensal (Legacy)",
                                        billing: "subscription",
                                        desc: "Plano legado"
                                    },
                                    basico: {
                                        price: 9.90,
                                        name: "1 Crédito (Legacy)",
                                        billing: "one_time",
                                        desc: "Plano legado"
                                    },
                                };

                                const plan = prices[planId] || prices.premium_plus;
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
                )
            }

            <AuthModal
                isOpen={showAuthModal}
                selectedPlan={selectedPlan}
                supabase={supabase}
                onSuccess={(userId, email) => {
                    setAuthUserId(userId);
                    setAuthEmail(email);
                    setShowAuthModal(false);
                    // Não forçar checkout - deixar useEffect decidir baseado no status do usuário
                }}
                onClose={() => setShowAuthModal(false)}
            />
        </main >
    );
}
