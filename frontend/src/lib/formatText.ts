/**
 * Utilitários de formatação de texto segura.
 * Sempre escapa HTML antes de adicionar marcações, prevenindo XSS.
 */

/**
 * Escapa HTML entities para uso seguro em dangerouslySetInnerHTML.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Converte markdown básico (**bold**) para HTML seguro.
 * Escapa o texto antes de aplicar formatação.
 */
export function safeFormatMarkdown(text: string, boldColor = "#38BDF8"): string {
  if (!text) return "";
  const escaped = escapeHtml(text);
  return escaped.replace(
    /\*\*(.*?)\*\*/g,
    `<strong style="color:${boldColor}!important">$1</strong>`
  );
}

/**
 * Converte texto com markdown para HTML seguro com quebras de linha.
 */
export function safeFormatMarkdownWithBreaks(text: string): string {
  if (!text) return "";
  const escaped = escapeHtml(text);
  const withBold = escaped.replace(
    /\*\*(.*?)\*\*/g,
    '<strong style="color:#38BDF8;font-weight:700">$1</strong>'
  );
  return withBold.replace(/\n/g, "<br>");
}
