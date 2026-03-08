// Aligned with the 6 schools of the Freelancing Academy
export const MARKETPLACE_SCHOOLS = [
  {
    value: "digital_freelancing",
    label: "Digital Freelancing",
    icon: "globe",
    programs: ["Upwork Mastery", "Fiverr Success", "Freelance Business", "Client Management"],
  },
  {
    value: "creative_services",
    label: "Creative Services",
    icon: "palette",
    programs: ["Logo & Brand Design", "Social Media Management", "Copywriting & Blogging", "Photography & Editing"],
  },
  {
    value: "technical_services",
    label: "Technical Services",
    icon: "code",
    programs: ["Web Development", "Mobile App Dev", "Data Analysis", "QA & Testing"],
  },
  {
    value: "media_production",
    label: "Media & Production",
    icon: "video",
    programs: ["Video Production", "Motion Graphics", "Podcast Production", "Live Streaming"],
  },
  {
    value: "ai_automation",
    label: "AI & Automation",
    icon: "bot",
    programs: ["AI Tools Mastery", "Chatbot Development", "Workflow Automation", "Prompt Engineering"],
  },
  {
    value: "consulting",
    label: "Consulting",
    icon: "briefcase",
    programs: ["Business Consulting", "Management Consulting", "HR Consulting", "Financial Advisory"],
  },
] as const;

export const MARKETPLACE_SCHOOL_MAP = Object.fromEntries(
  MARKETPLACE_SCHOOLS.map((s) => [s.value, s])
);
