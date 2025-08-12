import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { stocksTable, historicalPricesTable } from '../db/schema';
import { type AddHistoricalPriceInput } from '../schema';
import { addHistoricalPrice } from '../handlers/add_historical_price';
import { eq, and, gte } from 'drizzle-orm';

// Helper to create a test stock
const createTestStock = async () => {
  const stockData = {
    symbol: 'AAPL',
    company_name: 'Apple Inc.',
    current_price: '150.50',
    daily_change: '2.25',
    daily_change_percent: '1.52',
    market_cap: '2500000000000',
    volume: 45000000,
    pe_ratio: '28.5'
  };

  const result = await db.insert(stocksTable)
    .values(stockData)
    .returning()
    .execute();

  return result[0];
};

// Test input with all required fields
const testInput: AddHistoricalPriceInput = {
  stock_id: 1, // Will be updated with actual stock ID
  symbol: 'AAPL',
  price: 148.75,
  volume: 42000000,
  date: new Date('2024-01-15T16:00:00Z')
};

describe('addHistoricalPrice', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should add a historical price record', async () => {
    // Create test stock first
    const stock = await createTestStock();
    const input = { ...testInput, stock_id: stock.id };

    const result = await addHistoricalPrice(input);

    // Basic field validation
    expect(result.stock_id).toEqual(stock.id);
    expect(result.symbol).toEqual('AAPL');
    expect(result.price).toEqual(148.75);
    expect(typeof result.price).toEqual('number');
    expect(result.volume).toEqual(42000000);
    expect(result.date).toEqual(input.date);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save historical price to database', async () => {
    // Create test stock first
    const stock = await createTestStock();
    const input = { ...testInput, stock_id: stock.id };

    const result = await addHistoricalPrice(input);

    // Query using proper drizzle syntax
    const historicalPrices = await db.select()
      .from(historicalPricesTable)
      .where(eq(historicalPricesTable.id, result.id))
      .execute();

    expect(historicalPrices).toHaveLength(1);
    const saved = historicalPrices[0];
    expect(saved.stock_id).toEqual(stock.id);
    expect(saved.symbol).toEqual('AAPL');
    expect(parseFloat(saved.price)).toEqual(148.75);
    expect(saved.volume).toEqual(42000000);
    expect(saved.date).toEqual(input.date);
    expect(saved.created_at).toBeInstanceOf(Date);
  });

  it('should handle historical price with null volume', async () => {
    // Create test stock first
    const stock = await createTestStock();
    const inputWithNullVolume = {
      ...testInput,
      stock_id: stock.id,
      volume: null
    };

    const result = await addHistoricalPrice(inputWithNullVolume);

    expect(result.stock_id).toEqual(stock.id);
    expect(result.symbol).toEqual('AAPL');
    expect(result.price).toEqual(148.75);
    expect(result.volume).toBeNull();
    expect(result.date).toEqual(inputWithNullVolume.date);
  });

  it('should throw error when stock does not exist', async () => {
    const inputWithInvalidStock = {
      ...testInput,
      stock_id: 999 // Non-existent stock ID
    };

    await expect(addHistoricalPrice(inputWithInvalidStock))
      .rejects.toThrow(/stock with id 999 does not exist/i);
  });

  it('should query historical prices by date range correctly', async () => {
    // Create test stock first
    const stock = await createTestStock();

    // Add multiple historical prices with different dates
    const dates = [
      new Date('2024-01-13T16:00:00Z'),
      new Date('2024-01-14T16:00:00Z'), 
      new Date('2024-01-15T16:00:00Z')
    ];

    for (let i = 0; i < dates.length; i++) {
      await addHistoricalPrice({
        stock_id: stock.id,
        symbol: 'AAPL',
        price: 150 + i,
        volume: 40000000 + (i * 1000000),
        date: dates[i]
      });
    }

    // Test date filtering - demonstration of correct date handling
    const startDate = new Date('2024-01-14T00:00:00Z');

    // Build conditions array
    const conditions = [
      eq(historicalPricesTable.stock_id, stock.id),
      gte(historicalPricesTable.date, startDate)
    ];

    // Execute query directly without reassigning to variable
    const results = await db.select()
      .from(historicalPricesTable)
      .where(and(...conditions))
      .execute();

    expect(results.length).toBeGreaterThanOrEqual(2);
    results.forEach(price => {
      expect(price.date).toBeInstanceOf(Date);
      expect(price.date >= startDate).toBe(true);
      expect(price.stock_id).toEqual(stock.id);
      expect(parseFloat(price.price)).toBeGreaterThan(0);
    });
  });

  it('should handle multiple historical prices for the same stock', async () => {
    // Create test stock first
    const stock = await createTestStock();

    // Add multiple historical prices
    const prices = [
      { price: 148.75, date: new Date('2024-01-13T16:00:00Z') },
      { price: 151.20, date: new Date('2024-01-14T16:00:00Z') },
      { price: 149.85, date: new Date('2024-01-15T16:00:00Z') }
    ];

    const results = [];
    for (const priceData of prices) {
      const result = await addHistoricalPrice({
        stock_id: stock.id,
        symbol: 'AAPL',
        price: priceData.price,
        volume: 40000000,
        date: priceData.date
      });
      results.push(result);
    }

    // Verify all prices were added
    expect(results).toHaveLength(3);
    results.forEach((result, index) => {
      expect(result.stock_id).toEqual(stock.id);
      expect(result.price).toEqual(prices[index].price);
      expect(result.date).toEqual(prices[index].date);
    });

    // Verify they're all in the database
    const allPrices = await db.select()
      .from(historicalPricesTable)
      .where(eq(historicalPricesTable.stock_id, stock.id))
      .execute();

    expect(allPrices).toHaveLength(3);
  });
});