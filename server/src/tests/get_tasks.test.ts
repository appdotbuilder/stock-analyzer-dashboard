import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { getTasks } from '../handlers/get_tasks';

describe('getTasks', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no tasks exist', async () => {
    const result = await getTasks();
    
    expect(result).toEqual([]);
  });

  it('should return all tasks when they exist', async () => {
    // Insert test tasks
    const insertedTasks = await db.insert(tasksTable)
      .values([
        {
          title: 'Task 1',
          description: 'First task',
          completed: false
        },
        {
          title: 'Task 2',
          description: null,
          completed: true
        }
      ])
      .returning()
      .execute();

    const result = await getTasks();

    expect(result).toHaveLength(2);
    expect(result[0].title).toEqual('Task 1');
    expect(result[0].description).toEqual('First task');
    expect(result[0].completed).toEqual(false);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    
    expect(result[1].title).toEqual('Task 2');
    expect(result[1].description).toEqual(null);
    expect(result[1].completed).toEqual(true);
  });

  it('should sort tasks with incomplete first, then completed', async () => {
    // Insert tasks in different completion states
    await db.insert(tasksTable)
      .values([
        {
          title: 'Completed Task',
          description: 'This is done',
          completed: true
        },
        {
          title: 'Incomplete Task',
          description: 'Still working on this',
          completed: false
        }
      ])
      .execute();

    const result = await getTasks();

    expect(result).toHaveLength(2);
    // Incomplete task should come first
    expect(result[0].title).toEqual('Incomplete Task');
    expect(result[0].completed).toEqual(false);
    // Completed task should come second
    expect(result[1].title).toEqual('Completed Task');
    expect(result[1].completed).toEqual(true);
  });

  it('should sort tasks by creation date within completion groups', async () => {
    // Insert tasks with slight delays to ensure different timestamps
    const task1 = await db.insert(tasksTable)
      .values({
        title: 'Old Incomplete Task',
        description: 'Created first',
        completed: false
      })
      .returning()
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const task2 = await db.insert(tasksTable)
      .values({
        title: 'New Incomplete Task',
        description: 'Created second',
        completed: false
      })
      .returning()
      .execute();

    await new Promise(resolve => setTimeout(resolve, 10));

    const task3 = await db.insert(tasksTable)
      .values({
        title: 'Old Completed Task',
        description: 'Completed first',
        completed: true
      })
      .returning()
      .execute();

    await new Promise(resolve => setTimeout(resolve, 10));

    const task4 = await db.insert(tasksTable)
      .values({
        title: 'New Completed Task',
        description: 'Completed second',
        completed: true
      })
      .returning()
      .execute();

    const result = await getTasks();

    expect(result).toHaveLength(4);
    
    // First two should be incomplete tasks (newest first)
    expect(result[0].completed).toEqual(false);
    expect(result[1].completed).toEqual(false);
    expect(result[0].title).toEqual('New Incomplete Task');
    expect(result[1].title).toEqual('Old Incomplete Task');
    
    // Last two should be completed tasks (newest first)
    expect(result[2].completed).toEqual(true);
    expect(result[3].completed).toEqual(true);
    expect(result[2].title).toEqual('New Completed Task');
    expect(result[3].title).toEqual('Old Completed Task');
  });

  it('should handle tasks with null descriptions correctly', async () => {
    await db.insert(tasksTable)
      .values([
        {
          title: 'Task with description',
          description: 'Has a description',
          completed: false
        },
        {
          title: 'Task without description',
          description: null,
          completed: false
        }
      ])
      .execute();

    const result = await getTasks();

    expect(result).toHaveLength(2);
    
    const taskWithDescription = result.find(t => t.title === 'Task with description');
    const taskWithoutDescription = result.find(t => t.title === 'Task without description');
    
    expect(taskWithDescription?.description).toEqual('Has a description');
    expect(taskWithoutDescription?.description).toEqual(null);
  });

  it('should return tasks with all required fields', async () => {
    await db.insert(tasksTable)
      .values({
        title: 'Complete Task',
        description: 'Test description',
        completed: true
      })
      .execute();

    const result = await getTasks();

    expect(result).toHaveLength(1);
    const task = result[0];
    
    expect(task.id).toBeDefined();
    expect(typeof task.id).toBe('number');
    expect(task.title).toBeDefined();
    expect(typeof task.title).toBe('string');
    expect(task.description).toBeDefined(); // Can be null or string
    expect(typeof task.completed).toBe('boolean');
    expect(task.created_at).toBeInstanceOf(Date);
  });
});