import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { stocksTable, watchlistTable } from '../db/schema';
import { type AddWatchlistItemInput } from '../schema';
import { addWatchlistItem } from '../handlers/add_watchlist_item';
import { eq } from 'drizzle-orm';

describe('addWatchlistItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  const createTestStock = async () => {
    const result = await db.insert(stocksTable)
      .values({
        symbol: 'AAPL',
        company_name: 'Apple Inc.',
        current_price: '150.25',
        daily_change: '2.50',
        daily_change_percent: '1.69',
        market_cap: '2500000000000',
        volume: 50000000,
        pe_ratio: '28.5'
      })
      .returning()
      .execute();
    
    return result[0];
  };

  // Test input with all fields
  const testInput: AddWatchlistItemInput = {
    user_id: 'user123',
    symbol: 'AAPL',
    notes: 'Watching for good entry point'
  };

  it('should add watchlist item with all fields', async () => {
    await createTestStock();

    const result = await addWatchlistItem(testInput);

    expect(result.user_id).toEqual('user123');
    expect(result.symbol).toEqual('AAPL');
    expect(result.notes).toEqual('Watching for good entry point');
    expect(result.id).toBeDefined();
    expect(result.stock_id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should add watchlist item with null notes', async () => {
    await createTestStock();

    const inputWithNullNotes: AddWatchlistItemInput = {
      user_id: 'user123',
      symbol: 'AAPL',
      notes: null
    };

    const result = await addWatchlistItem(inputWithNullNotes);

    expect(result.user_id).toEqual('user123');
    expect(result.symbol).toEqual('AAPL');
    expect(result.notes).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.stock_id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save watchlist item to database', async () => {
    const stock = await createTestStock();
    
    const result = await addWatchlistItem(testInput);

    // Query the database to verify the watchlist item was saved
    const watchlistItems = await db.select()
      .from(watchlistTable)
      .where(eq(watchlistTable.id, result.id))
      .execute();

    expect(watchlistItems).toHaveLength(1);
    const savedItem = watchlistItems[0];
    expect(savedItem.user_id).toEqual('user123');
    expect(savedItem.symbol).toEqual('AAPL');
    expect(savedItem.stock_id).toEqual(stock.id);
    expect(savedItem.notes).toEqual('Watching for good entry point');
    expect(savedItem.created_at).toBeInstanceOf(Date);
  });

  it('should link to correct stock via stock_id', async () => {
    const stock = await createTestStock();
    
    const result = await addWatchlistItem(testInput);

    expect(result.stock_id).toEqual(stock.id);
    expect(result.symbol).toEqual(stock.symbol);
  });

  it('should throw error when stock symbol does not exist', async () => {
    const invalidInput: AddWatchlistItemInput = {
      user_id: 'user123',
      symbol: 'INVALID',
      notes: 'This should fail'
    };

    await expect(addWatchlistItem(invalidInput)).rejects.toThrow(/Stock with symbol 'INVALID' not found/);
  });

  it('should allow multiple users to watch the same stock', async () => {
    await createTestStock();

    const user1Input: AddWatchlistItemInput = {
      user_id: 'user1',
      symbol: 'AAPL',
      notes: 'User 1 notes'
    };

    const user2Input: AddWatchlistItemInput = {
      user_id: 'user2',
      symbol: 'AAPL',
      notes: 'User 2 notes'
    };

    const result1 = await addWatchlistItem(user1Input);
    const result2 = await addWatchlistItem(user2Input);

    expect(result1.user_id).toEqual('user1');
    expect(result1.notes).toEqual('User 1 notes');
    expect(result2.user_id).toEqual('user2');
    expect(result2.notes).toEqual('User 2 notes');
    expect(result1.stock_id).toEqual(result2.stock_id); // Same stock
    expect(result1.id).not.toEqual(result2.id); // Different watchlist items
  });

  it('should allow same user to watch different stocks', async () => {
    // Create two different stocks
    await createTestStock(); // AAPL
    
    await db.insert(stocksTable)
      .values({
        symbol: 'GOOGL',
        company_name: 'Alphabet Inc.',
        current_price: '2800.00',
        daily_change: '15.50',
        daily_change_percent: '0.56',
        market_cap: '1800000000000',
        volume: 25000000,
        pe_ratio: '25.2'
      })
      .execute();

    const appleInput: AddWatchlistItemInput = {
      user_id: 'user123',
      symbol: 'AAPL',
      notes: 'Apple notes'
    };

    const googleInput: AddWatchlistItemInput = {
      user_id: 'user123',
      symbol: 'GOOGL',
      notes: 'Google notes'
    };

    const appleResult = await addWatchlistItem(appleInput);
    const googleResult = await addWatchlistItem(googleInput);

    expect(appleResult.user_id).toEqual('user123');
    expect(appleResult.symbol).toEqual('AAPL');
    expect(appleResult.notes).toEqual('Apple notes');

    expect(googleResult.user_id).toEqual('user123');
    expect(googleResult.symbol).toEqual('GOOGL');
    expect(googleResult.notes).toEqual('Google notes');

    expect(appleResult.stock_id).not.toEqual(googleResult.stock_id);
    expect(appleResult.id).not.toEqual(googleResult.id);
  });
});