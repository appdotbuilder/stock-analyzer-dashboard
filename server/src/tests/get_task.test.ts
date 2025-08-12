import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type GetTaskInput, type CreateTaskInput } from '../schema';
import { getTask } from '../handlers/get_task';
import { eq } from 'drizzle-orm';

// Test input
const testInput: GetTaskInput = {
  id: 1
};

// Helper to create a test task
const createTestTask = async (): Promise<number> => {
  const taskInput: CreateTaskInput = {
    title: 'Test Task',
    description: 'A task for testing'
  };

  const result = await db.insert(tasksTable)
    .values({
      title: taskInput.title,
      description: taskInput.description
    })
    .returning()
    .execute();

  return result[0].id;
};

describe('getTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return a task when it exists', async () => {
    // Create a test task first
    const taskId = await createTestTask();

    const result = await getTask({ id: taskId });

    // Verify task is returned with correct data
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(taskId);
    expect(result!.title).toEqual('Test Task');
    expect(result!.description).toEqual('A task for testing');
    expect(result!.completed).toEqual(false); // Default value
    expect(result!.created_at).toBeInstanceOf(Date);
  });

  it('should return null when task does not exist', async () => {
    const result = await getTask({ id: 999 });

    expect(result).toBeNull();
  });

  it('should handle task with null description', async () => {
    // Create task with null description
    const result = await db.insert(tasksTable)
      .values({
        title: 'Task without description',
        description: null
      })
      .returning()
      .execute();

    const taskId = result[0].id;
    const task = await getTask({ id: taskId });

    expect(task).not.toBeNull();
    expect(task!.title).toEqual('Task without description');
    expect(task!.description).toBeNull();
  });

  it('should handle completed task correctly', async () => {
    // Create a completed task
    const result = await db.insert(tasksTable)
      .values({
        title: 'Completed Task',
        description: 'This task is done',
        completed: true
      })
      .returning()
      .execute();

    const taskId = result[0].id;
    const task = await getTask({ id: taskId });

    expect(task).not.toBeNull();
    expect(task!.title).toEqual('Completed Task');
    expect(task!.completed).toEqual(true);
  });

  it('should return correct data types', async () => {
    const taskId = await createTestTask();
    const result = await getTask({ id: taskId });

    expect(result).not.toBeNull();
    expect(typeof result!.id).toBe('number');
    expect(typeof result!.title).toBe('string');
    expect(typeof result!.completed).toBe('boolean');
    expect(result!.created_at).toBeInstanceOf(Date);
    
    // Description can be string or null
    expect(
      typeof result!.description === 'string' || result!.description === null
    ).toBe(true);
  });

  it('should verify task exists in database after retrieval', async () => {
    const taskId = await createTestTask();
    const retrievedTask = await getTask({ id: taskId });

    // Verify by querying database directly
    const dbTasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskId))
      .execute();

    expect(dbTasks).toHaveLength(1);
    expect(retrievedTask!.id).toEqual(dbTasks[0].id);
    expect(retrievedTask!.title).toEqual(dbTasks[0].title);
    expect(retrievedTask!.description).toEqual(dbTasks[0].description);
    expect(retrievedTask!.completed).toEqual(dbTasks[0].completed);
  });
});