
'use server';
import { sendEmail as sendEmailService } from '@/lib/email-service';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const SendEmailSchema = z.object({
  recipient: z.string().email({ message: "Invalid email address." }),
  subject: z.string().min(1, { message: "Subject cannot be empty." }),
  body: z.string().min(1, { message: "Email body cannot be empty." }),
});

export interface SendEmailFormState {
  message: string;
  errors?: {
    recipient?: string[];
    subject?: string[];
    body?: string[];
    general?: string[];
  };
  success: boolean;
}

export async function handleSendEmail(
  prevState: SendEmailFormState,
  formData: FormData
): Promise<SendEmailFormState> {
  const validatedFields = SendEmailSchema.safeParse({
    recipient: formData.get('recipient'),
    subject: formData.get('subject'),
    body: formData.get('body'),
  });

  if (!validatedFields.success) {
    return {
      message: "Failed to send email. Please check the fields.",
      errors: validatedFields.error.flatten().fieldErrors,
      success: false,
    };
  }

  try {
    await sendEmailService({
      sender: 'you@muninmail.com', // Assuming 'you' are the sender
      recipient: validatedFields.data.recipient,
      subject: validatedFields.data.subject,
      body: validatedFields.data.body,
    });
    revalidatePath('/inbox');
    // Instead of returning a success message that requires client-side handling for redirect,
    // we can redirect directly from the server action after success.
    // The client will show a toast based on its own logic or if this redirect is caught.
    // For a cleaner UX, redirect is often preferred after successful form submission.
  } catch (error) {
    return {
      message: 'Server error: Failed to send email.',
      success: false,
      errors: { general: ['An unexpected error occurred.'] }
    };
  }
  // If successful, redirect to inbox.
  // Note: `redirect` must be called outside of a try/catch block if it throws an error.
  redirect('/inbox?sent=true'); // Add a query param to potentially show a success message on inbox page
}
