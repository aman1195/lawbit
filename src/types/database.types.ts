import { Finding, RiskLevel } from './index';

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