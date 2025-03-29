export const CONTRACT_TYPES = [
  // Most popular agreements first
  "Non-Disclosure Agreement (NDA)",
  "Employment Agreement",
  "Service Agreement",
  "Consulting Agreement",
  "Sales Contract",
  "Lease Agreement",
  "Term Sheet",
  "SAFE Note Agreement",
  "Convertible Note Agreement",
  "Equity Vesting Agreement",
  "Partnership Agreement",
  // Less common agreements
  "Distribution Agreement",
  "Licensing Agreement",
  "Software License Agreement",
  "Freelancer Contract",
  "Intellectual Property Assignment",
  "Co-Founder Agreement",
  "Stock Option Agreement",
  "Investment Agreement",
  "Terms of Service",
  "Privacy Policy",
  "Data Processing Agreement",
  "SAAS Agreement"
];

export const JURISDICTIONS = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware",
  "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky",
  "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi",
  "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico",
  "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania",
  "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont",
  "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
];

export const AI_MODELS = [
  { id: "openai", name: "OpenAI", model: "gpt-4o" },
  { id: "gemini", name: "Google Gemini", model: "gemini-1.5-pro" },
  { id: "grok", name: "Grok", model: "grok-1" }
];

// Document type definitions
export type RiskLevel = "low" | "medium" | "high";

export type AIModel = "openai" | "gemini" | "grok";

export type AnalyzingDocument = {
  id: string;
  title: string;
  date: string;
  status: "analyzing";
  progress: number;
};

export type ErrorDocument = {
  id: string;
  title: string;
  date: string;
  status: "error";
  error: string;
};

export interface Finding {
  text: string;
  riskLevel: RiskLevel;
  suggestions: string[];
}

export interface Document {
  id: string;
  title: string;
  content: string;
  created_at: string;
  user_id: string;
  status: 'analyzing' | 'completed' | 'error';
  progress?: number;
  error?: string;
  risk_level?: RiskLevel;
  risk_score?: number;
  findings?: Finding[];
  recommendations?: string;
}

export type CompletedDocument = DocumentType & {
  status: 'completed';
  body: string;
  date: string;
  riskLevel: RiskLevel;
  riskScore: number;
  findings: Finding[];
  recommendations: string;
};

export interface DocumentCardProps {
  id: string;
  title: string;
  date: string;
  status: "analyzing" | "completed" | "error";
  riskLevel?: RiskLevel;
  riskScore?: number;
  findings?: Finding[];
  recommendations?: string;
  progress?: number;
  error?: string;
  onDelete?: (id: string) => void;
  onView?: (id: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

export interface ContractPreviewProps {
  contract: {
    id?: string;
    title: string;
    contractType: string;
    firstParty: string;
    firstPartyAddress?: string;
    secondParty: string;
    secondPartyAddress?: string;
    jurisdiction?: string;
    description?: string;
    keyTerms?: string;
    intensity: string;
    aiModel?: string;
  };
  onClose: () => void;
  onSaved: () => void;
}

export interface Contract {
  id: string;
  user_id: string;
  title: string;
  contract_type: string;
  first_party_name: string;
  first_party_address: string | null;
  second_party_name: string;
  second_party_address: string | null;
  jurisdiction: string | null;
  description: string | null;
  key_terms: string | null;
  intensity: string;
  risk_level: string;
  risk_score: number;
  content: string;
  created_at: string;
  updated_at: string;
}
