const fs = require('fs');
const content = fs.readFileSync('frontend/src/app/app/page.tsx', 'utf8');
const lines = content.split('\n');
const insertIndex = 1294;
const buttonCode = `                {creditsRemaining > 0 && (
                    <button
                        onClick={() => {
                            setSelectedPlan("credit_3");
                            setStage("checkout");
                        }}
                        style={{
                            background: "rgba(56, 189, 248, 0.1)",
                            border: "1px solid rgba(56, 189, 248, 0.3)",
                            borderRadius: 6,
                            padding: "6px 12px",
                            color: "#38BDF8",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "all 0.2s",
                            marginLeft: 8
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = "rgba(56, 189, 248, 0.2)";
                            e.currentTarget.style.borderColor = "#38BDF8";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = "rgba(56, 189, 248, 0.1)";
                            e.currentTarget.style.borderColor = "rgba(56, 189, 248, 0.3)";
                        }}
                        title="Comprar mais créditos"
                    >
                        + Comprar
                    </button>
                )}`;
lines.splice(insertIndex, 0, buttonCode);
fs.writeFileSync('frontend/src/app/app/page.tsx', lines.join('\n'));
console.log('Botão adicionado com sucesso!');
