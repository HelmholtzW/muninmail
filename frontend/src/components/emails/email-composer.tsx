
"use client";

import { useState, useEffect } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { handleSendEmail, type SendEmailFormState } from '@/app/actions';
import { analyzeEmailSentiment, type AnalyzeEmailSentimentOutput } from '@/ai/flows/email-sentiment-analysis';
import { suggestPhrases, type SuggestPhrasesOutput } from '@/ai/flows/suggest-phrases';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Sparkles, AlertTriangle, Info, MessageSquareQuote, SendHorizonal } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";


function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <SendHorizonal className="mr-2 h-4 w-4" />}
      Send Email
    </Button>
  );
}

export function EmailComposer() {
  const { toast } = useToast();
  const initialState: SendEmailFormState = { message: '', success: false };
  const [formState, formAction] = useFormState(handleSendEmail, initialState);
  
  const [emailBody, setEmailBody] = useState('');
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');

  const [sentimentResult, setSentimentResult] = useState<AnalyzeEmailSentimentOutput | null>(null);
  const [suggestedPhrasesResult, setSuggestedPhrasesResult] = useState<SuggestPhrasesOutput | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    if (formState.message) {
      if (formState.success) {
        // Redirect is handled by server action. Client-side toast might be redundant or for non-redirect scenarios.
        // toast({ title: "Success", description: formState.message, variant: "default" });
        // Reset form fields (optional, as redirect clears context)
        // setRecipient(''); setSubject(''); setEmailBody('');
        // setSentimentResult(null); setSuggestedPhrasesResult(null);
      } else if (formState.errors || formState.message) {
         toast({
          title: "Error",
          description: formState.message || "An error occurred.",
          variant: "destructive",
        });
      }
    }
  }, [formState, toast]);


  const handleAnalyzeDraft = async () => {
    if (!emailBody.trim()) {
      setAiError("Email body cannot be empty to analyze.");
      setSentimentResult(null);
      setSuggestedPhrasesResult(null);
      return;
    }
    setIsAiLoading(true);
    setAiError(null);
    setSentimentResult(null);
    setSuggestedPhrasesResult(null);

    try {
      const [sentiment, phrases] = await Promise.all([
        analyzeEmailSentiment({ emailBody }),
        suggestPhrases({ emailBody })
      ]);
      setSentimentResult(sentiment);
      setSuggestedPhrasesResult(phrases);
    } catch (error) {
      console.error("AI analysis failed:", error);
      setAiError("Failed to analyze draft. Please try again.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const getSentimentScoreColor = (score: number) => {
    if (score < -0.33) return 'text-red-500'; // Negative
    if (score > 0.33) return 'text-green-500'; // Positive
    return 'text-yellow-500'; // Neutral
  };
  
  const getSentimentProgressValue = (score: number) => {
    // Convert score from -1 to 1 range to 0 to 100 range
    return (score + 1) * 50;
  };


  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl rounded-lg">
      <CardHeader className="border-b">
        <CardTitle className="text-2xl font-bold">Compose New Email</CardTitle>
        <CardDescription>Craft your message and use AI tools to enhance it.</CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="recipient">To</Label>
            <Input 
              id="recipient" 
              name="recipient" 
              type="email" 
              placeholder="recipient@example.com" 
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              required 
            />
            {formState.errors?.recipient && <p className="text-sm text-destructive">{formState.errors.recipient.join(', ')}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input 
              id="subject" 
              name="subject" 
              placeholder="Email Subject" 
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required 
            />
            {formState.errors?.subject && <p className="text-sm text-destructive">{formState.errors.subject.join(', ')}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="body">Body</Label>
            <Textarea
              id="body"
              name="body"
              placeholder="Write your email here..."
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
              rows={10}
              required
              className="min-h-[200px]"
            />
            {formState.errors?.body && <p className="text-sm text-destructive">{formState.errors.body.join(', ')}</p>}
          </div>

          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-lg font-semibold flex items-center text-foreground">
              <Sparkles className="mr-2 h-5 w-5 text-primary" />
              AI Writing Assistant
            </h3>
            <Button type="button" variant="outline" onClick={handleAnalyzeDraft} disabled={isAiLoading || !emailBody.trim()} className="w-full sm:w-auto">
              {isAiLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Analyze Draft
            </Button>

            {aiError && (
              <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm flex items-start">
                <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
                <span>{aiError}</span>
              </div>
            )}

            {isAiLoading && <p className="text-sm text-muted-foreground flex items-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analyzing your draft...</p>}

            {sentimentResult && (
              <Card className="bg-card/50">
                <CardHeader>
                  <CardTitle className="text-md flex items-center">
                    <Info className="mr-2 h-5 w-5 text-primary" />
                    Sentiment Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Overall Sentiment:</span>
                    <span className={`font-semibold ${getSentimentScoreColor(sentimentResult.score)}`}>
                      {sentimentResult.sentiment} (Score: {sentimentResult.score.toFixed(2)})
                    </span>
                  </div>
                  <Progress value={getSentimentProgressValue(sentimentResult.score)} className="h-2 [&>div]:bg-gradient-to-r [&>div]:from-red-500 [&>div]:via-yellow-500 [&>div]:to-green-500" />
                  <p className="text-sm text-muted-foreground pt-1"><span className="font-medium text-foreground">Details:</span> {sentimentResult.analysis}</p>
                </CardContent>
              </Card>
            )}

            {suggestedPhrasesResult && suggestedPhrasesResult.suggestedPhrases.length > 0 && (
              <Card className="bg-card/50">
                <CardHeader>
                  <CardTitle className="text-md flex items-center">
                    <MessageSquareQuote className="mr-2 h-5 w-5 text-primary" />
                    Suggested Phrases
                  </CardTitle>
                  <CardDescription>Consider using these phrases to improve clarity or tone.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    {suggestedPhrasesResult.suggestedPhrases.map((phrase, index) => (
                      <li key={index}>{phrase}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
        <CardFooter className="p-6 border-t">
          <SubmitButton />
        </CardFooter>
      </form>
    </Card>
  );
}
