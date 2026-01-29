"use client";

import { useState } from "react";

interface CopyableSectionProps {
    title: string;
    content: string;
    isHeadline?: boolean;
}

export function CopyableSection({ title, content, isHeadline = false }: CopyableSectionProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    const formatTextToHtml = (text: string) => {
        if (!text) return "";
        
        let html = text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
        
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong style="color: #38BDF8; font-weight: 700;">$1</strong>');
        html = html.replace(/\n/g, '<br>');
        
        return html;
    };

    const bodyStyle = isHeadline ? "text-align: center; font-weight: 700;" : "";

    return (
        <div className="unified-doc-container" style={{ marginBottom: "20px" }}>
            <div className="doc-header" style={{
                backgroundColor: "rgba(56, 189, 248, 0.1)",
                padding: "10px 20px",
                borderBottom: "1px solid rgba(56, 189, 248, 0.3)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderRadius: "8px 8px 0 0"
            }}>
                <div className="doc-title" style={{
                    color: "#38BDF8",
                    fontWeight: 700,
                    textTransform: "uppercase"
                }}>
                    {title}
                </div>
                <button
                    className="header-copy-btn"
                    onClick={handleCopy}
                    style={{
                        background: "#FFFFFF",
                        border: "1px solid #CBD5E1",
                        color: copied ? "#10B981" : "#475569",
                        padding: "6px 12px",
                        borderRadius: "6px",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        transition: "all 0.2s"
                    }}
                >
                    {copied ? "COPIADO! ✅" : "COPIAR TEXTO 📋"}
                </button>
            </div>
            <div
                className="doc-body"
                style={{
                    backgroundColor: "rgba(15, 23, 42, 0.9)",
                    padding: "35px",
                    color: "#E2E8F0",
                    fontFamily: "'Inter', sans-serif",
                    lineHeight: 1.7,
                    fontSize: "1rem",
                    borderRadius: "0 0 8px 8px",
                    ...( isHeadline ? { textAlign: "center", fontWeight: 700 } : {})
                }}
                dangerouslySetInnerHTML={{ __html: formatTextToHtml(content) }}
            />
        </div>
    );
}
