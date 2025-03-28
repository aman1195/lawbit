import { supabase } from '@/integrations/supabase/client';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface AnalysisResult {
  findings: {
    text: string;
    riskLevel: 'low' | 'medium' | 'high';
    suggestions: string[];
  }[];
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

    // Initialize Gemini API
    const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Prepare the prompt
    const prompt = `You are a legal document analysis expert. Analyze the provided legal document and extract the following information:
    1. Key findings - for each finding provide:
       - The finding text
       - Risk level (low, medium, or high)
       - 2-3 specific suggestions for improvement
    2. Overall risk level (low, medium, or high)
    3. Overall risk score (a number between 0 and 100)
    4. General recommendations for improvement
    
    Return the results in JSON format with the following structure:
    {
      "findings": [
        {
          "text": "Finding description",
          "riskLevel": "low|medium|high",
          "suggestions": ["Suggestion 1", "Suggestion 2", "Suggestion 3"]
        }
      ],
      "riskLevel": "low|medium|high",
      "riskScore": number,
      "recommendations": "text with recommendations"
    }

    Document to analyze:
    ${content}`;

    // Call Gemini API
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    let analysis: AnalysisResult;
    
    try {
      // Extract the JSON part from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Could not extract JSON from Gemini response');
      }
    } catch (error) {
      console.error('Error parsing Gemini response:', error);
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