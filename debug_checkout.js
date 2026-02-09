// Script para debug do fluxo de checkout
// Copiar e colar no console do navegador

console.log("=== DEBUG CHECKOUT FLOW ===");

// 1. Limpar tudo
localStorage.clear();
console.log("✅ localStorage limpo");

// 2. Simular clique em "COMEÇAR TRIAL"
const trialData = {
    plan: "trial",
    amount: 1.99,
    timestamp: Date.now(),
    source: 'debug_script'
};
localStorage.setItem('checkout_pending', JSON.stringify(trialData));
console.log("✅ checkout_pending salvo:", trialData);

// 3. Verificar se está salvo
const saved = localStorage.getItem('checkout_pending');
console.log("✅ Verificando checkout_pending:", saved ? "EXISTS" : "NULL");

// 4. Simular login (setar authUserId manualmente para testar useEffect)
// NOTA: Isso não vai funcionar completamente porque precisa do estado React
// Mas ajuda a verificar se a lógica do useEffect está correta

console.log("=== AGORA FAÇA O LOGIN REAL ===");
console.log("1. Clique em 'COMEÇAR TRIAL R$ 1,99'");
console.log("2. Faça login");
console.log("3. Observe os logs no console");

// Função para verificar estado atual
function checkState() {
    const pending = localStorage.getItem('checkout_pending');
    console.log("Estado atual:", {
        checkout_pending: !!pending,
        data: pending ? JSON.parse(pending) : null
    });
}

// Verificar a cada 2 segundos
setInterval(checkState, 2000);
