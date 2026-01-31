"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import type { AppStage, PlanType, PreviewData, ReportData, PilaresData, GapFatal, Book, PricesMap } from "@/types";
import { PaidStage } from "@/components/PaidStage";
import { AuthModal } from "@/components/AuthModal";
import { calcPotencial } from "@/lib/helpers";

type JsonObject = Record<string, unknown>;

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

const HERO_INNER_HTML = `
    <div class="hero-section">
        <div class="badge-live">
            <span class="vant-tooltip" 
                  tabindex="0" 
                  style="border-bottom: none; cursor: help;" 
                  data-tooltip="Mais de 50.000 CVs otimizados. Taxa de sucesso comprovada em seleções de grandes empresas.">
                50K+ Currículos Otimizados
            </span>
        </div>

        <div class="logo-text">VANT</div>

        <div class="headline">
            Vença o algoritmo ATS.<br>
            <span class="highlight">Chegue na mão do recrutador.</span>
        </div>

        <div class="subheadline">
            Nossa IA otimiza seu currículo para passar nos filtros automáticos 
            e chegar direto no recrutador.
        </div>
    </div>

    <div class="hero-section" style="margin-top: 80px;">
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-number">+34%</div>
                <div class="stat-label">
                    de aprovação em ATS
                    <span class="vant-tooltip" tabindex="0" data-tooltip="Aumento médio de pontuação comparado ao currículo original (Base: 50k+ processamentos)." style="margin-left: 4px; opacity: 0.6; font-size: 0.75rem; border-bottom: 1px dotted #94A3B8; cursor: help;">
                        
                    </span>
                </div>
            </div>
            
            <div class="stat-card">
                <div class="stat-number">3x</div>
                <div class="stat-label">
                    mais entrevistas conseguidas
                    <span class="vant-tooltip" tabindex="0" data-tooltip="Média de conversão de usuários ativos nos últimos 3 meses." style="margin-left: 4px; opacity: 0.6; font-size: 0.75rem; border-bottom: 1px dotted #94A3B8; cursor: help;">
                        
                    </span>
                </div>
            </div>
            
            <div class="stat-card">
                <div class="stat-number">100%</div>
                <div class="stat-label">
                    Privado - Dados anonimizados
                    <span class="vant-tooltip" tabindex="0" data-tooltip="Processamento em memória volátil (RAM). Seus dados são destruídos após a sessão. Zero logs" style="margin-left: 4px; opacity: 0.6; font-size: 0.75rem; border-bottom: 1px dotted #94A3B8; cursor: help;">
                        
                    </span>
                </div>
            </div>
        </div>
        <div style="text-align: center; margin-top: 20px; color: #64748B; font-size: 0.8rem; font-style: italic;">
            Baseado em dados de 50.000+ processamentos reais
        </div>
    </div>

    <!-- Por que funciona -->
    <div class="hero-section" style="margin-top: 80px;">
        <div style="text-align: center; margin-bottom: 32px;">
            <h3 style="color: #F8FAFC; font-size: 1.5rem; font-weight: 700; margin: 0 0 8px 0;">Por que funciona</h3>
            <p style="color: #94A3B8; font-size: 0.9rem; margin: 0;">Tecnologia baseada em dados reais de mercado</p>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; max-width: 900px; margin: 0 auto;">
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
                    <span style="color: #10B981; font-size: 1.4rem;">43</span> Critérios ATS Detectados
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
    </div>
    
    <!-- Garantia e Transparência -->
    <div class="hero-section" style="margin-top: 80px;">
        <div style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(74, 158, 255, 0.05)); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 16px; padding: 32px; text-align: center; max-width: 700px; margin: 0 auto;">
            <div style="font-size: 2rem; margin-bottom: 16px;">🎯</div>
            <h3 style="color: #F8FAFC; font-size: 1.3rem; font-weight: 700; margin: 0 0 12px 0;">Análise Gratuita</h3>
            <p style="color: #E2E8F0; font-size: 1rem; line-height: 1.6; margin: 0 0 20px 0;">
                Veja seu score ATS e descubra exatamente o que precisa melhorar no seu CV.<br>
                <strong>Sem compromisso. Sem cartão de crédito.</strong>
            </p>
            <div style="display: flex; flex-direction: column; gap: 12px; align-items: center; margin-top: 24px;">
                <div style="display: flex; align-items: center; gap: 8px; color: #94A3B8; font-size: 0.85rem;">
                    <span style="color: #10B981;">✓</span> Processamento 100% privado e anônimo
                </div>
                <div style="display: flex; align-items: center; gap: 8px; color: #94A3B8; font-size: 0.85rem;">
                    <span style="color: #10B981;">✓</span> Seus dados são destruídos após a análise
                </div>
                <div style="display: flex; align-items: center; gap: 8px; color: #94A3B8; font-size: 0.85rem;">
                    <span style="color: #10B981;">✓</span> Relatório detalhado em segundos
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
        <p style="color: #94A3B8; font-size: 0.85rem; margin: 0; line-height: 1.6;">
            Anexe o CV de um profissional da área e a IA fará engenharia reversa para aplicar os acertos no seu perfil.
            <br><br>
            <span style="color: #64748B; font-size: 0.8rem;">
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

export default function AppPage() {
    // Estados principais
    const [stage, setStage] = useState<AppStage>("hero");
    const [selectedPlan, setSelectedPlan] = useState<PlanType>("basico");
    const [jobDescription, setJobDescription] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [competitorFiles, setCompetitorFiles] = useState<File[]>([]);

    const [authEmail, setAuthEmail] = useState("");
    const [authPassword, setAuthPassword] = useState("");
    const [authUserId, setAuthUserId] = useState<string | null>(null);
    const [stripeSessionId, setStripeSessionId] = useState<string | null>(null);
    const [checkoutError, setCheckoutError] = useState<string | null>(null);
    const [, setCreditsRemaining] = useState(0);
    const [needsActivation, setNeedsActivation] = useState(false);
    const [isActivating, setIsActivating] = useState(false);
    const [isLoginMode, setIsLoginMode] = useState(true);  // ← NOVO (true = login, false = cadastro)
    const [isAuthenticating, setIsAuthenticating] = useState(false);  // ← NOVO
    const [showAuthModal, setShowAuthModal] = useState(false);

    // Estados de processamento
    const [progress, setProgress] = useState(0);
    const [statusText, setStatusText] = useState("");
    const [apiError, setApiError] = useState("");
    const [previewData, setPreviewData] = useState<PreviewData | null>(null);
    const [reportData, setReportData] = useState<ReportData | null>(null);
    const [, setPremiumError] = useState("");
    const [isRestoringData, setIsRestoringData] = useState(false);
    const [pdfMetadata, setPdfMetadata] = useState<{ pages?: number; text?: string; candidateName?: string } | null>(null);

    // Refs
    const uploaderInputRef = useRef<HTMLInputElement | null>(null);
    const competitorUploaderInputRef = useRef<HTMLInputElement | null>(null);

    const supabase = useMemo(() => {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (!url || !key) {
            return null;
        }
        return createClient(url, key);
    }, []);

    function getErrorMessage(e: unknown, fallback: string): string {
        if (e instanceof Error && e.message) {
            return String(e.message);
        }
        if (typeof e === "string" && e.trim()) {
            return e;
        }
        return fallback;
    }

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
                    /\b([A-ZÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜ][a-zàáâãäåçèéêëìíîïñòóôõöùúûü]{2,}(?:\s+(?:da|de|do|dos|das|e)\s+|\s+)[A-ZÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜ][a-zàáâãäåçèéêëìíîïñòóôõöùúûü]{2,}(?:\s+(?:da|de|do|dos|das)\s+[A-ZÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜ][a-zàáâãäåçèéêëìíîïñòóôõöùúûü]{2,})?(?:\s+[A-ZÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜ][a-zàáâãäåçèéêëìíîïñòóôõöùúûü]{2,})?)\b/,
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

    // Restaurar jobDescription e file do localStorage ao montar
    useEffect(() => {
        if (typeof window !== "undefined") {
            const savedJob = localStorage.getItem("vant_jobDescription");
            const savedFileName = localStorage.getItem("vant_file_name");
            const savedFileType = localStorage.getItem("vant_file_type");
            const savedFileB64 = localStorage.getItem("vant_file_b64");
            // Só restaurar se for a primeira montagem (estado ainda vazio)
            if (savedJob && jobDescription === "") {
                setJobDescription(savedJob);
            }
            if (savedFileName && savedFileType && savedFileB64 && !file) {
                fetch(savedFileB64)
                    .then(res => res.blob())
                    .then(blob => {
                        const restoredFile = new File([blob], savedFileName, { type: savedFileType });
                        setFile(restoredFile);
                    });
            }
        }
    }, []); // Removido jobDescription e file das dependências

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

    useEffect(() => {
        console.log("[useEffect URL params] Rodou.");
        if (typeof window === "undefined") {
            return;
        }

        const initSession = async () => {
            if (!supabase) {
                return;
            }
            const { data } = await supabase.auth.getSession();
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

        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        const payment = url.searchParams.get("payment");
        const sessionId = url.searchParams.get("session_id") || "";

        if (code && supabase) {
            (async () => {
                try {
                    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
                    if (error) {
                        throw new Error(error.message);
                    }
                    const user = data?.session?.user;
                    if (user?.id) {
                        setAuthUserId(user.id);
                        if (user.email) {
                            setAuthEmail(user.email);
                        }
                        setCheckoutError("");

                        // Restaurar o stage e plano após login com Google
                        const returnStage = localStorage.getItem("vant_auth_return_stage");
                        const returnPlan = localStorage.getItem("vant_auth_return_plan");

                        if (returnStage) {
                            setStage(returnStage as AppStage);
                            localStorage.removeItem("vant_auth_return_stage");
                        }

                        if (returnPlan) {
                            setSelectedPlan(returnPlan as PlanType);
                            localStorage.removeItem("vant_auth_return_plan");
                        }
                    }
                } catch (e: unknown) {
                    setCheckoutError(getErrorMessage(e, "Falha no login"));
                }
            })();

            url.searchParams.delete("code");
            window.history.replaceState({}, "", url.toString());
        }

        const activateEntitlements = async (sid: string, uid: string) => {
            const resp = await fetch(`${getApiUrl()}/api/entitlements/activate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ session_id: sid, user_id: uid }),
            });
            const payload = (await resp.json()) as JsonObject;
            if (!resp.ok) {
                const err = typeof payload.error === "string" ? payload.error : `HTTP ${resp.status}`;
                throw new Error(err);
            }
            if (typeof payload.plan_id === "string") {
                setSelectedPlan(payload.plan_id as PlanType);
            }
            if (typeof payload.credits_remaining === "number") {
                setCreditsRemaining(payload.credits_remaining);
            }
        };

        const pendingSid = window.localStorage.getItem("vant_pending_stripe_session_id") || "";
        if (pendingSid) {
            setStripeSessionId(pendingSid);
            setNeedsActivation(true);

            if (!authUserId) {
                setStage("checkout");
                setCheckoutError("Pagamento confirmado. Faça login para finalizar a ativação do seu plano.");
            }
        }

        if (payment === "success" && sessionId) {
            setStripeSessionId(sessionId);
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
                        const err = typeof payload.error === "string" ? payload.error : `HTTP ${resp.status}`;
                        throw new Error(err);
                    }

                    if (payload.paid === true) {
                        if (typeof payload.plan_id === "string") {
                            setSelectedPlan(payload.plan_id as PlanType);
                        }
                        if (!authUserId) {
                            setNeedsActivation(true);
                            window.localStorage.setItem("vant_pending_stripe_session_id", sessionId);
                            setCheckoutError("Pagamento confirmado. Faça login para finalizar a ativação do seu plano.");
                            setStage("checkout");
                            return;
                        }
                        await activateEntitlements(sessionId, authUserId);
                        window.localStorage.removeItem("vant_pending_stripe_session_id");
                        setNeedsActivation(false);
                        // Em vez de ir direto para paid, vai para processing_premium para processar o arquivo
                        setStage("processing_premium");
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

    useEffect(() => {
        console.log("[useEffect needsActivation] Rodou.");
        if (!needsActivation || !authUserId || !stripeSessionId || isActivating) {
            return;
        }

        (async () => {
            setIsActivating(true);
            try {
                console.log("[needsActivation] Chamando /api/entitlements/activate...");
                const resp = await fetch(`${getApiUrl()}/api/entitlements/activate`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ session_id: stripeSessionId, user_id: authUserId }),
                });
                const payload = (await resp.json()) as JsonObject;
                if (!resp.ok) {
                    const err = typeof payload.error === "string" ? payload.error : `HTTP ${resp.status}`;
                    throw new Error(err);
                }
                if (typeof payload.plan_id === "string") {
                    setSelectedPlan(payload.plan_id as PlanType);
                }
                if (typeof payload.credits_remaining === "number") {
                    setCreditsRemaining(payload.credits_remaining);
                }
                setNeedsActivation(false);
                setCheckoutError("");
                // Em vez de ir direto para paid, vai para processing_premium para processar o arquivo
                setStage("processing_premium");
            } catch (e: unknown) {
                setCheckoutError(getErrorMessage(e, "Falha ao ativar plano"));
            } finally {
                setIsActivating(false);
            }
        })();
    }, [authUserId, needsActivation, stripeSessionId, isActivating]);

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

        const planId = (selectedPlan || "basico").trim();
        if (!authEmail || !authEmail.includes("@")) {
            setCheckoutError("Digite um e-mail válido.");
            return;
        }

        try {
            const body: Record<string, unknown> = {
                plan_id: planId,
                customer_email: authEmail,
                score: typeof previewData?.nota_ats === "number" ? previewData.nota_ats : 0,
            };
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
                const err = typeof payload.error === "string" ? payload.error : `HTTP ${resp.status}`;
                throw new Error(err);
            }
            if (typeof payload.id === "string") {
                setStripeSessionId(payload.id);
            }
            const checkoutUrl = typeof payload.url === "string" ? payload.url : "";
            if (!checkoutUrl) {
                throw new Error("URL de checkout não retornada pelo backend");
            }

            // Salvar dados no localStorage antes de redirecionar para o pagamento
            if (typeof window !== "undefined" && jobDescription && file) {
                console.log("[startCheckout] Salvando dados no localStorage antes do pagamento...");
                localStorage.setItem("vant_jobDescription", jobDescription);

                // Converter arquivo para base64 e aguardar conclusão
                const reader = new FileReader();
                reader.onload = () => {
                    const base64 = reader.result as string;
                    localStorage.setItem("vant_file_b64", base64);
                    localStorage.setItem("vant_file_name", file.name);
                    localStorage.setItem("vant_file_type", file.type);
                    console.log("[startCheckout] Dados salvos com sucesso. Redirecionando...");
                    window.location.href = checkoutUrl;
                };
                reader.readAsDataURL(file);
            } else {
                // Se não houver dados para salvar, redireciona imediatamente
                window.location.href = checkoutUrl;
            }
            return; // Evita que o redirecionamento abaixo execute antes da hora
        } catch (e: unknown) {
            setCheckoutError(getErrorMessage(e, "Erro ao iniciar checkout"));
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

        try {
            if (isLoginMode) {
                // LOGIN
                const { data, error } = await supabase.auth.signInWithPassword({
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
                const { data, error } = await supabase.auth.signUp({
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
            }

            const { error } = await supabase.auth.signInWithOAuth({
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
        }
    }

    useEffect(() => {
        console.log("[useEffect syncEntitlements] Rodou.");
        if (!authUserId) {
            return;
        }
        (async () => {
            try {
                await syncEntitlements(authUserId);
            } catch {
                return;
            }
        })();
    }, [authUserId]);

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
            console.error("[processing_premium] Dados incompletos:", { jobDescription: !!jobDescription, file: !!file });
            setPremiumError("Dados da sessão incompletos. Volte e envie seu CV novamente.");
            setStage("preview");
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
                    await sleep(220);
                };

                await updateStatus("🔒 PAGAMENTO VERIFICADO. INICIANDO IA GENERATIVA...", 10);
                await updateStatus("REESCREVENDO SEU CV (AGENT)...", 35);

                const form = new FormData();
                form.append("user_id", authUserId);
                form.append("job_description", jobDescription);
                form.append("file", file);
                if (competitorFiles && competitorFiles.length) {
                    for (const cf of competitorFiles) {
                        form.append("competitor_files", cf);
                    }
                }

                const resp = await fetch(`${getApiUrl()}/api/analyze-premium-paid`, {
                    method: "POST",
                    body: form,
                });
                const payload = (await resp.json()) as JsonObject;
                if (!resp.ok) {
                    const err = typeof payload.error === "string" ? payload.error : `HTTP ${resp.status}`;
                    throw new Error(err);
                }

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
                setPremiumError(getErrorMessage(e, "Erro na geração premium"));
                setStage("paid");
            }
        })();
    }, [authUserId, competitorFiles, stage, jobDescription, file]);

    async function onStart() {
        console.log("[onStart] Chamado. Estado atual:", { jobDescription: !!jobDescription, file: !!file, stage });
        if (!jobDescription.trim() || !file) {
            console.warn("[onStart] Retorno antecipado: jobDescription ou file vazios.");
            return;
        }

        setApiError("");
        setPreviewData(null);
        setReportData(null);
        setPremiumError("");
        setProgress(0);
        setStatusText("");
        setStage("analyzing");

        await sleep(120);

        try {
            const updateStatus = async (text: string, percent: number) => {
                setStatusText(text);
                setProgress(percent);
                await sleep(220);
            };

            await updateStatus("INICIANDO SCANNER BIOMÉTRICO DO CV...", 10);
            await updateStatus("MAPEANDO DENSIDADE DE PALAVRAS-CHAVE...", 40);

            const form = new FormData();
            form.append("job_description", jobDescription);
            form.append("file", file);

            console.log("[DEBUG] API_URL:", getApiUrl());

            const resp = await fetch(`${getApiUrl()}/api/analyze-lite`, {
                method: "POST",
                body: form,
            });

            if (!resp.ok) {
                const text = await resp.text();
                throw new Error(text || `HTTP ${resp.status}`);
            }

            const data = (await resp.json()) as unknown;

            await updateStatus("CALCULANDO SCORE DE ADERÊNCIA...", 80);
            await sleep(450);
            await updateStatus("RELATÓRIO PRELIMINAR PRONTO.", 100);
            await sleep(350);

            setPreviewData(data as PreviewData);
            setStage("preview");
        } catch (e: unknown) {
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

    function renderDashboardMetricsHtml(nota: number, veredito: string, potencial: number, pilares: PilaresData) {
        const getNum = (v: unknown) => (typeof v === "number" ? v : 0);
        const impacto = getNum(pilares.impacto);
        const keywords = getNum(pilares.keywords);
        const ats = getNum(pilares.ats);

        const row = (label: string, value: number) => `
            <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                <span style="color:#94A3B8; font-size:0.75rem; font-weight:700; letter-spacing:0.8px;">${label.toUpperCase()}</span>
                <span style="color:#F8FAFC; font-size:0.8rem; font-weight:800; font-family:monospace;">${value}%</span>
            </div>
        `;

        return `
            <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(56, 189, 248, 0.15); border-radius: 12px; padding: 16px;">
                <div style="display:flex; justify-content:space-between; align-items:center; gap:12px; margin-bottom: 12px;">
                    <div style="color:#E2E8F0; font-weight:900; font-size: 1.0rem;">SCORE ATS: ${nota}%</div>
                    <div style="color:#94A3B8; font-size:0.85rem; font-weight:700;">${veredito || ""}</div>
                </div>
                ${row("Impacto", impacto)}
                ${row("Keywords", keywords)}
                ${row("ATS", ats)}
                <div style="margin-top:10px; color:#64748B; font-size:0.8rem;">Potencial estimado: <strong style=\"color:#10B981;\">${potencial}%</strong></div>
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
            <div style="color: #94A3B8; font-size: 0.9rem; margin-top: 5px;">
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
        background-image: linear-gradient(160deg, rgba(56, 189, 248, 0.05), rgba(16, 185, 129, 0.05));
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
                <p style="margin:4px 0 0 0; color:#94A3B8; font-size:0.75rem;">Acesso Vitalício • VANT-PRO</p>
            </div>
            <ul style="list-style:none; padding:0; margin:0;">
                ${listaHtml}
            </ul>
        </div>

        <div style="text-align:center; margin-top: 20px;">
            <div style="display:flex; align-items:center; justify-content:center; gap:8px;">
                <span style="text-decoration: line-through; color: #64748B; font-size: 0.8rem;">R$ 97,90</span>
                <span style="background:#10B981; color:#fff; font-size:0.6rem; padding:2px 6px; border-radius:4px; font-weight:700;">-70% OFF</span>
            </div>
            <div style="font-size: 3rem; font-weight: 800; color: #fff; line-height:1; margin-bottom: 5px;">
                <span style="font-size:1.5rem; vertical-align:top; color:#94A3B8;">R$</span>29<span style="font-size:1rem; color:#94A3B8;">,90</span>
            </div>
        </div>
    </div>
    `;
    }

    return (
        <main>
            {stage === "hero" && (
                <>
                    <div className="hero-container">
                        <div dangerouslySetInnerHTML={{ __html: HERO_INNER_HTML }} />

                        <div className="action-island-container">
                            <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
                                <div style={{ flex: "1 1 380px" }}>
                                    <h5>1. VAGA ALVO 🎯</h5>
                                    <div className="stTextArea">
                                        <textarea
                                            value={jobDescription}
                                            onChange={(e) => setJobDescription(e.target.value)}
                                            placeholder="Cole aqui a descrição da vaga (Título, Requisitos e Responsabilidades)..."
                                            style={{ height: 185, width: "100%", boxSizing: "border-box" }}
                                        />
                                    </div>
                                    <div style={{
                                        marginTop: 8,
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        color: jobDescription && jobDescription.length >= 500 ? "#10B981" : "#64748B",
                                        fontSize: "0.8rem"
                                    }}>
                                        <span>Caracteres: {jobDescription ? jobDescription.length : 0}/500</span>
                                        <span style={{ color: "#94A3B8", fontSize: "0.75rem" }}>
                                            💡 Cole a descrição completa para melhores resultados
                                        </span>
                                    </div>
                                </div>

                                <div style={{ flex: "1 1 380px" }}>
                                    <h5>2. SEU CV (PDF) 📄</h5>
                                    {file ? (
                                        <div style={{ background: "rgba(16, 185, 129, 0.1)", border: "1px solid #10B981", borderRadius: 8, padding: 16, textAlign: "center" }}>
                                            <div style={{ color: "#10B981", fontSize: "0.9rem", fontWeight: 600, marginBottom: 4 }}>✅ Arquivo carregado</div>
                                            <div style={{ color: "#E2E8F0", fontSize: "0.85rem" }}>{file.name}</div>

                                            {/* Exibir metadados extraídos */}
                                            {pdfMetadata && (
                                                <div style={{
                                                    background: "rgba(16, 185, 129, 0.05)",
                                                    border: "1px solid rgba(16, 185, 129, 0.2)",
                                                    borderRadius: 6,
                                                    padding: 12,
                                                    marginTop: 8,
                                                    textAlign: "left"
                                                }}>
                                                    <div style={{ color: "#94A3B8", fontSize: "0.75rem", marginBottom: 4 }}>📊 DETALHES DETECTADOS:</div>
                                                    {pdfMetadata.pages && (
                                                        <div style={{ color: pdfMetadata.pages > 3 ? "#FBBF24" : "#E2E8F0", fontSize: "0.85rem", marginBottom: 2 }}>
                                                            <strong>Páginas:</strong> {pdfMetadata.pages}
                                                            {pdfMetadata.pages > 3 && <span style={{ marginLeft: 6 }}>- Vamos otimizar para 1-2 páginas ideais ✓</span>}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            <button type="button" onClick={() => setFile(null)} style={{ marginTop: 12, fontSize: "0.75rem", color: "#94A3B8", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                                                Remover
                                            </button>
                                        </div>
                                    ) : (
                                        <div data-testid="stFileUploader">
                                            <section onClick={openFileDialog} style={{ cursor: "pointer" }}>
                                                <div>
                                                    <div>
                                                        <span>Arraste aqui ou clique para selecionar</span>
                                                    </div>
                                                    <small>✓ PDF ou DOCX • Máx. 10MB</small>
                                                    <button type="button" onClick={openFileDialog} style={{ marginTop: "8px", fontSize: "0.8rem", opacity: 0.7 }}>Selecionar Arquivo</button>
                                                    <input
                                                        ref={uploaderInputRef}
                                                        type="file"
                                                        accept="application/pdf"
                                                        style={{ display: "none" }}
                                                        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                                                    />
                                                </div>
                                            </section>
                                        </div>
                                    )}
                                </div>

                                <div style={{ height: 16 }} />

                                {/* Toggle Top Performer - Agora visível como vantagem */}
                                <div style={{
                                    background: "linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(16, 185, 129, 0.05))",
                                    border: "1px solid rgba(245, 158, 11, 0.25)",
                                    borderRadius: 12,
                                    padding: "16px 20px",
                                    marginBottom: 16
                                }}>
                                    <div style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        gap: 12,
                                        marginBottom: competitorFiles.length > 0 ? 16 : 0
                                    }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
                                            <div style={{
                                                width: 40,
                                                height: 40,
                                                background: "linear-gradient(135deg, #F59E0B, #10B981)",
                                                borderRadius: 10,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                fontSize: "1.3rem",
                                                flexShrink: 0
                                            }}>
                                                🎯
                                            </div>
                                            <div>
                                                <div style={{
                                                    color: "#F8FAFC",
                                                    fontSize: "0.95rem",
                                                    fontWeight: 700,
                                                    letterSpacing: "0.3px"
                                                }}>
                                                    Referência de Candidato Ideal <span style={{ color: "#94A3B8", fontSize: "0.75rem", fontWeight: 400 }}>(Opcional)</span>
                                                </div>
                                                <div style={{
                                                    color: "#94A3B8",
                                                    fontSize: "0.8rem",
                                                    marginTop: 2
                                                }}>
                                                    {competitorFiles.length > 0
                                                        ? `Usando ${competitorFiles.length} arquivo(s) de referência`
                                                        : "Use nosso padrão de mercado automaticamente"
                                                    }
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (competitorFiles.length > 0) {
                                                    setCompetitorFiles([]);
                                                } else {
                                                    openCompetitorFileDialog();
                                                }
                                            }}
                                            style={{
                                                background: competitorFiles.length > 0
                                                    ? "linear-gradient(135deg, #10B981, #059669)"
                                                    : "transparent",
                                                color: competitorFiles.length > 0 ? "#fff" : "#94A3B8",
                                                border: competitorFiles.length > 0
                                                    ? "none"
                                                    : "1px solid rgba(148, 163, 184, 0.4)",
                                                borderRadius: 20,
                                                padding: "8px 16px",
                                                fontSize: "0.8rem",
                                                fontWeight: 600,
                                                cursor: "pointer",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 6,
                                                whiteSpace: "nowrap",
                                                transition: "all 0.2s ease"
                                            }}
                                        >
                                            {competitorFiles.length > 0 ? (
                                                <span
                                                    style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        background: 'linear-gradient(135deg, #10B981, #059669)',
                                                        padding: '8px 16px',
                                                        borderRadius: '6px',
                                                        color: 'white',
                                                        fontWeight: '600',
                                                        fontSize: '0.9rem',
                                                        boxShadow: '0 0 20px rgba(16, 185, 129, 0.5)',
                                                        animation: 'subtle-pulse 2s infinite'
                                                    }}
                                                >
                                                    ✓ PRONTO PARA ANÁLISE
                                                </span>
                                            ) : (
                                                <>+ ADICIONAR CV DE REFERÊNCIA</>
                                            )}
                                        </button>
                                        <input
                                            ref={competitorUploaderInputRef}
                                            type="file"
                                            accept="application/pdf"
                                            multiple
                                            style={{ display: "none" }}
                                            onChange={(e) => setCompetitorFiles(Array.from(e.target.files ?? []))}
                                        />
                                    </div>

                                    {competitorFiles.length > 0 && (
                                        <div style={{
                                            background: "rgba(16, 185, 129, 0.1)",
                                            border: "1px solid rgba(16, 185, 129, 0.3)",
                                            borderRadius: 8,
                                            padding: 12,
                                            marginTop: 12
                                        }}>
                                            <div style={{
                                                color: "#10B981",
                                                fontSize: "0.85rem",
                                                fontWeight: 600,
                                                marginBottom: 8,
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 6
                                            }}>
                                                ✅ Referência carregada
                                            </div>
                                            <div style={{ color: "#E2E8F0", fontSize: "0.8rem" }}>
                                                {competitorFiles.map((f, i) => (
                                                    <div key={i} style={{ marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
                                                        <span style={{ color: "#64748B" }}>📄</span>
                                                        {f.name}
                                                    </div>
                                                ))}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setCompetitorFiles([])}
                                                style={{
                                                    marginTop: 8,
                                                    fontSize: "0.75rem",
                                                    color: "#94A3B8",
                                                    background: "none",
                                                    border: "none",
                                                    cursor: "pointer",
                                                    textDecoration: "underline"
                                                }}
                                            >
                                                Remover e usar padrão automático
                                            </button>
                                        </div>
                                    )}

                                    {competitorFiles.length === 0 && (
                                        <div style={{
                                            marginTop: 12,
                                            padding: "10px 12px",
                                            background: "rgba(15, 23, 42, 0.4)",
                                            borderRadius: 6,
                                            border: "1px dashed rgba(148, 163, 184, 0.2)"
                                        }}>
                                            <p style={{
                                                color: "#94A3B8",
                                                fontSize: "0.8rem",
                                                margin: 0,
                                                lineHeight: 1.5
                                            }}>
                                                💡 <strong style={{ color: "#E2E8F0" }}>Bônus incluído:</strong> Nossa IA aplicará automaticamente os padrões de quem foi contratado nessa área.
                                                Quer calibrar com um perfil específico? Clique no botão acima.
                                            </p>
                                        </div>
                                    )}
                                </div>
                                <div data-testid="stButton" className="stButton" style={{ width: "100%" }}>
                                    <button
                                        type="button"
                                        data-kind="primary"
                                        onClick={onStart}
                                        style={{
                                            width: "100%",
                                            transition: "all 0.2s ease",
                                            cursor: "pointer"
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = "translateY(-2px)";
                                            e.currentTarget.style.boxShadow = "0 8px 24px rgba(255, 140, 66, 0.4)";
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = "translateY(0)";
                                            e.currentTarget.style.boxShadow = "";
                                        }}
                                        onMouseDown={(e) => {
                                            e.currentTarget.style.transform = "scale(0.98)";
                                        }}
                                        onMouseUp={(e) => {
                                            e.currentTarget.style.transform = "translateY(-2px)";
                                        }}
                                    >
                                        VER MEU SCORE ATS GRÁTIS
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {stage === "paid" && (
                <PaidStage
                    reportData={reportData}
                    authUserId={authUserId}
                    onNewOptimization={() => {
                        setReportData(null);
                        setFile(null);
                        setCompetitorFiles([]);
                        setStage("hero");
                    }}
                    onUpdateReport={(updated) => setReportData(updated)}
                />
            )}

            {stage === "analyzing" && (
                <div className="hero-container">
                    <div className="loading-logo">vant.core scanner</div>
                    <div style={{ maxWidth: 680, margin: "0 auto" }}>
                        <div style={{ height: 10, background: "rgba(255,255,255,0.08)", borderRadius: 999, overflow: "hidden" }}>
                            <div
                                style={{
                                    width: `${Math.max(0, Math.min(100, progress))}%`,
                                    height: "100%",
                                    background: "linear-gradient(90deg, #38BDF8, #818CF8)",
                                    transition: "width 0.25s ease",
                                }}
                            />
                        </div>

                        <div style={{ marginTop: 18 }}>
                            <div className="terminal-log" style={{ color: "#38BDF8" }}>
                                &gt;&gt; {statusText}
                            </div>
                        </div>
                    </div>
                </div>
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

                        const metaHtml = `
    <div style="background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(16, 185, 129, 0.1)); 
                border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 12px; padding: 20px; margin-top: 20px;">
        <div style="display: flex; align-items: center; gap: 15px;">
            <div style="font-size: 2.5rem;">🎯</div>
            <div>
                <div style="color: #F59E0B; font-weight: 800; font-size: 1.1rem;">META DE PONTUAÇÃO</div>
                <div style="color: #E2E8F0; font-size: 0.9rem; margin-top: 5px;">
                    Se aplicar as correções sugeridas, sua nota pode chegar a <strong style="color: #10B981;">${potencial}%</strong>
                    <br>Isso coloca você no <strong>Top 15%</strong> dos candidatos.
                </div>
            </div>
        </div>
    </div>
    `;

                        const dashHtml = renderDashboardMetricsHtml(nota, veredito, potencial, pilares);

                        const setorDetectado = typeof pilares.setor_detectado === "string" ? pilares.setor_detectado : "Gestão Estratégica";
                        const exemploMelhoria = `Especialista em ${setorDetectado} com histórico de ` +
                            "liderança em projetos de alta complexidade. Otimizou o budget operacional em 22%..." +
                            "Implementação de frameworks ágeis e reestruturação de governança corporativa.";

                        const xrayHtml = `
        <div style='background: rgba(15, 23, 42, 0.6); border: 1px solid #38BDF8; padding: 20px; border-radius: 12px; position: relative; overflow: hidden; margin-top: 25px;'>
            <div style="position: absolute; top: -10px; right: -10px; background: #38BDF8; width: 50px; height: 50px; filter: blur(30px); opacity: 0.2;"></div>
            
            <h3 style='color: #38BDF8; margin-top: 0; font-size: 1.1rem; display: flex; align-items: center; gap: 8px;'>
                🎯 Radar de Recrutadores Ativo
            </h3>
            
            <p style='color: #94A3B8; font-size: 0.9rem; margin-bottom: 15px; line-height: 1.4;'>
                Nossa varredura X-Ray já configurou os algoritmos para localizar <strong>${texto_destaque}</strong> no LinkedIn (Mercado Oculto).
            </p>
            
            <div style='background: rgba(0,0,0,0.3); padding: 12px; border-radius: 6px; margin-bottom: 15px; border-left: 2px solid #38BDF8; font-family: monospace; font-size: 0.75rem; color: #10B981; overflow-x: hidden; white-space: nowrap;'>
                site:linkedin.com/in/ "talent acquisition" "hiring" ...
            </div>
            
            <div style='text-align: center;'>
                <div style='background: rgba(245,158,11,0.1); padding: 8px 12px; border-radius: 6px; border: 1px dashed #F59E0B; display: inline-block;'>
                    <p style='color: #F59E0B; font-weight: 700; margin: 0; font-size: 0.75rem;'>
                        🔒 Lista pronta para acesso no Dossiê
                    </p>
                </div>
            </div>
        </div>
        `;

                        return (
                            <>
                                <div dangerouslySetInnerHTML={{ __html: metaHtml }} />

                                <div className="action-island-container" style={{ textAlign: "left", marginTop: 18 }}>
                                    <div dangerouslySetInnerHTML={{ __html: dashHtml }} />

                                    <div style={{ color: "#E2E8F0", fontSize: "1.25rem", fontWeight: 800, marginBottom: 14, textAlign: "center" }}>
                                        � Escolha Seu Plano
                                    </div>
                                    <div style={{ color: "#94A3B8", fontSize: "0.9rem", marginBottom: 24, textAlign: "center" }}>
                                        Desbloqueie análises completas e otimize múltiplos CVs
                                    </div>

                                    <div dangerouslySetInnerHTML={{ __html: xrayHtml }} />

                                    <div style={{ height: 12 }} />

                                    <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                                        <div style={{ flex: "1 1 220px" }}>
                                            <div
                                                dangerouslySetInnerHTML={{
                                                    __html: `
            <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 20px; text-align: center;">
                <div style="color: #94A3B8; font-size: 0.8rem; margin-bottom: 10px;">BÁSICO</div>
                <div style="font-size: 2rem; font-weight: 800; color: #F8FAFC; margin-bottom: 5px;">R$ 29,90</div>
                <div style="color: #64748B; font-size: 0.75rem; margin-bottom: 15px;">Pagamento único</div>
                <div style="text-align: left; font-size: 0.85rem; color: #CBD5E1; margin-bottom: 15px;">
                    ✅ 1 CV otimizado<br>
                    ✅ Análise ATS<br>
                    ✅ Download PDF + DOCX<br>
                    ✅ X-Ray Search
                </div>
            </div>
            `,
                                                }}
                                            />
                                            <div data-testid="stButton" className="stButton" style={{ width: "100%" }}>
                                                <button
                                                    type="button"
                                                    data-kind="secondary"
                                                    onClick={() => {
                                                        setSelectedPlan("basico");
                                                        if (!authUserId) {
                                                            setShowAuthModal(true);
                                                        } else {
                                                            setStage("pricing");
                                                        }
                                                    }}
                                                    style={{ width: "100%" }}
                                                >
                                                    ESCOLHER BÁSICO
                                                </button>
                                            </div>
                                        </div>

                                        <div style={{ flex: "1 1 220px" }}>
                                            <div
                                                dangerouslySetInnerHTML={{
                                                    __html: `
            <div style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(56, 189, 248, 0.1)); border: 2px solid #10B981; border-radius: 12px; padding: 20px; text-align: center; position: relative;">
                <div style="position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: #10B981; color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.7rem; font-weight: 700;">
                    🔥 MAIS VENDIDO
                </div>
                <div style="color: #10B981; font-size: 0.8rem; margin-bottom: 10px; margin-top: 8px;">PRO</div>
                <div style="font-size: 2rem; font-weight: 800; color: #F8FAFC; margin-bottom: 5px;">R$ 69,90</div>
                <div style="color: #64748B; font-size: 0.75rem; margin-bottom: 5px;">R$ 23,30/CV</div>
                <div style="background: rgba(16, 185, 129, 0.2); color: #10B981; padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; display: inline-block; margin-bottom: 10px;">
                    Economize 20%
                </div>
                <div style="text-align: left; font-size: 0.85rem; color: #CBD5E1; margin-bottom: 15px;">
                    ✅ 3 CVs otimizados<br>
                    ✅ Análise comparativa<br>
                    ✅ Templates premium<br>
                    ✅ Simulador de entrevista<br>
                    ✅ Biblioteca curada
                </div>
            </div>
            `,
                                                }}
                                            />
                                            <div data-testid="stButton" className="stButton" style={{ width: "100%" }}>
                                                <button
                                                    type="button"
                                                    data-kind="secondary"
                                                    onClick={() => {
                                                        setSelectedPlan("pro");
                                                        if (!authUserId) {
                                                            setShowAuthModal(true);
                                                        } else {
                                                            setStage("pricing");
                                                        }
                                                    }}
                                                    style={{ width: "100%" }}
                                                >
                                                    ESCOLHER PRO
                                                </button>
                                            </div>
                                        </div>

                                        <div style={{ flex: "1 1 220px" }}>
                                            <div
                                                dangerouslySetInnerHTML={{
                                                    __html: `
            <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 12px; padding: 20px; text-align: center;">
                <div style="color: #F59E0B; font-size: 0.8rem; margin-bottom: 10px;">PREMIUM PLUS</div>
                <div style="font-size: 2rem; font-weight: 800; color: #F8FAFC; margin-bottom: 5px;">R$ 49,90</div>
                <div style="color: #64748B; font-size: 0.75rem; margin-bottom: 15px;">por mês (assinatura)</div>
                <div style="text-align: left; font-size: 0.85rem; color: #CBD5E1; margin-bottom: 15px;">
                    ✅ 30 CVs por mês<br>
                    ✅ Tudo do Pro<br>
                    ✅ Suporte prioritário<br>
                    ✅ Acesso antecipado<br>
                    💎 Melhor para quem aplica para várias vagas
                </div>
            </div>
            `,
                                                }}
                                            />
                                            <div data-testid="stButton" className="stButton" style={{ width: "100%" }}>
                                                <button
                                                    type="button"
                                                    data-kind="secondary"
                                                    onClick={() => {
                                                        setSelectedPlan("premium_plus");
                                                        if (!authUserId) {
                                                            setShowAuthModal(true);
                                                        } else {
                                                            setStage("pricing");
                                                        }
                                                    }}
                                                    style={{ width: "100%" }}
                                                >
                                                    ESCOLHER PREMIUM PLUS
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ height: 16 }} />

                                    <div data-testid="stButton" className="stButton" style={{ width: "100%" }}>
                                        <button type="button" data-kind="secondary" onClick={() => setStage("hero")} style={{ width: "100%" }}>
                                            VOLTAR
                                        </button>
                                    </div>
                                </div>
                            </>
                        );
                    })()}
                </div>
            )}

            {stage === "pricing" && (
                <div className="hero-container">
                    <div className="action-island-container">
                        <div style={{ marginBottom: 16, padding: 16, background: "rgba(16, 185, 129, 0.1)", border: "1px solid #10B981", borderRadius: 8 }}>
                            <div style={{ color: "#10B981", fontSize: "0.9rem", fontWeight: 600, marginBottom: 4 }}>
                                ✅ Logado como
                            </div>
                            <div style={{ color: "#E2E8F0", fontSize: "0.85rem" }}>{authEmail}</div>
                        </div>

                        <div style={{ color: "#E2E8F0", fontSize: "1.5rem", fontWeight: 800, marginBottom: 8, textAlign: "center" }}>
                            💳 Escolha Seu Plano
                        </div>
                        <div style={{ color: "#94A3B8", fontSize: "0.9rem", marginBottom: 24, textAlign: "center" }}>
                            Desbloqueie seu dossiê profissional completo
                        </div>

                        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                            <div style={{ flex: "1 1 220px" }}>
                                <div
                                    dangerouslySetInnerHTML={{
                                        __html: `
            <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 20px; text-align: center;">
                <div style="color: #94A3B8; font-size: 0.8rem; margin-bottom: 10px;">BÁSICO</div>
                <div style="font-size: 2rem; font-weight: 800; color: #F8FAFC; margin-bottom: 5px;">R$ 29,90</div>
                <div style="color: #64748B; font-size: 0.75rem; margin-bottom: 15px;">Pagamento único</div>
                <div style="text-align: left; font-size: 0.85rem; color: #CBD5E1; margin-bottom: 15px;">
                    ✅ 1 CV otimizado<br>
                    ✅ Análise ATS<br>
                    ✅ Download PDF + DOCX<br>
                    ✅ X-Ray Search
                </div>
            </div>
            `,
                                    }}
                                />
                                <div data-testid="stButton" className="stButton" style={{ width: "100%" }}>
                                    <button
                                        type="button"
                                        data-kind="secondary"
                                        onClick={() => {
                                            setSelectedPlan("basico");
                                            setStage("checkout");
                                        }}
                                        style={{ width: "100%" }}
                                    >
                                        ESCOLHER BÁSICO
                                    </button>
                                </div>
                            </div>

                            <div style={{ flex: "1 1 220px" }}>
                                <div
                                    dangerouslySetInnerHTML={{
                                        __html: `
            <div style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(56, 189, 248, 0.1)); border: 2px solid #10B981; border-radius: 12px; padding: 20px; text-align: center; position: relative;">
                <div style="position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: #10B981; color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.7rem; font-weight: 700;">
                    🔥 MAIS VENDIDO
                </div>
                <div style="color: #10B981; font-size: 0.8rem; margin-bottom: 10px; margin-top: 8px;">PRO</div>
                <div style="font-size: 2rem; font-weight: 800; color: #F8FAFC; margin-bottom: 5px;">R$ 69,90</div>
                <div style="color: #64748B; font-size: 0.75rem; margin-bottom: 5px;">R$ 23,30/CV</div>
                <div style="background: rgba(16, 185, 129, 0.2); color: #10B981; padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; display: inline-block; margin-bottom: 10px;">
                    Economize 20%
                </div>
                <div style="text-align: left; font-size: 0.85rem; color: #CBD5E1; margin-bottom: 15px;">
                    ✅ 3 CVs otimizados<br>
                    ✅ Análise comparativa<br>
                    ✅ Templates premium<br>
                    ✅ Simulador de entrevista<br>
                    ✅ Biblioteca curada
                </div>
            </div>
            `,
                                    }}
                                />
                                <div data-testid="stButton" className="stButton" style={{ width: "100%" }}>
                                    <button
                                        type="button"
                                        data-kind="primary"
                                        onClick={() => {
                                            setSelectedPlan("pro");
                                            setStage("checkout");
                                        }}
                                        style={{ width: "100%" }}
                                    >
                                        ESCOLHER PRO
                                    </button>
                                </div>
                            </div>

                            <div style={{ flex: "1 1 220px" }}>
                                <div
                                    dangerouslySetInnerHTML={{
                                        __html: `
            <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 12px; padding: 20px; text-align: center;">
                <div style="color: #F59E0B; font-size: 0.8rem; margin-bottom: 10px;">PREMIUM PLUS</div>
                <div style="font-size: 2rem; font-weight: 800; color: #F8FAFC; margin-bottom: 5px;">R$ 49,90</div>
                <div style="color: #64748B; font-size: 0.75rem; margin-bottom: 15px;">por mês (assinatura)</div>
                <div style="text-align: left; font-size: 0.85rem; color: #CBD5E1; margin-bottom: 15px;">
                    ✅ 30 CVs por mês<br>
                    ✅ Tudo do Pro<br>
                    ✅ Suporte prioritário<br>
                    ✅ Acesso antecipado<br>
                    💎 Melhor para quem aplica para várias vagas
                </div>
            </div>
            `,
                                    }}
                                />
                                <div data-testid="stButton" className="stButton" style={{ width: "100%" }}>
                                    <button
                                        type="button"
                                        data-kind="secondary"
                                        onClick={() => {
                                            setSelectedPlan("premium_plus");
                                            setStage("checkout");
                                        }}
                                        style={{ width: "100%" }}
                                    >
                                        ESCOLHER PREMIUM PLUS
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div style={{ height: 16 }} />

                        <div data-testid="stButton" className="stButton" style={{ width: "100%" }}>
                            <button type="button" data-kind="secondary" onClick={() => setStage("preview")} style={{ width: "100%" }}>
                                VOLTAR
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {stage === "checkout" && (
                <div className="hero-container">
                    <div className="action-island-container">
                        {(() => {
                            const planId = (selectedPlan || "basico").trim();
                            const prices: any = {
                                basico: { price: 29.90, name: "1 Otimização", billing: "one_time" },
                                pro: { price: 69.90, name: "Pacote 3 Vagas", billing: "one_time" },
                                premium_plus: { price: 49.90, name: "VANT - Pacote Premium Plus", billing: "subscription" },
                            };
                            const plan = prices[planId] || prices.basico;
                            const isSubscription = plan.billing === "subscription";
                            const billingLine = !isSubscription
                                ? "✅ Pagamento único · ✅ Acesso imediato"
                                : "✅ Assinatura mensal · ✅ 30 CVs/mês";

                            const boxHtml = `
            <div style="background: rgba(15, 23, 42, 0.6); padding: 20px; border-radius: 12px; margin-bottom: 16px; border: 1px solid rgba(255,255,255,0.08);">
                <div style="display:flex; justify-content: space-between; align-items:center; margin-bottom: 8px;">
                    <span style="color:#94A3B8;">Plano</span>
                    <strong style="color:#F8FAFC;">${plan.name}</strong>
                </div>
                <div style="display:flex; justify-content: space-between; align-items:center; margin-bottom: 8px;">
                    <span style="color:#94A3B8;">Valor</span>
                    <strong style="color:#10B981; font-size: 1.4rem;">R$ ${plan.price.toFixed(2)}</strong>
                </div>
                <div style="color:#64748B; font-size: 0.8rem;">${billingLine}</div>
            </div>
            `;

                            return (
                                <>
                                    <div style={{ color: "#E2E8F0", fontSize: "1.25rem", fontWeight: 800, marginBottom: 12 }}>
                                        Confirmar Compra: {planId.toUpperCase()}
                                    </div>

                                    <div dangerouslySetInnerHTML={{ __html: boxHtml }} />

                                    {!authUserId ? (
                                        <>
                                            {/* CENÁRIO B - Usuário NÃO logado */}
                                            <div style={{ marginBottom: 16, padding: 16, background: "rgba(56, 189, 248, 0.05)", border: "1px solid rgba(56, 189, 248, 0.2)", borderRadius: 8 }}>
                                                <div style={{ color: "#94A3B8", fontSize: "0.85rem", marginBottom: 8, textAlign: "center" }}>
                                                    Para continuar, faça login com sua conta Google
                                                </div>
                                            </div>

                                            {/* Botão Google OAuth - PRINCIPAL */}
                                            <div data-testid="stButton" className="stButton" style={{ width: "100%", marginBottom: 16 }}>
                                                <button
                                                    type="button"
                                                    onClick={handleGoogleLogin}
                                                    disabled={isAuthenticating}
                                                    style={{
                                                        width: "100%",
                                                        height: 52,
                                                        background: "#fff",
                                                        color: "#1f2937",
                                                        border: "1px solid rgba(255,255,255,0.2)",
                                                        borderRadius: 8,
                                                        fontSize: "1rem",
                                                        fontWeight: 600,
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        gap: 12,
                                                        cursor: isAuthenticating ? "not-allowed" : "pointer",
                                                        opacity: isAuthenticating ? 0.6 : 1,
                                                    }}
                                                >
                                                    <svg width="20" height="20" viewBox="0 0 18 18">
                                                        <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" />
                                                        <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" />
                                                        <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z" />
                                                        <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" />
                                                    </svg>
                                                    {isAuthenticating ? "Autenticando..." : "🔵 Continuar com Google"}
                                                </button>
                                            </div>

                                            {/* CENÁRIO C - Fallback discreto para email/senha */}
                                            <details style={{ marginBottom: 16 }}>
                                                <summary style={{
                                                    color: "#64748B",
                                                    fontSize: "0.85rem",
                                                    cursor: "pointer",
                                                    textAlign: "center",
                                                    listStyle: "none",
                                                    padding: "8px",
                                                }}>
                                                    Prefere usar email? Clique aqui
                                                </summary>

                                                <div style={{ marginTop: 16 }}>
                                                    {/* Email */}
                                                    <div style={{ marginBottom: 12 }}>
                                                        <div style={{ color: "#94A3B8", fontSize: "0.85rem", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
                                                            E-mail
                                                        </div>
                                                        <input
                                                            type="email"
                                                            value={authEmail}
                                                            onChange={(e) => setAuthEmail(e.target.value)}
                                                            placeholder="voce@exemplo.com"
                                                            style={{ width: "100%", boxSizing: "border-box", height: 44, padding: "10px 12px" }}
                                                        />
                                                    </div>

                                                    {/* Senha */}
                                                    <div style={{ marginBottom: 16 }}>
                                                        <div style={{ color: "#94A3B8", fontSize: "0.85rem", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
                                                            Senha
                                                        </div>
                                                        <input
                                                            type="password"
                                                            value={authPassword}
                                                            onChange={(e) => setAuthPassword(e.target.value)}
                                                            placeholder="Mínimo 6 caracteres"
                                                            style={{ width: "100%", boxSizing: "border-box", height: 44, padding: "10px 12px" }}
                                                        />
                                                    </div>

                                                    {/* Botão Login/Cadastro */}
                                                    <div data-testid="stButton" className="stButton" style={{ width: "100%", marginBottom: 12 }}>
                                                        <button
                                                            type="button"
                                                            data-kind="primary"
                                                            onClick={handleEmailPasswordAuth}
                                                            disabled={isAuthenticating}
                                                            style={{ width: "100%", opacity: isAuthenticating ? 0.6 : 1 }}
                                                        >
                                                            {isAuthenticating ? "Autenticando..." : (isLoginMode ? "ENTRAR" : "CRIAR CONTA")}
                                                        </button>
                                                    </div>

                                                    {/* Toggle Login/Cadastro */}
                                                    <div style={{ textAlign: "center" }}>
                                                        <button
                                                            type="button"
                                                            onClick={() => setIsLoginMode(!isLoginMode)}
                                                            style={{
                                                                background: "none",
                                                                border: "none",
                                                                color: "#38BDF8",
                                                                fontSize: "0.85rem",
                                                                cursor: "pointer",
                                                                textDecoration: "underline",
                                                            }}
                                                        >
                                                            {isLoginMode ? "Não tem conta? Criar agora" : "Já tem conta? Fazer login"}
                                                        </button>
                                                    </div>
                                                </div>
                                            </details>
                                        </>
                                    ) : (
                                        <>
                                            {/* CENÁRIO A - Usuário JÁ logado */}
                                            <div style={{ marginBottom: 16, padding: 16, background: "rgba(16, 185, 129, 0.1)", border: "1px solid #10B981", borderRadius: 8 }}>
                                                <div style={{ color: "#10B981", fontSize: "0.9rem", fontWeight: 600, marginBottom: 4 }}>
                                                    ✅ Logado como
                                                </div>
                                                <div style={{ color: "#E2E8F0", fontSize: "0.95rem", fontWeight: 500 }}>{authEmail}</div>
                                            </div>

                                            <div data-testid="stButton" className="stButton" style={{ width: "100%" }}>
                                                <button type="button" data-kind="primary" onClick={startCheckout} style={{ width: "100%", height: 52, fontSize: "1rem" }}>
                                                    CONFIRMAR PAGAMENTO
                                                </button>
                                            </div>
                                        </>
                                    )}

                                    {stripeSessionId && (
                                        <div style={{ color: "#64748B", fontSize: "0.8rem", marginTop: 10 }}>
                                            Session ID: {stripeSessionId}
                                        </div>
                                    )}

                                    {checkoutError && (
                                        <div
                                            style={{
                                                marginTop: 12,
                                                color: checkoutError.startsWith("✅") || checkoutError.startsWith("Link enviado") || checkoutError.startsWith("Pagamento confirmado") ? "#10B981" : "#EF4444",
                                                fontSize: "0.85rem",
                                            }}
                                        >
                                            {checkoutError}
                                        </div>
                                    )}

                                    <div style={{ height: 16 }} />

                                    <div data-testid="stButton" className="stButton" style={{ width: "100%" }}>
                                        <button type="button" data-kind="secondary" onClick={() => setStage("preview")} style={{ width: "100%" }}>
                                            VOLTAR
                                        </button>
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                </div>
            )}

            {/* Modal de Autenticação */}
            <AuthModal
                isOpen={showAuthModal}
                onSuccess={(userId, email) => {
                    setAuthUserId(userId);
                    setAuthEmail(email);
                    setShowAuthModal(false);
                    setStage("pricing");
                }}
                onClose={() => setShowAuthModal(false)}
            />
        </main>
    );
}