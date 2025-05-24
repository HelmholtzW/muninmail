import type { Todo } from '@/lib/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function getTodos(): Promise<Todo[]> {
    try {
        const response = await fetch(`${API_BASE_URL}/todos`);
        if (!response.ok) {
            throw new Error(`Error fetching todos: ${response.statusText}`);
        }
        const todos: Todo[] = await response.json();
        // Sort by priority (high -> medium -> low) and then by task name
        return todos.sort((a: Todo, b: Todo) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
            const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;

            if (aPriority !== bPriority) {
                return bPriority - aPriority; // Higher priority first
            }

            return a.task.localeCompare(b.task); // Alphabetical by task name
        });
    } catch (error) {
        console.error("Failed to get todos:", error);
        return []; // Return empty array on error
    }
} 