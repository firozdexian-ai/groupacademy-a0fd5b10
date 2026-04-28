import { format } from "date-fns";

/**
 * GroUp Academy: Institutional Completion Artifact
 * CTO Reference: Authoritative landscape template for high-fidelity certificate generation.
 */

interface CertificateData {
  holder_name: string;
  course_title: string;
  verify_code: string;
  percentage: number | null;
  score: number | null;
  total_questions: number | null;
  issued_at: string;
}

interface CertificatePDFTemplateProps {
  data: CertificateData;
}

const BRAND = {
  primary: "#2A7DDE",
  secondary: "#33E1E4",
  accent: "#10D576",
  dark: "#0F172A",
  muted: "#64748B",
  border: "rgba(42, 125, 222, 0.2)",
};

export function CertificatePDFTemplate({ data }: CertificatePDFTemplateProps) {
  const verifyUrl = `${window.location.origin}/verify/${data.verify_code}`;

  return (
    <div
      id="certificate-pdf-content"
      style={{
        width: "1122px", // A4 Landscape Resolution Node
        height: "794px",
        padding: "0",
        backgroundColor: "#ffffff",
        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        color: BRAND.dark,
        position: "absolute",
        left: "-9999px",
        top: 0,
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      {/* HUD: EXTERNAL_DECORATIVE_FRAME */}
      <div
        style={{
          position: "absolute",
          inset: "20px",
          border: `2px solid ${BRAND.primary}`,
          borderRadius: "4px",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: "30px",
          border: `1px solid ${BRAND.border}`,
          borderRadius: "2px",
          pointerEvents: "none",
        }}
      />

      {/* COMPONENT: CORNER_SYNC_NODES */}
      {[
        { top: 0, left: 0, borderRadius: "0 0 100px 0" },
        { top: 0, right: 0, borderRadius: "0 0 0 100px" },
        { bottom: 0, left: 0, borderRadius: "0 100px 0 0" },
        { bottom: 0, right: 0, borderRadius: "100px 0 0 0" },
      ].map((style, i) => (
        <div
          key={i}
          style={
            {
              position: "absolute",
              width: "120px",
              height: "120px",
              background: `linear-gradient(135deg, ${BRAND.primary}10, ${BRAND.secondary}15)`,
              ...style,
            } as any
          }
        />
      ))}

      {/* VIEWPORT: ARTIFACT_CONTENT */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          padding: "60px 100px",
          textAlign: "center",
          position: "relative",
          zIndex: 10,
        }}
      >
        {/* HUD: INSTITUTIONAL_HEADER */}
        <div style={{ marginBottom: "12px" }}>
          <h1
            style={{
              margin: 0,
              fontSize: "36px",
              fontWeight: 900,
              color: BRAND.primary,
              letterSpacing: "-1px",
              textTransform: "uppercase",
              fontStyle: "italic",
            }}
          >
            GroUp_Academy
          </h1>
        </div>

        <div
          style={{
            width: "160px",
            height: "4px",
            background: `linear-gradient(90deg, ${BRAND.primary}, ${BRAND.secondary})`,
            borderRadius: "2px",
            marginBottom: "24px",
          }}
        />

        <p
          style={{
            margin: "0 0 40px",
            fontSize: "14px",
            textTransform: "uppercase",
            letterSpacing: "6px",
            color: BRAND.muted,
            fontWeight: 800,
          }}
        >
          Credential_of_Completion
        </p>

        <p style={{ margin: "0 0 12px", fontSize: "16px", fontStyle: "italic", color: BRAND.muted }}>
          This system verifies that
        </p>

        {/* IDENTITY: HOLDER_NAME */}
        <h2
          style={{
            margin: "0 0 24px",
            fontSize: "52px",
            fontWeight: 900,
            color: BRAND.dark,
            borderBottom: `4px solid ${BRAND.secondary}`,
            paddingBottom: "10px",
            display: "inline-block",
            letterSpacing: "-2px",
          }}
        >
          {data.holder_name.toUpperCase()}
        </h2>

        <p style={{ margin: "0 0 16px", fontSize: "16px", color: BRAND.muted }}>
          has synchronized mastery in the curriculum of
        </p>

        {/* ARTIFACT: COURSE_TITLE */}
        <h3
          style={{
            margin: "0 0 32px",
            fontSize: "28px",
            fontWeight: 800,
            color: BRAND.primary,
            maxWidth: "800px",
            textTransform: "uppercase",
            letterSpacing: "-0.5px",
          }}
        >
          {data.course_title}
        </h3>

        {/* HUD: METRIC_SYNC */}
        {data.percentage !== null && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "15px",
              backgroundColor: "#F0FDF4",
              border: "1px solid rgba(16, 213, 118, 0.2)",
              padding: "12px 32px",
              borderRadius: "16px",
              marginBottom: "32px",
            }}
          >
            <span
              style={{
                fontSize: "14px",
                color: BRAND.accent,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              ✓ Diagnostic_Yield: {data.score}/{data.total_questions} ({data.percentage}%)
            </span>
          </div>
        )}

        {/* HUD: SIGNATURE_AUTHORITY */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            width: "100%",
            marginTop: "20px",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: "220px",
                borderBottom: `1px solid ${BRAND.muted}40`,
                marginBottom: "8px",
                paddingBottom: "8px",
                fontSize: "18px",
                fontWeight: 800,
                fontStyle: "italic",
                color: BRAND.dark,
                letterSpacing: "-0.5px",
              }}
            >
              GroUp_Registry
            </div>
            <p
              style={{
                margin: 0,
                fontSize: "10px",
                fontWeight: 700,
                color: BRAND.muted,
                textTransform: "uppercase",
                letterSpacing: "2px",
              }}
            >
              Issuing_Authority
            </p>
            <p style={{ margin: "4px 0 0", fontSize: "11px", fontWeight: 600, color: BRAND.primary }}>
              {format(new Date(data.issued_at), "dd_MMM_yyyy").toUpperCase()}
            </p>
          </div>
        </div>

        {/* FOOTER: VERIFICATION_LEDGER */}
        <div
          style={{
            position: "absolute",
            bottom: "35px",
            left: "80px",
            right: "80px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            fontSize: "9px",
            fontWeight: 700,
            color: BRAND.muted,
            textTransform: "uppercase",
            letterSpacing: "1px",
          }}
        >
          <div style={{ textAlign: "left" }}>
            <span style={{ display: "block", marginBottom: "4px" }}>System_Verify: {verifyUrl}</span>
            <span>Artifact_ID: {data.verify_code}</span>
          </div>
          <div style={{ textAlign: "right" }}>
            <span style={{ display: "block", marginBottom: "4px" }}>Verification_Status: LEVEL_1_VERIFIED</span>
            <span>© {new Date().getFullYear()} GroUp_Academy_Neural_Registry</span>
          </div>
        </div>
      </div>
    </div>
  );
}
