import type { GapFatal } from "@/types";
import { safeFormatMarkdown } from "@/lib/formatText";

interface GapCardProps {
    gap: GapFatal;
}

export function GapCard({ gap }: GapCardProps) {

    return (
        <div
            className="opportunity-box"
            style={{
                background: "linear-gradient(135deg, rgba(245, 158, 11, 0.14), rgba(15, 23, 42, 0.64))",
                border: "1px solid rgba(245, 158, 11, 0.36)",
                borderRadius: "14px",
                padding: "20px",
                marginBottom: "20px",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                boxShadow: "0 10px 24px rgba(2, 6, 23, 0.28), inset 0 1px 0 rgba(255,255,255,0.06)"
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
                    background: "rgba(2, 6, 23, 0.45)",
                    padding: "12px",
                    borderRadius: "6px",
                    color: "#94A3B8",
                    fontStyle: "italic",
                    borderLeft: "2px solid #64748B",
                    marginBottom: "10px",
                    marginTop: "10px"
                }}
                dangerouslySetInnerHTML={{ __html: `Evidência: "${safeFormatMarkdown(gap.evidencia)}"` }}
            />

            <div
                className="solution-box-card"
                style={{
                    background: "linear-gradient(135deg, rgba(16, 185, 129, 0.16), rgba(15, 23, 42, 0.35))",
                    border: "1px solid rgba(16, 185, 129, 0.3)",
                    padding: "12px",
                    borderRadius: "6px",
                    color: "#34d399",
                    fontWeight: 600
                }}
                dangerouslySetInnerHTML={{ __html: `💡 ${safeFormatMarkdown(gap.correcao_sugerida)}` }}
            />
        </div>
    );
}
