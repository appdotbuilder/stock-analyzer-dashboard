import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { stocksTable, historicalPricesTable } from '../db/schema';
import { type GetHistoricalPricesInput } from '../schema';
import { getHistoricalPrices } from '../handlers/get_historical_prices';

describe('getHistoricalPrices', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should get historical prices for a stock within date range', async () => {
    // Create test stock
    const stockResult = await db.insert(stocksTable)
      .values({
        symbol: 'AAPL',
        company_name: 'Apple Inc.',
        current_price: '150.00',
        daily_change: '2.50',
        daily_change_percent: '1.70',
        market_cap: '2500000000000',
        volume: 50000000,
        pe_ratio: '25.50'
      })
      .returning()
      .execute();

    const stockId = stockResult[0].id;

    // Create historical price data
    const testDates = [
      new Date('2024-01-01'),
      new Date('2024-01-02'),
      new Date('2024-01-03'),
      new Date('2024-01-04'),
      new Date('2024-01-05')
    ];

    const priceData = testDates.map((date, index) => ({
      stock_id: stockId,
      symbol: 'AAPL',
      price: (100 + index * 5).toString(), // 100, 105, 110, 115, 120
      volume: 1000000 + index * 100000,
      date: date
    }));

    await db.insert(historicalPricesTable)
      .values(priceData)
      .execute();

    const input: GetHistoricalPricesInput = {
      symbol: 'AAPL',
      start_date: new Date('2024-01-02'),
      end_date: new Date('2024-01-04'),
      limit: 100
    };

    const result = await getHistoricalPrices(input);

    // Should return 3 records (Jan 2, 3, 4) ordered by date descending
    expect(result).toHaveLength(3);
    
    // Verify ordering (most recent first)
    expect(result[0].date).toEqual(new Date('2024-01-04'));
    expect(result[1].date).toEqual(new Date('2024-01-03'));
    expect(result[2].date).toEqual(new Date('2024-01-02'));

    // Verify data integrity and numeric conversion
    expect(result[0].symbol).toEqual('AAPL');
    expect(result[0].stock_id).toEqual(stockId);
    expect(typeof result[0].price).toBe('number');
    expect(result[0].price).toEqual(115);
    expect(result[0].volume).toEqual(1300000);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should return empty array for non-existent symbol', async () => {
    const input: GetHistoricalPricesInput = {
      symbol: 'NONEXISTENT',
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-31'),
      limit: 100
    };

    const result = await getHistoricalPrices(input);

    expect(result).toHaveLength(0);
  });

  it('should respect limit parameter', async () => {
    // Create test stock
    const stockResult = await db.insert(stocksTable)
      .values({
        symbol: 'GOOGL',
        company_name: 'Alphabet Inc.',
        current_price: '2800.00',
        daily_change: '15.00',
        daily_change_percent: '0.54',
        market_cap: '1800000000000',
        volume: 25000000,
        pe_ratio: '20.50'
      })
      .returning()
      .execute();

    const stockId = stockResult[0].id;

    // Create 10 historical price records
    const priceData = Array.from({ length: 10 }, (_, index) => ({
      stock_id: stockId,
      symbol: 'GOOGL',
      price: (2800 + index * 10).toString(),
      volume: 1000000,
      date: new Date(`2024-01-${String(index + 1).padStart(2, '0')}`)
    }));

    await db.insert(historicalPricesTable)
      .values(priceData)
      .execute();

    const input: GetHistoricalPricesInput = {
      symbol: 'GOOGL',
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-31'),
      limit: 5
    };

    const result = await getHistoricalPrices(input);

    // Should return only 5 records due to limit
    expect(result).toHaveLength(5);
    
    // Should be ordered by date descending (most recent first)
    expect(result[0].date).toEqual(new Date('2024-01-10'));
    expect(result[4].date).toEqual(new Date('2024-01-06'));
  });

  it('should handle date range filtering correctly', async () => {
    // Create test stock
    const stockResult = await db.insert(stocksTable)
      .values({
        symbol: 'MSFT',
        company_name: 'Microsoft Corporation',
        current_price: '420.00',
        daily_change: '3.20',
        daily_change_percent: '0.77',
        market_cap: '3100000000000',
        volume: 30000000,
        pe_ratio: '28.50'
      })
      .returning()
      .execute();

    const stockId = stockResult[0].id;

    // Create historical data spanning multiple months
    const priceData = [
      {
        stock_id: stockId,
        symbol: 'MSFT',
        price: '400.00',
        volume: 1000000,
        date: new Date('2023-12-15') // Outside range
      },
      {
        stock_id: stockId,
        symbol: 'MSFT',
        price: '410.00',
        volume: 1100000,
        date: new Date('2024-01-15') // Inside range
      },
      {
        stock_id: stockId,
        symbol: 'MSFT',
        price: '420.00',
        volume: 1200000,
        date: new Date('2024-02-15') // Inside range
      },
      {
        stock_id: stockId,
        symbol: 'MSFT',
        price: '430.00',
        volume: 1300000,
        date: new Date('2024-03-15') // Outside range
      }
    ];

    await db.insert(historicalPricesTable)
      .values(priceData)
      .execute();

    const input: GetHistoricalPricesInput = {
      symbol: 'MSFT',
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-02-28'),
      limit: 100
    };

    const result = await getHistoricalPrices(input);

    // Should return only records within date range
    expect(result).toHaveLength(2);
    expect(result.every(record => 
      record.date >= new Date('2024-01-01') && 
      record.date <= new Date('2024-02-28')
    )).toBe(true);

    // Verify correct records are returned
    const prices = result.map(r => r.price).sort();
    expect(prices).toEqual([410, 420]);
  });

  it('should handle nullable volume values', async () => {
    // Create test stock
    const stockResult = await db.insert(stocksTable)
      .values({
        symbol: 'TSLA',
        company_name: 'Tesla, Inc.',
        current_price: '250.00',
        daily_change: '-5.00',
        daily_change_percent: '-1.96',
        market_cap: '800000000000',
        volume: 40000000,
        pe_ratio: '45.50'
      })
      .returning()
      .execute();

    const stockId = stockResult[0].id;

    // Create historical data with null volume
    await db.insert(historicalPricesTable)
      .values({
        stock_id: stockId,
        symbol: 'TSLA',
        price: '250.00',
        volume: null, // Null volume
        date: new Date('2024-01-15')
      })
      .execute();

    const input: GetHistoricalPricesInput = {
      symbol: 'TSLA',
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-01-31'),
      limit: 100
    };

    const result = await getHistoricalPrices(input);

    expect(result).toHaveLength(1);
    expect(result[0].volume).toBeNull();
    expect(typeof result[0].price).toBe('number');
    expect(result[0].price).toEqual(250);
  });

  it('should handle edge case with same start and end date', async () => {
    // Create test stock
    const stockResult = await db.insert(stocksTable)
      .values({
        symbol: 'AMZN',
        company_name: 'Amazon.com, Inc.',
        current_price: '3300.00',
        daily_change: '25.00',
        daily_change_percent: '0.76',
        market_cap: '1700000000000',
        volume: 20000000,
        pe_ratio: '55.50'
      })
      .returning()
      .execute();

    const stockId = stockResult[0].id;

    // Create historical data for specific date
    await db.insert(historicalPricesTable)
      .values({
        stock_id: stockId,
        symbol: 'AMZN',
        price: '3300.00',
        volume: 2000000,
        date: new Date('2024-01-15')
      })
      .execute();

    const sameDate = new Date('2024-01-15');
    const input: GetHistoricalPricesInput = {
      symbol: 'AMZN',
      start_date: sameDate,
      end_date: sameDate,
      limit: 100
    };

    const result = await getHistoricalPrices(input);

    expect(result).toHaveLength(1);
    expect(result[0].symbol).toEqual('AMZN');
    expect(result[0].date).toEqual(sameDate);
  });
});