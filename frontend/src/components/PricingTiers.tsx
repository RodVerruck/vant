"use client";

import { useState } from "react";

export type TierType = "free" | "premium" | "pro" | "ultimate";

interface PricingTier {
  id: TierType;
  name: string;
  price: number;
  period?: string;
  description: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
  badge?: string;
}

const tiers: PricingTier[] = [
  {
    id: "free",
    name: "Gratuito",
    price: 0,
    description: "Experimente sem compromisso",
    features: [
      "1 análise gratuita",
      "Diagnóstico básico do CV",
      "2 sugestões de melhoria",
      "Score ATS",
    ],
    cta: "Começar Grátis",
  },
  {
    id: "premium",
    name: "Premium",
    price: 27,
    period: "/mês",
    description: "Para quem busca oportunidades ativamente",
    features: [
      "Análises ilimitadas",
      "Otimizações completas",
      "CV otimizado para download",
      "Biblioteca de conteúdos",
      "Suporte prioritário",
    ],
    cta: "Assinar Premium",
    highlighted: true,
    badge: "MAIS POPULAR",
  },
  {
    id: "pro",
    name: "Pro",
    price: 47,
    period: "/mês",
    description: "Para profissionais que querem se destacar",
    features: [
      "Tudo do Premium",
      "Simulador de entrevista com IA",
      "Radar de vagas compatíveis",
      "Análise de concorrência",
      "Relatórios avançados",
    ],
    cta: "Assinar Pro",
  },
  {
    id: "ultimate",
    name: "Ultimate",
    price: 97,
    period: "/mês",
    description: "Consultoria completa de carreira",
    features: [
      "Tudo do Pro",
      "Revisão humana por especialista",
      "Otimização de perfil LinkedIn",
      "Consultoria de carreira 1:1",
      "Acesso vitalício a atualizações",
    ],
    cta: "Assinar Ultimate",
  },
];

interface PricingTiersProps {
  onSelectTier: (tierId: TierType) => void;
  currentTier?: TierType;
  showFree?: boolean;
}

export function PricingTiers({ onSelectTier, currentTier, showFree = true }: PricingTiersProps) {
  const [billingPeriod] = useState<"monthly" | "annual">("monthly");

  const displayTiers = showFree ? tiers : tiers.filter(t => t.id !== "free");

  return (
    <div className="pricing-container">
      <style jsx>{`
        .pricing-container {
          width: 100%;
          max-width: 1200px;
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
          max-width: 600px;
          margin: 0 auto;
        }

        .guarantee-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.3);
          border-radius: 24px;
          padding: 8px 16px;
          margin-top: 24px;
          color: #10B981;
          font-size: 0.9rem;
          font-weight: 600;
        }

        .pricing-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
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

        .tier-card.current {
          border-color: #10B981;
          background: rgba(16, 185, 129, 0.08);
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
          display: flex;
          align-items: baseline;
          gap: 4px;
          margin-bottom: 24px;
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

        .tier-features {
          list-style: none;
          padding: 0;
          margin: 0 0 32px 0;
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

        .tier-card.current .tier-cta {
          background: rgba(16, 185, 129, 0.2);
          color: #10B981;
          border-color: #10B981;
          cursor: default;
        }

        .trust-signals {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 32px;
          padding: 32px;
          background: rgba(30, 41, 59, 0.3);
          border-radius: 12px;
          margin-top: 48px;
        }

        .trust-signal {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #CBD5E1;
          font-size: 0.95rem;
        }

        .trust-icon {
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
        }
      `}</style>

      <div className="pricing-header">
        <h2 className="pricing-title">Escolha seu plano</h2>
        <p className="pricing-subtitle">
          Comece grátis e faça upgrade quando precisar. Sem surpresas, sem taxas escondidas.
        </p>
        <div className="guarantee-badge">
          <span>🛡️</span>
          <span>Garantia de 7 dias ou seu dinheiro de volta</span>
        </div>
      </div>

      <div className="pricing-grid">
        {displayTiers.map((tier) => (
          <div
            key={tier.id}
            className={`tier-card ${tier.highlighted ? "highlighted" : ""} ${
              currentTier === tier.id ? "current" : ""
            }`}
            onClick={() => onSelectTier(tier.id)}
          >
            {tier.badge && <div className="tier-badge">{tier.badge}</div>}
            
            <h3 className="tier-name">{tier.name}</h3>
            <p className="tier-description">{tier.description}</p>

            <div className="tier-price">
              {tier.price > 0 && <span className="price-currency">R$</span>}
              <span className="price-amount">{tier.price === 0 ? "Grátis" : tier.price}</span>
              {tier.period && <span className="price-period">{tier.period}</span>}
            </div>

            <ul className="tier-features">
              {tier.features.map((feature, idx) => (
                <li key={idx}>{feature}</li>
              ))}
            </ul>

            <button className="tier-cta">
              {currentTier === tier.id ? "Plano Atual" : tier.cta}
            </button>
          </div>
        ))}
      </div>

      <div className="trust-signals">
        <div className="trust-signal">
          <span className="trust-icon">🔒</span>
          <span>Pagamento seguro via Stripe</span>
        </div>
        <div className="trust-signal">
          <span className="trust-icon">⚡</span>
          <span>Cancele quando quiser</span>
        </div>
        <div className="trust-signal">
          <span className="trust-icon">💳</span>
          <span>Sem taxas de cancelamento</span>
        </div>
        <div className="trust-signal">
          <span className="trust-icon">🎯</span>
          <span>Suporte em português</span>
        </div>
      </div>
    </div>
  );
}
