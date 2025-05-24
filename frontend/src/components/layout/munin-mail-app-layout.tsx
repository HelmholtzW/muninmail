
import type { ReactNode } from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppHeader } from './app-header';
import { AppSidebar } from './app-sidebar';
import { Toaster } from "@/components/ui/toaster";
import { ChatPanel } from '@/components/chat/chat-panel';
import { TodosPanel } from '@/components/todos/todos-panel'; // Import TodosPanel

export function MuninMailAppLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      {/* This div creates the main horizontal layout: (Central Content + Chat) | TodosPanel */}
      <div className="flex flex-1 h-screen max-h-screen overflow-hidden">
        
        {/* This div is the Central Column: Header, Main Content (SidebarInset), Chat Panel */}
        <div className="flex flex-col flex-1 min-w-0"> {/* Added min-w-0 to prevent flex item from growing too large and pushing out TodosPanel */}
          <AppHeader />
          <SidebarInset className="flex-1 overflow-y-auto bg-background">
            <main className="flex-1 p-4 md:p-6 lg:p-8">
              {children}
            </main>
          </SidebarInset>
          <ChatPanel /> {/* Chat panel manages its own collapse state */}
        </div>

        {/* This is the Right Column: Todos Panel */}
        <TodosPanel /> {/* Todos panel manages its own open/close state */}
      
      </div>
      <Toaster />
    </SidebarProvider>
  );
}
