import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  contractType: string;
  firstParty: string;
  firstPartyAddress?: string;
  secondParty: string;
  secondPartyAddress?: string;
  jurisdiction?: string;
  description?: string;
  keyTerms?: string;
  intensity: string;
  aiModel: string;
}

interface AIResponse {
  contractText: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    const requestData: RequestBody = await req.json();
    const {
      contractType,
      firstParty,
      firstPartyAddress,
      secondParty,
      secondPartyAddress,
      jurisdiction,
      description,
      keyTerms,
      intensity,
      aiModel,
    } = requestData;

    // Format prompt for AI
    const prompt = formatPrompt(
      contractType,
      firstParty,
      firstPartyAddress || "",
      secondParty,
      secondPartyAddress || "",
      jurisdiction || "",
      description || "",
      keyTerms || "",
      intensity
    );

    let contractHtml = "";

    switch (aiModel) {
      case "openai":
        contractHtml = await generateWithOpenAI(prompt);
        break;
      case "gemini":
        contractHtml = await generateWithGemini(prompt);
        break;
      case "grok":
        contractHtml = await generateWithGrok(prompt);
        break;
      default:
        contractHtml = await generateWithOpenAI(prompt);
    }

    const response: AIResponse = {
      contractText: contractHtml,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in generate-contract function:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

function formatPrompt(
  contractType: string,
  firstParty: string,
  firstPartyAddress: string,
  secondParty: string,
  secondPartyAddress: string,
  jurisdiction: string,
  description: string,
  keyTerms: string,
  intensity: string
): string {
  let protectionLevel = "";
  switch (intensity) {
    case "Light":
      protectionLevel = "minimal protection, focusing on simple and straightforward terms";
      break;
    case "Moderate":
      protectionLevel = "standard legal protection with balanced terms for both parties";
      break;
    case "Aggressive":
      protectionLevel = "strong legal protection favoring the first party with comprehensive safeguards";
      break;
    default:
      protectionLevel = "standard legal protection";
  }

  return `
    Generate a professional, legally-sound ${contractType} in HTML format.

    Contract Details:
    - First Party: ${firstParty}
    - First Party Address: ${firstPartyAddress}
    - Second Party: ${secondParty}
    - Second Party Address: ${secondPartyAddress}
    - Jurisdiction: ${jurisdiction}
    - Description: ${description}
    - Key Terms: ${keyTerms}
    - Protection Level: ${protectionLevel}

    Instructions:
    1. Format the contract professionally with proper sections and clauses
    2. Include all standard clauses required for this type of agreement
    3. Add appropriate legal language based on the jurisdiction
    4. Structure with clear headings, numbered sections, and proper spacing
    5. Include signature blocks at the end
    6. Output in clean HTML with appropriate tags (<h1>, <h2>, <p>, etc.)
    7. Use professional legal terminology
    8. Create a contract that would be recognized as valid in ${jurisdiction || "the appropriate jurisdiction"}
    9. Format dates as Month Day, Year (e.g., June 1, 2023)
    10. Only return the HTML for the contract, properly formatted
    11. Include at least 10-15 sections with detailed clauses
    12. Add standard boilerplate clauses for the specific contract type
    13. Include definitions section at the beginning
    14. Add dispute resolution and arbitration clauses
    15. Include force majeure and termination clauses
    16. Add confidentiality and non-disclosure clauses where appropriate
    17. Include governing law and jurisdiction clauses
    18. Add entire agreement and severability clauses
    19. Format the contract with proper spacing and indentation
    20. Use semantic HTML tags for better structure
    21. Add CSS classes for styling (e.g., class="section-title", class="clause")
    22. Include a table of contents at the beginning
    23. Add proper page breaks for printing
    24. Include headers and footers with page numbers
    25. Format the signature blocks professionally
    26. Add witness signature lines where appropriate
    27. Include notary blocks where required
    28. Add execution date and place
    29. Include company seals and stamps where appropriate
    30. Format the contract in a way that's easy to read and understand
  `;
}

async function generateWithOpenAI(prompt: string): Promise<string> {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) {
    throw new Error("OpenAI API key not found");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a legal expert who drafts professional contracts in clean HTML format. Return only the HTML, no explanations or preamble."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
    }),
  });

  const data = await response.json();
  if (data.error) {
    throw new Error(`OpenAI API error: ${data.error.message}`);
  }

  return data.choices[0].message.content;
}

async function generateWithGemini(prompt: string): Promise<string> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) {
    throw new Error("Gemini API key not found");
  }

  const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=" + apiKey, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature: 0.2,
      },
    }),
  });

  const data = await response.json();
  if (data.error) {
    throw new Error(`Gemini API error: ${data.error.message}`);
  }

  return data.candidates[0].content.parts[0].text;
}

async function generateWithGrok(prompt: string): Promise<string> {
  const apiKey = Deno.env.get("GROK_API_KEY");
  if (!apiKey) {
    throw new Error("Grok API key not found");
  }

  // Implementation would depend on Grok's API specifics
  // This is a placeholder as Grok's API might not be publicly available yet
  return `<h1>Contract Generated with Grok</h1><p>This is a placeholder as the Grok API implementation details might not be available yet.</p>`;
}
