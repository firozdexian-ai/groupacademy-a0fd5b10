import {
  Html,
  Body,
  Container,
  Text,
  Heading,
  Button,
  Section,
  Preview,
} from "https://esm.sh/@react-email/components@0.0.12";

export default function TalentInviteEmail({ name, personal_note }: { name: string; personal_note?: string }) {
  return (
    <Html>
      <Preview>You've been invited to join GroUp Academy</Preview>
      <Body style={{ backgroundColor: "#ffffff", fontFamily: "system-ui, -apple-system, sans-serif" }}>
        <Container style={{ margin: "0 auto", padding: "40px 20px", maxWidth: "580px" }}>
          <Heading style={{ color: "#0f172a", fontSize: "24px", fontWeight: "bold" }}>
            Exclusive Invite for {name}
          </Heading>

          <Text style={{ color: "#475569", fontSize: "16px", lineHeight: "1.6" }}>
            A member of our Talent Executive team has invited you to join **GroUp Academy**, the premier career platform
            for high-potential professionals in {name === "there" ? "your region" : "Bangladesh"}. [cite: 94]
          </Text>

          {personal_note && (
            <Section
              style={{
                borderLeft: "4px solid #2A7DDE",
                paddingLeft: "20px",
                margin: "24px 0",
                backgroundColor: "#f8fafc",
                padding: "16px",
              }}
            >
              <Text style={{ fontStyle: "italic", color: "#1e293b", margin: "0" }}>"{personal_note}"</Text>
            </Section>
          )}

          <Text style={{ color: "#475569", fontSize: "16px", lineHeight: "1.6" }}>
            By joining today, you'll instantly receive **250 welcome credits** [cite: 296, 320, 364] to use on:
          </Text>

          <ul style={{ color: "#475569", fontSize: "15px", lineHeight: "1.8" }}>
            <li>
              <strong>AI Career Assessments</strong> (Benchmark your skills) [cite: 301, 383]
            </li>
            <li>
              <strong>AI Mock Interviews</strong> (Real-time feedback) [cite: 301, 383]
            </li>
            <li>
              <strong>Job Recommendations</strong> (Matched to your profile) [cite: 417, 498]
            </li>
          </ul>

          <Section style={{ textAlign: "center", marginTop: "32px" }}>
            <Button
              href="https://groupacademy.online/auth"
              style={{
                backgroundColor: "#2A7DDE",
                color: "#ffffff",
                padding: "14px 28px",
                borderRadius: "8px",
                fontWeight: "bold",
                textDecoration: "none",
              }}
            >
              Accept Invite & Claim Credits
            </Button>
          </Section>

          <Text style={{ color: "#94a3b8", fontSize: "12px", textAlign: "center", marginTop: "48px" }}>
            This invite was sent from the GroUp Academy Operations Console. [cite: 333]
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
