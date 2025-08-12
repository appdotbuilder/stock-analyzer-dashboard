import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type CreateTaskInput } from '../schema';
import { createTask } from '../handlers/create_task';
import { eq } from 'drizzle-orm';

// Test inputs with different scenarios
const basicTestInput: CreateTaskInput = {
  title: 'Test Task',
  description: 'A task for testing purposes'
};

const nullDescriptionInput: CreateTaskInput = {
  title: 'Task without description',
  description: null
};

const longTitleInput: CreateTaskInput = {
  title: 'This is a very long task title that should still work perfectly fine',
  description: 'Testing with longer content'
};

describe('createTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a task with description', async () => {
    const result = await createTask(basicTestInput);

    // Basic field validation
    expect(result.title).toEqual('Test Task');
    expect(result.description).toEqual('A task for testing purposes');
    expect(result.completed).toEqual(false);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toEqual('number');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a task with null description', async () => {
    const result = await createTask(nullDescriptionInput);

    // Verify null description is handled correctly
    expect(result.title).toEqual('Task without description');
    expect(result.description).toBeNull();
    expect(result.completed).toEqual(false);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save task to database correctly', async () => {
    const result = await createTask(basicTestInput);

    // Query database to verify persistence
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, result.id))
      .execute();

    expect(tasks).toHaveLength(1);
    const savedTask = tasks[0];
    expect(savedTask.title).toEqual('Test Task');
    expect(savedTask.description).toEqual('A task for testing purposes');
    expect(savedTask.completed).toEqual(false);
    expect(savedTask.created_at).toBeInstanceOf(Date);
  });

  it('should handle long titles correctly', async () => {
    const result = await createTask(longTitleInput);

    expect(result.title).toEqual('This is a very long task title that should still work perfectly fine');
    expect(result.description).toEqual('Testing with longer content');
    expect(result.completed).toEqual(false);

    // Verify in database
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, result.id))
      .execute();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toEqual(longTitleInput.title);
  });

  it('should set completed to false by default', async () => {
    const result = await createTask(basicTestInput);

    // Verify default completed status
    expect(result.completed).toEqual(false);

    // Verify in database that default is applied
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, result.id))
      .execute();

    expect(tasks[0].completed).toEqual(false);
  });

  it('should generate unique IDs for multiple tasks', async () => {
    const task1 = await createTask(basicTestInput);
    const task2 = await createTask(nullDescriptionInput);

    // IDs should be different
    expect(task1.id).not.toEqual(task2.id);
    
    // Both should be valid numbers
    expect(typeof task1.id).toEqual('number');
    expect(typeof task2.id).toEqual('number');

    // Verify both are in database
    const allTasks = await db.select()
      .from(tasksTable)
      .execute();

    expect(allTasks).toHaveLength(2);
    expect(allTasks.map(t => t.id)).toContain(task1.id);
    expect(allTasks.map(t => t.id)).toContain(task2.id);
  });

  it('should preserve creation timestamps', async () => {
    const beforeCreation = new Date();
    const result = await createTask(basicTestInput);
    const afterCreation = new Date();

    // Timestamp should be between before and after
    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());

    // Verify timestamp is persisted correctly in database
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, result.id))
      .execute();

    expect(tasks[0].created_at).toBeInstanceOf(Date);
    expect(tasks[0].created_at.getTime()).toEqual(result.created_at.getTime());
  });
});