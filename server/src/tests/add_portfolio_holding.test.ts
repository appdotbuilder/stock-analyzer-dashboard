import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { stocksTable, portfolioHoldingsTable } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { type AddPortfolioHoldingInput } from '../schema';
import { addPortfolioHolding } from '../handlers/add_portfolio_holding';

describe('addPortfolioHolding', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Test data
  const testStock = {
    symbol: 'AAPL',
    company_name: 'Apple Inc.',
    current_price: 150.0,
    daily_change: 2.5,
    daily_change_percent: 1.69,
    market_cap: 2500000000000,
    volume: 50000000,
    pe_ratio: 28.5
  };

  const testInput: AddPortfolioHoldingInput = {
    user_id: 'user123',
    symbol: 'AAPL',
    quantity: 10,
    average_cost: 145.0
  };

  it('should create new portfolio holding when user has no existing position', async () => {
    // Create prerequisite stock
    await db.insert(stocksTable).values({
      ...testStock,
      current_price: testStock.current_price.toString(),
      daily_change: testStock.daily_change.toString(),
      daily_change_percent: testStock.daily_change_percent.toString(),
      market_cap: testStock.market_cap.toString(),
      pe_ratio: testStock.pe_ratio.toString()
    }).execute();

    const result = await addPortfolioHolding(testInput);

    // Validate result
    expect(result.id).toBeDefined();
    expect(result.user_id).toBe('user123');
    expect(result.symbol).toBe('AAPL');
    expect(result.stock_id).toBeDefined();
    expect(result.quantity).toBe(10);
    expect(result.average_cost).toBe(145.0);
    expect(result.current_value).toBe(1500.0); // 10 * 150.0
    expect(result.total_return).toBe(50.0); // 1500 - (10 * 145)
    expect(result.total_return_percent).toBeCloseTo(3.45, 1); // (50/1450) * 100
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Verify numeric field types
    expect(typeof result.quantity).toBe('number');
    expect(typeof result.average_cost).toBe('number');
    expect(typeof result.current_value).toBe('number');
    expect(typeof result.total_return).toBe('number');
    expect(typeof result.total_return_percent).toBe('number');
  });

  it('should save new holding to database', async () => {
    // Create prerequisite stock
    const stockResults = await db.insert(stocksTable).values({
      ...testStock,
      current_price: testStock.current_price.toString(),
      daily_change: testStock.daily_change.toString(),
      daily_change_percent: testStock.daily_change_percent.toString(),
      market_cap: testStock.market_cap.toString(),
      pe_ratio: testStock.pe_ratio.toString()
    }).returning().execute();

    const result = await addPortfolioHolding(testInput);

    // Query database directly
    const holdings = await db.select()
      .from(portfolioHoldingsTable)
      .where(eq(portfolioHoldingsTable.id, result.id))
      .execute();

    expect(holdings).toHaveLength(1);
    expect(holdings[0].user_id).toBe('user123');
    expect(holdings[0].stock_id).toBe(stockResults[0].id);
    expect(holdings[0].symbol).toBe('AAPL');
    expect(parseFloat(holdings[0].quantity)).toBe(10);
    expect(parseFloat(holdings[0].average_cost)).toBe(145.0);
    expect(parseFloat(holdings[0].current_value)).toBe(1500.0);
  });

  it('should update existing holding when user already has position', async () => {
    // Create prerequisite stock
    const stockResults = await db.insert(stocksTable).values({
      ...testStock,
      current_price: testStock.current_price.toString(),
      daily_change: testStock.daily_change.toString(),
      daily_change_percent: testStock.daily_change_percent.toString(),
      market_cap: testStock.market_cap.toString(),
      pe_ratio: testStock.pe_ratio.toString()
    }).returning().execute();

    // Create existing holding: 5 shares at $140
    const existingHoldingResults = await db.insert(portfolioHoldingsTable).values({
      user_id: 'user123',
      stock_id: stockResults[0].id,
      symbol: 'AAPL',
      quantity: '5',
      average_cost: '140.0',
      current_value: '750.0',
      total_return: '50.0',
      total_return_percent: '7.14'
    }).returning().execute();

    // Add another 10 shares at $145
    const result = await addPortfolioHolding(testInput);

    // Should update existing holding
    expect(result.id).toBe(existingHoldingResults[0].id);
    expect(result.quantity).toBe(15); // 5 + 10
    expect(result.average_cost).toBeCloseTo(143.33, 2); // ((5*140) + (10*145)) / 15
    expect(result.current_value).toBe(2250.0); // 15 * 150
    expect(result.total_return).toBeCloseTo(100.0, 1); // 2250 - (15 * 143.33)
    expect(result.total_return_percent).toBeCloseTo(4.65, 1);
  });

  it('should handle zero cost basis correctly', async () => {
    // Create prerequisite stock
    await db.insert(stocksTable).values({
      ...testStock,
      current_price: testStock.current_price.toString(),
      daily_change: testStock.daily_change.toString(),
      daily_change_percent: testStock.daily_change_percent.toString(),
      market_cap: testStock.market_cap.toString(),
      pe_ratio: testStock.pe_ratio.toString()
    }).execute();

    const zeroCostInput: AddPortfolioHoldingInput = {
      user_id: 'user123',
      symbol: 'AAPL',
      quantity: 10,
      average_cost: 0
    };

    const result = await addPortfolioHolding(zeroCostInput);

    expect(result.average_cost).toBe(0);
    expect(result.current_value).toBe(1500.0);
    expect(result.total_return).toBe(1500.0); // All gain since cost is 0
    expect(result.total_return_percent).toBe(0); // Division by zero should return 0
  });

  it('should handle fractional shares', async () => {
    // Create prerequisite stock
    await db.insert(stocksTable).values({
      ...testStock,
      current_price: testStock.current_price.toString(),
      daily_change: testStock.daily_change.toString(),
      daily_change_percent: testStock.daily_change_percent.toString(),
      market_cap: testStock.market_cap.toString(),
      pe_ratio: testStock.pe_ratio.toString()
    }).execute();

    const fractionalInput: AddPortfolioHoldingInput = {
      user_id: 'user123',
      symbol: 'AAPL',
      quantity: 2.5,
      average_cost: 148.75
    };

    const result = await addPortfolioHolding(fractionalInput);

    expect(result.quantity).toBe(2.5);
    expect(result.average_cost).toBe(148.75);
    expect(result.current_value).toBe(375.0); // 2.5 * 150
    expect(result.total_return).toBeCloseTo(3.125, 2); // 375 - (2.5 * 148.75)
    expect(result.total_return_percent).toBeCloseTo(0.84, 2);
  });

  it('should throw error when stock symbol not found', async () => {
    const invalidInput: AddPortfolioHoldingInput = {
      user_id: 'user123',
      symbol: 'INVALID',
      quantity: 10,
      average_cost: 145.0
    };

    await expect(addPortfolioHolding(invalidInput)).rejects.toThrow(/stock with symbol INVALID not found/i);
  });

  it('should handle different users independently', async () => {
    // Create prerequisite stock
    await db.insert(stocksTable).values({
      ...testStock,
      current_price: testStock.current_price.toString(),
      daily_change: testStock.daily_change.toString(),
      daily_change_percent: testStock.daily_change_percent.toString(),
      market_cap: testStock.market_cap.toString(),
      pe_ratio: testStock.pe_ratio.toString()
    }).execute();

    const user1Input: AddPortfolioHoldingInput = {
      user_id: 'user1',
      symbol: 'AAPL',
      quantity: 10,
      average_cost: 145.0
    };

    const user2Input: AddPortfolioHoldingInput = {
      user_id: 'user2',
      symbol: 'AAPL',
      quantity: 5,
      average_cost: 150.0
    };

    const result1 = await addPortfolioHolding(user1Input);
    const result2 = await addPortfolioHolding(user2Input);

    expect(result1.user_id).toBe('user1');
    expect(result1.quantity).toBe(10);
    expect(result2.user_id).toBe('user2');
    expect(result2.quantity).toBe(5);

    // Verify both holdings exist independently
    const user1Holdings = await db.select()
      .from(portfolioHoldingsTable)
      .where(eq(portfolioHoldingsTable.user_id, 'user1'))
      .execute();

    const user2Holdings = await db.select()
      .from(portfolioHoldingsTable)
      .where(eq(portfolioHoldingsTable.user_id, 'user2'))
      .execute();

    expect(user1Holdings).toHaveLength(1);
    expect(user2Holdings).toHaveLength(1);
  });

  it('should update same user adding to same stock multiple times', async () => {
    // Create prerequisite stock
    await db.insert(stocksTable).values({
      ...testStock,
      current_price: testStock.current_price.toString(),
      daily_change: testStock.daily_change.toString(),
      daily_change_percent: testStock.daily_change_percent.toString(),
      market_cap: testStock.market_cap.toString(),
      pe_ratio: testStock.pe_ratio.toString()
    }).execute();

    // First addition
    const result1 = await addPortfolioHolding(testInput);
    expect(result1.quantity).toBe(10);

    // Second addition  
    const secondInput: AddPortfolioHoldingInput = {
      user_id: 'user123',
      symbol: 'AAPL',
      quantity: 5,
      average_cost: 160.0
    };

    const result2 = await addPortfolioHolding(secondInput);
    expect(result2.id).toBe(result1.id); // Same holding record updated
    expect(result2.quantity).toBe(15); // 10 + 5

    // Verify only one holding exists
    const holdings = await db.select()
      .from(portfolioHoldingsTable)
      .where(and(
        eq(portfolioHoldingsTable.user_id, 'user123'),
        eq(portfolioHoldingsTable.symbol, 'AAPL')
      ))
      .execute();

    expect(holdings).toHaveLength(1);
  });
});