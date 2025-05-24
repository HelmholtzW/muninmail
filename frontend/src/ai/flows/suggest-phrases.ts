// EmailSentimentAnalyzerTool
'use server';
/**
 * @fileOverview Suggest phrases to include in emails to avoid sounding passive-aggressive. 
 *
 * - suggestPhrases - A function that handles the email phrases suggestion process.
 * - SuggestPhrasesInput - The input type for the suggestPhrases function.
 * - SuggestPhrasesOutput - The return type for the suggestPhrases function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

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
  return suggestPhrasesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestPhrasesPrompt',
  input: {schema: SuggestPhrasesInputSchema},
  output: {schema: SuggestPhrasesOutputSchema},
  prompt: `You are an AI assistant that helps users write professional emails. You will suggest phrases to include in the email to avoid sounding passive-aggressive, and analyze the sentiment of the email.

Email Body: {{{emailBody}}}

Suggested Phrases:`, // output will be parsed into suggestedPhrases
});

const suggestPhrasesFlow = ai.defineFlow(
  {
    name: 'suggestPhrasesFlow',
    inputSchema: SuggestPhrasesInputSchema,
    outputSchema: SuggestPhrasesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
