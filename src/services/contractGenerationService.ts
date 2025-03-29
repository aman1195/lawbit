import { supabase } from '@/integrations/supabase/client';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface ContractGenerationParams {
  contractType: string;
  firstPartyName: string;
  secondPartyName: string;
  jurisdiction?: string;
  keyTerms?: string;
}

export const contractGenerationService = {
  async generateContractWithOpenAI(params: ContractGenerationParams): Promise<string> {
    try {
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
              
              Format the contract with the following structure:
              1. Title (centered, larger font)
              2. Date (right-aligned)
              3. Parties (with full names and addresses)
              4. Recitals (if applicable)
              5. Main body with numbered sections
              6. Signatures section
              
              Use proper legal formatting:
              - Number all sections and subsections
              - Use clear headings for each section
              - Include standard legal boilerplate
              - Format dates consistently
              - Use proper spacing between sections
              - Do not use markdown symbols (* or #)
              - Use proper indentation and spacing
              - Use proper capitalization for headings
              - Use proper line breaks between sections
              
              Do not include any placeholders or template markers - generate a complete, ready-to-use contract.
              Format the output as plain text without any markdown or special formatting symbols.`
            },
            {
              role: 'user',
              content: `Generate a ${params.contractType} contract between ${params.firstPartyName} and ${params.secondPartyName}.
              ${params.jurisdiction ? `Jurisdiction: ${params.jurisdiction}` : ''}
              ${params.keyTerms ? `Key Terms: ${params.keyTerms}` : ''}
              
              Please generate a complete, professional contract with proper formatting and structure.
              Do not use any markdown symbols or special formatting characters.`
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
      console.error('Error generating contract with OpenAI:', error);
      throw error;
    }
  },

  async generateContractWithGemini(params: ContractGenerationParams): Promise<string> {
    try {
      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

      const prompt = `You are a legal contract generation expert. Generate a professional legal contract based on the following parameters:
      Contract Type: ${params.contractType}
      First Party: ${params.firstPartyName}
      Second Party: ${params.secondPartyName}
      ${params.jurisdiction ? `Jurisdiction: ${params.jurisdiction}` : ''}
      ${params.keyTerms ? `Key Terms: ${params.keyTerms}` : ''}
      
      Format the contract with the following structure:
      1. Title (centered, larger font)
      2. Date (right-aligned)
      3. Parties (with full names and addresses)
      4. Recitals (if applicable)
      5. Main body with numbered sections
      6. Signatures section
      
      Use proper legal formatting:
      - Number all sections and subsections
      - Use clear headings for each section
      - Include standard legal boilerplate
      - Format dates consistently
      - Use proper spacing between sections
      - Do not use markdown symbols (* or #)
      - Use proper indentation and spacing
      - Use proper capitalization for headings
      - Use proper line breaks between sections
      
      The contract should be well-structured, legally sound, and include all necessary clauses for the specified type.
      Format the contract in a clean, professional manner with proper sections and paragraphs.
      Include standard legal boilerplate where appropriate.
      Do not include any placeholders or template markers - generate a complete, ready-to-use contract.
      Format the output as plain text without any markdown or special formatting symbols.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating contract with Gemini:', error);
      throw error;
    }
  },

  async generateBothContracts(params: ContractGenerationParams): Promise<{
    openAI: string;
    gemini: string;
  }> {
    try {
      const [openAIContract, geminiContract] = await Promise.all([
        this.generateContractWithOpenAI(params),
        this.generateContractWithGemini(params)
      ]);

      return {
        openAI: openAIContract,
        gemini: geminiContract
      };
    } catch (error) {
      console.error('Error generating contracts:', error);
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