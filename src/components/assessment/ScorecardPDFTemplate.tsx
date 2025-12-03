import { format } from "date-fns";

interface Assessment {
  id: string;
  full_name: string;
  email: string;
  percentage: number;
  readiness_level: string;
  total_score: number;
  max_score: number;
  created_at: string;
  ai_analysis: any;
  improvement_areas: string[];
  profession_categories?: {
    name: string;
  };
}

interface ScorecardPDFTemplateProps {
  assessment: Assessment;
}

const readinessLabels: Record<string, string> = {
  beginner: "Beginner",
  developing: "Developing",
  competent: "Competent",
  proficient: "Proficient",
  expert: "Expert",
};

export function ScorecardPDFTemplate({ assessment }: ScorecardPDFTemplateProps) {
  const readinessLevel = assessment.readiness_level || "beginner";

  return (
    <div
      id="scorecard-pdf-content"
      style={{
        width: "794px",
        padding: "40px",
        backgroundColor: "#ffffff",
        fontFamily: "system-ui, -apple-system, sans-serif",
        color: "#1a1a1a",
        position: "absolute",
        left: "-9999px",
        top: 0,
      }}
    >
      {/* Header */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        marginBottom: "30px",
        paddingBottom: "20px",
        borderBottom: "2px solid #6366f1"
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "28px", fontWeight: 700, color: "#6366f1" }}>
            GroUp Academy
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: "14px", color: "#666" }}>
            Career Readiness Scorecard
          </p>
        </div>
        <div style={{ textAlign: "right", fontSize: "12px", color: "#666" }}>
          <p style={{ margin: 0 }}>Assessment Date</p>
          <p style={{ margin: "2px 0 0", fontWeight: 600, color: "#1a1a1a" }}>
            {format(new Date(assessment.created_at), "MMMM d, yyyy")}
          </p>
        </div>
      </div>

      {/* Candidate Info */}
      <div style={{ 
        backgroundColor: "#f8fafc", 
        padding: "16px 20px", 
        borderRadius: "8px",
        marginBottom: "24px"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div>
            <p style={{ margin: 0, fontSize: "12px", color: "#666" }}>Candidate Name</p>
            <p style={{ margin: "4px 0 0", fontSize: "18px", fontWeight: 600 }}>
              {assessment.full_name}
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ margin: 0, fontSize: "12px", color: "#666" }}>Profession Category</p>
            <p style={{ margin: "4px 0 0", fontSize: "14px", fontWeight: 500 }}>
              {assessment.profession_categories?.name || "General"}
            </p>
          </div>
        </div>
      </div>

      {/* Score Section */}
      <div style={{ 
        textAlign: "center", 
        padding: "30px",
        backgroundColor: "#6366f1",
        borderRadius: "12px",
        marginBottom: "24px",
        color: "#ffffff"
      }}>
        <p style={{ margin: 0, fontSize: "14px", opacity: 0.9 }}>Career Readiness Score</p>
        <p style={{ margin: "8px 0", fontSize: "64px", fontWeight: 700, lineHeight: 1 }}>
          {assessment.percentage}%
        </p>
        <div style={{ 
          display: "inline-block",
          backgroundColor: "rgba(255,255,255,0.2)",
          padding: "6px 16px",
          borderRadius: "20px",
          fontSize: "14px",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.5px"
        }}>
          {readinessLabels[readinessLevel]}
        </div>
        <div style={{ 
          display: "flex", 
          justifyContent: "center", 
          gap: "40px", 
          marginTop: "20px",
          fontSize: "13px"
        }}>
          <div>
            <span style={{ opacity: 0.8 }}>Points Earned: </span>
            <strong>{assessment.total_score}</strong>
          </div>
          <div>
            <span style={{ opacity: 0.8 }}>Max Points: </span>
            <strong>{assessment.max_score}</strong>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div style={{ display: "flex", gap: "20px", marginBottom: "24px" }}>
        {/* Strengths */}
        <div style={{ flex: 1 }}>
          <h3 style={{ 
            margin: "0 0 12px", 
            fontSize: "14px", 
            fontWeight: 600,
            color: "#16a34a",
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}>
            ✓ Strengths
          </h3>
          <ul style={{ 
            margin: 0, 
            paddingLeft: "16px", 
            fontSize: "12px",
            lineHeight: 1.6,
            color: "#333"
          }}>
            {assessment.ai_analysis?.strengths?.slice(0, 4).map((s: string, i: number) => (
              <li key={i} style={{ marginBottom: "6px" }}>{s}</li>
            )) || <li style={{ color: "#999" }}>Analysis pending...</li>}
          </ul>
        </div>

        {/* Improvement Areas */}
        <div style={{ flex: 1 }}>
          <h3 style={{ 
            margin: "0 0 12px", 
            fontSize: "14px", 
            fontWeight: 600,
            color: "#ea580c",
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}>
            △ Areas for Improvement
          </h3>
          <ul style={{ 
            margin: 0, 
            paddingLeft: "16px", 
            fontSize: "12px",
            lineHeight: 1.6,
            color: "#333"
          }}>
            {(assessment.ai_analysis?.improvement_areas || assessment.improvement_areas)?.slice(0, 4).map((a: string, i: number) => (
              <li key={i} style={{ marginBottom: "6px" }}>{a}</li>
            )) || <li style={{ color: "#999" }}>Analysis pending...</li>}
          </ul>
        </div>
      </div>

      {/* Recommendations */}
      {assessment.ai_analysis?.recommendations && (
        <div style={{ marginBottom: "24px" }}>
          <h3 style={{ 
            margin: "0 0 12px", 
            fontSize: "14px", 
            fontWeight: 600,
            color: "#6366f1"
          }}>
            Personalized Recommendations
          </h3>
          <ol style={{ 
            margin: 0, 
            paddingLeft: "20px", 
            fontSize: "12px",
            lineHeight: 1.6,
            color: "#333"
          }}>
            {assessment.ai_analysis.recommendations.slice(0, 5).map((r: string, i: number) => (
              <li key={i} style={{ marginBottom: "8px" }}>{r}</li>
            ))}
          </ol>
        </div>
      )}

      {/* Career Tip */}
      {assessment.ai_analysis?.career_tips && (
        <div style={{ 
          backgroundColor: "#fef3c7",
          padding: "16px",
          borderRadius: "8px",
          borderLeft: "4px solid #f59e0b",
          marginBottom: "24px"
        }}>
          <p style={{ 
            margin: 0, 
            fontSize: "12px", 
            fontStyle: "italic",
            color: "#92400e"
          }}>
            💡 {assessment.ai_analysis.career_tips}
          </p>
        </div>
      )}

      {/* CTA */}
      <div style={{ 
        textAlign: "center",
        padding: "20px",
        backgroundColor: "#f0fdf4",
        borderRadius: "8px",
        marginBottom: "24px"
      }}>
        <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#166534" }}>
          Ready to improve your career readiness?
        </p>
        <p style={{ margin: "8px 0 0", fontSize: "12px", color: "#15803d" }}>
          Visit groupacademy.com/courses to explore our skill-building programs
        </p>
      </div>

      {/* Footer */}
      <div style={{ 
        borderTop: "1px solid #e5e7eb",
        paddingTop: "16px",
        display: "flex",
        justifyContent: "space-between",
        fontSize: "10px",
        color: "#999"
      }}>
        <div>
          <p style={{ margin: 0 }}>Assessment ID: {assessment.id.slice(0, 8).toUpperCase()}</p>
          <p style={{ margin: "2px 0 0" }}>Valid for 90 days</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ margin: 0 }}>Generated by GroUp Academy</p>
          <p style={{ margin: "2px 0 0" }}>© {new Date().getFullYear()} All Rights Reserved</p>
        </div>
      </div>
    </div>
  );
}