
import Link from 'next/link';
import type { Email } from '@/lib/types';
import { cn } from '@/lib/utils';
import { formatDistanceToNowStrict } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge'; // Import Badge

interface EmailListItemProps {
  email: Email;
  isActive?: boolean;
}

export function EmailListItem({ email, isActive }: EmailListItemProps) {
  const timeAgo = formatDistanceToNowStrict(new Date(email.timestamp), { addSuffix: true });
  const senderName = email.sender.includes('<') ? email.sender.substring(0, email.sender.indexOf('<')).trim() : email.sender;

  return (
    <Link href={`/inbox/${email.id}`} className="block hover:no-underline" scroll={false}>
      <Card className={cn(
        "transition-all duration-150 ease-in-out mb-2 rounded-lg border", 
        email.read ? 'bg-card/70 dark:bg-card/90' : 'bg-card', 
        isActive 
          ? 'border-primary bg-primary/5 dark:bg-primary/20 shadow-md' 
          : 'hover:bg-accent/50 dark:hover:bg-accent/70 hover:shadow-md',
        !isActive && !email.read && "font-bold border-primary/30" 
      )}>
        <CardContent className="p-3 md:p-4">
          <div className="flex justify-between items-start gap-2 md:gap-3">
            <div className="flex-grow truncate">
              <h3 className={cn(
                "text-sm font-semibold truncate",
                isActive ? "text-primary" : "text-foreground",
                !email.read && !isActive && "font-bold"
              )}>
                {senderName}
              </h3>
              <p className={cn(
                "text-xs truncate", 
                isActive ? "text-primary/90" : "text-muted-foreground",
                !email.read && !isActive && "text-foreground/80"
              )}>
                {email.subject}
              </p>
            </div>
            <div className={cn(
              "flex-shrink-0 text-xs whitespace-nowrap",
              isActive ? "text-primary/80" : "text-muted-foreground",
              !email.read && !isActive && "text-foreground/70"
            )}>
              {timeAgo}
            </div>
          </div>
          <p className={cn(
            "mt-1 text-xs line-clamp-1 md:line-clamp-2",
            isActive ? "text-primary/80" : "text-muted-foreground",
            !email.read && !isActive && "text-foreground/70 opacity-90" ,
            email.read && !isActive && "opacity-70"
          )}>
            {email.body.replace(/(\r\n|\n|\r)/gm, " ").substring(0, 120)}
          </p>
          {email.tags && email.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1"> {/* Moved here, added mt-2 */}
              {email.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
