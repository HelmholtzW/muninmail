import type { Email } from '@/lib/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function getEmails(): Promise<Email[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/emails`);
    if (!response.ok) {
      throw new Error(`Error fetching emails: ${response.statusText}`);
    }
    const data = await response.json();
    // Extract emails array from the response object
    const emails: Email[] = data.emails || [];
    // Sort by timestamp, newest first (if backend doesn't sort)
    return emails.sort((a: Email, b: Email) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (error) {
    console.error("Failed to get emails:", error);
    return []; // Return empty array on error or handle appropriately
  }
}

export async function getEmailById(id: string): Promise<Email | undefined> {
  try {
    const response = await fetch(`${API_BASE_URL}/emails/${id}`);
    if (!response.ok) {
      if (response.status === 404) {
        return undefined;
      }
      throw new Error(`Error fetching email ${id}: ${response.statusText}`);
    }
    const email: Email = await response.json();
    // The backend should ideally handle marking as read or provide a separate endpoint.
    // The previous local marking logic is removed.
    return email;
  } catch (error) {
    console.error(`Failed to get email by ID ${id}:`, error);
    return undefined; // Return undefined on error
  }
}

export async function sendEmail(data: { sender: string; recipient: string; subject: string; body: string }): Promise<Email> {
  try {
    const response = await fetch(`${API_BASE_URL}/send_email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`Error sending email: ${response.statusText}`);
    }
    const newEmail: Email = await response.json();
    // Backend is expected to generate id, timestamp, read status, tags, etc.
    return newEmail;
  } catch (error) {
    console.error("Failed to send email:", error);
    // Re-throw or handle as appropriate for your application
    // For now, re-throwing to make it clear to the caller that sending failed.
    // You might want to return a specific error object or null.
    throw error;
  }
}
