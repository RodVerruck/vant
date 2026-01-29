import type { Book } from "@/types";

interface BookCardProps {
    book: Book;
    index: number;
}

export function BookCard({ book, index }: BookCardProps) {
    const link = book.amazon_url || `https://www.amazon.com.br/s?k=${encodeURIComponent(book.titulo)}&tag=rodrigoverruc-20`;

    return (
        <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="book-card"
            style={{
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "8px",
                padding: "15px",
                marginBottom: "10px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                textDecoration: "none",
                transition: "all 0.3s"
            }}
        >
            <div className="book-rank" style={{
                fontSize: "2.5rem",
                fontWeight: 800,
                color: "rgba(255, 255, 255, 0.1)",
                marginRight: "15px"
            }}>
                {index + 1}
            </div>
            <div className="book-info">
                <h4 style={{ margin: 0, color: "#F8FAFC", fontSize: "1rem" }}>
                    {book.titulo} ↗
                </h4>
                <p style={{ margin: "2px 0 0 0", color: "#94A3B8", fontSize: "0.85rem" }}>
                    {book.autor}
                </p>
                <div className="book-reason" style={{
                    color: "#38BDF8",
                    fontSize: "0.85rem",
                    marginTop: "5px",
                    fontStyle: "italic"
                }}>
                    "{book.motivo}"
                </div>
            </div>
        </a>
    );
}
