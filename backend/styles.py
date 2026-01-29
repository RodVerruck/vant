# ============================================================
# CSS V14: DESIGN SYSTEM (FLEXBOX BLINDADO + PDF MM)
# Migrado de css_constants.py para o backend
# ============================================================

CSS_V13 = """
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

/* --- VARIÁVEIS GLOBAIS --- */
:root {
    --color-text: #334155;
    --color-title: #0f172a;
    --color-accent: #10B981; /* Verde Vant */
    --color-sub: #64748B;
    --font-stack: 'Inter', sans-serif;
}

/* --- 1. ESTRUTURA WEB (VISUALIZAÇÃO EM TELA) --- */
.stApp { background-color: #f8fafc; }

.cv-paper-sheet {
    background-color: #ffffff;
    width: 100%;
    max-width: 210mm; /* Largura A4 real */
    margin: 2rem auto;
    padding: 15mm 15mm; /* Margem interna segura */
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    color: var(--color-text);
    font-family: var(--font-stack);
    border-top: 6px solid var(--color-accent);
    line-height: 1.5;
    box-sizing: border-box; /* CRÍTICO: Evita estouro de largura */
}

/* --- 2. HEADER OTIMIZADO --- */
.cv-paper-sheet .vant-cv-name {
    font-size: 24pt;
    font-weight: 800;
    text-align: center;
    margin-bottom: 4px;
    text-transform: uppercase;
    color: var(--color-title);
    letter-spacing: -0.5px;
}

.cv-paper-sheet .vant-cv-contact-line {
    font-size: 10pt;
    color: var(--color-sub);
    text-align: center;
    margin-bottom: 8mm;
    font-weight: 500;
    /* Impede que o contato quebre linha feio */
    white-space: normal; 
    line-height: 1.4;
}

/* --- 3. TÍTULOS DE SEÇÃO --- */
.cv-paper-sheet .vant-cv-section {
    font-size: 10pt;
    font-weight: 800;
    color: var(--color-title);
    text-transform: uppercase;
    letter-spacing: 1px;
    border-bottom: 1px solid #e2e8f0;
    margin-top: 6mm;
    margin-bottom: 4mm;
    padding-bottom: 1mm;
    display: flex;
    align-items: center;
    break-after: avoid; /* Mantém título colado no conteúdo */
}

.cv-paper-sheet .vant-cv-section::before {
    content: '';
    display: inline-block;
    width: 20px;
    height: 4px;
    background-color: var(--color-accent);
    margin-right: 10px;
    border-radius: 2px;
}

/* --- 4. EXPERIÊNCIA PROFISSIONAL --- */
.cv-paper-sheet .vant-cv-job-container {
    margin-bottom: 5mm;
    break-inside: avoid; /* Tenta não quebrar a empresa ao meio */
}

.cv-paper-sheet .vant-job-title {
    font-size: 12pt;
    font-weight: 700;
    color: var(--color-title);
    margin: 0;
    line-height: 1.2;
}

.cv-paper-sheet .vant-job-company {
    color: #059669;
    font-weight: 600;
}

.cv-paper-sheet .vant-job-date {
    font-size: 9pt;
    color: #94a3b8;
    margin-bottom: 2mm;
    display: block;
}

/* --- CURATIVO PARA O BULLET FANTASMA --- */
/* Se a coluna de texto estiver vazia, esconde a linha inteira */
.vant-cv-grid-row:has(.vant-cv-text-col:empty) {
    display: none;
}
/* Fallback para leitores de PDF antigos que não suportam :has */
.vant-cv-text-col:empty {
    display: none;
}

/* --- 5. CORREÇÃO DO BULLET (FLEXBOX BLINDADO) --- */
.cv-paper-sheet .vant-cv-grid-row {
    display: flex;
    align-items: flex-start; /* Alinha bullet no topo */
    margin-bottom: 1.5mm;
    page-break-inside: avoid; /* CRÍTICO: Bullet e texto nunca se separam */
}

.cv-paper-sheet .vant-cv-bullet-col {
    color: var(--color-accent);
    font-size: 14px;
    line-height: 1.3; /* Ajuste fino vertical para alinhar com texto */
    
    /* SEGURANÇA MÁXIMA PARA NÃO QUEBRAR */
    flex: 0 0 12px; /* Largura fixa de 12px */
    width: 12px;
    min-width: 12px;
    margin-right: 6px;
}

.cv-paper-sheet .vant-cv-text-col {
    flex: 1; /* Ocupa todo o resto do espaço */
    font-size: 10pt;
    line-height: 1.4;
    text-align: left;
    margin: 0;
    padding: 0;
}

/* Resumo (Parágrafo) */
.cv-paper-sheet p {
    font-size: 10pt;
    line-height: 1.5;
    text-align: left;
    margin-bottom: 4mm;
}

/* --- 6. SKILLS E TAGS --- */
.cv-paper-sheet .vant-skills-container {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 4mm;
}

.cv-paper-sheet .vant-skill-chip {
    font-size: 8pt;
    background-color: #f1f5f9;
    padding: 3px 8px;
    border-radius: 4px;
    border: 1px solid #cbd5e1;
    color: #475569;
    font-weight: 600;
}
"""

# ============================================================
# CSS PDF: REGRAS DE IMPRESSÃO (A4 RÍGIDO)
# ============================================================
CSS_PDF = CSS_V13 + """
@page {
    size: A4;
    margin: 0; /* Remove margens do navegador, controlaremos no body */
}

html, body {
    margin: 0;
    padding: 0;
    width: 100%;
    background: #fff;
    -webkit-print-color-adjust: exact;
}

.cv-paper-sheet {
    width: 100% !important;
    max-width: none !important;
    margin: 0 !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    
    /* MARGENS DE IMPRESSÃO REAIS EM MILÍMETROS */
    padding: 15mm 18mm !important; /* Top/Bottom 15mm, Laterais 18mm */
}

/* Controle de Quebras de Página */
.vant-cv-section, 
.vant-job-title, 
.vant-job-date {
    break-after: avoid;
    page-break-after: avoid;
}

.vant-cv-job-container {
    break-inside: auto; /* Permite quebra se a empresa for muito longa... */
}

/* ...mas evita quebrar dentro de um bullet individual */
.vant-cv-grid-row {
    break-inside: avoid;
    page-break-inside: avoid;
}

/* Esconde elementos vazios gerados por erro de dados (Opcional) */
.vant-cv-text-col:empty {
    display: none;
}
"""
