export type AppStage = "hero" | "analyzing" | "preview" | "diagnostico_pronto" | "pricing" | "checkout" | "activating_payment" | "processing_premium" | "paid" | "history" | "simulador";
export type PlanType = "free" | "pro_monthly" | "pro_monthly_early_bird" | "pro_annual" | "trial" | "credit_1" | "credit_3" | "credit_5";
export type BillingType = "one_time" | "subscription";

export interface PilarItem {
    nome: string;
    pontos: number;
}

export interface PilaresData {
    impacto?: number;
    keywords?: number;
    ats?: number;
    setor_detectado?: string;
    [key: string]: unknown;
}

export type PilaresArray = PilarItem[];

// Union type that can be either object with numeric properties OR array of PilarItem
export type PilaresFlexible = PilaresData | PilaresArray;

export interface PreviewData {
    nota: number;
    nota_ats: number;
    veredito: string;
    potencial: number;
    pilares: PilaresFlexible;
    analise_por_pilares: PilaresData;
    projected_score?: number;
    percentile?: string;
    pergunta_preview?: {
        pergunta: string;
        dica: string;
    };
    gap_1?: {
        titulo?: string;
        explicacao?: string;
        exemplo_atual?: string;
        exemplo_otimizado?: string;
        termos_faltando?: string[] | { termo: string; frequencia: string }[];
        impacto?: string;
        pontos?: number;
    };
    gap_2?: {
        titulo?: string;
        explicacao?: string;
        exemplo_atual?: string;
        exemplo_otimizado?: string;
        termos_faltando?: string[] | { termo: string; frequencia: string }[];
        impacto?: string;
        pontos?: number;
    };
}

export interface GapFatal {
    erro: string;
    evidencia: string;
    correcao_sugerida: string;
}

export interface AnaliseComparativa {
    vantagens_concorrentes: string[];
    seus_diferenciais: string[];
    plano_de_ataque: string;
    probabilidade_aprovacao: number;
}

export interface ProjetoPratico {
    titulo: string;
    descricao: string;
    como_apresentar: string;
}

export interface PerguntaEntrevista {
    pergunta: string;
    expectativa_recrutador: string;
    dica_resposta?: string;
}

export interface FeedbackEntrevista {
    nota_final: number;
    feedback_curto: string;
    analise_fina: {
        clareza: number;
        estrutura: number;
        impacto: number;
        conteudo_tecnico: number;
    };
    pontos_melhoria: string[];
    exemplo_resposta_star?: string;
}

export interface Book {
    titulo: string;
    autor: string;
    motivo: string;
    amazon_url?: string;
    categoria_origem?: string;
}

export interface KitHacker {
    boolean_string: string;
}

export interface ReportData {
    veredito: string;
    nota_ats: number;
    nota_ats_estrutura?: number;
    nota_ats_conteudo?: number;
    analise_por_pilares_estrutura?: PilaresData;
    preview_gaps_count?: number;
    analise_por_pilares: PilaresData;
    linkedin_headline: string;
    resumo_otimizado: string;
    cv_otimizado_completo: string;
    gaps_fatais: GapFatal[];
    analise_comparativa?: AnaliseComparativa;
    biblioteca_tecnica: Book[];
    perguntas_entrevista: PerguntaEntrevista[];
    kit_hacker: KitHacker;
    projeto_pratico?: ProjetoPratico;
    texto_destaque?: string;
    setor_detectado?: string;
}

export interface PricePlan {
    price: number;
    name: string;
    billing: BillingType;
    credits?: number;
    badge?: string;
    stripe_price_id?: string;
}

export type PricesMap = Record<PlanType, PricePlan>;

export interface HistoryItem {
    id: string;
    created_at: string;
    job_description: string;
    result_preview: {
        veredito: string;
        score_ats: number;
        gaps_count: number;
    };
    full_result?: ReportData;
}

// Tipos para o Simulador de Entrevista
export interface InterviewQuestion {
    id: number;
    text: string;
    type: "comportamental" | "tecnica" | "situacional";
    context: string;
    max_duration: number;
}

export interface InterviewSession {
    question: InterviewQuestion;
    audioBlob: Blob;
    feedback: FeedbackEntrevista;
    timestamp: Date;
}

export type SimuladorStage = "welcome" | "question" | "recording" | "processing" | "feedback" | "results";
