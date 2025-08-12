import { type UpdateTaskInput, type Task } from '../schema';

export async function updateTask(input: UpdateTaskInput): Promise<Task> {
    // This is a placeholder declaration! Real code should be implemented here.
    // The goal of this handler is updating an existing task in the database.
    // Should handle partial updates (only update provided fields).
    // This is commonly used for marking tasks as complete/incomplete.
    return Promise.resolve({
        id: input.id,
        title: "Updated Task", // Placeholder
        description: null,
        completed: input.completed ?? false,
        created_at: new Date()
    } as Task);
}