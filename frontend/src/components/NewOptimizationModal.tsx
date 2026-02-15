"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./NewOptimizationModal.module.css";

function getApiUrl(): string {
    if (typeof window !== "undefined") {
        const isLocalhost =
            window.location.hostname === "localhost" ||
            window.location.hostname === "127.0.0.1";
        if (isLocalhost) return "http://127.0.0.1:8000";
    }
    return process.env.NEXT_PUBLIC_API_URL || "https://vant-vlgn.onrender.com";
}

interface NewOptimizationModalProps {
    isOpen: boolean;
    onClose: () => void;
    creditsRemaining: number;
    authUserId?: string | null;
    // Props para último CV mágico
    lastCV?: {
        has_last_cv: boolean;
        filename?: string;
        time_ago?: string;
        is_recent?: boolean;
        analysis_id?: string;
        job_description?: string;
    } | null;
}

const AREA_OPTIONS = [
    { value: "", label: "Selecione uma área..." },
    { value: "ti_dados_ai", label: "Tecnologia / Dados / IA" },
    { value: "ti_dev_gen", label: "Desenvolvimento de Software" },
    { value: "ti_suporte", label: "TI / Suporte Técnico" },
    { value: "produto_agil", label: "Produto / Agile" },
    { value: "marketing_growth", label: "Marketing / Growth" },
    { value: "vendas_cs", label: "Vendas / Customer Success" },
    { value: "rh_lideranca", label: "RH / Liderança" },
    { value: "financeiro_corp", label: "Financeiro / Corporativo" },
    { value: "global_soft_skills", label: "Geral / Soft Skills" },
];

const GENERIC_JOB_TEXT =
    "Busco oportunidades profissionais que valorizem minhas habilidades e experiência. Estou aberto a posições desafiadoras que permitam meu crescimento e contribuição para os objetivos da empresa, com foco em resultados e inovação.";

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function NewOptimizationModal({
    isOpen,
    onClose,
    creditsRemaining,
    authUserId,
    lastCV,
}: NewOptimizationModalProps) {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Form state
    const [jobDescription, setJobDescription] = useState("");
    const [useGenericJob, setUseGenericJob] = useState(false);
    const [selectedArea, setSelectedArea] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    // Estado para carregamento do último CV
    const [loadingLastCV, setLoadingLastCV] = useState(false);

    // Função para usar último CV: busca cv_text do backend e salva no localStorage
    const handleUseLastCV = async (): Promise<boolean> => {
        if (!lastCV?.analysis_id || !authUserId) return false;
        setLoadingLastCV(true);
        try {
            console.log("[LastCV] Buscando texto do CV:", lastCV.analysis_id);
            const resp = await fetch(
                `${getApiUrl()}/api/user/last-cv-file/${lastCV.analysis_id}?user_id=${authUserId}`
            );
            if (!resp.ok) {
                console.error("[LastCV] Erro ao buscar CV:", resp.status);
                return false;
            }
            const data = await resp.json();
            if (data.cv_text) {
                // Salva o texto pré-extraído no localStorage
                localStorage.setItem("vant_cv_text_preextracted", data.cv_text);
                // Cria um File placeholder apenas para a UI (não será enviado como PDF)
                const placeholder = new File(["placeholder"], lastCV.filename || "cv.pdf", { type: "text/plain" });
                setFile(placeholder);
                console.log("[LastCV] CV texto carregado com sucesso:", lastCV.filename, `(${data.cv_text.length} chars)`);
                return true;
            }

            console.warn("[LastCV] Resposta sem cv_text, fallback para upload manual.");
            return false;
        } catch (error) {
            console.error("[LastCV] Erro ao buscar texto do CV:", error);
            return false;
        } finally {
            setLoadingLastCV(false);
        }
    };

    // Animation state
    const [visible, setVisible] = useState(false);

    // Confirmation slide state
    const [showConfirmation, setShowConfirmation] = useState(false);

    // Animate in
    useEffect(() => {
        if (isOpen) {
            // Small delay for mount → animate
            requestAnimationFrame(() => {
                requestAnimationFrame(() => setVisible(true));
            });
        } else {
            setVisible(false);
        }
    }, [isOpen]);

    // Close with Escape
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") handleClose();
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [isOpen]);

    // Prevent body scroll
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    const handleClose = useCallback(() => {
        setVisible(false);
        setTimeout(() => {
            onClose();
            // Reset form
            setJobDescription("");
            setUseGenericJob(false);
            setSelectedArea("");
            setFile(null);
            setShowConfirmation(false);
        }, 350);
    }, [onClose]);

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) handleClose();
    };

    // Generic toggle
    const handleGenericToggle = () => {
        const newVal = !useGenericJob;
        setUseGenericJob(newVal);
        if (newVal) {
            setJobDescription(GENERIC_JOB_TEXT);
        } else {
            setJobDescription("");
            setSelectedArea("");
        }
    };

    // File handling
    const handleFile = (f: File | null) => {
        if (!f) return;
        const allowed = [
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ];
        if (!allowed.includes(f.type) && !f.name.endsWith(".pdf") && !f.name.endsWith(".docx")) {
            return;
        }
        if (f.size > 10 * 1024 * 1024) return; // 10MB
        setFile(f);
    };

    // Drag & drop
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files?.[0];
        if (droppedFile) handleFile(droppedFile);
    };

    // Submit → store data in localStorage & navigate to /app
    const isJobReady = useGenericJob
        ? selectedArea.trim().length > 0
        : jobDescription.trim().length > 0;
    const canUseRecentLastCV = !!(lastCV?.has_last_cv && lastCV?.is_recent && authUserId);
    const canSubmit = isJobReady && (!!file || canUseRecentLastCV);

    const handleSubmit = async () => {
        if (!canSubmit || loadingLastCV) return;

        if (!file && canUseRecentLastCV) {
            const loaded = await handleUseLastCV();
            if (!loaded) {
                fileInputRef.current?.click();
                return;
            }
        }

        setShowConfirmation(true);
    };

    const handleConfirmSubmit = () => {
        if (!file) return;

        // 1. Store job description
        localStorage.setItem("vant_jobDescription", jobDescription);

        // 2. Store area if generic
        if (useGenericJob && selectedArea) {
            localStorage.setItem("vant_area_of_interest", selectedArea);
            localStorage.setItem("vant_use_generic_job", "true");
        } else {
            localStorage.removeItem("vant_area_of_interest");
            localStorage.removeItem("vant_use_generic_job");
        }

        // Determinar stage de retorno baseado em créditos
        // Se usuário tem 0 créditos, vai direto para checkout
        const returnStage = creditsRemaining === 0 ? "checkout" : "hero";

        // Verificar se é CV pré-extraído (último CV reutilizado)
        const hasPreextracted = !!localStorage.getItem("vant_cv_text_preextracted");

        if (hasPreextracted) {
            // CV pré-extraído: não precisa salvar file como base64
            localStorage.setItem("vant_file_name", file.name);
            localStorage.setItem("vant_file_type", "text/plain");
            localStorage.removeItem("vant_file_b64");

            // Set flags
            localStorage.setItem("vant_auto_start", "true");
            localStorage.setItem("vant_skip_preview", "true");
            localStorage.setItem("vant_auth_return_stage", returnStage);

            router.push("/app");
            return;
        }

        // 3. Store file as base64 (fluxo normal)
        const reader = new FileReader();
        reader.onloadend = () => {
            localStorage.setItem("vant_file_b64", reader.result as string);
            localStorage.setItem("vant_file_name", file.name);
            localStorage.setItem("vant_file_type", file.type);

            // 4. Set flag to auto-start analysis on /app and skip preview
            localStorage.setItem("vant_auto_start", "true");
            localStorage.setItem("vant_skip_preview", "true"); // NEW: skip preview
            localStorage.setItem("vant_auth_return_stage", returnStage);

            // 5. Navigate
            router.push("/app");
        };
        reader.readAsDataURL(file);
    };

    // Keyboard: Ctrl+Enter to submit
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && canSubmit) {
            e.preventDefault();
            handleSubmit();
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className={`${styles.overlay} ${visible ? styles.overlayVisible : ""}`}
            onClick={handleOverlayClick}
            onKeyDown={handleKeyDown}
        >
            <div className={`${styles.modal} ${visible ? styles.modalVisible : ""}`}>
                <div className={styles.glowOrb} />
                <div className={styles.glowOrbBottom} />

                <button
                    className={styles.closeBtn}
                    onClick={handleClose}
                    aria-label="Fechar"
                >
                    ✕
                </button>

                <div className={styles.content}>
                    {/* ─── Header ─── */}
                    <div className={styles.header}>
                        <div className={styles.iconCircle}>🚀</div>
                        <h2 className={styles.title}>Nova Otimização</h2>
                        <p className={styles.subtitle}>
                            Cole a vaga e envie seu CV. A IA faz o resto.
                        </p>
                        {creditsRemaining > 0 && (
                            <div className={styles.creditsBadge}>
                                ✦ {creditsRemaining} crédito{creditsRemaining !== 1 ? "s" : ""} disponível{creditsRemaining !== 1 ? "is" : ""}
                            </div>
                        )}
                        {creditsRemaining <= 0 && (
                            <div className={styles.creditsWarning}>
                                <strong>Créditos insuficientes.</strong> Ao confirmar, você será direcionado ao checkout para comprar 1 crédito avulso.
                            </div>
                        )}
                    </div>

                    {/* ─── Section 1: Vaga ─── */}
                    <div className={styles.section}>
                        <div className={styles.sectionLabel}>
                            <span className={styles.sectionNumber}>1</span>
                            Vaga Alvo
                        </div>

                        <label className={styles.genericToggle} onClick={handleGenericToggle}>
                            <input
                                type="checkbox"
                                checked={useGenericJob}
                                onChange={handleGenericToggle}
                                className={styles.toggleCheckbox}
                                onClick={(e) => e.stopPropagation()}
                            />
                            <span className={styles.toggleText}>
                                <span className={styles.toggleTextBold}>Não tenho uma vaga específica</span>
                                {" "}— Analisar contra o mercado
                            </span>
                        </label>

                        {useGenericJob && (
                            <select
                                value={selectedArea}
                                onChange={(e) => setSelectedArea(e.target.value)}
                                className={styles.areaSelector}
                            >
                                {AREA_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        )}

                        <textarea
                            value={jobDescription}
                            onChange={(e) => setJobDescription(e.target.value)}
                            placeholder="Cole aqui a descrição completa da vaga (Título, Requisitos e Responsabilidades)..."
                            disabled={useGenericJob}
                            className={`${styles.textarea} ${useGenericJob ? styles.textareaDisabled : ""}`}
                        />
                        <div className={styles.charCount}>
                            <span className={jobDescription.length >= 500 ? styles.charCountGood : ""}>
                                {jobDescription.length}/5000
                            </span>
                            <span>
                                {useGenericJob
                                    ? "Análise de mercado ativada"
                                    : "Quanto mais detalhes, melhor o resultado"}
                            </span>
                        </div>
                    </div>

                    {/* ─── Section 2: CV ─── */}
                    <div className={styles.section}>
                        <div className={styles.sectionLabel}>
                            <span className={styles.sectionNumber}>2</span>
                            Seu Currículo
                        </div>

                        {file ? (
                            <div className={styles.fileLoaded}>
                                <div className={styles.fileIcon}>📄</div>
                                <div className={styles.fileInfo}>
                                    <div className={styles.fileName}>{file.name}</div>
                                    <div className={styles.fileSize}>
                                        ✓ {formatFileSize(file.size)} — Pronto
                                    </div>
                                </div>
                                <button
                                    className={styles.fileRemove}
                                    onClick={() => setFile(null)}
                                >
                                    Remover
                                </button>
                            </div>
                        ) : (
                            <div
                                className={`${styles.dropZone} ${isDragging ? styles.dropZoneActive : ""}`}
                                onClick={() => fileInputRef.current?.click()}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                            >
                                <div className={styles.dropIcon}>
                                    {isDragging ? "⬇️" : "📎"}
                                </div>
                                <div className={styles.dropText}>
                                    Arraste seu CV aqui ou{" "}
                                    <span className={styles.browseLink}>procure no computador</span>
                                </div>
                                <div className={styles.dropHint}>
                                    PDF ou DOCX · Máximo 10 MB
                                </div>

                                {lastCV && lastCV.has_last_cv && lastCV.is_recent && (
                                    <div
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleUseLastCV();
                                        }}
                                        style={{
                                            marginTop: 12,
                                            padding: "8px 14px",
                                            background: "rgba(16, 185, 129, 0.1)",
                                            border: "1px solid rgba(16, 185, 129, 0.3)",
                                            borderRadius: 8,
                                            cursor: "pointer",
                                            transition: "all 0.2s",
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: 6,
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = "rgba(16, 185, 129, 0.2)";
                                            e.currentTarget.style.borderColor = "rgba(16, 185, 129, 0.5)";
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = "rgba(16, 185, 129, 0.1)";
                                            e.currentTarget.style.borderColor = "rgba(16, 185, 129, 0.3)";
                                        }}
                                    >
                                        <span style={{ fontSize: "0.85rem" }}>✨</span>
                                        <span style={{ color: "#10B981", fontSize: "0.8rem", fontWeight: 600 }}>
                                            {loadingLastCV ? "Carregando..." : `Usar ${lastCV.filename} · ${lastCV.time_ago}`}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="application/pdf,.pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                            style={{ display: "none" }}
                            onChange={(e) => handleFile(e.target.files?.[0] || null)}
                        />
                    </div>

                    {/* ─── Divider ─── */}
                    <div className={styles.divider} />

                    {/* ─── CTA ─── */}
                    <button
                        className={`${styles.ctaButton} ${canSubmit ? styles.ctaButtonReady : ""}`}
                        disabled={!canSubmit || loadingLastCV}
                        onClick={handleSubmit}
                    >
                        {creditsRemaining > 0
                            ? "Otimizar Meu Currículo →"
                            : "Ver Meu Score ATS →"}
                    </button>

                    <div className={styles.keyboardHint}>
                        <span className={styles.kbd}>Ctrl</span>+<span className={styles.kbd}>Enter</span> para enviar
                    </div>
                </div>

                {/* ─── Confirmation Slide ─── */}
                <div className={`${styles.confirmationSlide} ${showConfirmation ? styles.confirmationSlideVisible : ""}`}>
                    <div className={styles.confirmationHeader}>
                        <div className={styles.confirmationIcon}>🎯</div>
                        <h3 className={styles.confirmationTitle}>Confirme a Análise</h3>
                        <p className={styles.confirmationSubtitle}>
                            {creditsRemaining > 0
                                ? "Revise os dados abaixo antes de iniciar a otimização"
                                : "Revise os dados abaixo antes de ir para o checkout de crédito avulso"}
                        </p>
                    </div>

                    <div className={styles.confirmationContent}>
                        <div className={styles.confirmationCard}>
                            <div className={styles.confirmationCardLabel}>
                                <span className={styles.confirmationCardIcon}>1</span>
                                Vaga
                            </div>
                            <div className={styles.confirmationJobTitle}>
                                {useGenericJob
                                    ? AREA_OPTIONS.find(opt => opt.value === selectedArea)?.label || "Área selecionada"
                                    : "Vaga específica"
                                }
                            </div>
                            <div className={styles.confirmationJobDesc}>
                                {useGenericJob
                                    ? "Análise de mercado para a área selecionada"
                                    : jobDescription.length > 150
                                        ? jobDescription.substring(0, 150) + "..."
                                        : jobDescription
                                }
                            </div>
                        </div>

                        <div className={styles.confirmationCard}>
                            <div className={styles.confirmationCardLabel}>
                                <span className={styles.confirmationCardIcon}>2</span>
                                Currículo
                            </div>
                            <div className={styles.confirmationFileInfo}>
                                <div className={styles.confirmationFileIcon}>📄</div>
                                <div className={styles.confirmationFileDetails}>
                                    <div className={styles.confirmationFileName}>{file?.name}</div>
                                    <div className={styles.confirmationFileSize}>
                                        ✓ {file ? formatFileSize(file.size) : ""} — Pronto
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={styles.confirmationActions}>
                        <button
                            className={styles.confirmationBack}
                            onClick={() => setShowConfirmation(false)}
                        >
                            ← Voltar
                        </button>
                        <button
                            className={styles.confirmationConfirm}
                            onClick={handleConfirmSubmit}
                        >
                            {creditsRemaining > 0
                                ? "Confirmar e Otimizar →"
                                : "Confirmar e Ir para Checkout →"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
