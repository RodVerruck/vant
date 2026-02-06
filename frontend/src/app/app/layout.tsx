import { Suspense, type ReactNode } from "react";

export default function AppLayout({ children }: { children: ReactNode }) {
    return (
        <Suspense fallback={
            <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "100vh",
                background: "#0F172A",
                color: "#94A3B8",
                fontSize: "1rem"
            }}>
                Carregando...
            </div>
        }>
            {children}
        </Suspense>
    );
}
