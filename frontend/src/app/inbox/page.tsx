
import { getEmails } from '@/lib/email-service';
import { EmailList } from '@/components/emails/email-list';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, Inbox as InboxIcon } from 'lucide-react'; // Renamed Inbox to InboxIcon to avoid conflict

export const dynamic = 'force-dynamic';

export default async function InboxBasePage({ searchParams }: { searchParams?: { [key: string]: string | string[] | undefined } }) {
  const emails = await getEmails();
  const emailSent = searchParams?.sent === 'true';

  return (
    <div className="flex flex-col h-full"> {/* Ensures full height for children */}
      {emailSent && (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-900/30 dark:border-green-700 mb-2 mx-2 md:mx-0 shrink-0">
          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
          <AlertTitle className="text-green-700 dark:text-green-300">Success!</AlertTitle>
          <AlertDescription className="text-green-600 dark:text-green-400">
            Your email has been sent successfully.
          </AlertDescription>
        </Alert>
      )}
      {/* Changed to flex h-full to make columns take full height */}
      <div className="flex h-full">
        {/* Left Column: Email List */}
        <div className="w-full md:w-1/3 border-r flex flex-col bg-card md:mr-6"> {/* Added md:mr-6 */}
          <div className="p-4 md:p-6 border-b shrink-0"> {/* Adjusted padding for vertical alignment */}
            <h2 className="text-xl font-semibold text-card-foreground">Inbox</h2>
          </div>
          <div className="overflow-y-auto flex-grow">
            <div className="p-4 md:p-6"> {/* Adjusted padding for list container */}
              <EmailList emails={emails} /> {/* No selectedEmailId here */}
            </div>
          </div>
        </div>

        {/* Right Column: Placeholder for email content (hidden on small screens if an email is selected via URL) */}
        {/* On larger screens, this shows when no email is selected. */}
        <div className="hidden md:flex md:w-2/3 flex-col items-center justify-center p-10 bg-background">
          <Card className="w-full max-w-md shadow-lg rounded-lg">
            <CardHeader className="items-center text-center">
              <InboxIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <CardTitle className="text-2xl">Select an email to read</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground">Choose an email from the list on the left to view its content here.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
