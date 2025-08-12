import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type Task } from '../schema';
import { asc, desc } from 'drizzle-orm';

export const getTasks = async (): Promise<Task[]> => {
  try {
    // Fetch all tasks ordered by completion status (incomplete first) and creation date (newest first)
    const results = await db.select()
      .from(tasksTable)
      .orderBy(
        asc(tasksTable.completed), // false comes before true (incomplete first)
        desc(tasksTable.created_at) // newest tasks first within each completion group
      )
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch tasks:', error);
    throw error;
  }
};