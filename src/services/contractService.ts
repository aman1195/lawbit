import { supabase } from '@/integrations/supabase/client';
import { Contract } from '@/types';

export const contractService = {
  async createContract(contractData: Omit<Contract, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('No authenticated user');

    const { data, error } = await supabase
      .from('contracts')
      .insert([{
        ...contractData,
        user_id: user.id
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getContracts() {
    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getContract(id: string) {
    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async updateContract(id: string, updates: Partial<Contract>) {
    const { data, error } = await supabase
      .from('contracts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteContract(id: string) {
    const { error } = await supabase
      .from('contracts')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}; 