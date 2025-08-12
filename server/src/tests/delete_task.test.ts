import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type DeleteTaskInput, type CreateTaskInput } from '../schema';
import { deleteTask } from '../handlers/delete_task';
import { eq } from 'drizzle-orm';

// Test input for deleting a task
const testDeleteInput: DeleteTaskInput = {
  id: 1
};

// Helper function to create a test task
const createTestTask = async (taskData: Omit<CreateTaskInput, 'id'> = {
  title: 'Test Task',
  description: 'A task for testing deletion'
}): Promise<number> => {
  const result = await db.insert(tasksTable)
    .values({
      title: taskData.title,
      description: taskData.description,
      completed: false
    })
    .returning()
    .execute();
  
  return result[0].id;
};

describe('deleteTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should successfully delete an existing task', async () => {
    // Create a task to delete
    const taskId = await createTestTask();
    
    // Delete the task
    const result = await deleteTask({ id: taskId });

    // Verify success
    expect(result.success).toBe(true);

    // Verify task was actually deleted from database
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskId))
      .execute();

    expect(tasks).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent task', async () => {
    // Try to delete a task that doesn't exist
    const result = await deleteTask({ id: 999 });

    // Should return success: false since no rows were affected
    expect(result.success).toBe(false);
  });

  it('should not affect other tasks when deleting specific task', async () => {
    // Create multiple tasks
    const taskId1 = await createTestTask({ title: 'Task 1', description: 'First task' });
    const taskId2 = await createTestTask({ title: 'Task 2', description: 'Second task' });
    const taskId3 = await createTestTask({ title: 'Task 3', description: 'Third task' });

    // Delete middle task
    const result = await deleteTask({ id: taskId2 });

    // Verify deletion was successful
    expect(result.success).toBe(true);

    // Verify other tasks still exist
    const remainingTasks = await db.select()
      .from(tasksTable)
      .execute();

    expect(remainingTasks).toHaveLength(2);
    
    const remainingIds = remainingTasks.map(task => task.id);
    expect(remainingIds).toContain(taskId1);
    expect(remainingIds).toContain(taskId3);
    expect(remainingIds).not.toContain(taskId2);
  });

  it('should delete tasks with different completion states', async () => {
    // Create completed task
    const completedTaskId = await db.insert(tasksTable)
      .values({
        title: 'Completed Task',
        description: 'This task is completed',
        completed: true
      })
      .returning()
      .execute()
      .then(result => result[0].id);

    // Delete completed task
    const result = await deleteTask({ id: completedTaskId });

    // Verify deletion was successful
    expect(result.success).toBe(true);

    // Verify task was deleted
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, completedTaskId))
      .execute();

    expect(tasks).toHaveLength(0);
  });

  it('should delete tasks with null descriptions', async () => {
    // Create task with null description
    const taskWithNullDesc = await db.insert(tasksTable)
      .values({
        title: 'Task with null description',
        description: null,
        completed: false
      })
      .returning()
      .execute()
      .then(result => result[0].id);

    // Delete the task
    const result = await deleteTask({ id: taskWithNullDesc });

    // Verify deletion was successful
    expect(result.success).toBe(true);

    // Verify task was deleted
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskWithNullDesc))
      .execute();

    expect(tasks).toHaveLength(0);
  });
});