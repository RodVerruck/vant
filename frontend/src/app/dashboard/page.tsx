import { Suspense } from "react";
import { DashboardClient } from "./DashboardClient";

export default function DashboardPage() {
    return (
        <Suspense
            fallback={
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        minHeight: "100vh",
                        background: "#0F172A",
                        color: "#94A3B8",
                        fontSize: "1rem",
                    }}
                >
                    Carregando Dashboard...
                </div>
            }
        >
            <DashboardClient />
        </Suspense>
    );
}
