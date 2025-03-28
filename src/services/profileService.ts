import { supabase } from '@/integrations/supabase/client';

export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  created_at: string;
  updated_at: string;
}

export const profileService = {
  async getProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user logged in');

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) throw error;
    return data;
  },

  async updateProfile(updates: Partial<Profile>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user logged in');

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}; 