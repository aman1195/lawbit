import { supabase } from '@/integrations/supabase/client';
import { analyzeDocument } from './documentAnalysis';
import { DocumentType, Finding } from '@/types';

interface DatabaseDocument {
  id: string;
  title: string;
  content?: string;
  status: string;
  findings?: any;
  risk_level?: string;
  risk_score?: number;
  recommendations?: string;
  user_id: string;
  created_at?: string;
  updated_at?: string;
  error?: string;
}

export interface Document {
  id: string;
  user_id: string;
  title: string;
  content: string | null;
  status: 'analyzing' | 'completed' | 'error';
  risk_level: string | null;
  risk_score: number | null;
  findings: string[] | null;
  recommendations: string | null;
  error: string | null;
  created_at: string;
  updated_at: string;
}

export const documentService = {
  async createDocument(documentData: Omit<DocumentType, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('No authenticated user');

    // Format findings to match the Finding interface
    const formattedFindings: Finding[] = documentData.findings?.map(finding => {
      if (typeof finding === 'object' && 'text' in finding && 'riskLevel' in finding && 'suggestions' in finding) {
        return finding as Finding;
      }
      // If finding is not in the correct format, create a default structure
      return {
        text: typeof finding === 'string' ? finding : 'Unknown finding',
        riskLevel: 'medium',
        suggestions: []
      };
    }) || [];

    // Convert to database format
    const dbDocument: Omit<DatabaseDocument, 'id' | 'created_at' | 'updated_at'> = {
      title: documentData.title,
      content: documentData.body,
      status: documentData.status,
      findings: formattedFindings,
      risk_level: documentData.riskLevel,
      risk_score: documentData.riskScore,
      recommendations: documentData.recommendations,
      user_id: user.id,
      error: documentData.error
    };

    const { data, error } = await supabase
      .from('documents')
      .insert([dbDocument])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getDocuments() {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getDocument(id: string) {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async updateDocument(id: string, updates: Partial<DocumentType>) {
    // Format findings if they are being updated
    let formattedFindings: Finding[] | undefined;
    if (updates.findings) {
      formattedFindings = updates.findings.map(finding => {
        if (typeof finding === 'object' && 'text' in finding && 'riskLevel' in finding && 'suggestions' in finding) {
          return finding as Finding;
        }
        return {
          text: typeof finding === 'string' ? finding : 'Unknown finding',
          riskLevel: 'medium',
          suggestions: []
        };
      });
    }

    // Convert to database format
    const dbUpdates: Partial<DatabaseDocument> = {
      title: updates.title,
      content: updates.body,
      status: updates.status,
      findings: formattedFindings,
      risk_level: updates.riskLevel,
      risk_score: updates.riskScore,
      recommendations: updates.recommendations,
      error: updates.error
    };

    const { data, error } = await supabase
      .from('documents')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteDocument(id: string) {
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async retryAnalysis(id: string) {
    const document = await this.getDocument(id);
    if (!document.content) {
      throw new Error('Document has no content to analyze');
    }

    await analyzeDocument(id, document.content);
  }
}; 