// Email sentiment analyzer flow.

'use server';
/**
 * @fileOverview An email sentiment analysis AI service.
 *
 * - analyzeEmailSentiment - A function that handles the email sentiment analysis process.
 * - AnalyzeEmailSentimentInput - The input type for the analyzeEmailSentiment function.
 * - AnalyzeEmailSentimentOutput - The return type for the analyzeEmailSentiment function.
 */

import { generateStructuredResponse } from '@/ai/client';
import { z } from 'zod';

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
  // Validate input
  const validatedInput = AnalyzeEmailSentimentInputSchema.parse(input);

  const systemPrompt = `You are an AI assistant that analyzes the sentiment of emails.

Analyze the provided email body and provide a sentiment analysis, a sentiment score, and a detailed analysis.

Ensure the sentiment is one of: positive, negative, neutral.
The score should range from -1 (negative) to 1 (positive).
The analysis should briefly explain the reasoning behind the sentiment.`;

  const userPrompt = `Email Body: ${validatedInput.emailBody}`;

  const schema = {
    name: 'analyze_email_sentiment',
    description: 'Analyze the sentiment of an email',
    parameters: {
      type: 'object',
      properties: {
        sentiment: {
          type: 'string',
          description: 'The overall sentiment of the email (positive, negative, or neutral)',
          enum: ['positive', 'negative', 'neutral']
        },
        score: {
          type: 'number',
          description: 'A numerical score representing the sentiment, ranging from -1 (negative) to 1 (positive)',
          minimum: -1,
          maximum: 1
        },
        analysis: {
          type: 'string',
          description: 'A detailed analysis of the email sentiment'
        }
      },
      required: ['sentiment', 'score', 'analysis']
    }
  };

  const result = await generateStructuredResponse<AnalyzeEmailSentimentOutput>(
    systemPrompt,
    userPrompt,
    schema
  );

  // Validate output
  return AnalyzeEmailSentimentOutputSchema.parse(result);
}
