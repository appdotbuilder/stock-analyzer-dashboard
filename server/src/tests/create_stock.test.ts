import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { stocksTable } from '../db/schema';
import { type CreateStockInput } from '../schema';
import { createStock } from '../handlers/create_stock';
import { eq } from 'drizzle-orm';

// Simple test input with all required fields
const testInput: CreateStockInput = {
  symbol: 'AAPL',
  company_name: 'Apple Inc.',
  current_price: 150.25,
  daily_change: 2.50,
  daily_change_percent: 1.69,
  market_cap: 2500000000000,
  volume: 75000000,
  pe_ratio: 28.5
};

// Test input with nullable fields set to null
const testInputWithNulls: CreateStockInput = {
  symbol: 'TSLA',
  company_name: 'Tesla Inc.',
  current_price: 800.75,
  daily_change: -15.25,
  daily_change_percent: -1.87,
  market_cap: null,
  volume: null,
  pe_ratio: null
};

describe('createStock', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a stock with all fields', async () => {
    const result = await createStock(testInput);

    // Basic field validation
    expect(result.symbol).toEqual('AAPL');
    expect(result.company_name).toEqual('Apple Inc.');
    expect(result.current_price).toEqual(150.25);
    expect(typeof result.current_price).toBe('number');
    expect(result.daily_change).toEqual(2.50);
    expect(typeof result.daily_change).toBe('number');
    expect(result.daily_change_percent).toEqual(1.69);
    expect(typeof result.daily_change_percent).toBe('number');
    expect(result.market_cap).toEqual(2500000000000);
    expect(typeof result.market_cap).toBe('number');
    expect(result.volume).toEqual(75000000);
    expect(result.pe_ratio).toEqual(28.5);
    expect(typeof result.pe_ratio).toBe('number');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a stock with nullable fields set to null', async () => {
    const result = await createStock(testInputWithNulls);

    // Basic field validation
    expect(result.symbol).toEqual('TSLA');
    expect(result.company_name).toEqual('Tesla Inc.');
    expect(result.current_price).toEqual(800.75);
    expect(result.daily_change).toEqual(-15.25);
    expect(result.daily_change_percent).toEqual(-1.87);
    expect(result.market_cap).toBeNull();
    expect(result.volume).toBeNull();
    expect(result.pe_ratio).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save stock to database', async () => {
    const result = await createStock(testInput);

    // Query using proper drizzle syntax
    const stocks = await db.select()
      .from(stocksTable)
      .where(eq(stocksTable.id, result.id))
      .execute();

    expect(stocks).toHaveLength(1);
    expect(stocks[0].symbol).toEqual('AAPL');
    expect(stocks[0].company_name).toEqual('Apple Inc.');
    expect(parseFloat(stocks[0].current_price)).toEqual(150.25);
    expect(parseFloat(stocks[0].daily_change)).toEqual(2.50);
    expect(parseFloat(stocks[0].daily_change_percent)).toEqual(1.69);
    expect(parseFloat(stocks[0].market_cap!)).toEqual(2500000000000);
    expect(stocks[0].volume).toEqual(75000000);
    expect(parseFloat(stocks[0].pe_ratio!)).toEqual(28.5);
    expect(stocks[0].created_at).toBeInstanceOf(Date);
    expect(stocks[0].updated_at).toBeInstanceOf(Date);
  });

  it('should save stock with null values correctly to database', async () => {
    const result = await createStock(testInputWithNulls);

    // Query using proper drizzle syntax
    const stocks = await db.select()
      .from(stocksTable)
      .where(eq(stocksTable.id, result.id))
      .execute();

    expect(stocks).toHaveLength(1);
    expect(stocks[0].symbol).toEqual('TSLA');
    expect(stocks[0].company_name).toEqual('Tesla Inc.');
    expect(parseFloat(stocks[0].current_price)).toEqual(800.75);
    expect(parseFloat(stocks[0].daily_change)).toEqual(-15.25);
    expect(parseFloat(stocks[0].daily_change_percent)).toEqual(-1.87);
    expect(stocks[0].market_cap).toBeNull();
    expect(stocks[0].volume).toBeNull();
    expect(stocks[0].pe_ratio).toBeNull();
  });

  it('should handle unique symbol constraint', async () => {
    // Create first stock
    await createStock(testInput);

    // Try to create duplicate symbol
    const duplicateInput: CreateStockInput = {
      ...testInput,
      company_name: 'Different Company'
    };

    await expect(createStock(duplicateInput)).rejects.toThrow(/unique/i);
  });

  it('should handle precision correctly for decimal fields', async () => {
    const precisionInput: CreateStockInput = {
      symbol: 'PREC',
      company_name: 'Precision Test',
      current_price: 123.4567, // 4 decimal places
      daily_change: -0.0123, // Small negative value
      daily_change_percent: 0.0001, // Very small percentage
      market_cap: 999999999999.99, // Large number with decimals
      volume: 1,
      pe_ratio: 0.01 // Very small PE ratio
    };

    const result = await createStock(precisionInput);

    expect(result.current_price).toEqual(123.4567);
    expect(result.daily_change).toEqual(-0.0123);
    expect(result.daily_change_percent).toEqual(0.0001);
    expect(result.market_cap).toEqual(999999999999.99);
    expect(result.pe_ratio).toEqual(0.01);
  });
});