
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card'; // Removed CardTitle as we'll use span
import { ScrollArea } from '@/components/ui/scroll-area';
import { ListTodo, PanelRightClose, PanelRightOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

export function TodosPanel() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div
      className={cn(
        "flex flex-col bg-card border-l h-full transition-all duration-300 ease-in-out shrink-0", // Added shrink-0
        isOpen ? "w-72" : "w-[4.5rem]"
      )}
    >
      {isOpen ? (
        <>
          <CardHeader className="py-3 px-4 border-b flex flex-row items-center justify-between shrink-0">
            <div className="flex items-center text-lg text-card-foreground">
              <ListTodo className="mr-2 h-5 w-5 text-primary" />
              <span className="font-semibold">Todos</span>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} aria-label="Close Todos Panel">
              <PanelRightClose className="h-5 w-5" />
            </Button>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-3">
                <p className="text-sm text-muted-foreground">Your tasks will appear here.</p>
                <div className="p-3 rounded-lg border bg-background shadow-sm">
                  <p className="font-medium text-sm">Follow up with Alice</p>
                  <p className="text-xs text-muted-foreground">Regarding Phoenix Project</p>
                </div>
                <div className="p-3 rounded-lg border bg-background shadow-sm">
                  <p className="font-medium text-sm">Prepare Q3 report</p>
                  <p className="text-xs text-muted-foreground">Due: Next Friday</p>
                </div>
                 <div className="p-3 rounded-lg border bg-background shadow-sm">
                  <p className="font-medium text-sm">Review marketing proposal</p>
                  <p className="text-xs text-muted-foreground">Sent by Bob</p>
                </div>
              </div>
            </ScrollArea>
          </CardContent>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-full p-2">
          <Button
            variant="ghost"
            size="lg"
            onClick={() => setIsOpen(true)}
            aria-label="Open Todos Panel"
            className="flex flex-col h-auto p-2 w-full"
          >
            <PanelRightOpen className="h-6 w-6 text-primary mb-1" />
            <span className="text-xs">Todos</span>
          </Button>
        </div>
      )}
    </div>
  );
}
