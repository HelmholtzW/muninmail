
'use server';
/**
 * @fileOverview A chat flow for interacting with an AI email assistant.
 *
 * - chatWithEmailAssistant - A function that handles the chat interaction.
 * - EmailChatInput - The input type for the chatWithEmailAssistant function.
 * - EmailChatOutput - The return type for the chatWithEmailAssistant function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EmailChatInputSchema = z.object({
  userInput: z.string().describe('The user_s message to the email assistant.'),
  // TODO: Consider adding chat history or current email context for more advanced interactions
});
export type EmailChatInput = z.infer<typeof EmailChatInputSchema>;

const EmailChatOutputSchema = z.object({
  aiResponse: z.string().describe('The AI assistant_s response.'),
});
export type EmailChatOutput = z.infer<typeof EmailChatOutputSchema>;

export async function chatWithEmailAssistant(input: EmailChatInput): Promise<EmailChatOutput> {
  return emailChatAssistantFlow(input);
}

const chatPrompt = ai.definePrompt({
  name: 'emailChatPrompt',
  input: {schema: EmailChatInputSchema},
  output: {schema: EmailChatOutputSchema},
  prompt: `You are Munin, a friendly and helpful AI assistant embedded within the MuninMail email client.
Your primary role is to assist users with tasks related to their emails. This includes:
- Answering general questions about email management best practices.
- Helping users draft or refine email content.
- Summarizing text if the user provides it in the chat.
- Offering suggestions for email organization.

Keep your responses concise, professional, and directly relevant to the user's query.
If a user asks for actions you cannot perform (like accessing their live email data without it being provided in the prompt, or sending emails for them), politely explain your limitations and offer to help in ways you can (e.g., "I can help you draft that reply if you give me the main points.").

User's query: {{{userInput}}}

Assistant's response:`,
});

const emailChatAssistantFlow = ai.defineFlow(
  {
    name: 'emailChatAssistantFlow',
    inputSchema: EmailChatInputSchema,
    outputSchema: EmailChatOutputSchema,
  },
  async (input) => {
    // In a more advanced scenario, you might fetch chat history or relevant email data here
    // and include it in the prompt input.

    const {output} = await chatPrompt(input);
    
    if (!output || !output.aiResponse) {
      // This case should ideally be rare due to Zod schema validation on output.
      // However, if the LLM fails to produce a structured response or an empty one.
      console.error('AI response was empty or not matching schema for input:', input);
      return { aiResponse: "I'm sorry, I encountered an issue processing your request. Could you please try rephrasing or ask something else?" };
    }
    return output;
  }
);
