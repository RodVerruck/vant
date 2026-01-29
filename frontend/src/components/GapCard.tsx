import type { GapFatal } from "@/types";

interface GapCardProps {
    gap: GapFatal;
}

export function GapCard({ gap }: GapCardProps) {
    const formatDiagnostic = (text: string) => {
        if (!text) return "";
        return text.replace(/\*\*(.*?)\*\*/g, '<strong style="color:#38BDF8!important">$1</strong>');
    };

    return (
        <div
            className="opportunity-box"
            style={{
                background: "rgba(245, 158, 11, 0.1)",
                border: "1px solid rgba(245, 158, 11, 0.4)",
                borderRadius: "12px",
                padding: "20px",
                marginBottom: "20px"
            }}
        >
            <div
                className="opportunity-title"
                style={{
                    color: "#F59E0B",
                    fontWeight: 800,
                    fontSize: "1.1rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "12px"
                }}
            >
                ⚡ {gap.erro}
            </div>

            <div
                className="evidence-box"
                style={{
                    background: "rgba(0, 0, 0, 0.4)",
                    padding: "12px",
                    borderRadius: "6px",
                    color: "#94A3B8",
                    fontStyle: "italic",
                    borderLeft: "2px solid #64748B",
                    marginBottom: "10px",
                    marginTop: "10px"
                }}
                dangerouslySetInnerHTML={{ __html: `Evidência: "${formatDiagnostic(gap.evidencia)}"` }}
            />

            <div
                className="solution-box-card"
                style={{
                    background: "rgba(16, 185, 129, 0.1)",
                    border: "1px solid rgba(16, 185, 129, 0.3)",
                    padding: "12px",
                    borderRadius: "6px",
                    color: "#34d399",
                    fontWeight: 600
                }}
                dangerouslySetInnerHTML={{ __html: `💡 ${formatDiagnostic(gap.correcao_sugerida)}` }}
            />
        </div>
    );
}
