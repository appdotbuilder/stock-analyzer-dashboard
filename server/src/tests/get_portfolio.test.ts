import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { stocksTable, portfolioHoldingsTable } from '../db/schema';
import { type GetPortfolioInput } from '../schema';
import { getPortfolio } from '../handlers/get_portfolio';

// Test input
const testInput: GetPortfolioInput = {
  user_id: 'test-user-123'
};

describe('getPortfolio', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array for user with no holdings', async () => {
    const result = await getPortfolio(testInput);

    expect(result).toEqual([]);
  });

  it('should fetch portfolio holdings with current values', async () => {
    // Create test stocks
    const stocksResult = await db.insert(stocksTable)
      .values([
        {
          symbol: 'AAPL',
          company_name: 'Apple Inc.',
          current_price: '150.00',
          daily_change: '2.50',
          daily_change_percent: '1.69',
          market_cap: '2400000000000',
          volume: 85000000,
          pe_ratio: '28.50'
        },
        {
          symbol: 'GOOGL',
          company_name: 'Alphabet Inc.',
          current_price: '2500.00',
          daily_change: '-10.00',
          daily_change_percent: '-0.40',
          market_cap: '1650000000000',
          volume: 1200000,
          pe_ratio: '25.30'
        }
      ])
      .returning()
      .execute();

    // Create portfolio holdings
    await db.insert(portfolioHoldingsTable)
      .values([
        {
          user_id: 'test-user-123',
          stock_id: stocksResult[0].id,
          symbol: 'AAPL',
          quantity: '10.0000',
          average_cost: '140.0000',
          current_value: '1400.00',
          total_return: '0.00',
          total_return_percent: '0.0000'
        },
        {
          user_id: 'test-user-123',
          stock_id: stocksResult[1].id,
          symbol: 'GOOGL',
          quantity: '2.0000',
          average_cost: '2600.0000',
          current_value: '5200.00',
          total_return: '0.00',
          total_return_percent: '0.0000'
        }
      ])
      .execute();

    const result = await getPortfolio(testInput);

    expect(result).toHaveLength(2);

    // Check AAPL holding
    const appleHolding = result.find(h => h.symbol === 'AAPL');
    expect(appleHolding).toBeDefined();
    expect(appleHolding!.user_id).toBe('test-user-123');
    expect(appleHolding!.symbol).toBe('AAPL');
    expect(appleHolding!.quantity).toBe(10);
    expect(appleHolding!.average_cost).toBe(140);
    expect(appleHolding!.current_value).toBe(1500); // 10 * 150 (current price)
    expect(appleHolding!.total_return).toBe(100); // 1500 - 1400 (total cost)
    expect(appleHolding!.total_return_percent).toBeCloseTo(7.14, 1); // (100 / 1400) * 100
    expect(appleHolding!.created_at).toBeInstanceOf(Date);
    expect(appleHolding!.updated_at).toBeInstanceOf(Date);

    // Check GOOGL holding
    const googleHolding = result.find(h => h.symbol === 'GOOGL');
    expect(googleHolding).toBeDefined();
    expect(googleHolding!.user_id).toBe('test-user-123');
    expect(googleHolding!.symbol).toBe('GOOGL');
    expect(googleHolding!.quantity).toBe(2);
    expect(googleHolding!.average_cost).toBe(2600);
    expect(googleHolding!.current_value).toBe(5000); // 2 * 2500 (current price)
    expect(googleHolding!.total_return).toBe(-200); // 5000 - 5200 (total cost)
    expect(googleHolding!.total_return_percent).toBeCloseTo(-3.85, 1); // (-200 / 5200) * 100
  });

  it('should only return holdings for specified user', async () => {
    // Create test stock
    const stockResult = await db.insert(stocksTable)
      .values({
        symbol: 'TSLA',
        company_name: 'Tesla Inc.',
        current_price: '800.00',
        daily_change: '15.00',
        daily_change_percent: '1.91',
        market_cap: '800000000000',
        volume: 25000000,
        pe_ratio: '60.25'
      })
      .returning()
      .execute();

    // Create holdings for different users
    await db.insert(portfolioHoldingsTable)
      .values([
        {
          user_id: 'test-user-123',
          stock_id: stockResult[0].id,
          symbol: 'TSLA',
          quantity: '5.0000',
          average_cost: '750.0000',
          current_value: '3750.00',
          total_return: '250.00',
          total_return_percent: '6.6667'
        },
        {
          user_id: 'other-user-456',
          stock_id: stockResult[0].id,
          symbol: 'TSLA',
          quantity: '3.0000',
          average_cost: '850.0000',
          current_value: '2550.00',
          total_return: '-150.00',
          total_return_percent: '-5.8824'
        }
      ])
      .execute();

    const result = await getPortfolio(testInput);

    expect(result).toHaveLength(1);
    expect(result[0].user_id).toBe('test-user-123');
    expect(result[0].symbol).toBe('TSLA');
    expect(result[0].quantity).toBe(5);
    expect(result[0].current_value).toBe(4000); // 5 * 800 (current price)
  });

  it('should handle zero average cost correctly', async () => {
    // Create test stock
    const stockResult = await db.insert(stocksTable)
      .values({
        symbol: 'FREE',
        company_name: 'Free Stock Co.',
        current_price: '10.00',
        daily_change: '0.50',
        daily_change_percent: '5.26',
        market_cap: '1000000000',
        volume: 500000,
        pe_ratio: '15.00'
      })
      .returning()
      .execute();

    // Create holding with zero average cost (e.g., from stock split or dividend)
    await db.insert(portfolioHoldingsTable)
      .values({
        user_id: 'test-user-123',
        stock_id: stockResult[0].id,
        symbol: 'FREE',
        quantity: '100.0000',
        average_cost: '0.0000',
        current_value: '0.00',
        total_return: '0.00',
        total_return_percent: '0.0000'
      })
      .execute();

    const result = await getPortfolio(testInput);

    expect(result).toHaveLength(1);
    expect(result[0].average_cost).toBe(0);
    expect(result[0].current_value).toBe(1000); // 100 * 10
    expect(result[0].total_return).toBe(1000); // 1000 - 0
    expect(result[0].total_return_percent).toBe(0); // Should handle division by zero
  });

  it('should handle fractional quantities correctly', async () => {
    // Create test stock
    const stockResult = await db.insert(stocksTable)
      .values({
        symbol: 'BRK.A',
        company_name: 'Berkshire Hathaway',
        current_price: '450000.00',
        daily_change: '1000.00',
        daily_change_percent: '0.22',
        market_cap: '650000000000',
        volume: 100,
        pe_ratio: '22.50'
      })
      .returning()
      .execute();

    // Create holding with fractional quantity
    await db.insert(portfolioHoldingsTable)
      .values({
        user_id: 'test-user-123',
        stock_id: stockResult[0].id,
        symbol: 'BRK.A',
        quantity: '0.2500',
        average_cost: '440000.0000',
        current_value: '110000.00',
        total_return: '2500.00',
        total_return_percent: '2.3256'
      })
      .execute();

    const result = await getPortfolio(testInput);

    expect(result).toHaveLength(1);
    expect(result[0].quantity).toBe(0.25);
    expect(result[0].average_cost).toBe(440000);
    expect(result[0].current_value).toBe(112500); // 0.25 * 450000
    expect(result[0].total_return).toBe(2500); // 112500 - 110000
    expect(result[0].total_return_percent).toBeCloseTo(2.27, 1); // (2500 / 110000) * 100
  });
});