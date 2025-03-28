import { supabase } from '@/integrations/supabase/client';

interface AnalysisResult {
  findings: string[];
  riskLevel: 'low' | 'medium' | 'high';
  riskScore: number;
  recommendations: string;
}

export const analyzeDocument = async (documentId: string, content: string): Promise<void> => {
  try {
    // Update document status to analyzing
    await supabase
      .from('documents')
      .update({ status: 'analyzing' })
      .eq('id', documentId);

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
            content: `You are a legal document analysis expert. Analyze the provided legal document and extract the following information:
            1. Key findings (list of potential issues, non-standard clauses, or areas of concern)
            2. Risk level (low, medium, or high)
            3. Risk score (a number between 0 and 100)
            4. Recommendations for improvement
            
            Return the results in JSON format with the following structure:
            {
              "findings": ["Finding 1", "Finding 2", ...],
              "riskLevel": "low|medium|high",
              "riskScore": number,
              "recommendations": "text with recommendations"
            }`
          },
          {
            role: 'user',
            content: content
          }
        ],
      }),
    });

    const openAiData = await response.json();
    
    if (!openAiData.choices || openAiData.choices.length === 0) {
      throw new Error('No response from OpenAI');
    }

    const analysisContent = openAiData.choices[0].message.content;
    let analysis: AnalysisResult;
    
    try {
      // Extract the JSON part from the response
      const jsonMatch = analysisContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Could not extract JSON from OpenAI response');
      }
    } catch (error) {
      console.error('Error parsing OpenAI response:', error);
      throw new Error('Failed to parse analysis results');
    }

    // Update document with analysis results
    const { error: updateError } = await supabase
      .from('documents')
      .update({
        status: 'completed',
        risk_level: analysis.riskLevel,
        risk_score: analysis.riskScore,
        findings: analysis.findings,
        recommendations: analysis.recommendations,
      })
      .eq('id', documentId);

    if (updateError) {
      throw updateError;
    }
  } catch (error) {
    console.error('Error analyzing document:', error);
    
    // Update document status to error
    await supabase
      .from('documents')
      .update({
        status: 'error',
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      })
      .eq('id', documentId);
    
    throw error;
  }
}; 