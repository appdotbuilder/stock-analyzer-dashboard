import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { stocksTable, watchlistTable } from '../db/schema';
import { type UpdateWatchlistItemInput, type AddWatchlistItemInput } from '../schema';
import { updateWatchlistItem } from '../handlers/update_watchlist_item';
import { eq } from 'drizzle-orm';

// Test data
const testStock = {
  symbol: 'TEST',
  company_name: 'Test Company',
  current_price: '100.00',
  daily_change: '2.50',
  daily_change_percent: '2.56',
  market_cap: '1000000000.00',
  volume: 1000000,
  pe_ratio: '15.50'
};

const testWatchlistItem = {
  user_id: 'test-user-1',
  stock_id: 1, // Will be set after stock creation
  symbol: 'TEST',
  notes: 'Initial notes about this stock'
};

describe('updateWatchlistItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update watchlist item notes', async () => {
    // Create prerequisite stock
    const stockResult = await db.insert(stocksTable)
      .values(testStock)
      .returning()
      .execute();

    // Create watchlist item
    const watchlistResult = await db.insert(watchlistTable)
      .values({
        ...testWatchlistItem,
        stock_id: stockResult[0].id
      })
      .returning()
      .execute();

    const updateInput: UpdateWatchlistItemInput = {
      id: watchlistResult[0].id,
      notes: 'Updated notes with new analysis'
    };

    const result = await updateWatchlistItem(updateInput);

    // Verify the updated fields
    expect(result.id).toEqual(watchlistResult[0].id);
    expect(result.notes).toEqual('Updated notes with new analysis');
    expect(result.user_id).toEqual('test-user-1');
    expect(result.symbol).toEqual('TEST');
    expect(result.stock_id).toEqual(stockResult[0].id);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save updated notes to database', async () => {
    // Create prerequisite stock
    const stockResult = await db.insert(stocksTable)
      .values(testStock)
      .returning()
      .execute();

    // Create watchlist item
    const watchlistResult = await db.insert(watchlistTable)
      .values({
        ...testWatchlistItem,
        stock_id: stockResult[0].id
      })
      .returning()
      .execute();

    const updateInput: UpdateWatchlistItemInput = {
      id: watchlistResult[0].id,
      notes: 'Saved to database notes'
    };

    await updateWatchlistItem(updateInput);

    // Verify in database
    const savedItem = await db.select()
      .from(watchlistTable)
      .where(eq(watchlistTable.id, watchlistResult[0].id))
      .execute();

    expect(savedItem).toHaveLength(1);
    expect(savedItem[0].notes).toEqual('Saved to database notes');
    expect(savedItem[0].user_id).toEqual('test-user-1');
  });

  it('should set notes to null when provided', async () => {
    // Create prerequisite stock
    const stockResult = await db.insert(stocksTable)
      .values(testStock)
      .returning()
      .execute();

    // Create watchlist item with initial notes
    const watchlistResult = await db.insert(watchlistTable)
      .values({
        ...testWatchlistItem,
        stock_id: stockResult[0].id,
        notes: 'Initial notes to be cleared'
      })
      .returning()
      .execute();

    const updateInput: UpdateWatchlistItemInput = {
      id: watchlistResult[0].id,
      notes: null
    };

    const result = await updateWatchlistItem(updateInput);

    expect(result.notes).toBeNull();

    // Verify in database
    const savedItem = await db.select()
      .from(watchlistTable)
      .where(eq(watchlistTable.id, watchlistResult[0].id))
      .execute();

    expect(savedItem[0].notes).toBeNull();
  });

  it('should return existing item when no fields to update', async () => {
    // Create prerequisite stock
    const stockResult = await db.insert(stocksTable)
      .values(testStock)
      .returning()
      .execute();

    // Create watchlist item
    const watchlistResult = await db.insert(watchlistTable)
      .values({
        ...testWatchlistItem,
        stock_id: stockResult[0].id
      })
      .returning()
      .execute();

    const updateInput: UpdateWatchlistItemInput = {
      id: watchlistResult[0].id
      // No fields to update
    };

    const result = await updateWatchlistItem(updateInput);

    // Should return existing item unchanged
    expect(result.id).toEqual(watchlistResult[0].id);
    expect(result.notes).toEqual(testWatchlistItem.notes);
    expect(result.user_id).toEqual('test-user-1');
    expect(result.symbol).toEqual('TEST');
  });

  it('should throw error for non-existent watchlist item', async () => {
    const updateInput: UpdateWatchlistItemInput = {
      id: 99999, // Non-existent ID
      notes: 'This should fail'
    };

    await expect(updateWatchlistItem(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should preserve all other fields when updating notes', async () => {
    // Create prerequisite stock
    const stockResult = await db.insert(stocksTable)
      .values(testStock)
      .returning()
      .execute();

    // Create watchlist item with specific data
    const watchlistResult = await db.insert(watchlistTable)
      .values({
        user_id: 'specific-user',
        stock_id: stockResult[0].id,
        symbol: 'SPECIFIC',
        notes: 'Original notes'
      })
      .returning()
      .execute();

    const updateInput: UpdateWatchlistItemInput = {
      id: watchlistResult[0].id,
      notes: 'Updated notes only'
    };

    const result = await updateWatchlistItem(updateInput);

    // Verify all fields are preserved except notes
    expect(result.id).toEqual(watchlistResult[0].id);
    expect(result.user_id).toEqual('specific-user');
    expect(result.stock_id).toEqual(stockResult[0].id);
    expect(result.symbol).toEqual('SPECIFIC');
    expect(result.notes).toEqual('Updated notes only');
    expect(result.created_at).toEqual(watchlistResult[0].created_at);
  });
});