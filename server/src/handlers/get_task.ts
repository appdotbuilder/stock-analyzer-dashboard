import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type GetTaskInput, type Task } from '../schema';
import { eq } from 'drizzle-orm';

export const getTask = async (input: GetTaskInput): Promise<Task | null> => {
  try {
    // Query for the task by ID
    const results = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, input.id))
      .execute();

    // Return null if task not found
    if (results.length === 0) {
      return null;
    }

    // Return the first (and only) result
    const task = results[0];
    return {
      ...task,
      created_at: task.created_at // Date already handled by Drizzle for timestamp columns
    };
  } catch (error) {
    console.error('Task retrieval failed:', error);
    throw error;
  }
};