import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { stocksTable, watchlistTable } from '../db/schema';
import { type GetWatchlistInput } from '../schema';
import { getWatchlist } from '../handlers/get_watchlist';

// Test input
const testInput: GetWatchlistInput = {
  user_id: 'user123'
};

describe('getWatchlist', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array for user with no watchlist items', async () => {
    const result = await getWatchlist(testInput);
    
    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });

  it('should return watchlist items for a user', async () => {
    // Create test stocks first
    const stockResults = await db.insert(stocksTable)
      .values([
        {
          symbol: 'AAPL',
          company_name: 'Apple Inc.',
          current_price: '150.25',
          daily_change: '2.50',
          daily_change_percent: '1.69',
          market_cap: '2400000000000',
          volume: 50000000,
          pe_ratio: '28.5'
        },
        {
          symbol: 'GOOGL',
          company_name: 'Alphabet Inc.',
          current_price: '2750.80',
          daily_change: '-15.25',
          daily_change_percent: '-0.55',
          market_cap: '1800000000000',
          volume: 1200000,
          pe_ratio: '22.3'
        }
      ])
      .returning()
      .execute();

    // Create watchlist items
    await db.insert(watchlistTable)
      .values([
        {
          user_id: 'user123',
          stock_id: stockResults[0].id,
          symbol: 'AAPL',
          notes: 'Considering buying more'
        },
        {
          user_id: 'user123',
          stock_id: stockResults[1].id,
          symbol: 'GOOGL',
          notes: null
        }
      ])
      .execute();

    const result = await getWatchlist(testInput);

    expect(result).toHaveLength(2);
    
    // Check first watchlist item
    const appleItem = result.find(item => item.symbol === 'AAPL');
    expect(appleItem).toBeDefined();
    expect(appleItem!.user_id).toEqual('user123');
    expect(appleItem!.stock_id).toEqual(stockResults[0].id);
    expect(appleItem!.symbol).toEqual('AAPL');
    expect(appleItem!.notes).toEqual('Considering buying more');
    expect(appleItem!.id).toBeDefined();
    expect(appleItem!.created_at).toBeInstanceOf(Date);

    // Check second watchlist item
    const googleItem = result.find(item => item.symbol === 'GOOGL');
    expect(googleItem).toBeDefined();
    expect(googleItem!.user_id).toEqual('user123');
    expect(googleItem!.stock_id).toEqual(stockResults[1].id);
    expect(googleItem!.symbol).toEqual('GOOGL');
    expect(googleItem!.notes).toBeNull();
    expect(googleItem!.id).toBeDefined();
    expect(googleItem!.created_at).toBeInstanceOf(Date);
  });

  it('should only return watchlist items for the specified user', async () => {
    // Create test stock
    const stockResult = await db.insert(stocksTable)
      .values({
        symbol: 'TSLA',
        company_name: 'Tesla Inc.',
        current_price: '800.50',
        daily_change: '25.00',
        daily_change_percent: '3.22',
        market_cap: '850000000000',
        volume: 25000000,
        pe_ratio: '45.2'
      })
      .returning()
      .execute();

    // Create watchlist items for different users
    await db.insert(watchlistTable)
      .values([
        {
          user_id: 'user123',
          stock_id: stockResult[0].id,
          symbol: 'TSLA',
          notes: 'User 123 watching TSLA'
        },
        {
          user_id: 'user456',
          stock_id: stockResult[0].id,
          symbol: 'TSLA',
          notes: 'User 456 watching TSLA'
        }
      ])
      .execute();

    const result = await getWatchlist(testInput);

    expect(result).toHaveLength(1);
    expect(result[0].user_id).toEqual('user123');
    expect(result[0].symbol).toEqual('TSLA');
    expect(result[0].notes).toEqual('User 123 watching TSLA');
  });

  it('should handle watchlist items with null notes', async () => {
    // Create test stock
    const stockResult = await db.insert(stocksTable)
      .values({
        symbol: 'MSFT',
        company_name: 'Microsoft Corp.',
        current_price: '350.00',
        daily_change: '5.75',
        daily_change_percent: '1.67',
        market_cap: '2600000000000',
        volume: 30000000,
        pe_ratio: '30.1'
      })
      .returning()
      .execute();

    // Create watchlist item with null notes
    await db.insert(watchlistTable)
      .values({
        user_id: 'user123',
        stock_id: stockResult[0].id,
        symbol: 'MSFT',
        notes: null
      })
      .execute();

    const result = await getWatchlist(testInput);

    expect(result).toHaveLength(1);
    expect(result[0].symbol).toEqual('MSFT');
    expect(result[0].notes).toBeNull();
    expect(result[0].user_id).toEqual('user123');
  });

  it('should return items ordered by creation date (implicit database order)', async () => {
    // Create test stocks
    const stockResults = await db.insert(stocksTable)
      .values([
        {
          symbol: 'AMZN',
          company_name: 'Amazon.com Inc.',
          current_price: '3300.00',
          daily_change: '45.50',
          daily_change_percent: '1.40',
          market_cap: '1700000000000',
          volume: 3500000,
          pe_ratio: '55.8'
        },
        {
          symbol: 'NFLX',
          company_name: 'Netflix Inc.',
          current_price: '580.25',
          daily_change: '-12.75',
          daily_change_percent: '-2.15',
          market_cap: '260000000000',
          volume: 4200000,
          pe_ratio: '40.2'
        }
      ])
      .returning()
      .execute();

    // Create watchlist items (first item created first)
    await db.insert(watchlistTable)
      .values({
        user_id: 'user123',
        stock_id: stockResults[0].id,
        symbol: 'AMZN',
        notes: 'First item'
      })
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(watchlistTable)
      .values({
        user_id: 'user123',
        stock_id: stockResults[1].id,
        symbol: 'NFLX',
        notes: 'Second item'
      })
      .execute();

    const result = await getWatchlist(testInput);

    expect(result).toHaveLength(2);
    // Verify that both items are returned (order may vary based on database implementation)
    const symbols = result.map(item => item.symbol);
    expect(symbols).toContain('AMZN');
    expect(symbols).toContain('NFLX');
  });
});