
import type { Email } from '@/lib/types';
import { formatISO, subHours, subDays } from 'date-fns';

// Initialize with a default set of emails
let emails: Email[] = [
  {
    id: '1',
    sender: 'Alice Johnson <alice@example.com>',
    recipient: 'you@muninmail.com',
    subject: 'Project Update - Phoenix Initiative',
    body: 'Hi team,\n\nJust a quick update on the Phoenix project. We are on track to meet the Q3 deadline. I\'ve attached the latest progress report for your review. Please let me know if you have any feedback by EOD Friday.\n\nBest regards,\nAlice',
    timestamp: formatISO(subHours(new Date(), 2)),
    read: false,
    tags: ['important', 'respond'],
  },
  {
    id: '2',
    sender: 'Bob Williams <bob@example.com>',
    recipient: 'you@muninmail.com',
    subject: 'Lunch Meeting Next Week?',
    body: 'Hey,\n\nHope you\'re having a great week. Are you free for a lunch meeting sometime next week? I\'d love to discuss the new marketing strategy. Let me know what day and time works best for you.\n\nCheers,\nBob',
    timestamp: formatISO(subDays(new Date(), 1)),
    read: true,
    tags: ['meeting', 'todo'],
  },
  {
    id: '3',
    sender: 'MuninMail Support <support@muninmail.com>',
    recipient: 'you@muninmail.com',
    subject: 'Welcome to MuninMail!',
    body: 'Dear User,\n\nWelcome to MuninMail! We\'re thrilled to have you on board. Explore our features and enjoy a cleaner, more focused email experience.\nIf you have any questions, don\'t hesitate to reach out to our support team.\n\nHappy emailing!\n\nThe MuninMail Team',
    timestamp: formatISO(subDays(new Date(), 3)),
    read: false,
    // No tags for this one
  },
  {
    id: '4',
    sender: 'Carol White <carol@example.com>',
    recipient: 'you@muninmail.com',
    subject: 'Regarding your inquiry',
    body: 'Hello,\n\nThank you for reaching out. We have received your inquiry and will get back to you within 24-48 business hours.\n\nSincerely,\nCarol White\nCustomer Relations',
    timestamp: formatISO(subHours(new Date(), 5)),
    read: false,
    tags: ['follow-up'],
  },
  {
    id: '5',
    sender: 'Internal Announcements <announce@muninmail.com>',
    recipient: 'you@muninmail.com',
    subject: 'System Maintenance Notification',
    body: 'Dear Users,\n\nPlease be advised that we will be performing scheduled system maintenance on Sunday from 2:00 AM to 4:00 AM. During this time, MuninMail services may be temporarily unavailable.\n\nWe apologize for any inconvenience.\n\nMuninMail Operations',
    timestamp: formatISO(subDays(new Date(), 2)),
    read: true,
    tags: ['info'],
  },
];

export async function getEmails(): Promise<Email[]> {
  // Sort by timestamp, newest first
  return [...emails].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export async function getEmailById(id: string): Promise<Email | undefined> {
  const email = emails.find(e => e.id === id);
  if (email && !email.read) {
    // Simulate marking as read by updating the in-memory store
    // In a real app, this would be a database update.
    const emailIndex = emails.findIndex(e => e.id === id);
    if (emailIndex !== -1) {
      emails[emailIndex] = { ...emails[emailIndex], read: true };
    }
  }
  return email ? {...email} : undefined; // Return a copy
}

export async function sendEmail(data: { sender: string; recipient: string; subject: string; body: string }): Promise<Email> {
  const newEmail: Email = {
    id: String(Date.now() + Math.random().toString(36).substring(2, 9)), // More unique ID
    ...data,
    timestamp: formatISO(new Date()),
    read: data.sender === 'you@muninmail.com', // Mark as read if sending from self (appears in sent, typically)
    tags: [], // Sent emails start with no tags by default
  };
  emails.unshift(newEmail); // Add to the beginning of the list
  return newEmail;
}
