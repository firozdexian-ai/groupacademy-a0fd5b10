/**
 * Dexian Bangladesh: B2B Outreach Orchestrator
 * CTO Reference: Authoritative controller for institutional BD templates.
 * Logic: Implements honorific-aware name parsing, bimodal link generation, and UI metadata.
 */

export type DexianEmailTemplate = "discovery" | "talent_matching" | "ai_training";
export type DexianWhatsAppTemplate = "intro" | "follow_up" | "training_pitch";

// --- dashboard: REGISTRY_SANITY_CHECK ---
/**
 * Extracts the semantic first name while filtering common honorifics
 * to maintain a "Human-First" professional trajectory.
 */
function getFirstName(fullName: string): string {
  if (!fullName) return "there";
  const parts = fullName.trim().split(" ");
  // Skip institutional honorifics commonly found in the Bangladesh corporate registry
  const skipWords = ["mr", "mr.", "mrs", "mrs.", "ms", "ms.", "md", "md.", "dr", "dr."];

  for (const part of parts) {
    if (!skipWords.includes(part.toLowerCase())) {
      return part;
    }
  }
  return parts[0] || "there";
}

// Executive signature block for institutional consistency
const EXECUTIVE_SIGNATURE = `Best regards,
Towsif Ahmed Chowdhury
Business Development, Sr. Executive
Dexian Bangladesh Limited
ðŸ“§ info@dexian.com.bd`;

// ============= PHASE: Email_Artifact_Registry =============

export const DEXIAN_EMAIL_TEMPLATES = {
  discovery: {
    subject: (companyName: string) => `Talent Solutions & Corporate AI Training - Dexian Bangladesh`,
    body: (companyName: string, contactName?: string) =>
      `Dear ${contactName ? getFirstName(contactName) : "HR/Hiring Team"},

I hope this email finds you well. I'm reaching out from Dexian Bangladesh regarding solutions that may benefit ${companyName}:

ðŸ. ðð«ðž-ð’ðœð«ðžðžð§ðžð ð“ðšð¥ðžð§ð­ ðð¨ð¨ð¥
Access 500+ career-ready professionals across Business Development, Sales, Marketing, Tech, and Operations roles. We handle sourcing, screening, and matching - you focus on interviews.

ðŸ. ð€ðˆ ð„ðŸðŸð¢ðœð¢ðžð§ðœð² ð€ðœðœðžð¥ðžð«ðšð­ð¨ð« (Corporate Training)
6-session practical training designed to deliver 20%+ productivity gains through AI tools. Topics include AI-assisted communication, data analysis, research, and workflow automation.

Would you be open to a 15-minute discovery call this week?
I'm available Tuesday-Thursday between 10 AM - 4 PM.

${EXECUTIVE_SIGNATURE}`,
  },

  talent_matching: {
    subject: (companyName: string) => `Pre-Screened Candidates for ${companyName} - Dexian Bangladesh`,
    body: (companyName: string, contactName?: string) =>
      `Dear ${contactName ? getFirstName(contactName) : "Hiring Team"},

Following up on talent acquisition - I wanted to check if ${companyName} has unknown upcoming hiring needs.

We currently have 500+ verified professionals in our talent pool across:
â€¢ Business Development & Sales
â€¢ Marketing & Digital
â€¢ Tech & Engineering  
â€¢ Operations & Supply Chain
â€¢ Finance & Accounting

If you share your current open positions, I can send you matched candidate profiles within 24 hours - completely free as a trial.

Would a quick 15-minute call work for you this week?
I'm available Tuesday-Thursday, 10 AM - 4 PM.

${EXECUTIVE_SIGNATURE}`,
  },

  ai_training: {
    subject: (companyName: string) => `AI Efficiency Accelerator for ${companyName} - Corporate Training`,
    body: (companyName: string, contactName?: string) =>
      `Dear ${contactName ? getFirstName(contactName) : "L&D Team"},

Does ${companyName} invest in employee skill development? 

We'd like to introduce the ð€ðˆ ð„ðŸðŸð¢ðœð¢ðžð§ðœð² ð€ðœðœðžð¥ðžð«ðšð­ð¨ð« - a 6-session corporate training program designed for tangible productivity gains.

ð–ð¡ðšð­'ð¬ ð‚ð¨ð¯ðžð«ðžð:
â€¢ Session 1-2: AI-Powered Communication (emails, reports, presentations)
â€¢ Session 3-4: Data Analysis & Research with AI
â€¢ Session 5-6: Workflow Automation & Personal Productivity

ðŽð®ð­ðœð¨ð¦ðžð¬:
âœ“ 20%+ productivity improvement
âœ“ Practical hands-on exercises
âœ“ Customizable to your industry

Shall I send over our corporate training brochure and pricing?

I'm available for a quick 15-minute intro call Tuesday-Thursday, 10 AM - 4 PM.

${EXECUTIVE_SIGNATURE}`,
  },
};

// ============= PHASE: WhatsApp_Artifact_Registry =============

export const DEXIAN_WHATSAPP_TEMPLATES = {
  intro: (contactName: string, companyName: string) => {
    const firstName = getFirstName(contactName);
    return `Hi ${firstName}! This is Towsif from Dexian Bangladesh.

We help companies like ${companyName} with:
â€¢ Pre-screened talent matching for open roles
â€¢ Corporate AI training programs (AI Efficiency Accelerator)

Would love to discuss how we can support your team. When would be a good time to connect?`;
  },

  follow_up: (contactName: string, companyName: string) => {
    const firstName = getFirstName(contactName);
    return `Hi ${firstName}, following up on my earlier message regarding Dexian's talent and training solutions.

Is ${companyName} currently looking to hire or upskill your team? Happy to share more details!`;
  },

  training_pitch: (contactName: string, companyName: string) => {
    const firstName = getFirstName(contactName);
    return `Hi ${firstName}! Quick question - is ${companyName} investing in employee training this year?

We offer an AI Efficiency Accelerator program (6 sessions) that helps teams become 20%+ more productive using practical AI tools.

Would you be interested in learning more?`;
  },
};

// ============= PHASE: Utility_Link_Generators =============

/**
 * Generate a mailto URI with pre-filled Dexian artifacts
 */
export function getDexianEmailLink(
  to: string,
  template: DexianEmailTemplate,
  companyName: string,
  contactName?: string,
): string {
  const emailTemplate = DEXIAN_EMAIL_TEMPLATES[template];
  const subject = emailTemplate.subject(companyName);
  const body = emailTemplate.body(companyName, contactName);

  return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/**
 * Generate a WhatsApp URI for instant concierge-based outreach
 */
export function getDexianWhatsAppLink(
  phone: string,
  template: DexianWhatsAppTemplate,
  contactName: string,
  companyName: string,
): string {
  const cleanPhone = phone.replace(/\D/g, "");
  const message = DEXIAN_WHATSAPP_TEMPLATES[template](contactName, companyName);

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

// ============= PHASE: UI_Metadata_Exports =============

/**
 * Metadata options for institutional UI selection components.
 * Resolved TS2305 error by providing explicit named export.
 */
export const EMAIL_TEMPLATE_OPTIONS: { value: DexianEmailTemplate; label: string; icon: string }[] = [
  { value: "discovery", label: "Discovery (Talent + Training)", icon: "ðŸ”" },
  { value: "talent_matching", label: "Talent Matching Only", icon: "ðŸ‘¥" },
  { value: "ai_training", label: "AI Training Pitch", icon: "ðŸ¤–" },
];


