'use server';
/**
 * @fileOverview A chat flow for interacting with an AI email assistant.
 *
 * - chatWithEmailAssistant - A function that handles the chat interaction.
 * - EmailChatInput - The input type for the chatWithEmailAssistant function.
 * - EmailChatOutput - The return type for the chatWithEmailAssistant function.
 */

import { openai, DEFAULT_MODEL } from '@/ai/client';
import { z } from 'zod';

const ChatMessageSchema = z.object({
  sender: z.enum(['user', 'ai']).describe('Who sent the message'),
  text: z.string().describe('The message content'),
  timestamp: z.string().describe('When the message was sent (ISO string)'),
});

const EmailChatInputSchema = z.object({
  userInput: z.string().describe('The user_s message to the email assistant.'),
  messageHistory: z.array(ChatMessageSchema).optional().describe('Previous conversation history'),
});
export type EmailChatInput = z.infer<typeof EmailChatInputSchema>;

const EmailChatOutputSchema = z.object({
  aiResponse: z.string().describe('The AI assistant_s response.'),
});
export type EmailChatOutput = z.infer<typeof EmailChatOutputSchema>;

export async function chatWithEmailAssistant(input: EmailChatInput): Promise<EmailChatOutput> {
  // Validate input
  const validatedInput = EmailChatInputSchema.parse(input);

  const systemPrompt = `You are Munin, a friendly and helpful AI assistant embedded within the MuninMail email client.
Your primary role is to assist users with tasks related to their emails. This includes:
- Answering general questions about email management best practices.
- Helping users draft or refine email content.
- Summarizing text if the user provides it in the chat.
- Offering suggestions for email organization.

Keep your responses concise, professional, and directly relevant to the user's query.
If a user asks for actions you cannot perform (like accessing their live email data without it being provided in the prompt, or sending emails for them), politely explain your limitations and offer to help in ways you can (e.g., "I can help you draft that reply if you give me the main points.").`;

  try {
    // Build conversation messages including history
    const messages: Array<{ role: 'system' | 'user' | 'assistant', content: string }> = [
      { role: 'system', content: systemPrompt }
    ];

    // Add conversation history if provided
    if (validatedInput.messageHistory && validatedInput.messageHistory.length > 0) {
      for (const historyMessage of validatedInput.messageHistory) {
        messages.push({
          role: historyMessage.sender === 'user' ? 'user' : 'assistant',
          content: historyMessage.text
        });
      }
    }

    // Add the current user message
    messages.push({
      role: 'user',
      content: validatedInput.userInput
    });

    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages,
      max_tokens: 500,
      temperature: 0.7,
    });

    const aiResponse = response.choices[0]?.message?.content;
    
    if (!aiResponse) {
      console.error('AI response was empty for input:', validatedInput);
      return { 
        aiResponse: "I'm sorry, I encountered an issue processing your request. Could you please try rephrasing or ask something else?" 
      };
    }

    const result = { aiResponse };
    // Validate output
    return EmailChatOutputSchema.parse(result);
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    return { 
      aiResponse: "I'm sorry, I encountered an issue processing your request. Could you please try rephrasing or ask something else?" 
    };
  }
}
