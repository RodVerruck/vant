{/* ARQUITETURA SAAS - "COMPARATIVO DESLEAL" (Growth Hacking Version) */}
<div style={{ display: "flex", flexDirection: "column", gap: "24px", marginTop: 24 }}>

    {/* 1. HEADLINE DE CONVERSÃO */}
    <div style={{ textAlign: "center", marginBottom: 8 }}>
        <h3 style={{ color: "#E2E8F0", fontSize: "1.2rem", fontWeight: 700, margin: "0 0 8px 0" }}>
            Não aposte seu futuro em uma única vaga.
        </h3>
        <p style={{ color: "#94A3B8", fontSize: "0.9rem", margin: 0, lineHeight: 1.5 }}>
            Candidatos que aplicam para <strong>10+ vagas</strong> aumentam em 5x as chances de entrevista.<br />
            Jogue o jogo dos números.
        </p>
    </div>

    {/* CONTAINER DOS CARDS - Grid Responsivo */}
    <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "stretch" }}>

        {/* CARD 1: CRÉDITOS AVULSOS (A Âncora Lógica) */}
        <div style={{
            flex: "1 1 300px",
            background: "rgba(15, 23, 42, 0.4)",
            border: "1px solid rgba(148, 163, 184, 0.2)",
            borderRadius: 16,
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between"
        }}>
            <div>
                <div style={{ color: "#94A3B8", fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8 }}>
                    CRÉDITOS AVULSOS
                </div>
                <div style={{ color: "#E2E8F0", fontSize: "1.4rem", fontWeight: 700, marginBottom: 8 }}>
                    A partir de R$ 19,90
                </div>
                <p style={{ color: "#64748B", fontSize: "0.85rem", lineHeight: 1.5, marginBottom: 24 }}>
                    Ideal para ajustes pontuais ou se você já tem uma vaga específica em mente.
                </p>

                {/* Opção 1: A Âncora de Preço (R$ 19,90) */}
                <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: "1px dashed rgba(148, 163, 184, 0.2)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <span style={{ color: "#CBD5E1", fontWeight: 600 }}>1 Otimização</span>
                        <span style={{ color: "#fff", fontWeight: 700 }}>R$ 19,90</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            setSelectedPlan("credit_1");
                            if (!authUserId) setShowAuthModal(true);
                            else setStage("checkout");
                        }}
                        style={{ width: "100%", background: "transparent", border: "1px solid rgba(148, 163, 184, 0.4)", color: "#94A3B8", padding: "10px", borderRadius: 8, fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#fff"; e.currentTarget.style.color = "#fff"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(148, 163, 184, 0.4)"; e.currentTarget.style.color = "#94A3B8"; }}
                    >
                        Comprar 1 Crédito
                    </button>
                </div>

                {/* Opção 2: Pacote Intermediário */}
                <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                        <span style={{ color: "#CBD5E1", fontWeight: 600 }}>Pacote 3 CVs</span>
                        <span style={{ color: "#fff", fontWeight: 700 }}>R$ 39,90</span>
                    </div>
                    <div style={{ color: "#10B981", fontSize: "0.75rem", marginBottom: 8 }}>R$ 13,30/cada • economize 33%</div>
                    <button
                        type="button"
                        onClick={() => {
                            setSelectedPlan("credit_3");
                            if (!authUserId) setShowAuthModal(true);
                            else setStage("checkout");
                        }}
                        style={{ width: "100%", background: "transparent", border: "1px solid rgba(148, 163, 184, 0.4)", color: "#94A3B8", padding: "10px", borderRadius: 8, fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#fff"; e.currentTarget.style.color = "#fff"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(148, 163, 184, 0.4)"; e.currentTarget.style.color = "#94A3B8"; }}
                    >
                        Comprar Pacote 3
                    </button>
                </div>
                
                {/* Dica de Comparação */}
                <div style={{ marginTop: 16, padding: 12, background: "rgba(56, 189, 248, 0.1)", borderRadius: 8, border: "1px solid rgba(56, 189, 248, 0.2)" }}>
                    <div style={{ color: "#38BDF8", fontSize: "0.8rem", fontWeight: 600, marginBottom: 4 }}>💡 Quer otimizar mais CVs?</div>
                    <div style={{ color: "#94A3B8", fontSize: "0.75rem" }}>Trial por R$ 1,99 é muito mais barato! 👉</div>
                </div>
            </div>
        </div>

        {/* CARD 2: VANT PRO MENSAL (O Hero - High Pressure) */}
        <div style={{
            flex: "1 1 300px",
            background: "linear-gradient(145deg, rgba(16, 185, 129, 0.1), rgba(6, 78, 59, 0.4))",
            border: "2px solid #10B981",
            borderRadius: 16,
            padding: "24px",
            position: "relative",
            boxShadow: "0 0 30px rgba(16, 185, 129, 0.2)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between"
        }}>
            <div style={{ position: "absolute", top: "-14px", left: "50%", transform: "translateX(-50%)", background: "#10B981", color: "#fff", padding: "4px 16px", borderRadius: 20, fontSize: "0.8rem", fontWeight: 800, letterSpacing: "0.5px", boxShadow: "0 4px 6px rgba(0,0,0,0.2)", whiteSpace: "nowrap" }}>
                🏆 RECOMENDADO PELA IA
            </div>

            <div>
                <div style={{ color: "#10B981", fontWeight: 800, fontSize: "1.4rem", marginBottom: 20, textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    🚀 VANT PRO MENSAL
                </div>

                <div style={{
                    background: "linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(245, 158, 11, 0.15))",
                    border: "2px solid #EF4444",
                    borderRadius: 12,
                    padding: "18px",
                    marginBottom: 20,
                    textAlign: "center",
                    boxShadow: "0 0 20px rgba(239, 68, 68, 0.3)"
                }}>
                    {/* Etiqueta Vermelha Removida para Limpeza Visual */}
                    
                    <div style={{ fontSize: "2.2rem", fontWeight: 900, color: "#fff", lineHeight: 1, marginBottom: 6 }}>
                        7 DIAS POR R$ 1,99
                    </div>
                    
                    {/* Texto Corrigido: Grandfathering Explicito */}
                    <div style={{ color: "#CBD5E1", fontSize: "0.85rem", lineHeight: 1.4, marginBottom: 12 }}>
                        <span style={{ textDecoration: "line-through", opacity: 0.6, marginRight: 6 }}>De R$ 27,90</span>
                        <span style={{ color: "#FDE68A", fontWeight: 700 }}>depois R$ 19,90/mês (Preço Travado!)</span>
                    </div>

                    <div style={{
                        background: "rgba(245, 158, 11, 0.2)",
                        border: "1px solid rgba(245, 158, 11, 0.4)",
                        borderRadius: 8,
                        padding: "10px",
                        marginBottom: 12
                    }}>
                        <div style={{ color: "#F59E0B", fontSize: "0.75rem", fontWeight: 700, marginBottom: 4 }}>
                            🔥 PRIMEIROS 100 CLIENTES GARANTEM:
                        </div>
                        <div style={{ color: "#FDE68A", fontSize: "0.9rem", fontWeight: 700 }}>
                            Preço vitalício de R$ 19,90/mês
                        </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 12 }}>
                        <div>
                            <div style={{ color: "#F59E0B", fontSize: "0.7rem", fontWeight: 600, marginBottom: 2 }}>⏰ RESTAM</div>
                            <div style={{ color: "#fff", fontSize: "1.3rem", fontWeight: 900 }}>{remainingSpots} vagas</div>
                        </div>
                        <div style={{ width: "1px", background: "rgba(148, 163, 184, 0.3)" }} />
                        <div>
                            <div style={{ color: "#F59E0B", fontSize: "0.7rem", fontWeight: 600, marginBottom: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                                <span style={{ animation: timeRemaining.hours === 0 && timeRemaining.minutes < 60 ? "pulse 1.5s infinite" : "none" }}>🔥</span>
                                EXPIRA EM
                            </div>
                            <div style={{
                                color: timeRemaining.hours === 0 && timeRemaining.minutes < 60 ? "#EF4444" : "#fff",
                                fontSize: "1.3rem",
                                fontWeight: 900,
                                fontFamily: "monospace",
                                animation: timeRemaining.hours === 0 && timeRemaining.minutes < 10 ? "pulse 1.5s infinite" : "none"
                            }}>
                                {String(timeRemaining.hours).padStart(2, '0')}:{String(timeRemaining.minutes).padStart(2, '0')}:{String(timeRemaining.seconds).padStart(2, '0')}
                            </div>
                        </div>
                    </div>
                    <style dangerouslySetInnerHTML={{
                        __html: `
                            @keyframes pulse {
                                0%, 100% { opacity: 1; transform: scale(1); }
                                50% { opacity: 0.8; transform: scale(1.05); }
                            }
                        ` }} />
                </div>

                <div style={{ color: "#E2E8F0", fontSize: "0.9rem", lineHeight: 1.6, marginBottom: 20, textAlign: "center", fontWeight: 600 }}>
                    O que você ganha agora:
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: 24 }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center", fontSize: "0.9rem", color: "#E2E8F0" }}>
                        <div style={{ color: "#10B981", fontSize: "1rem" }}>✓</div>
                        <span><strong>30 Otimizações/mês</strong></span>
                    </div>
                    <div style={{ display: "flex", gap: 10, alignItems: "center", fontSize: "0.9rem", color: "#E2E8F0" }}>
                        <div style={{ color: "#10B981", fontSize: "1rem" }}>✓</div>
                        <span><strong>Simulador de Entrevista IA</strong></span>
                    </div>
                    <div style={{ display: "flex", gap: 10, alignItems: "center", fontSize: "0.9rem", color: "#E2E8F0" }}>
                        <div style={{ color: "#10B981", fontSize: "1rem" }}>✓</div>
                        <span><strong>Radar de Vagas Inteligente</strong></span>
                    </div>
                    <div style={{ display: "flex", gap: 10, alignItems: "center", fontSize: "0.9rem", color: "#E2E8F0" }}>
                        <div style={{ color: "#10B981", fontSize: "1rem" }}>✓</div>
                        <span>💰 Custo por CV: <strong>Apenas R$ 0,93</strong></span>
                    </div>
                    <div style={{
                        color: "#94A3B8",
                        fontSize: "0.75rem",
                        marginTop: 4
                    }}>
                        (95% mais barato que comprar avulso)
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => {
                        setSelectedPlan("trial");
                        if (!authUserId) setShowAuthModal(true);
                        else setStage("checkout");
                    }}
                    style={{ width: "100%", background: "linear-gradient(135deg, #10B981, #059669)", color: "#fff", border: "none", padding: "20px", borderRadius: 12, fontSize: "1.15rem", fontWeight: 800, cursor: "pointer", boxShadow: "0 6px 20px rgba(16, 185, 129, 0.5)", transition: "all 0.2s", textTransform: "uppercase", letterSpacing: "0.5px" }}
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
                    GARANTIR MINHA VAGA - R$ 1,99 🚀
                </button>

                <div style={{
                    background: "rgba(16, 185, 129, 0.1)",
                    border: "1px solid rgba(16, 185, 129, 0.3)",
                    borderRadius: 8,
                    padding: "14px",
                    marginTop: 16
                }}>
                    <div style={{ display: "flex", alignItems: "start", gap: 10, marginBottom: 10 }}>
                        <span style={{ fontSize: "1.3rem" }}>🔒</span>
                        <div>
                            <div style={{ color: "#10B981", fontSize: "0.9rem", fontWeight: 700, marginBottom: 4 }}>
                                GARANTIA TOTAL DE 7 DIAS
                            </div>
                            <div style={{ color: "#CBD5E1", fontSize: "0.8rem", lineHeight: 1.5 }}>
                                Teste sem risco. Não gostou? Devolvemos 100%<br />
                                Sem perguntas, sem burocracia.
                            </div>
                        </div>
                    </div>
                    <div style={{ borderTop: "1px dashed rgba(16, 185, 129, 0.3)", paddingTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: "1rem" }}>🔐</span>
                        <div style={{ color: "#94A3B8", fontSize: "0.75rem" }}>
                            <strong style={{ color: "#D1FAE5" }}>Cancele online em 1 clique</strong> • Sem renovação forçada
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

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
