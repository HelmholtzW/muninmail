// Email sentiment analyzer flow.

'use server';
/**
 * @fileOverview An email sentiment analysis AI agent.
 *
 * - analyzeEmailSentiment - A function that handles the email sentiment analysis process.
 * - AnalyzeEmailSentimentInput - The input type for the analyzeEmailSentiment function.
 * - AnalyzeEmailSentimentOutput - The return type for the analyzeEmailSentiment function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeEmailSentimentInputSchema = z.object({
  emailBody: z.string().describe('The body of the email to analyze.'),
});
export type AnalyzeEmailSentimentInput = z.infer<
  typeof AnalyzeEmailSentimentInputSchema
>;

const AnalyzeEmailSentimentOutputSchema = z.object({
  sentiment: z
    .string()
    .describe(
      'The overall sentiment of the email, e.g., positive, negative, neutral.'
    ),
  score: z
    .number()
    .describe(
      'A numerical score representing the sentiment, ranging from -1 (negative) to 1 (positive).'
    ),
  analysis: z.string().describe('A more detailed analysis of the email sentiment.'),
});
export type AnalyzeEmailSentimentOutput = z.infer<
  typeof AnalyzeEmailSentimentOutputSchema
>;

export async function analyzeEmailSentiment(
  input: AnalyzeEmailSentimentInput
): Promise<AnalyzeEmailSentimentOutput> {
  return analyzeEmailSentimentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeEmailSentimentPrompt',
  input: {schema: AnalyzeEmailSentimentInputSchema},
  output: {schema: AnalyzeEmailSentimentOutputSchema},
  prompt: `You are an AI assistant that analyzes the sentiment of emails.

  Analyze the following email body and provide a sentiment analysis, a sentiment score, and a detailed analysis.

  Email Body: {{{emailBody}}}

  Ensure the sentiment is one of: positive, negative, neutral.
  The score should range from -1 (negative) to 1 (positive).
  The analysis should briefly explain the reasoning behind the sentiment.
  `,
});

const analyzeEmailSentimentFlow = ai.defineFlow(
  {
    name: 'analyzeEmailSentimentFlow',
    inputSchema: AnalyzeEmailSentimentInputSchema,
    outputSchema: AnalyzeEmailSentimentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
