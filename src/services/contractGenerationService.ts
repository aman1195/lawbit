import { supabase } from '@/integrations/supabase/client';

interface ContractGenerationParams {
  contractType: string;
  firstPartyName: string;
  secondPartyName: string;
  jurisdiction?: string;
  keyTerms?: string;
}

export const contractGenerationService = {
  async generateContract(params: ContractGenerationParams): Promise<string> {
    try {
      // Call OpenAI API directly
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: `You are a legal contract generation expert. Generate a professional legal contract based on the provided parameters.
              The contract should be well-structured, legally sound, and include all necessary clauses for the specified type.
              Format the contract in a clean, professional manner with proper sections and paragraphs.
              Include standard legal boilerplate where appropriate.
              Do not include any placeholders or template markers - generate a complete, ready-to-use contract.`
            },
            {
              role: 'user',
              content: `Generate a ${params.contractType} contract between ${params.firstPartyName} and ${params.secondPartyName}.
              ${params.jurisdiction ? `Jurisdiction: ${params.jurisdiction}` : ''}
              ${params.keyTerms ? `Key Terms: ${params.keyTerms}` : ''}
              Please generate a complete, professional contract.`
            }
          ],
        }),
      });

      const openAiData = await response.json();
      
      if (!openAiData.choices || openAiData.choices.length === 0) {
        throw new Error('No response from OpenAI');
      }

      return openAiData.choices[0].message.content;
    } catch (error) {
      console.error('Error generating contract:', error);
      throw error;
    }
  },

  async saveContract(contractData: {
    title: string;
    contract_type: string;
    first_party_name: string;
    second_party_name: string;
    jurisdiction?: string;
    key_terms?: string;
    content: string;
  }) {
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
  }
}; 