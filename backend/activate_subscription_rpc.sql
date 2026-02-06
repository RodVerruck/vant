-- Função RPC para ativação de assinatura e créditos de forma atômica
-- Bypass de RLS com SECURITY DEFINER
-- Grava assinatura e usage em transação única

CREATE OR REPLACE FUNCTION activate_subscription_rpc(
    p_user_id TEXT,
    p_stripe_sub_id TEXT,
    p_stripe_cust_id TEXT,
    p_plan TEXT,
    p_status TEXT,
    p_start TIMESTAMPTZ,
    p_end TIMESTAMPTZ
)
RETURNS BOOLEAN -- MUDOU DE JSON PARA BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_plan_credits INTEGER;
    v_usage_period_start TIMESTAMPTZ;
BEGIN
    -- Determinar créditos
    v_plan_credits := CASE p_plan
        WHEN 'trial' THEN 30
        WHEN 'pro_monthly' THEN 30
        WHEN 'pro_annual' THEN 30
        WHEN 'premium_plus' THEN 30
        ELSE 30
    END;

    v_usage_period_start := COALESCE(p_start, NOW());

    -- Assinatura
    DELETE FROM subscriptions WHERE user_id = p_user_id;

    INSERT INTO subscriptions (
        user_id, subscription_plan, stripe_subscription_id, stripe_customer_id,
        subscription_status, current_period_start, current_period_end
    ) VALUES (
        p_user_id, p_plan, p_stripe_sub_id, p_stripe_cust_id,
        p_status, p_start, p_end
    );

    -- Usage
    DELETE FROM usage WHERE user_id = p_user_id AND period_start = v_usage_period_start;

    INSERT INTO usage (user_id, period_start, used, usage_limit) 
    VALUES (p_user_id, v_usage_period_start, 0, v_plan_credits);

    RETURN TRUE; -- SIMPLES E DIRETO
END;
$$;

GRANT EXECUTE ON FUNCTION activate_subscription_rpc TO service_role;
