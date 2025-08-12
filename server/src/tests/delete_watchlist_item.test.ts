import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { stocksTable, watchlistTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type DeleteItemInput } from '../schema';
import { deleteWatchlistItem } from '../handlers/delete_watchlist_item';

describe('deleteWatchlistItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing watchlist item', async () => {
    // First, create a stock
    const stockResult = await db.insert(stocksTable)
      .values({
        symbol: 'AAPL',
        company_name: 'Apple Inc.',
        current_price: '150.00',
        daily_change: '2.50',
        daily_change_percent: '1.69',
        market_cap: '2400000000000',
        volume: 50000000,
        pe_ratio: '28.50'
      })
      .returning()
      .execute();

    const stock = stockResult[0];

    // Create a watchlist item
    const watchlistResult = await db.insert(watchlistTable)
      .values({
        user_id: 'user123',
        stock_id: stock.id,
        symbol: 'AAPL',
        notes: 'Watching for earnings'
      })
      .returning()
      .execute();

    const watchlistItem = watchlistResult[0];

    // Test input
    const testInput: DeleteItemInput = {
      id: watchlistItem.id
    };

    // Delete the watchlist item
    const result = await deleteWatchlistItem(testInput);

    // Should return true for successful deletion
    expect(result).toBe(true);

    // Verify the item was actually deleted from the database
    const remainingItems = await db.select()
      .from(watchlistTable)
      .where(eq(watchlistTable.id, watchlistItem.id))
      .execute();

    expect(remainingItems).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent watchlist item', async () => {
    const testInput: DeleteItemInput = {
      id: 99999 // Non-existent ID
    };

    // Try to delete non-existent item
    const result = await deleteWatchlistItem(testInput);

    // Should return false since no record was found
    expect(result).toBe(false);
  });

  it('should not affect other watchlist items when deleting one', async () => {
    // First, create a stock
    const stockResult = await db.insert(stocksTable)
      .values({
        symbol: 'MSFT',
        company_name: 'Microsoft Corporation',
        current_price: '300.00',
        daily_change: '-5.00',
        daily_change_percent: '-1.64',
        market_cap: '2200000000000',
        volume: 30000000,
        pe_ratio: '30.00'
      })
      .returning()
      .execute();

    const stock = stockResult[0];

    // Create multiple watchlist items for different users
    const watchlistResults = await db.insert(watchlistTable)
      .values([
        {
          user_id: 'user123',
          stock_id: stock.id,
          symbol: 'MSFT',
          notes: 'First item'
        },
        {
          user_id: 'user456',
          stock_id: stock.id,
          symbol: 'MSFT',
          notes: 'Second item'
        }
      ])
      .returning()
      .execute();

    // Delete only the first item
    const testInput: DeleteItemInput = {
      id: watchlistResults[0].id
    };

    const result = await deleteWatchlistItem(testInput);
    expect(result).toBe(true);

    // Verify only the first item was deleted
    const remainingItems = await db.select()
      .from(watchlistTable)
      .execute();

    expect(remainingItems).toHaveLength(1);
    expect(remainingItems[0].id).toBe(watchlistResults[1].id);
    expect(remainingItems[0].user_id).toBe('user456');
    expect(remainingItems[0].notes).toBe('Second item');
  });

  it('should handle deletion of watchlist item with null notes', async () => {
    // Create a stock
    const stockResult = await db.insert(stocksTable)
      .values({
        symbol: 'GOOGL',
        company_name: 'Alphabet Inc.',
        current_price: '2500.00',
        daily_change: '10.00',
        daily_change_percent: '0.40',
        market_cap: '1600000000000',
        volume: 25000000,
        pe_ratio: '25.00'
      })
      .returning()
      .execute();

    const stock = stockResult[0];

    // Create watchlist item with null notes
    const watchlistResult = await db.insert(watchlistTable)
      .values({
        user_id: 'user789',
        stock_id: stock.id,
        symbol: 'GOOGL',
        notes: null // Explicitly null notes
      })
      .returning()
      .execute();

    const watchlistItem = watchlistResult[0];

    const testInput: DeleteItemInput = {
      id: watchlistItem.id
    };

    // Delete the item
    const result = await deleteWatchlistItem(testInput);

    expect(result).toBe(true);

    // Verify deletion
    const remainingItems = await db.select()
      .from(watchlistTable)
      .where(eq(watchlistTable.id, watchlistItem.id))
      .execute();

    expect(remainingItems).toHaveLength(0);
  });
});