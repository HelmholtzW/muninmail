import OpenAI from 'openai';

// Validate environment variables and log configuration
function validateConfig() {
  const apiKey = process.env.OPENAI_API_KEY;
  const baseURL = process.env.OPENAI_BASE_URL;
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  if (!apiKey) {
    console.warn('⚠️  OPENAI_API_KEY is not set');
  } else {
    console.log('✅ OpenAI API key is configured');
  }

  if (baseURL) {
    console.log(`🔗 Using custom base URL: ${baseURL}`);
  } else {
    console.log('🔗 Using default OpenAI base URL');
  }

  console.log(`🤖 Using model: ${model}`);
  
  return { apiKey, baseURL, model };
}

// Validate config on import
const config = validateConfig();

// Initialize OpenAI client
export const openai = new OpenAI({
  apiKey: config.apiKey,
  baseURL: config.baseURL,
});

// Default model configuration (can be overridden with OPENAI_MODEL env var)
export const DEFAULT_MODEL = config.model;

// Helper function to create structured responses using OpenAI function calling
export async function generateStructuredResponse<T>(
  systemPrompt: string,
  userPrompt: string,
  schema: {
    name: string;
    description: string;
    parameters: {
      type: string;
      properties: Record<string, unknown>;
      required: string[];
    };
  },
  model: string = DEFAULT_MODEL
): Promise<T> {
  try {
    // First try with function calling
    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      tools: [
        {
          type: 'function',
          function: schema
        }
      ],
      tool_choice: { type: 'function', function: { name: schema.name } }
    });

    const toolCall = response.choices[0]?.message?.tool_calls?.[0];
    if (!toolCall || !toolCall.function.arguments) {
      throw new Error('Failed to get structured response from OpenAI');
    }

    return JSON.parse(toolCall.function.arguments) as T;
  } catch (error) {
    console.log('Function calling failed, trying fallback approach:', error);
    
    // Fallback: Use regular chat completion with JSON format request
    const fallbackSystemPrompt = `${systemPrompt}

Please respond with valid JSON in exactly this format:
${JSON.stringify(generateSchemaExample(schema), null, 2)}

Make sure your response is valid JSON and follows the schema exactly.`;

    try {
      const fallbackResponse = await openai.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: fallbackSystemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1, // Lower temperature for more consistent JSON output
      });

      const content = fallbackResponse.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response content from OpenAI fallback');
      }

      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      return JSON.parse(jsonMatch[0]) as T;
    } catch (fallbackError) {
      console.error('Both function calling and fallback failed:', { error, fallbackError });
      throw new Error(`AI request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Helper function to generate example JSON from schema
function generateSchemaExample(schema: {
  parameters: {
    properties: Record<string, unknown>;
    required: string[];
  };
}): Record<string, unknown> {
  const example: Record<string, unknown> = {};
  
  for (const [key, prop] of Object.entries(schema.parameters.properties)) {
    const propDef = prop as { type: string; enum?: string[]; items?: { type: string } };
    
    if (propDef.enum) {
      example[key] = propDef.enum[0];
    } else if (propDef.type === 'string') {
      example[key] = 'example_string';
    } else if (propDef.type === 'number') {
      example[key] = 0;
    } else if (propDef.type === 'boolean') {
      example[key] = true;
    } else if (propDef.type === 'array' && propDef.items?.type === 'string') {
      example[key] = ['example_item'];
    } else {
      example[key] = null;
    }
  }
  
  return example;
} 