# Refatoração do Sistema de Autenticação - Email + Senha + OAuth Google

## 📋 Objetivo
Substituir o sistema de Magic Link (que causa perda de dados em nova aba) por:
1. **Email + Senha** (login/cadastro tradicional)
2. **OAuth Google** (login com 1 clique)

## 🎯 Benefícios
- ✅ Elimina problema de perda de dados entre abas
- ✅ UX muito melhor (sem sair do app)
- ✅ Login instantâneo
- ✅ Maior taxa de conversão

---

## 🔧 PASSO 1: Adicionar Novos Estados

No arquivo `frontend/src/app/app/page.tsx`, **linha ~126**, adicione os novos estados:

```typescript
// ANTES (linha ~125-135):
const [authEmail, setAuthEmail] = useState("");
const [authUserId, setAuthUserId] = useState<string | null>(null);
const [stripeSessionId, setStripeSessionId] = useState<string | null>(null);
const [checkoutError, setCheckoutError] = useState<string | null>(null);
const [, setCreditsRemaining] = useState(0);
const [needsActivation, setNeedsActivation] = useState(false);
const [isActivating, setIsActivating] = useState(false);

// Estados de magic link
const [isSendingMagicLink, setIsSendingMagicLink] = useState(false);
const [magicLinkCooldownUntil, setMagicLinkCooldownUntil] = useState<number>(0);

// DEPOIS:
const [authEmail, setAuthEmail] = useState("");
const [authPassword, setAuthPassword] = useState("");  // ← NOVO
const [authUserId, setAuthUserId] = useState<string | null>(null);
const [stripeSessionId, setStripeSessionId] = useState<string | null>(null);
const [checkoutError, setCheckoutError] = useState<string | null>(null);
const [, setCreditsRemaining] = useState(0);
const [needsActivation, setNeedsActivation] = useState(false);
const [isActivating, setIsActivating] = useState(false);
const [isLoginMode, setIsLoginMode] = useState(true);  // ← NOVO (true = login, false = cadastro)
const [isAuthenticating, setIsAuthenticating] = useState(false);  // ← NOVO

// Remover estados de magic link (não precisa mais)
```

---

## 🔧 PASSO 2: Adicionar Funções de Autenticação

**Substituir** a função `sendMagicLink()` (linha ~517) por estas duas novas funções:

```typescript
// Login com Email + Senha
async function handleEmailPasswordAuth() {
    setCheckoutError("");
    
    if (!supabase) {
        setCheckoutError("Supabase não configurado.");
        return;
    }

    if (!authEmail || !authEmail.includes("@")) {
        setCheckoutError("Digite um e-mail válido.");
        return;
    }

    if (!authPassword || authPassword.length < 6) {
        setCheckoutError("A senha deve ter no mínimo 6 caracteres.");
        return;
    }

    setIsAuthenticating(true);

    try {
        if (isLoginMode) {
            // LOGIN
            const { data, error } = await supabase.auth.signInWithPassword({
                email: authEmail,
                password: authPassword,
            });

            if (error) throw error;

            if (data.user) {
                setAuthUserId(data.user.id);
                setAuthEmail(data.user.email || authEmail);
                setCheckoutError("");
                setAuthPassword(""); // Limpar senha
            }
        } else {
            // CADASTRO
            const { data, error } = await supabase.auth.signUp({
                email: authEmail,
                password: authPassword,
            });

            if (error) throw error;

            if (data.user) {
                setAuthUserId(data.user.id);
                setAuthEmail(data.user.email || authEmail);
                setCheckoutError("✅ Conta criada com sucesso!");
                setAuthPassword(""); // Limpar senha
            }
        }
    } catch (e: unknown) {
        setCheckoutError(getErrorMessage(e, isLoginMode ? "Erro ao fazer login" : "Erro ao criar conta"));
    } finally {
        setIsAuthenticating(false);
    }
}

// Login com Google OAuth
async function handleGoogleLogin() {
    setCheckoutError("");

    if (!supabase) {
        setCheckoutError("Supabase não configurado.");
        return;
    }

    setIsAuthenticating(true);

    try {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: typeof window !== "undefined" 
                    ? `${window.location.origin}/app`
                    : undefined,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                },
            },
        });

        if (error) throw error;

        // O redirecionamento acontece automaticamente
    } catch (e: unknown) {
        setCheckoutError(getErrorMessage(e, "Erro ao fazer login com Google"));
        setIsAuthenticating(false);
    }
}
```

---

## 🔧 PASSO 3: Atualizar a UI do Checkout

No `stage === "checkout"` (linha ~1357), **substituir** a seção de autenticação:

```typescript
// ANTES (linha ~1395-1441):
<div style={{ marginBottom: 12 }}>
    <div style={{ color: "#94A3B8", fontSize: "0.85rem", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
        Seu e-mail
    </div>
    <input
        value={authEmail}
        onChange={(e) => setAuthEmail(e.target.value)}
        placeholder="voce@exemplo.com"
        style={{ width: "100%", boxSizing: "border-box", height: 44, padding: "10px 12px" }}
    />
    {!authUserId ? (
        <div style={{ color: "#64748B", fontSize: "0.8rem", marginTop: 8 }}>
            🔐 Entre com seu e-mail para salvar créditos/assinatura e acessar de qualquer dispositivo.
        </div>
    ) : (
        <div style={{ color: "#10B981", fontSize: "0.8rem", marginTop: 8, fontWeight: 700 }}>
            ✅ Logado
        </div>
    )}
</div>

<div data-testid="stButton" className="stButton" style={{ width: "100%" }}>
    <button type="button" data-kind="primary" onClick={startCheckout} style={{ width: "100%" }}>
        Continuar para pagamento
    </button>
</div>

{!authUserId && (
    <>
        <div style={{ height: 12 }} />
        <div data-testid="stButton" className="stButton" style={{ width: "100%" }}>
            <button
                type="button"
                data-kind="secondary"
                onClick={sendMagicLink}
                disabled={isSendingMagicLink || magicLinkCooldownSeconds > 0}
                style={{ width: "100%" }}
            >
                {isSendingMagicLink
                    ? "Enviando..."
                    : magicLinkCooldownSeconds > 0
                        ? `Aguarde ${magicLinkCooldownSeconds}s`
                        : "Enviar link de acesso"}
            </button>
        </div>
    </>
)}

// DEPOIS:
{!authUserId ? (
    <>
        {/* Botão Google OAuth */}
        <div data-testid="stButton" className="stButton" style={{ width: "100%", marginBottom: 16 }}>
            <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isAuthenticating}
                style={{
                    width: "100%",
                    height: 48,
                    background: "#fff",
                    color: "#1f2937",
                    border: "1px solid rgba(255,255,255,0.2)",
                    borderRadius: 8,
                    fontSize: "0.95rem",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 12,
                    cursor: isAuthenticating ? "not-allowed" : "pointer",
                    opacity: isAuthenticating ? 0.6 : 1,
                }}
            >
                <svg width="18" height="18" viewBox="0 0 18 18">
                    <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
                    <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
                    <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"/>
                    <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"/>
                </svg>
                {isAuthenticating ? "Autenticando..." : "Continuar com Google"}
            </button>
        </div>

        {/* Divisor */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.1)" }} />
            <span style={{ color: "#64748B", fontSize: "0.8rem" }}>ou use email</span>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.1)" }} />
        </div>

        {/* Email */}
        <div style={{ marginBottom: 12 }}>
            <div style={{ color: "#94A3B8", fontSize: "0.85rem", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
                E-mail
            </div>
            <input
                type="email"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                placeholder="voce@exemplo.com"
                style={{ width: "100%", boxSizing: "border-box", height: 44, padding: "10px 12px" }}
            />
        </div>

        {/* Senha */}
        <div style={{ marginBottom: 16 }}>
            <div style={{ color: "#94A3B8", fontSize: "0.85rem", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
                Senha
            </div>
            <input
                type="password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                style={{ width: "100%", boxSizing: "border-box", height: 44, padding: "10px 12px" }}
            />
        </div>

        {/* Botão Login/Cadastro */}
        <div data-testid="stButton" className="stButton" style={{ width: "100%", marginBottom: 12 }}>
            <button
                type="button"
                data-kind="primary"
                onClick={handleEmailPasswordAuth}
                disabled={isAuthenticating}
                style={{ width: "100%", opacity: isAuthenticating ? 0.6 : 1 }}
            >
                {isAuthenticating ? "Autenticando..." : (isLoginMode ? "ENTRAR" : "CRIAR CONTA")}
            </button>
        </div>

        {/* Toggle Login/Cadastro */}
        <div style={{ textAlign: "center", marginBottom: 16 }}>
            <button
                type="button"
                onClick={() => setIsLoginMode(!isLoginMode)}
                style={{
                    background: "none",
                    border: "none",
                    color: "#38BDF8",
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    textDecoration: "underline",
                }}
            >
                {isLoginMode ? "Não tem conta? Criar agora" : "Já tem conta? Fazer login"}
            </button>
        </div>
    </>
) : (
    <>
        {/* Usuário já logado */}
        <div style={{ marginBottom: 16, padding: 16, background: "rgba(16, 185, 129, 0.1)", border: "1px solid #10B981", borderRadius: 8 }}>
            <div style={{ color: "#10B981", fontSize: "0.9rem", fontWeight: 600, marginBottom: 4 }}>
                ✅ Logado como
            </div>
            <div style={{ color: "#E2E8F0", fontSize: "0.85rem" }}>{authEmail}</div>
        </div>

        <div data-testid="stButton" className="stButton" style={{ width: "100%" }}>
            <button type="button" data-kind="primary" onClick={startCheckout} style={{ width: "100%" }}>
                Continuar para pagamento
            </button>
        </div>
    </>
)}
```

---

## 🔧 PASSO 4: Remover Código Antigo (Opcional)

Você pode remover:
- Estados `isSendingMagicLink` e `magicLinkCooldownUntil` (linha ~134-135)
- `useEffect` do `magicLinkCooldown` (linha ~405-414)
- Variável `magicLinkCooldownSeconds` (linha ~403)

---

## 🧪 PASSO 5: Testar

1. **Teste OAuth Google:**
   - Vá para `/app`
   - Clique em "Continuar com Google"
   - Faça login com sua conta Google
   - Deve voltar para `/app` já autenticado

2. **Teste Email + Senha (Cadastro):**
   - Clique em "Não tem conta? Criar agora"
   - Digite email e senha (mín 6 caracteres)
   - Clique em "CRIAR CONTA"
   - Deve criar a conta e fazer login

3. **Teste Email + Senha (Login):**
   - Digite email e senha de conta existente
   - Clique em "ENTRAR"
   - Deve fazer login

4. **Teste Fluxo Completo:**
   - Faça upload de CV
   - Analise
   - Vá para checkout
   - Faça login (Google ou Email)
   - Complete pagamento
   - **Dados NÃO devem ser perdidos!** ✅

---

## 📝 Notas Importantes

1. **OAuth Google já está configurado** no Supabase com suas credenciais
2. **Não precisa mais de localStorage** para persistir dados entre abas (problema resolvido!)
3. **UX muito melhor**: usuário permanece na mesma aba
4. **Maior conversão**: login em 1 clique com Google

---

## 🚀 Commit Sugerido

```bash
git add frontend/src/app/app/page.tsx
git commit -m "feat: implementa autenticação com Email+Senha e OAuth Google

- Substitui magic link por login tradicional
- Adiciona botão 'Continuar com Google'
- Implementa toggle login/cadastro
- Remove dependência de localStorage para auth
- Melhora UX: usuário permanece na mesma aba
- Aumenta taxa de conversão com login em 1 clique

BREAKING CHANGE: Remove sistema de magic link
Fixes: Perda de dados entre abas durante autenticação"
```
