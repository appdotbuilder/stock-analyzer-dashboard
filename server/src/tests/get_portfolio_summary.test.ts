import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { stocksTable, portfolioHoldingsTable } from '../db/schema';
import { type GetPortfolioInput } from '../schema';
import { getPortfolioSummary } from '../handlers/get_portfolio_summary';

// Test input
const testInput: GetPortfolioInput = {
  user_id: 'user123'
};

describe('getPortfolioSummary', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty summary for user with no holdings', async () => {
    const result = await getPortfolioSummary(testInput);

    expect(result.user_id).toEqual('user123');
    expect(result.total_value).toEqual(0);
    expect(result.total_cost).toEqual(0);
    expect(result.total_return).toEqual(0);
    expect(result.total_return_percent).toEqual(0);
    expect(result.daily_change).toEqual(0);
    expect(result.daily_change_percent).toEqual(0);
    expect(result.holdings_count).toEqual(0);
    expect(result.last_updated).toBeInstanceOf(Date);
  });

  it('should calculate portfolio summary for single holding', async () => {
    // Create test stock
    const [stock] = await db.insert(stocksTable)
      .values({
        symbol: 'AAPL',
        company_name: 'Apple Inc.',
        current_price: '150.00',
        daily_change: '2.50',
        daily_change_percent: '1.69',
        market_cap: '2400000000000',
        volume: 50000000,
        pe_ratio: '25.5'
      })
      .returning()
      .execute();

    // Create portfolio holding
    await db.insert(portfolioHoldingsTable)
      .values({
        user_id: 'user123',
        stock_id: stock.id,
        symbol: 'AAPL',
        quantity: '10.0000',
        average_cost: '140.0000',
        current_value: '1500.00',
        total_return: '100.00',
        total_return_percent: '7.1429'
      })
      .execute();

    const result = await getPortfolioSummary(testInput);

    expect(result.user_id).toEqual('user123');
    expect(result.total_value).toEqual(1500);
    expect(result.total_cost).toEqual(1400); // 10 * 140
    expect(result.total_return).toEqual(100);
    expect(result.total_return_percent).toBeCloseTo(7.14, 1);
    expect(result.holdings_count).toEqual(1);
    expect(result.last_updated).toBeInstanceOf(Date);

    // Verify numeric type conversions
    expect(typeof result.total_value).toBe('number');
    expect(typeof result.total_cost).toBe('number');
    expect(typeof result.total_return).toBe('number');
    expect(typeof result.total_return_percent).toBe('number');
  });

  it('should calculate portfolio summary for multiple holdings', async () => {
    // Create test stocks
    const [stock1] = await db.insert(stocksTable)
      .values({
        symbol: 'AAPL',
        company_name: 'Apple Inc.',
        current_price: '150.00',
        daily_change: '2.50',
        daily_change_percent: '1.69',
        market_cap: '2400000000000',
        volume: 50000000,
        pe_ratio: '25.5'
      })
      .returning()
      .execute();

    const [stock2] = await db.insert(stocksTable)
      .values({
        symbol: 'GOOGL',
        company_name: 'Alphabet Inc.',
        current_price: '2800.00',
        daily_change: '-15.00',
        daily_change_percent: '-0.53',
        market_cap: '1800000000000',
        volume: 1200000,
        pe_ratio: '22.8'
      })
      .returning()
      .execute();

    // Create portfolio holdings
    await db.insert(portfolioHoldingsTable)
      .values([
        {
          user_id: 'user123',
          stock_id: stock1.id,
          symbol: 'AAPL',
          quantity: '10.0000',
          average_cost: '140.0000',
          current_value: '1500.00',
          total_return: '100.00',
          total_return_percent: '7.1429'
        },
        {
          user_id: 'user123',
          stock_id: stock2.id,
          symbol: 'GOOGL',
          quantity: '2.0000',
          average_cost: '2900.0000',
          current_value: '5600.00',
          total_return: '-600.00',
          total_return_percent: '-9.6774'
        }
      ])
      .execute();

    const result = await getPortfolioSummary(testInput);

    expect(result.user_id).toEqual('user123');
    expect(result.total_value).toEqual(7100); // 1500 + 5600
    expect(result.total_cost).toEqual(7200); // (10 * 140) + (2 * 2900)
    expect(result.total_return).toEqual(-500); // 100 + (-600)
    expect(result.total_return_percent).toBeCloseTo(-6.94, 1); // -500/7200 * 100
    expect(result.holdings_count).toEqual(2);
    expect(result.last_updated).toBeInstanceOf(Date);
  });

  it('should handle portfolio with zero cost basis', async () => {
    // Create test stock
    const [stock] = await db.insert(stocksTable)
      .values({
        symbol: 'GIFT',
        company_name: 'Gift Stock',
        current_price: '50.00',
        daily_change: '1.00',
        daily_change_percent: '2.04',
        market_cap: '1000000000',
        volume: 100000,
        pe_ratio: '15.0'
      })
      .returning()
      .execute();

    // Create holding with zero average cost (gifted stock)
    await db.insert(portfolioHoldingsTable)
      .values({
        user_id: 'user123',
        stock_id: stock.id,
        symbol: 'GIFT',
        quantity: '5.0000',
        average_cost: '0.0000',
        current_value: '250.00',
        total_return: '250.00',
        total_return_percent: '0.0000'
      })
      .execute();

    const result = await getPortfolioSummary(testInput);

    expect(result.user_id).toEqual('user123');
    expect(result.total_value).toEqual(250);
    expect(result.total_cost).toEqual(0);
    expect(result.total_return).toEqual(250);
    expect(result.total_return_percent).toEqual(0); // Should handle division by zero
    expect(result.holdings_count).toEqual(1);
  });

  it('should only return holdings for specified user', async () => {
    // Create test stock
    const [stock] = await db.insert(stocksTable)
      .values({
        symbol: 'AAPL',
        company_name: 'Apple Inc.',
        current_price: '150.00',
        daily_change: '2.50',
        daily_change_percent: '1.69',
        market_cap: '2400000000000',
        volume: 50000000,
        pe_ratio: '25.5'
      })
      .returning()
      .execute();

    // Create holdings for different users
    await db.insert(portfolioHoldingsTable)
      .values([
        {
          user_id: 'user123',
          stock_id: stock.id,
          symbol: 'AAPL',
          quantity: '10.0000',
          average_cost: '140.0000',
          current_value: '1500.00',
          total_return: '100.00',
          total_return_percent: '7.1429'
        },
        {
          user_id: 'other_user',
          stock_id: stock.id,
          symbol: 'AAPL',
          quantity: '5.0000',
          average_cost: '160.0000',
          current_value: '750.00',
          total_return: '-50.00',
          total_return_percent: '-6.2500'
        }
      ])
      .execute();

    const result = await getPortfolioSummary(testInput);

    // Should only include user123's holdings
    expect(result.user_id).toEqual('user123');
    expect(result.total_value).toEqual(1500);
    expect(result.total_cost).toEqual(1400);
    expect(result.total_return).toEqual(100);
    expect(result.holdings_count).toEqual(1);
  });

  it('should handle mixed positive and negative returns', async () => {
    // Create test stocks
    const stocks = await db.insert(stocksTable)
      .values([
        {
          symbol: 'WINNER',
          company_name: 'Winning Stock',
          current_price: '120.00',
          daily_change: '5.00',
          daily_change_percent: '4.35',
          market_cap: '500000000',
          volume: 1000000,
          pe_ratio: '18.5'
        },
        {
          symbol: 'LOSER',
          company_name: 'Losing Stock',
          current_price: '80.00',
          daily_change: '-10.00',
          daily_change_percent: '-11.11',
          market_cap: '300000000',
          volume: 800000,
          pe_ratio: '12.2'
        }
      ])
      .returning()
      .execute();

    // Create portfolio holdings with mixed returns
    await db.insert(portfolioHoldingsTable)
      .values([
        {
          user_id: 'user123',
          stock_id: stocks[0].id,
          symbol: 'WINNER',
          quantity: '8.0000',
          average_cost: '100.0000',
          current_value: '960.00',
          total_return: '160.00',
          total_return_percent: '20.0000'
        },
        {
          user_id: 'user123',
          stock_id: stocks[1].id,
          symbol: 'LOSER',
          quantity: '12.0000',
          average_cost: '100.0000',
          current_value: '960.00',
          total_return: '-240.00',
          total_return_percent: '-20.0000'
        }
      ])
      .execute();

    const result = await getPortfolioSummary(testInput);

    expect(result.user_id).toEqual('user123');
    expect(result.total_value).toEqual(1920); // 960 + 960
    expect(result.total_cost).toEqual(2000); // (8 * 100) + (12 * 100)
    expect(result.total_return).toEqual(-80); // 160 + (-240)
    expect(result.total_return_percent).toBeCloseTo(-4.0, 1); // -80/2000 * 100
    expect(result.holdings_count).toEqual(2);
  });
});