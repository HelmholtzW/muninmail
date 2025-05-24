
import type { Email } from '@/lib/types';
import { EmailListItem } from './email-list-item';

interface EmailListProps {
  emails: Email[];
  selectedEmailId?: string;
}

export function EmailList({ emails, selectedEmailId }: EmailListProps) {
  if (emails.length === 0) {
    return (
      <div className="text-muted-foreground text-center py-10 px-4">
        Your inbox is empty.
      </div>
    );
  }

  return (
    // Removed space-y classes, item margins will handle spacing
    <div> 
      {emails.map((email) => (
        <EmailListItem key={email.id} email={email} isActive={email.id === selectedEmailId} />
      ))}
    </div>
  );
}
