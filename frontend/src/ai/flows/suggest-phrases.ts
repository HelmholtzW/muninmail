// EmailSentimentAnalyzerTool
'use server';
/**
 * @fileOverview Suggest phrases to include in emails to avoid sounding passive-aggressive.
 *
 * - suggestPhrases - A function that handles the email phrases suggestion process.
 * - SuggestPhrasesInput - The input type for the suggestPhrases function.
 * - SuggestPhrasesOutput - The return type for the suggestPhrases function.
 */

import { generateStructuredResponse } from '@/ai/client';
import { z } from 'zod';

const SuggestPhrasesInputSchema = z.object({
  emailBody: z.string().describe('The body of the email to analyze.'),
});
export type SuggestPhrasesInput = z.infer<typeof SuggestPhrasesInputSchema>;

const SuggestPhrasesOutputSchema = z.object({
  suggestedPhrases: z
    .array(z.string())
    .describe('A list of suggested phrases to include in the email.'),
  sentimentAnalysis: z.string().describe('The sentiment analysis of the email.'),
});
export type SuggestPhrasesOutput = z.infer<typeof SuggestPhrasesOutputSchema>;

export async function suggestPhrases(input: SuggestPhrasesInput): Promise<SuggestPhrasesOutput> {
  // Validate input
  const validatedInput = SuggestPhrasesInputSchema.parse(input);

  const systemPrompt = `You are an AI assistant that helps users write professional emails. You will suggest phrases to include in the email to avoid sounding passive-aggressive, and analyze the sentiment of the email.

Provide helpful phrase suggestions that can improve the tone and professionalism of the email, along with a brief sentiment analysis.`;

  const userPrompt = `Email Body: ${validatedInput.emailBody}`;

  const schema = {
    name: 'suggest_phrases',
    description: 'Suggest phrases for professional email writing',
    parameters: {
      type: 'object',
      properties: {
        suggestedPhrases: {
          type: 'array',
          items: {
            type: 'string'
          },
          description: 'A list of suggested phrases to include in the email to improve tone and professionalism'
        },
        sentimentAnalysis: {
          type: 'string',
          description: 'A brief sentiment analysis of the email'
        }
      },
      required: ['suggestedPhrases', 'sentimentAnalysis']
    }
  };

  const result = await generateStructuredResponse<SuggestPhrasesOutput>(
    systemPrompt,
    userPrompt,
    schema
  );

  // Validate output
  return SuggestPhrasesOutputSchema.parse(result);
}
