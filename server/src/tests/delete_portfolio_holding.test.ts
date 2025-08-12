import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { stocksTable, portfolioHoldingsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type DeleteItemInput } from '../schema';
import { deletePortfolioHolding } from '../handlers/delete_portfolio_holding';

describe('deletePortfolioHolding', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing portfolio holding', async () => {
    // Create prerequisite stock data
    const stockResult = await db.insert(stocksTable)
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

    const stock = stockResult[0];

    // Create portfolio holding
    const holdingResult = await db.insert(portfolioHoldingsTable)
      .values({
        user_id: 'user123',
        stock_id: stock.id,
        symbol: 'AAPL',
        quantity: '100.0000',
        average_cost: '140.0000',
        current_value: '15025.00',
        total_return: '1025.00',
        total_return_percent: '7.3214'
      })
      .returning()
      .execute();

    const holding = holdingResult[0];

    const input: DeleteItemInput = {
      id: holding.id
    };

    // Delete the portfolio holding
    const result = await deletePortfolioHolding(input);

    // Verify deletion was successful
    expect(result).toBe(true);

    // Verify record was actually deleted from database
    const deletedHoldings = await db.select()
      .from(portfolioHoldingsTable)
      .where(eq(portfolioHoldingsTable.id, holding.id))
      .execute();

    expect(deletedHoldings).toHaveLength(0);
  });

  it('should return false when portfolio holding does not exist', async () => {
    const input: DeleteItemInput = {
      id: 99999 // Non-existent ID
    };

    // Attempt to delete non-existent portfolio holding
    const result = await deletePortfolioHolding(input);

    // Should return false for non-existent record
    expect(result).toBe(false);
  });

  it('should not affect other portfolio holdings', async () => {
    // Create prerequisite stock data
    const stockResult = await db.insert(stocksTable)
      .values({
        symbol: 'GOOGL',
        company_name: 'Alphabet Inc.',
        current_price: '2500.00',
        daily_change: '25.00',
        daily_change_percent: '1.01',
        market_cap: '1600000000000',
        volume: 2000000,
        pe_ratio: '25.0'
      })
      .returning()
      .execute();

    const stock = stockResult[0];

    // Create multiple portfolio holdings for the same user
    const holding1Result = await db.insert(portfolioHoldingsTable)
      .values({
        user_id: 'user123',
        stock_id: stock.id,
        symbol: 'GOOGL',
        quantity: '10.0000',
        average_cost: '2400.0000',
        current_value: '25000.00',
        total_return: '1000.00',
        total_return_percent: '4.1667'
      })
      .returning()
      .execute();

    const holding2Result = await db.insert(portfolioHoldingsTable)
      .values({
        user_id: 'user123',
        stock_id: stock.id,
        symbol: 'GOOGL',
        quantity: '5.0000',
        average_cost: '2450.0000',
        current_value: '12500.00',
        total_return: '250.00',
        total_return_percent: '2.0408'
      })
      .returning()
      .execute();

    const holding1 = holding1Result[0];
    const holding2 = holding2Result[0];

    // Delete only the first holding
    const input: DeleteItemInput = {
      id: holding1.id
    };

    const result = await deletePortfolioHolding(input);

    // Verify deletion was successful
    expect(result).toBe(true);

    // Verify first holding was deleted
    const deletedHoldings = await db.select()
      .from(portfolioHoldingsTable)
      .where(eq(portfolioHoldingsTable.id, holding1.id))
      .execute();

    expect(deletedHoldings).toHaveLength(0);

    // Verify second holding still exists
    const remainingHoldings = await db.select()
      .from(portfolioHoldingsTable)
      .where(eq(portfolioHoldingsTable.id, holding2.id))
      .execute();

    expect(remainingHoldings).toHaveLength(1);
    expect(remainingHoldings[0].id).toEqual(holding2.id);
    expect(remainingHoldings[0].user_id).toEqual('user123');
    expect(parseFloat(remainingHoldings[0].quantity)).toEqual(5.0000);
  });

  it('should handle different user portfolio holdings correctly', async () => {
    // Create prerequisite stock data
    const stockResult = await db.insert(stocksTable)
      .values({
        symbol: 'TSLA',
        company_name: 'Tesla Inc.',
        current_price: '800.00',
        daily_change: '-10.00',
        daily_change_percent: '-1.23',
        market_cap: '800000000000',
        volume: 25000000,
        pe_ratio: '100.0'
      })
      .returning()
      .execute();

    const stock = stockResult[0];

    // Create holdings for different users
    const user1HoldingResult = await db.insert(portfolioHoldingsTable)
      .values({
        user_id: 'user1',
        stock_id: stock.id,
        symbol: 'TSLA',
        quantity: '50.0000',
        average_cost: '750.0000',
        current_value: '40000.00',
        total_return: '2500.00',
        total_return_percent: '6.6667'
      })
      .returning()
      .execute();

    const user2HoldingResult = await db.insert(portfolioHoldingsTable)
      .values({
        user_id: 'user2',
        stock_id: stock.id,
        symbol: 'TSLA',
        quantity: '25.0000',
        average_cost: '850.0000',
        current_value: '20000.00',
        total_return: '-1250.00',
        total_return_percent: '-5.8824'
      })
      .returning()
      .execute();

    const user1Holding = user1HoldingResult[0];
    const user2Holding = user2HoldingResult[0];

    // Delete user1's holding
    const input: DeleteItemInput = {
      id: user1Holding.id
    };

    const result = await deletePortfolioHolding(input);

    // Verify deletion was successful
    expect(result).toBe(true);

    // Verify user1's holding was deleted
    const user1Holdings = await db.select()
      .from(portfolioHoldingsTable)
      .where(eq(portfolioHoldingsTable.user_id, 'user1'))
      .execute();

    expect(user1Holdings).toHaveLength(0);

    // Verify user2's holding still exists
    const user2Holdings = await db.select()
      .from(portfolioHoldingsTable)
      .where(eq(portfolioHoldingsTable.user_id, 'user2'))
      .execute();

    expect(user2Holdings).toHaveLength(1);
    expect(user2Holdings[0].id).toEqual(user2Holding.id);
    expect(user2Holdings[0].user_id).toEqual('user2');
  });
});