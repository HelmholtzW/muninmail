
import type { Email } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge'; // Import Badge
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';

interface EmailDetailProps {
  email: Email;
}

export function EmailDetail({ email }: EmailDetailProps) {
  return (
    <Card className="shadow-lg rounded-lg">
      <CardHeader className="border-b">
        <CardTitle className="text-2xl font-bold">{email.subject}</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          From: {email.sender} <br />
          To: {email.recipient} <br />
          Date: {format(new Date(email.timestamp), "PPPp")}
          {email.tags && email.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {email.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag.charAt(0).toUpperCase() + tag.slice(1)}
                </Badge>
              ))}
            </div>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap break-words">
          {email.body}
        </div>
      </CardContent>
    </Card>
  );
}
