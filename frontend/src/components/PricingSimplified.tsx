"use client";

import { useState } from "react";

export type PlanType = "free" | "pro_monthly" | "pro_annual" | "trial" | "credit_1" | "credit_5";

interface PricingSimplifiedProps {
  onSelectPlan: (planId: PlanType) => void;
  currentPlan?: PlanType;
  showTrial?: boolean;
}

export function PricingSimplified({ onSelectPlan, currentPlan, showTrial = true }: PricingSimplifiedProps) {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("monthly");

  return (
    <div className="pricing-container">
      <style jsx>{`
        .pricing-container {
          width: 100%;
          max-width: 1000px;
          margin: 0 auto;
          padding: 40px 20px;
        }

        .pricing-header {
          text-align: center;
          margin-bottom: 48px;
        }

        .pricing-title {
          font-size: 2.5rem;
          font-weight: 700;
          color: #F8FAFC;
          margin-bottom: 16px;
        }

        .pricing-subtitle {
          font-size: 1.1rem;
          color: #94A3B8;
          margin-bottom: 32px;
        }

        .billing-toggle {
          display: inline-flex;
          background: rgba(30, 41, 59, 0.5);
          border: 2px solid rgba(148, 163, 184, 0.2);
          border-radius: 12px;
          padding: 4px;
          gap: 4px;
        }

        .billing-option {
          padding: 10px 24px;
          border: none;
          border-radius: 8px;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          background: transparent;
          color: #94A3B8;
          position: relative;
        }

        .billing-option.active {
          background: linear-gradient(135deg, #4A9EFF 0%, #3B82F6 100%);
          color: white;
        }

        .billing-option .discount-badge {
          position: absolute;
          top: -8px;
          right: -8px;
          background: #10B981;
          color: white;
          font-size: 0.65rem;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 6px;
        }

        .pricing-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 24px;
          margin-bottom: 48px;
        }

        .tier-card {
          background: rgba(30, 41, 59, 0.5);
          border: 2px solid rgba(148, 163, 184, 0.2);
          border-radius: 16px;
          padding: 32px 24px;
          position: relative;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .tier-card:hover {
          transform: translateY(-4px);
          border-color: rgba(74, 158, 255, 0.5);
          box-shadow: 0 8px 24px rgba(74, 158, 255, 0.15);
        }

        .tier-card.highlighted {
          border-color: #4A9EFF;
          background: rgba(74, 158, 255, 0.08);
          box-shadow: 0 8px 32px rgba(74, 158, 255, 0.2);
        }

        .tier-badge {
          position: absolute;
          top: -12px;
          left: 50%;
          transform: translateX(-50%);
          background: linear-gradient(135deg, #4A9EFF 0%, #3B82F6 100%);
          color: white;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 4px 12px;
          border-radius: 12px;
          letter-spacing: 0.5px;
        }

        .tier-icon {
          font-size: 2.5rem;
          margin-bottom: 16px;
        }

        .tier-name {
          font-size: 1.5rem;
          font-weight: 700;
          color: #F8FAFC;
          margin-bottom: 8px;
        }

        .tier-description {
          font-size: 0.9rem;
          color: #94A3B8;
          margin-bottom: 24px;
          min-height: 40px;
        }

        .tier-price {
          margin-bottom: 8px;
        }

        .price-main {
          display: flex;
          align-items: baseline;
          gap: 4px;
          margin-bottom: 4px;
        }

        .price-currency {
          font-size: 1.2rem;
          color: #CBD5E1;
        }

        .price-amount {
          font-size: 3rem;
          font-weight: 700;
          color: #F8FAFC;
        }

        .price-period {
          font-size: 1rem;
          color: #94A3B8;
        }

        .price-detail {
          font-size: 0.85rem;
          color: #10B981;
          font-weight: 600;
        }

        .tier-features {
          list-style: none;
          padding: 0;
          margin: 24px 0 32px 0;
        }

        .tier-features li {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 8px 0;
          color: #CBD5E1;
          font-size: 0.95rem;
        }

        .tier-features li::before {
          content: "✓";
          color: #10B981;
          font-weight: 700;
          font-size: 1.2rem;
          flex-shrink: 0;
        }

        .tier-cta {
          width: 100%;
          padding: 14px 24px;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          background: rgba(74, 158, 255, 0.1);
          color: #4A9EFF;
          border: 2px solid rgba(74, 158, 255, 0.3);
        }

        .tier-cta:hover {
          background: rgba(74, 158, 255, 0.2);
          border-color: #4A9EFF;
          transform: translateY(-2px);
        }

        .tier-card.highlighted .tier-cta {
          background: linear-gradient(135deg, #4A9EFF 0%, #3B82F6 100%);
          color: white;
          border: none;
        }

        .tier-card.highlighted .tier-cta:hover {
          background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
          box-shadow: 0 4px 12px rgba(74, 158, 255, 0.4);
        }

        .credits-section {
          background: rgba(30, 41, 59, 0.3);
          border: 2px solid rgba(148, 163, 184, 0.2);
          border-radius: 16px;
          padding: 32px;
          margin-top: 48px;
        }

        .credits-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .credits-title {
          font-size: 1.8rem;
          font-weight: 700;
          color: #F8FAFC;
          margin-bottom: 8px;
        }

        .credits-subtitle {
          font-size: 0.95rem;
          color: #94A3B8;
        }

        .credits-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 20px;
        }

        .credit-card {
          background: rgba(30, 41, 59, 0.5);
          border: 2px solid rgba(148, 163, 184, 0.2);
          border-radius: 12px;
          padding: 24px;
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .credit-card:hover {
          border-color: #4A9EFF;
          transform: translateY(-2px);
        }

        .credit-card.popular {
          border-color: #10B981;
          background: rgba(16, 185, 129, 0.05);
        }

        .credit-badge {
          display: inline-block;
          background: #10B981;
          color: white;
          font-size: 0.7rem;
          font-weight: 700;
          padding: 4px 8px;
          border-radius: 6px;
          margin-bottom: 12px;
        }

        .credit-name {
          font-size: 1.2rem;
          font-weight: 700;
          color: #F8FAFC;
          margin-bottom: 8px;
        }

        .credit-price {
          font-size: 2rem;
          font-weight: 700;
          color: #4A9EFF;
          margin-bottom: 4px;
        }

        .credit-detail {
          font-size: 0.85rem;
          color: #94A3B8;
          margin-bottom: 16px;
        }

        .credit-cta {
          width: 100%;
          padding: 10px 20px;
          background: rgba(74, 158, 255, 0.1);
          color: #4A9EFF;
          border: 2px solid rgba(74, 158, 255, 0.3);
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .credit-cta:hover {
          background: rgba(74, 158, 255, 0.2);
          border-color: #4A9EFF;
        }

        .guarantee-section {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 32px;
          padding: 32px;
          background: rgba(30, 41, 59, 0.3);
          border-radius: 12px;
          margin-top: 48px;
        }

        .guarantee-item {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #CBD5E1;
          font-size: 0.95rem;
        }

        .guarantee-icon {
          font-size: 1.5rem;
        }

        @media (max-width: 768px) {
          .pricing-grid {
            grid-template-columns: 1fr;
          }

          .pricing-title {
            font-size: 2rem;
          }

          .price-amount {
            font-size: 2.5rem;
          }

          .billing-toggle {
            flex-direction: column;
            width: 100%;
          }

          .billing-option {
            width: 100%;
          }
        }
      `}</style>

      <div className="pricing-header">
        <h2 className="pricing-title">Escolha seu plano</h2>
        <p className="pricing-subtitle">
          Comece grátis. Faça upgrade quando precisar.
        </p>

        <div className="billing-toggle">
          <button
            className={`billing-option ${billingPeriod === "monthly" ? "active" : ""}`}
            onClick={() => setBillingPeriod("monthly")}
          >
            Mensal
          </button>
          <button
            className={`billing-option ${billingPeriod === "annual" ? "active" : ""}`}
            onClick={() => setBillingPeriod("annual")}
          >
            Anual
            <span className="discount-badge">-29%</span>
          </button>
        </div>
      </div>

      <div className="pricing-grid">
        {/* FREE TIER */}
        <div className="tier-card" onClick={() => onSelectPlan("free")}>
          <div className="tier-icon">🆓</div>
          <h3 className="tier-name">Gratuito</h3>
          <p className="tier-description">Teste Agora</p>

          <div className="tier-price">
            <div className="price-main">
              <span className="price-amount">Grátis</span>
            </div>
          </div>

          <ul className="tier-features">
            <li>1 Análise Completa</li>
            <li>Score ATS Detalhado</li>
            <li>43 Critérios Avaliados</li>
            <li>3 Sugestões de Melhoria</li>
          </ul>

          <button className="tier-cta">ANALISAR MEU CV GRÁTIS</button>
        </div>

        {/* PRO TIER */}
        <div className="tier-card highlighted" onClick={() => onSelectPlan(billingPeriod === "monthly" ? "pro_monthly" : "pro_annual")}>
          <div className="tier-badge">MAIS POPULAR ⭐</div>
          <div className="tier-icon">🚀</div>
          <h3 className="tier-name">PRO</h3>
          <p className="tier-description">Para quem busca oportunidades ativamente</p>

          <div className="tier-price">
            {billingPeriod === "monthly" ? (
              <>
                <div className="price-main">
                  <span className="price-currency">R$</span>
                  <span className="price-amount">27,90</span>
                  <span className="price-period">/mês</span>
                </div>
              </>
            ) : (
              <>
                <div className="price-main">
                  <span className="price-currency">R$</span>
                  <span className="price-amount">239</span>
                  <span className="price-period">/ano</span>
                </div>
                <div className="price-detail">= R$ 19,92/mês (economize 29%)</div>
              </>
            )}
          </div>

          <ul className="tier-features">
            <li>Otimizações ILIMITADAS</li>
            <li>Download de CV Otimizado (PDF + Word)</li>
            <li>Simulador de Entrevista com IA</li>
            <li>X-Ray Search - Encontre Recrutadores</li>
            <li>Biblioteca Recomendada</li>
          </ul>

          <button className="tier-cta">
            {showTrial ? "COMEÇAR TRIAL R$ 1,99" : "ASSINAR PRO"}
          </button>
        </div>
      </div>

      {/* CRÉDITOS AVULSOS */}
      <div className="credits-section">
        <div className="credits-header">
          <h3 className="credits-title">💎 Precisa apenas de 1 otimização?</h3>
          <p className="credits-subtitle">Compre créditos avulsos sem compromisso mensal</p>
        </div>

        <div className="credits-grid">
          <div className="credit-card" onClick={() => onSelectPlan("credit_1")}>
            <div className="credit-name">Crédito Único</div>
            <div className="credit-price">R$ 12,90</div>
            <div className="credit-detail">1 otimização completa</div>
            <button className="credit-cta">COMPRAR CRÉDITO</button>
          </div>

          <div className="credit-card popular" onClick={() => onSelectPlan("credit_5")}>
            <div className="credit-badge">ECONOMIZE 22%</div>
            <div className="credit-name">Pacote 5 CVs</div>
            <div className="credit-price">R$ 49,90</div>
            <div className="credit-detail">R$ 9,98 por CV • Válido 6 meses</div>
            <button className="credit-cta">COMPRAR PACOTE</button>
          </div>
        </div>
      </div>

      {/* GARANTIAS */}
      <div className="guarantee-section">
        <div className="guarantee-item">
          <span className="guarantee-icon">🛡️</span>
          <span>7 dias de garantia total</span>
        </div>
        <div className="guarantee-item">
          <span className="guarantee-icon">💳</span>
          <span>Cancele quando quiser</span>
        </div>
        <div className="guarantee-item">
          <span className="guarantee-icon">🔒</span>
          <span>Pagamento seguro via Stripe</span>
        </div>
        <div className="guarantee-item">
          <span className="guarantee-icon">⚡</span>
          <span>Acesso imediato</span>
        </div>
      </div>
    </div>
  );
}
