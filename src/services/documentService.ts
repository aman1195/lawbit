import { supabase } from '@/integrations/supabase/client';
import { analyzeDocument } from './documentAnalysis';
import { Document, Finding } from '../types/database.types';

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
  async createDocument(userId: string, title: string, content: string) {
    const { data, error } = await supabase
      .from('documents')
      .insert([
        {
          title,
          content,
          user_id: userId,
          status: 'analyzing',
          progress: 0,
          findings: [] as Finding[],
          risk_level: null,
          risk_score: null,
          recommendations: null
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateDocument(id: string, updates: Partial<Document>) {
    const { data, error } = await supabase
      .from('documents')
      .update(updates)
      .eq('id', id)
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