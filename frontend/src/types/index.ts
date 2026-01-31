export type AppStage = "hero" | "analyzing" | "preview" | "pricing" | "checkout" | "processing_premium" | "paid";
export type PlanType = "basico" | "pro" | "premium_plus";
export type BillingType = "one_time" | "subscription";

export interface PilaresData {
    impacto?: number;
    keywords?: number;
    ats?: number;
    setor_detectado?: string;
    [key: string]: unknown;
}

export interface PreviewData {
    nota: number;
    nota_ats: number;
    veredito: string;
    potencial: number;
    pilares: PilaresData;
    analise_por_pilares: PilaresData;
    gap_1?: {
        titulo?: string;
        explicacao?: string;
        exemplo_atual?: string;
        exemplo_otimizado?: string;
    };
    gap_2?: {
        titulo?: string;
        explicacao?: string;
        termos_faltando?: string[];
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
