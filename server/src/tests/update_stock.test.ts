import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { stocksTable } from '../db/schema';
import { type UpdateStockInput, type CreateStockInput } from '../schema';
import { updateStock } from '../handlers/update_stock';
import { eq } from 'drizzle-orm';

// Test input for creating initial stock
const testCreateInput: CreateStockInput = {
  symbol: 'AAPL',
  company_name: 'Apple Inc.',
  current_price: 150.00,
  daily_change: 2.50,
  daily_change_percent: 1.69,
  market_cap: 2500000000000,
  volume: 50000000,
  pe_ratio: 25.5
};

describe('updateStock', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let stockId: number;

  beforeEach(async () => {
    // Create a test stock first
    const result = await db.insert(stocksTable)
      .values({
        symbol: testCreateInput.symbol,
        company_name: testCreateInput.company_name,
        current_price: testCreateInput.current_price.toString(),
        daily_change: testCreateInput.daily_change.toString(),
        daily_change_percent: testCreateInput.daily_change_percent.toString(),
        market_cap: testCreateInput.market_cap?.toString() || null,
        volume: testCreateInput.volume,
        pe_ratio: testCreateInput.pe_ratio?.toString() || null
      })
      .returning()
      .execute();
    
    stockId = result[0].id;
  });

  it('should update stock price fields', async () => {
    const updateInput: UpdateStockInput = {
      id: stockId,
      current_price: 155.75,
      daily_change: 5.75,
      daily_change_percent: 3.83
    };

    const result = await updateStock(updateInput);

    // Verify updated fields
    expect(result.id).toEqual(stockId);
    expect(result.current_price).toEqual(155.75);
    expect(result.daily_change).toEqual(5.75);
    expect(result.daily_change_percent).toEqual(3.83);
    expect(typeof result.current_price).toBe('number');
    expect(typeof result.daily_change).toBe('number');
    expect(typeof result.daily_change_percent).toBe('number');

    // Verify unchanged fields remain the same
    expect(result.symbol).toEqual('AAPL');
    expect(result.company_name).toEqual('Apple Inc.');
    expect(result.market_cap).toEqual(2500000000000);
    expect(result.volume).toEqual(50000000);
    expect(result.pe_ratio).toEqual(25.5);
    
    // Verify updated_at is more recent
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update market data fields', async () => {
    const updateInput: UpdateStockInput = {
      id: stockId,
      market_cap: 2600000000000,
      volume: 75000000,
      pe_ratio: 28.2
    };

    const result = await updateStock(updateInput);

    // Verify updated fields
    expect(result.market_cap).toEqual(2600000000000);
    expect(result.volume).toEqual(75000000);
    expect(result.pe_ratio).toEqual(28.2);
    expect(typeof result.market_cap).toBe('number');
    expect(typeof result.pe_ratio).toBe('number');

    // Verify unchanged fields remain the same
    expect(result.current_price).toEqual(150.00);
    expect(result.daily_change).toEqual(2.50);
    expect(result.daily_change_percent).toEqual(1.69);
  });

  it('should handle null values for optional fields', async () => {
    const updateInput: UpdateStockInput = {
      id: stockId,
      market_cap: null,
      pe_ratio: null
    };

    const result = await updateStock(updateInput);

    // Verify null fields
    expect(result.market_cap).toBeNull();
    expect(result.pe_ratio).toBeNull();
    
    // Volume should remain unchanged
    expect(result.volume).toEqual(50000000);
  });

  it('should update partial fields only', async () => {
    const updateInput: UpdateStockInput = {
      id: stockId,
      current_price: 148.25
    };

    const result = await updateStock(updateInput);

    // Verify only current_price was updated
    expect(result.current_price).toEqual(148.25);
    
    // Verify other fields remain unchanged
    expect(result.daily_change).toEqual(2.50);
    expect(result.daily_change_percent).toEqual(1.69);
    expect(result.market_cap).toEqual(2500000000000);
    expect(result.volume).toEqual(50000000);
    expect(result.pe_ratio).toEqual(25.5);
  });

  it('should save updates to database', async () => {
    const updateInput: UpdateStockInput = {
      id: stockId,
      current_price: 160.00,
      daily_change: 10.00,
      daily_change_percent: 6.67
    };

    await updateStock(updateInput);

    // Query database directly to verify changes
    const stocks = await db.select()
      .from(stocksTable)
      .where(eq(stocksTable.id, stockId))
      .execute();

    expect(stocks).toHaveLength(1);
    const dbStock = stocks[0];
    expect(parseFloat(dbStock.current_price)).toEqual(160.00);
    expect(parseFloat(dbStock.daily_change)).toEqual(10.00);
    expect(parseFloat(dbStock.daily_change_percent)).toEqual(6.67);
    expect(dbStock.updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent stock', async () => {
    const updateInput: UpdateStockInput = {
      id: 99999,
      current_price: 100.00
    };

    await expect(updateStock(updateInput)).rejects.toThrow(/Stock with id 99999 not found/i);
  });

  it('should handle zero values correctly', async () => {
    const updateInput: UpdateStockInput = {
      id: stockId,
      current_price: 100.00,
      daily_change: 0,
      daily_change_percent: 0,
      volume: 0
    };

    const result = await updateStock(updateInput);

    expect(result.current_price).toEqual(100.00);
    expect(result.daily_change).toEqual(0);
    expect(result.daily_change_percent).toEqual(0);
    expect(result.volume).toEqual(0);
  });

  it('should preserve original timestamps for created_at', async () => {
    // Get original created_at
    const originalStock = await db.select()
      .from(stocksTable)
      .where(eq(stocksTable.id, stockId))
      .execute();
    
    const originalCreatedAt = originalStock[0].created_at;

    const updateInput: UpdateStockInput = {
      id: stockId,
      current_price: 155.00
    };

    const result = await updateStock(updateInput);

    // created_at should remain the same
    expect(result.created_at).toEqual(originalCreatedAt);
    // updated_at should be different (more recent)
    expect(result.updated_at.getTime()).toBeGreaterThan(originalCreatedAt.getTime());
  });
});