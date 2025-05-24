"use client";

import { useState, useRef, useEffect, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Send, MessageSquare, User, Bot, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { chatWithEmailAssistant, type EmailChatOutput } from '@/ai/flows/email-chat-flow';
import { cn } from '@/lib/utils';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

export function ChatPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const scrollViewportRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollViewportRef.current) {
      scrollViewportRef.current.scrollTop = scrollViewportRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    if (isExpanded) {
      scrollToBottom();
    }
  }, [messages, isExpanded]);

  const handleClearConversation = () => {
    setMessages([]);
    setError(null);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      sender: 'user',
      text: inputValue.trim(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    try {
      // Convert current messages to the format expected by the AI function
      const messageHistory = messages.map(msg => ({
        sender: msg.sender,
        text: msg.text,
        timestamp: msg.timestamp.toISOString()
      }));

      const aiResponse: EmailChatOutput = await chatWithEmailAssistant({
        userInput: userMessage.text,
        messageHistory
      });

      const aiMessage: ChatMessage = {
        id: crypto.randomUUID(),
        sender: 'ai',
        text: aiResponse.aiResponse,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      console.error("Chat API error:", err);
      const errorMessageText = "Sorry, I couldn't get a response. Please try again.";
      setError(errorMessageText);
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        sender: 'ai',
        text: errorMessageText,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className={cn(
      "w-full shadow-xl rounded-none border-t flex flex-col bg-card transition-all duration-300 ease-in-out",
      isExpanded ? "h-80" : "h-auto"
    )}>
      <CardHeader className="py-3 px-4 border-b flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center text-card-foreground">
          <MessageSquare className="mr-2 h-5 w-5 text-primary" />
          AI Email Assistant
        </CardTitle>
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClearConversation}
              aria-label="Clear conversation"
              className="h-8 w-8"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={() => setIsExpanded(!isExpanded)} aria-label={isExpanded ? "Collapse Chat" : "Expand Chat"}>
            {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
          </Button>
        </div>
      </CardHeader>
      {isExpanded && (
        <>
          <CardContent className="flex-1 p-0 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-3" ref={scrollViewportRef}>
                {messages.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">Start a conversation with your AI email assistant</p>
                  </div>
                )}
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`p-3 rounded-lg max-w-[70%] shadow-sm break-words ${
                        msg.sender === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-background border'
                      }`}
                    >
                      <div className="flex items-center mb-1">
                        {msg.sender === 'user' ? <User className="h-4 w-4 mr-2 flex-shrink-0" /> : <Bot className="h-4 w-4 mr-2 flex-shrink-0" />}
                        <span className="text-xs font-medium">{msg.sender === 'user' ? 'You' : 'AI Assistant'}</span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                      <p className={`text-xs mt-1 ${msg.sender === 'user' ? 'text-primary-foreground/70 text-right' : 'text-muted-foreground text-left'}`}>
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="p-3 rounded-lg bg-background border shadow-sm">
                      <div className="flex items-center">
                        <Bot className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="text-xs font-medium">AI Assistant</span>
                      </div>
                      <Loader2 className="mt-2 h-5 w-5 animate-spin text-primary" />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
          <CardFooter className="p-3 border-t">
            <form onSubmit={handleSubmit} className="w-full flex items-center gap-2">
              <Input
                type="text"
                placeholder="Ask about your emails..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isLoading}
                className="flex-1"
                aria-label="Chat input"
              />
              <Button type="submit" disabled={isLoading || !inputValue.trim()} size="icon" aria-label="Send message">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
          </CardFooter>
        </>
      )}
    </Card>
  );
}
