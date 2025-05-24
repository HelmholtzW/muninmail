"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ListTodo, PanelRightClose, PanelRightOpen, Clock, AlertCircle, Circle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getTodos } from '@/lib/todo-service';
import type { Todo } from '@/lib/types';

export function TodosPanel() {
  const [isOpen, setIsOpen] = useState(true);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTodos = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const fetchedTodos = await getTodos();
      setTodos(fetchedTodos);
    } catch (err) {
      setError('Failed to load todos');
      console.error('Error fetching todos:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  const getPriorityIcon = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return <AlertCircle className="h-3 w-3 text-red-500" />;
      case 'medium':
        return <Circle className="h-3 w-3 text-yellow-500 fill-current" />;
      case 'low':
        return <Circle className="h-3 w-3 text-green-500" />;
      default:
        return <Circle className="h-3 w-3 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'border-l-red-500';
      case 'medium':
        return 'border-l-yellow-500';
      case 'low':
        return 'border-l-green-500';
      default:
        return 'border-l-gray-500';
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col bg-card border-l h-full transition-all duration-300 ease-in-out shrink-0",
        isOpen ? "w-72" : "w-[4.5rem]"
      )}
    >
      {isOpen ? (
        <>
          <CardHeader className="py-3 px-4 border-b flex flex-row items-center justify-between shrink-0">
            <div className="flex items-center text-lg text-card-foreground">
              <ListTodo className="mr-2 h-5 w-5 text-primary" />
              <span className="font-semibold">Todos</span>
              {todos.length > 0 && (
                <span className="ml-2 text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5">
                  {todos.length}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={fetchTodos}
                disabled={isLoading}
                aria-label="Refresh Todos"
                className="h-8 w-8"
              >
                <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} aria-label="Close Todos Panel">
                <PanelRightClose className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-3">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : error ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-red-500">{error}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchTodos}
                      className="mt-2"
                    >
                      Try Again
                    </Button>
                  </div>
                ) : todos.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">No todos found.</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Process some emails to generate todos.
                    </p>
                  </div>
                ) : (
                  todos.map((todo, index) => (
                    <div
                      key={index}
                      className={cn(
                        "p-3 rounded-lg border bg-background shadow-sm border-l-4 transition-colors hover:bg-muted/50",
                        getPriorityColor(todo.priority)
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {getPriorityIcon(todo.priority)}
                            <span className="text-xs font-medium text-muted-foreground uppercase">
                              {todo.priority}
                            </span>
                          </div>
                          <p className="font-medium text-sm leading-tight break-words">
                            {todo.task}
                          </p>
                          {todo.due_date && (
                            <div className="flex items-center gap-1 mt-2">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              <p className="text-xs text-muted-foreground">
                                Due: {todo.due_date}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
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
            className="flex flex-col h-auto p-2 w-full relative"
          >
            <PanelRightOpen className="h-6 w-6 text-primary mb-1" />
            <span className="text-xs">Todos</span>
            {todos.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {todos.length > 99 ? '99+' : todos.length}
              </span>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
