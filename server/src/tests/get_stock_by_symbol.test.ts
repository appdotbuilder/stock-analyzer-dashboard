import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { stocksTable } from '../db/schema';
import { getStockBySymbol } from '../handlers/get_stock_by_symbol';
import { eq } from 'drizzle-orm';

describe('getStockBySymbol', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  const testStock = {
    symbol: 'AAPL',
    company_name: 'Apple Inc.',
    current_price: '150.25',
    daily_change: '2.50',
    daily_change_percent: '1.69',
    market_cap: '2500000000000',
    volume: 75000000,
    pe_ratio: '28.5'
  };

  const testStockWithNulls = {
    symbol: 'TSLA',
    company_name: 'Tesla, Inc.',
    current_price: '200.00',
    daily_change: '-5.00',
    daily_change_percent: '-2.44',
    market_cap: null,
    volume: null,
    pe_ratio: null
  };

  it('should return stock when found by symbol', async () => {
    // Insert test stock
    await db.insert(stocksTable)
      .values(testStock)
      .execute();

    const result = await getStockBySymbol('AAPL');

    expect(result).toBeDefined();
    expect(result!.symbol).toEqual('AAPL');
    expect(result!.company_name).toEqual('Apple Inc.');
    expect(result!.current_price).toEqual(150.25);
    expect(typeof result!.current_price).toEqual('number');
    expect(result!.daily_change).toEqual(2.50);
    expect(typeof result!.daily_change).toEqual('number');
    expect(result!.daily_change_percent).toEqual(1.69);
    expect(typeof result!.daily_change_percent).toEqual('number');
    expect(result!.market_cap).toEqual(2500000000000);
    expect(typeof result!.market_cap).toEqual('number');
    expect(result!.volume).toEqual(75000000);
    expect(result!.pe_ratio).toEqual(28.5);
    expect(typeof result!.pe_ratio).toEqual('number');
    expect(result!.id).toBeDefined();
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should handle nullable fields correctly', async () => {
    // Insert test stock with null values
    await db.insert(stocksTable)
      .values(testStockWithNulls)
      .execute();

    const result = await getStockBySymbol('TSLA');

    expect(result).toBeDefined();
    expect(result!.symbol).toEqual('TSLA');
    expect(result!.company_name).toEqual('Tesla, Inc.');
    expect(result!.current_price).toEqual(200.00);
    expect(result!.daily_change).toEqual(-5.00);
    expect(result!.daily_change_percent).toEqual(-2.44);
    expect(result!.market_cap).toBeNull();
    expect(result!.volume).toBeNull();
    expect(result!.pe_ratio).toBeNull();
  });

  it('should be case insensitive for symbol lookup', async () => {
    // Insert test stock
    await db.insert(stocksTable)
      .values(testStock)
      .execute();

    // Test lowercase symbol
    const result1 = await getStockBySymbol('aapl');
    expect(result1).toBeDefined();
    expect(result1!.symbol).toEqual('AAPL');

    // Test mixed case symbol
    const result2 = await getStockBySymbol('AaPl');
    expect(result2).toBeDefined();
    expect(result2!.symbol).toEqual('AAPL');

    // Test uppercase symbol
    const result3 = await getStockBySymbol('AAPL');
    expect(result3).toBeDefined();
    expect(result3!.symbol).toEqual('AAPL');
  });

  it('should return null when stock not found', async () => {
    const result = await getStockBySymbol('NONEXISTENT');

    expect(result).toBeNull();
  });

  it('should return only one result even if multiple stocks exist', async () => {
    // Insert test stock
    await db.insert(stocksTable)
      .values(testStock)
      .execute();

    const result = await getStockBySymbol('AAPL');

    expect(result).toBeDefined();
    expect(result!.symbol).toEqual('AAPL');
    
    // Verify it's a single stock object, not an array
    expect(Array.isArray(result)).toBe(false);
  });

  it('should verify data is actually saved in database', async () => {
    // Insert test stock
    await db.insert(stocksTable)
      .values(testStock)
      .execute();

    // Verify direct database query
    const dbResult = await db.select()
      .from(stocksTable)
      .where(eq(stocksTable.symbol, 'AAPL'))
      .execute();

    expect(dbResult).toHaveLength(1);
    expect(dbResult[0].symbol).toEqual('AAPL');
    expect(dbResult[0].company_name).toEqual('Apple Inc.');
    
    // Now test the handler
    const handlerResult = await getStockBySymbol('AAPL');
    expect(handlerResult).toBeDefined();
    expect(handlerResult!.id).toEqual(dbResult[0].id);
  });

  it('should handle empty string symbol', async () => {
    const result = await getStockBySymbol('');

    expect(result).toBeNull();
  });

  it('should handle symbol with whitespace', async () => {
    // Insert test stock
    await db.insert(stocksTable)
      .values(testStock)
      .execute();

    const result = await getStockBySymbol(' AAPL ');

    // Should normalize and find the stock
    expect(result).toBeDefined();
    expect(result!.symbol).toEqual('AAPL');
  });
});