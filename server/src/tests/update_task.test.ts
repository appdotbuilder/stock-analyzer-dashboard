import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type UpdateTaskInput, type CreateTaskInput } from '../schema';
import { updateTask } from '../handlers/update_task';
import { eq } from 'drizzle-orm';

// Test data
const testTask: CreateTaskInput = {
  title: 'Original Task',
  description: 'Original description'
};

// Helper function to create a task for testing
const createTestTask = async () => {
  const result = await db.insert(tasksTable)
    .values({
      title: testTask.title,
      description: testTask.description,
      completed: false
    })
    .returning()
    .execute();
  
  return result[0];
};

describe('updateTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update task title', async () => {
    const task = await createTestTask();
    
    const updateInput: UpdateTaskInput = {
      id: task.id,
      title: 'Updated Task Title'
    };

    const result = await updateTask(updateInput);

    expect(result.id).toEqual(task.id);
    expect(result.title).toEqual('Updated Task Title');
    expect(result.description).toEqual(testTask.description); // Should remain unchanged
    expect(result.completed).toEqual(false); // Should remain unchanged
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update task description', async () => {
    const task = await createTestTask();
    
    const updateInput: UpdateTaskInput = {
      id: task.id,
      description: 'Updated description'
    };

    const result = await updateTask(updateInput);

    expect(result.id).toEqual(task.id);
    expect(result.title).toEqual(testTask.title); // Should remain unchanged
    expect(result.description).toEqual('Updated description');
    expect(result.completed).toEqual(false); // Should remain unchanged
  });

  it('should update task completion status', async () => {
    const task = await createTestTask();
    
    const updateInput: UpdateTaskInput = {
      id: task.id,
      completed: true
    };

    const result = await updateTask(updateInput);

    expect(result.id).toEqual(task.id);
    expect(result.title).toEqual(testTask.title); // Should remain unchanged
    expect(result.description).toEqual(testTask.description); // Should remain unchanged
    expect(result.completed).toEqual(true);
  });

  it('should update multiple fields simultaneously', async () => {
    const task = await createTestTask();
    
    const updateInput: UpdateTaskInput = {
      id: task.id,
      title: 'Completely Updated Task',
      description: 'New description',
      completed: true
    };

    const result = await updateTask(updateInput);

    expect(result.id).toEqual(task.id);
    expect(result.title).toEqual('Completely Updated Task');
    expect(result.description).toEqual('New description');
    expect(result.completed).toEqual(true);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should set description to null', async () => {
    const task = await createTestTask();
    
    const updateInput: UpdateTaskInput = {
      id: task.id,
      description: null
    };

    const result = await updateTask(updateInput);

    expect(result.id).toEqual(task.id);
    expect(result.title).toEqual(testTask.title); // Should remain unchanged
    expect(result.description).toBeNull();
    expect(result.completed).toEqual(false); // Should remain unchanged
  });

  it('should save updated task to database', async () => {
    const task = await createTestTask();
    
    const updateInput: UpdateTaskInput = {
      id: task.id,
      title: 'Saved Updated Task',
      completed: true
    };

    await updateTask(updateInput);

    // Verify changes were persisted to database
    const savedTasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, task.id))
      .execute();

    expect(savedTasks).toHaveLength(1);
    expect(savedTasks[0].title).toEqual('Saved Updated Task');
    expect(savedTasks[0].completed).toEqual(true);
    expect(savedTasks[0].description).toEqual(testTask.description); // Unchanged
  });

  it('should throw error for non-existent task', async () => {
    const updateInput: UpdateTaskInput = {
      id: 99999, // Non-existent ID
      title: 'This should fail'
    };

    await expect(updateTask(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should handle partial updates correctly', async () => {
    const task = await createTestTask();
    
    // Update only completed status
    const updateInput: UpdateTaskInput = {
      id: task.id,
      completed: true
    };

    const result = await updateTask(updateInput);

    // Verify only completed field changed
    expect(result.title).toEqual(testTask.title);
    expect(result.description).toEqual(testTask.description);
    expect(result.completed).toEqual(true);
    expect(result.created_at).toEqual(task.created_at);
  });

  it('should preserve original created_at timestamp', async () => {
    const task = await createTestTask();
    const originalCreatedAt = task.created_at;
    
    // Wait a small amount to ensure timestamps would differ if modified
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const updateInput: UpdateTaskInput = {
      id: task.id,
      title: 'Updated title'
    };

    const result = await updateTask(updateInput);

    expect(result.created_at).toEqual(originalCreatedAt);
  });
});