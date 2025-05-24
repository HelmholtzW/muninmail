
export interface Email {
  id: string;
  sender: string;
  recipient: string;
  subject: string;
  body: string;
  timestamp: string; // ISO string
  read: boolean;
  tags?: string[]; // Added tags field
}

export interface SuggestedPhraseItem {
  phrase: string;
}

export interface SentimentAnalysisResult {
  sentiment: string;
  score: number;
  analysis: string;
}
