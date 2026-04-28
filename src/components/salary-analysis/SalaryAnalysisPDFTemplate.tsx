import { format } from "date-fns";

/**
 * GroUp Academy: Neural Fiscal Intelligence Artifact
 * CTO Reference: Authoritative report template for market salary and skill parity analysis.
 */

// Interface definitions remain consistent with the registry data model
interface SalaryRange {
  min_monthly: number;
  median_monthly: number;
  max_monthly: number;
  experience_level: string;
  market_context: string;
}
interface SkillsAnalysis {
  matching_skills: string[];
  missing_skills: string[];
  skills_gap_score: number;
  recommendations: string[];
}
interface NegotiationTip {
  tip: string;
  rationale: string;
}
interface MarketInsights {
  demand_level: string;
  growth_trajectory: string;
  industry_trends: string[];
}
interface AIAnalysis {
  summary: string;
  market_salary_range: SalaryRange;
  skills_analysis: SkillsAnalysis;
  negotiation_tips: NegotiationTip[];
  action_plan: string[];
  market_insights: MarketInsights;
  overall_readiness_score: number;
  salary_positioning: string;
}
interface Analysis {
  id: string;
  full_name: string;
  email: string;
  job_title: string | null;
  company_name: string | null;
  ai_analysis: AIAnalysis;
  created_at: string;
  completed_at: string | null;
  profession_categories?: { name: string } | null;
}

interface Props {
  analysis: Analysis;
}

const BRAND = {
  primary: "#2A7DDE",
  secondary: "#33E1E4",
  accent: "#10D576",
  warning: "#EA580C",
  error: "#F43F5E",
  dark: "#0F172A",
  muted: "#64748B",
  background: "#F8FAFC",
};

const formatCurrency = (amt: number) => new Intl.NumberFormat("en-US").format(amt);

const POSITION_REGISTRY: Record<string, { label: string; color: string }> = {
  above_market: { label: "ABOVE_MARKET_NODE", color: BRAND.accent },
  below_market: { label: "BELOW_MARKET_DEFICIT", color: BRAND.error },
  at_market: { label: "MARKET_EQUILIBRIUM", color: BRAND.muted },
};

export function SalaryAnalysisPDFTemplate({ analysis }: Props) {
  const ai = analysis.ai_analysis;
  const salary = ai.market_salary_range;
  const position = POSITION_REGISTRY[ai.salary_positioning] || POSITION_REGISTRY.at_market;

  return (
    <div
      id="salary-analysis-pdf-content"
      style={{
        width: "794px", // Standard A4 Resolution
        padding: "50px",
        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        backgroundColor: "#ffffff",
        color: BRAND.dark,
        boxSizing: "border-box",
      }}
    >
      {/* HUD: REPORT_HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: "40px",
          paddingBottom: "25px",
          borderBottom: `4px solid ${BRAND.secondary}`,
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: "32px",
              fontWeight: 900,
              color: BRAND.primary,
              textTransform: "uppercase",
              fontStyle: "italic",
              letterSpacing: "-1px",
            }}
          >
            Salary_Analysis_Report
          </h1>
          <p
            style={{
              margin: "5px 0 0",
              fontSize: "12px",
              fontWeight: 700,
              color: BRAND.muted,
              letterSpacing: "2px",
              textTransform: "uppercase",
            }}
          >
            GroUp_Academy Neural_Intelligence_v4
          </p>
        </div>
        <div
          style={{
            textAlign: "right",
            fontSize: "10px",
            color: BRAND.muted,
            fontWeight: 700,
            textTransform: "uppercase",
          }}
        >
          Registry_Sync: {format(new Date(analysis.completed_at || analysis.created_at), "dd_MMM_yyyy").toUpperCase()}
        </div>
      </div>

      {/* COMPONENT: CANDIDATE_METADATA */}
      <div style={{ display: "flex", gap: "20px", marginBottom: "30px" }}>
        <div
          style={{
            flex: 1,
            backgroundColor: BRAND.background,
            padding: "25px",
            borderRadius: "24px",
            border: "1px solid #e2e8f0",
          }}
        >
          <p style={{ margin: 0, fontSize: "10px", fontWeight: 800, color: BRAND.muted, textTransform: "uppercase" }}>
            Identity_Artifact
          </p>
          <h2 style={{ fontSize: "22px", fontWeight: 800, margin: "4px 0 12px 0" }}>{analysis.full_name}</h2>
          <div style={{ display: "flex", gap: "15px" }}>
            <div>
              <p
                style={{ margin: 0, fontSize: "9px", fontWeight: 800, color: BRAND.muted, textTransform: "uppercase" }}
              >
                Target_Role
              </p>
              <p style={{ fontSize: "13px", fontWeight: 600, margin: 0 }}>{analysis.job_title || "GENERAL_NODE"}</p>
            </div>
            {analysis.company_name && (
              <div>
                <p
                  style={{
                    margin: 0,
                    fontSize: "9px",
                    fontWeight: 800,
                    color: BRAND.muted,
                    textTransform: "uppercase",
                  }}
                >
                  Institution
                </p>
                <p style={{ fontSize: "13px", fontWeight: 600, margin: 0 }}>{analysis.company_name}</p>
              </div>
            )}
          </div>
        </div>
        <div
          style={{
            width: "220px",
            textAlign: "center",
            backgroundColor: BRAND.dark,
            color: "#fff",
            padding: "20px",
            borderRadius: "24px",
          }}
        >
          <p
            style={{ margin: 0, fontSize: "9px", fontWeight: 800, color: BRAND.secondary, textTransform: "uppercase" }}
          >
            Field_Sector
          </p>
          <p style={{ fontSize: "15px", fontWeight: 800, margin: "5px 0" }}>
            {analysis.profession_categories?.name.toUpperCase() || "CORE_TRAJECTORY"}
          </p>
          <p style={{ margin: "10px 0 0 0", fontSize: "9px", opacity: 0.6 }}>
            ID: {analysis.id.slice(0, 8).toUpperCase()}
          </p>
        </div>
      </div>

      {/* HUD: READINESS_INDEX */}
      <div
        style={{
          textAlign: "center",
          marginBottom: "40px",
          background: `linear-gradient(135deg, ${BRAND.secondary}, ${BRAND.primary})`,
          color: "white",
          padding: "40px",
          borderRadius: "32px",
          boxShadow: "0 20px 40px rgba(42, 125, 222, 0.2)",
        }}
      >
        <div
          style={{ fontSize: "12px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "3px", opacity: 0.9 }}
        >
          Overall_Readiness_Index
        </div>
        <div
          style={{
            fontSize: "92px",
            fontWeight: 900,
            margin: "10px 0",
            fontStyle: "italic",
            letterSpacing: "-4px",
            lineHeight: 1,
          }}
        >
          {ai.overall_readiness_score}%
        </div>
        <div
          style={{
            display: "inline-block",
            backgroundColor: position.color,
            color: "#fff",
            padding: "10px 30px",
            borderRadius: "15px",
            fontSize: "14px",
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "1px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          }}
        >
          {position.label}
        </div>
      </div>

      {/* COMPONENT: SUMMARY_VIEWPORT */}
      <div
        style={{
          marginBottom: "40px",
          background: "#F0F9FF",
          padding: "25px",
          borderRadius: "24px",
          borderLeft: `6px solid ${BRAND.primary}`,
          fontStyle: "italic",
        }}
      >
        <p style={{ fontSize: "14px", lineHeight: "1.8", color: BRAND.dark, margin: 0 }}>{ai.summary}</p>
      </div>

      {/* HUD: FISCAL_TELEMETRY */}
      <div style={{ marginBottom: "40px" }}>
        <h3
          style={{
            fontSize: "14px",
            fontWeight: 800,
            marginBottom: "20px",
            color: BRAND.primary,
            textTransform: "uppercase",
            letterSpacing: "1px",
          }}
        >
          Market_Salary_Parity_Node
        </h3>
        <div style={{ display: "flex", gap: "20px" }}>
          {[
            { label: "MIN_VECTOR", val: salary.min_monthly, accent: false },
            { label: "MEDIAN_SYNC", val: salary.median_monthly, accent: true },
            { label: "MAX_VECTOR", val: salary.max_monthly, accent: false },
          ].map((node, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                backgroundColor: node.accent ? "#fff" : BRAND.background,
                padding: "25px 15px",
                borderRadius: "20px",
                textAlign: "center",
                border: node.accent ? `3px solid ${BRAND.secondary}` : "1px solid #e2e8f0",
              }}
            >
              <p
                style={{
                  fontSize: "10px",
                  fontWeight: 800,
                  color: BRAND.muted,
                  margin: "0 0 8px 0",
                  textTransform: "uppercase",
                }}
              >
                {node.label}
              </p>
              <p
                style={{
                  fontSize: "24px",
                  fontWeight: 900,
                  color: node.accent ? BRAND.primary : BRAND.dark,
                  margin: 0,
                }}
              >
                ${formatCurrency(node.val)}
              </p>
              <p style={{ fontSize: "10px", fontWeight: 700, color: BRAND.muted, margin: "5px 0 0" }}>USD / MONTHLY</p>
            </div>
          ))}
        </div>
        <p
          style={{
            fontSize: "10px",
            fontWeight: 700,
            color: BRAND.muted,
            textAlign: "center",
            marginTop: "15px",
            textTransform: "uppercase",
            letterSpacing: "1px",
          }}
        >
          Context: {salary.experience_level} • {salary.market_context}
        </p>
      </div>

      {/* VIEWPORT: SKILL_VECTORS */}
      <div style={{ display: "flex", gap: "25px", marginBottom: "40px" }}>
        <div
          style={{
            flex: 1,
            backgroundColor: "#F0FDF4",
            padding: "25px",
            borderRadius: "24px",
            border: "1px solid rgba(16, 213, 118, 0.2)",
          }}
        >
          <h3
            style={{
              fontSize: "12px",
              fontWeight: 800,
              color: BRAND.accent,
              marginBottom: "15px",
              textTransform: "uppercase",
            }}
          >
            [+] Matching_Skills
          </h3>
          <p style={{ fontSize: "12px", fontWeight: 600, lineHeight: "2", color: BRAND.dark }}>
            {ai.skills_analysis.matching_skills.join(" • ")}
          </p>
        </div>
        <div
          style={{
            flex: 1,
            backgroundColor: "#FFF1F2",
            padding: "25px",
            borderRadius: "24px",
            border: "1px solid rgba(244, 63, 94, 0.2)",
          }}
        >
          <h3
            style={{
              fontSize: "12px",
              fontWeight: 800,
              color: BRAND.error,
              marginBottom: "15px",
              textTransform: "uppercase",
            }}
          >
            [△] Optimization_Gaps
          </h3>
          <p style={{ fontSize: "12px", fontWeight: 600, lineHeight: "2", color: BRAND.dark }}>
            {ai.skills_analysis.missing_skills.join(" • ")}
          </p>
        </div>
      </div>

      {/* HUD: STRATEGY_NODES */}
      <div style={{ display: "flex", gap: "25px", marginBottom: "40px" }}>
        <div style={{ flex: 1 }}>
          <h3
            style={{
              fontSize: "14px",
              fontWeight: 800,
              marginBottom: "15px",
              color: BRAND.primary,
              textTransform: "uppercase",
            }}
          >
            Negotiation_Protocol
          </h3>
          {ai.negotiation_tips.slice(0, 3).map((tip, i) => (
            <div
              key={i}
              style={{
                marginBottom: "15px",
                backgroundColor: "#FEFCE8",
                padding: "15px",
                borderRadius: "16px",
                border: "1px solid #FEF08A",
              }}
            >
              <p style={{ fontSize: "13px", fontWeight: 800, margin: "0 0 5px 0" }}>{tip.tip}</p>
              <p style={{ fontSize: "11px", fontWeight: 500, color: BRAND.muted, margin: 0, lineHeight: 1.4 }}>
                {tip.rationale}
              </p>
            </div>
          ))}
        </div>
        <div style={{ flex: 1 }}>
          <h3
            style={{
              fontSize: "14px",
              fontWeight: 800,
              marginBottom: "15px",
              color: BRAND.primary,
              textTransform: "uppercase",
            }}
          >
            Strategic_Action_Plan
          </h3>
          <div style={{ paddingLeft: "10px" }}>
            {ai.action_plan.slice(0, 5).map((action, i) => (
              <div
                key={i}
                style={{ display: "flex", gap: "10px", marginBottom: "12px", fontSize: "12px", fontWeight: 600 }}
              >
                <span style={{ color: BRAND.secondary, fontWeight: 900 }}>0{i + 1}.</span>
                <span>{action}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FOOTER: SYSTEM_VERIFICATION */}
      <div style={{ borderTop: "2px solid #f1f5f9", paddingTop: "25px", textAlign: "center" }}>
        <p
          style={{
            fontSize: "10px",
            color: BRAND.muted,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "1px",
          }}
        >
          Verification_Hash: {analysis.id.toUpperCase()} • Issued_by_GroUp_Academy_Neural_Registry
        </p>
      </div>
    </div>
  );
}
