
import { getEmailById, getEmails } from '@/lib/email-service';
import { EmailDetail } from '@/components/emails/email-detail';
import { EmailList } from '@/components/emails/email-list';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import Link from 'next/link'; // For back button on mobile
import { Button } from '@/components/ui/button'; // For back button on mobile


export const dynamic = 'force-dynamic';

interface EmailPageProps {
  params: {
    emailId: string;
  };
}

export default async function SelectedEmailPage({ params }: EmailPageProps) {
  const { emailId } = params;
  const allEmails = await getEmails();
  const selectedEmail = await getEmailById(emailId);

  return (
    <div className="flex h-full">
      {/* Left Column: Email List - Potentially hidden on mobile if an email is selected, to show detail full-width */}
      <div className="w-full md:w-1/3 border-r flex-col bg-card hidden md:flex md:mr-6"> {/* hidden on mobile, flex on md+, Added md:mr-6 */}
        <div className="p-4 md:p-6 border-b shrink-0"> {/* Adjusted padding for vertical alignment */}
          <h2 className="text-xl font-semibold text-card-foreground">Inbox</h2>
        </div>
        <div className="overflow-y-auto flex-grow">
          <div className="p-4 md:p-6"> {/* Adjusted padding for list container */}
            <EmailList emails={allEmails} selectedEmailId={emailId} />
          </div>
        </div>
      </div>

      {/* Right Column: Email Detail or Error Message */}
      <div className="w-full md:w-2/3 flex flex-col"> {/* Takes full width on mobile, 2/3 on md+ */}
        {/* Back button for mobile view */}
        <div className="md:hidden p-2 border-b bg-card">
             <Button asChild variant="outline" size="sm">
              <Link href="/inbox">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Inbox
              </Link>
            </Button>
        </div>
        {/* Container for EmailDetail, removed p-4 md:p-6 to allow Card's own padding to align */}
        <div className="overflow-y-auto flex-grow"> 
          {selectedEmail ? (
            <EmailDetail email={selectedEmail} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <Card className="w-full max-w-md shadow-lg rounded-lg">
                <CardHeader className="items-center text-center">
                  <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
                  <CardTitle className="text-2xl">Email Not Found</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-muted-foreground">The email (ID: {emailId}) was not found.</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
