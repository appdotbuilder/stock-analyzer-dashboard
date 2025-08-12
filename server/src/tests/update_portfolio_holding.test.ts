import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { stocksTable, portfolioHoldingsTable } from '../db/schema';
import { type UpdatePortfolioHoldingInput, type CreateStockInput, type AddPortfolioHoldingInput } from '../schema';
import { updatePortfolioHolding } from '../handlers/update_portfolio_holding';
import { eq } from 'drizzle-orm';

// Test data
const testStock: CreateStockInput = {
  symbol: 'AAPL',
  company_name: 'Apple Inc.',
  current_price: 150.00,
  daily_change: 2.50,
  daily_change_percent: 1.69,
  market_cap: 2400000000000,
  volume: 50000000,
  pe_ratio: 28.5
};

const testHolding: AddPortfolioHoldingInput = {
  user_id: 'user123',
  symbol: 'AAPL',
  quantity: 10,
  average_cost: 140.00
};

describe('updatePortfolioHolding', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update portfolio holding quantity', async () => {
    // Create stock first
    const stockResult = await db.insert(stocksTable)
      .values({
        symbol: testStock.symbol,
        company_name: testStock.company_name,
        current_price: testStock.current_price.toString(),
        daily_change: testStock.daily_change.toString(),
        daily_change_percent: testStock.daily_change_percent.toString(),
        market_cap: testStock.market_cap?.toString(),
        volume: testStock.volume,
        pe_ratio: testStock.pe_ratio?.toString()
      })
      .returning()
      .execute();

    const stock = stockResult[0];

    // Create portfolio holding
    const holdingResult = await db.insert(portfolioHoldingsTable)
      .values({
        user_id: testHolding.user_id,
        stock_id: stock.id,
        symbol: testHolding.symbol,
        quantity: testHolding.quantity.toString(),
        average_cost: testHolding.average_cost.toString(),
        current_value: (testHolding.quantity * testStock.current_price).toString(),
        total_return: ((testHolding.quantity * testStock.current_price) - (testHolding.quantity * testHolding.average_cost)).toString(),
        total_return_percent: (((testStock.current_price - testHolding.average_cost) / testHolding.average_cost) * 100).toString()
      })
      .returning()
      .execute();

    const originalHolding = holdingResult[0];

    // Update quantity
    const updateInput: UpdatePortfolioHoldingInput = {
      id: originalHolding.id,
      quantity: 15
    };

    const result = await updatePortfolioHolding(updateInput);

    // Verify updated values
    expect(result.id).toEqual(originalHolding.id);
    expect(result.user_id).toEqual(testHolding.user_id);
    expect(result.symbol).toEqual(testStock.symbol);
    expect(result.quantity).toEqual(15);
    expect(result.average_cost).toEqual(140.00); // Should remain unchanged
    expect(result.current_value).toEqual(2250.00); // 15 * 150.00
    expect(result.total_return).toEqual(150.00); // 2250 - (15 * 140)
    expect(result.total_return_percent).toBeCloseTo(7.14, 1); // (150 / 2100) * 100
    expect(typeof result.quantity).toBe('number');
    expect(typeof result.average_cost).toBe('number');
    expect(typeof result.current_value).toBe('number');
    expect(typeof result.total_return).toBe('number');
    expect(typeof result.total_return_percent).toBe('number');
  });

  it('should update portfolio holding average cost', async () => {
    // Create stock
    const stockResult = await db.insert(stocksTable)
      .values({
        symbol: testStock.symbol,
        company_name: testStock.company_name,
        current_price: testStock.current_price.toString(),
        daily_change: testStock.daily_change.toString(),
        daily_change_percent: testStock.daily_change_percent.toString(),
        market_cap: testStock.market_cap?.toString(),
        volume: testStock.volume,
        pe_ratio: testStock.pe_ratio?.toString()
      })
      .returning()
      .execute();

    const stock = stockResult[0];

    // Create portfolio holding
    const holdingResult = await db.insert(portfolioHoldingsTable)
      .values({
        user_id: testHolding.user_id,
        stock_id: stock.id,
        symbol: testHolding.symbol,
        quantity: testHolding.quantity.toString(),
        average_cost: testHolding.average_cost.toString(),
        current_value: (testHolding.quantity * testStock.current_price).toString(),
        total_return: ((testHolding.quantity * testStock.current_price) - (testHolding.quantity * testHolding.average_cost)).toString(),
        total_return_percent: (((testStock.current_price - testHolding.average_cost) / testHolding.average_cost) * 100).toString()
      })
      .returning()
      .execute();

    const originalHolding = holdingResult[0];

    // Update average cost
    const updateInput: UpdatePortfolioHoldingInput = {
      id: originalHolding.id,
      average_cost: 145.00
    };

    const result = await updatePortfolioHolding(updateInput);

    // Verify updated values
    expect(result.quantity).toEqual(10); // Should remain unchanged
    expect(result.average_cost).toEqual(145.00);
    expect(result.current_value).toEqual(1500.00); // 10 * 150.00
    expect(result.total_return).toEqual(50.00); // 1500 - (10 * 145)
    expect(result.total_return_percent).toBeCloseTo(3.45, 1); // (50 / 1450) * 100
  });

  it('should update both quantity and average cost', async () => {
    // Create stock
    const stockResult = await db.insert(stocksTable)
      .values({
        symbol: testStock.symbol,
        company_name: testStock.company_name,
        current_price: testStock.current_price.toString(),
        daily_change: testStock.daily_change.toString(),
        daily_change_percent: testStock.daily_change_percent.toString(),
        market_cap: testStock.market_cap?.toString(),
        volume: testStock.volume,
        pe_ratio: testStock.pe_ratio?.toString()
      })
      .returning()
      .execute();

    const stock = stockResult[0];

    // Create portfolio holding
    const holdingResult = await db.insert(portfolioHoldingsTable)
      .values({
        user_id: testHolding.user_id,
        stock_id: stock.id,
        symbol: testHolding.symbol,
        quantity: testHolding.quantity.toString(),
        average_cost: testHolding.average_cost.toString(),
        current_value: (testHolding.quantity * testStock.current_price).toString(),
        total_return: ((testHolding.quantity * testStock.current_price) - (testHolding.quantity * testHolding.average_cost)).toString(),
        total_return_percent: (((testStock.current_price - testHolding.average_cost) / testHolding.average_cost) * 100).toString()
      })
      .returning()
      .execute();

    const originalHolding = holdingResult[0];

    // Update both quantity and average cost
    const updateInput: UpdatePortfolioHoldingInput = {
      id: originalHolding.id,
      quantity: 20,
      average_cost: 135.00
    };

    const result = await updatePortfolioHolding(updateInput);

    // Verify updated values
    expect(result.quantity).toEqual(20);
    expect(result.average_cost).toEqual(135.00);
    expect(result.current_value).toEqual(3000.00); // 20 * 150.00
    expect(result.total_return).toEqual(300.00); // 3000 - (20 * 135)
    expect(result.total_return_percent).toBeCloseTo(11.11, 1); // (300 / 2700) * 100
  });

  it('should save updated holding to database', async () => {
    // Create stock
    const stockResult = await db.insert(stocksTable)
      .values({
        symbol: testStock.symbol,
        company_name: testStock.company_name,
        current_price: testStock.current_price.toString(),
        daily_change: testStock.daily_change.toString(),
        daily_change_percent: testStock.daily_change_percent.toString(),
        market_cap: testStock.market_cap?.toString(),
        volume: testStock.volume,
        pe_ratio: testStock.pe_ratio?.toString()
      })
      .returning()
      .execute();

    const stock = stockResult[0];

    // Create portfolio holding
    const holdingResult = await db.insert(portfolioHoldingsTable)
      .values({
        user_id: testHolding.user_id,
        stock_id: stock.id,
        symbol: testHolding.symbol,
        quantity: testHolding.quantity.toString(),
        average_cost: testHolding.average_cost.toString(),
        current_value: (testHolding.quantity * testStock.current_price).toString(),
        total_return: ((testHolding.quantity * testStock.current_price) - (testHolding.quantity * testHolding.average_cost)).toString(),
        total_return_percent: (((testStock.current_price - testHolding.average_cost) / testHolding.average_cost) * 100).toString()
      })
      .returning()
      .execute();

    const originalHolding = holdingResult[0];

    const updateInput: UpdatePortfolioHoldingInput = {
      id: originalHolding.id,
      quantity: 12
    };

    const result = await updatePortfolioHolding(updateInput);

    // Query database to verify changes were saved
    const savedHolding = await db.select()
      .from(portfolioHoldingsTable)
      .where(eq(portfolioHoldingsTable.id, result.id))
      .execute();

    expect(savedHolding).toHaveLength(1);
    expect(parseFloat(savedHolding[0].quantity)).toEqual(12);
    expect(parseFloat(savedHolding[0].current_value)).toEqual(1800.00); // 12 * 150.00
    expect(savedHolding[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when holding not found', async () => {
    const updateInput: UpdatePortfolioHoldingInput = {
      id: 999,
      quantity: 10
    };

    await expect(updatePortfolioHolding(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should handle zero total cost correctly', async () => {
    // Create stock
    const stockResult = await db.insert(stocksTable)
      .values({
        symbol: testStock.symbol,
        company_name: testStock.company_name,
        current_price: testStock.current_price.toString(),
        daily_change: testStock.daily_change.toString(),
        daily_change_percent: testStock.daily_change_percent.toString(),
        market_cap: testStock.market_cap?.toString(),
        volume: testStock.volume,
        pe_ratio: testStock.pe_ratio?.toString()
      })
      .returning()
      .execute();

    const stock = stockResult[0];

    // Create portfolio holding with zero average cost
    const holdingResult = await db.insert(portfolioHoldingsTable)
      .values({
        user_id: testHolding.user_id,
        stock_id: stock.id,
        symbol: testHolding.symbol,
        quantity: testHolding.quantity.toString(),
        average_cost: '0',
        current_value: '0',
        total_return: '0',
        total_return_percent: '0'
      })
      .returning()
      .execute();

    const originalHolding = holdingResult[0];

    const updateInput: UpdatePortfolioHoldingInput = {
      id: originalHolding.id,
      average_cost: 0
    };

    const result = await updatePortfolioHolding(updateInput);

    // Should handle division by zero gracefully
    expect(result.total_return_percent).toEqual(0);
    expect(result.current_value).toEqual(1500.00); // 10 * 150.00
    expect(result.total_return).toEqual(1500.00); // 1500 - (10 * 0)
  });

  it('should calculate negative returns correctly', async () => {
    // Create stock with lower current price
    const lowerPriceStock = {
      ...testStock,
      current_price: 120.00 // Lower than average cost of 140
    };

    const stockResult = await db.insert(stocksTable)
      .values({
        symbol: lowerPriceStock.symbol,
        company_name: lowerPriceStock.company_name,
        current_price: lowerPriceStock.current_price.toString(),
        daily_change: lowerPriceStock.daily_change.toString(),
        daily_change_percent: lowerPriceStock.daily_change_percent.toString(),
        market_cap: lowerPriceStock.market_cap?.toString(),
        volume: lowerPriceStock.volume,
        pe_ratio: lowerPriceStock.pe_ratio?.toString()
      })
      .returning()
      .execute();

    const stock = stockResult[0];

    // Create portfolio holding
    const holdingResult = await db.insert(portfolioHoldingsTable)
      .values({
        user_id: testHolding.user_id,
        stock_id: stock.id,
        symbol: testHolding.symbol,
        quantity: testHolding.quantity.toString(),
        average_cost: testHolding.average_cost.toString(),
        current_value: '0',
        total_return: '0',
        total_return_percent: '0'
      })
      .returning()
      .execute();

    const originalHolding = holdingResult[0];

    const updateInput: UpdatePortfolioHoldingInput = {
      id: originalHolding.id,
      quantity: 5
    };

    const result = await updatePortfolioHolding(updateInput);

    // Should calculate negative returns correctly
    expect(result.current_value).toEqual(600.00); // 5 * 120.00
    expect(result.total_return).toEqual(-100.00); // 600 - (5 * 140)
    expect(result.total_return_percent).toBeCloseTo(-14.29, 1); // (-100 / 700) * 100
  });
});