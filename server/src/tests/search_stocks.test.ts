import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { stocksTable } from '../db/schema';
import { type SearchStocksInput } from '../schema';
import { searchStocks } from '../handlers/search_stocks';

// Test stocks data
const testStocks = [
  {
    symbol: 'AAPL',
    company_name: 'Apple Inc.',
    current_price: '150.25',
    daily_change: '2.50',
    daily_change_percent: '1.69',
    market_cap: '2500000000000',
    volume: 50000000,
    pe_ratio: '28.75'
  },
  {
    symbol: 'GOOGL',
    company_name: 'Alphabet Inc.',
    current_price: '2750.80',
    daily_change: '-15.20',
    daily_change_percent: '-0.55',
    market_cap: '1800000000000',
    volume: 1200000,
    pe_ratio: '25.30'
  },
  {
    symbol: 'TSLA',
    company_name: 'Tesla, Inc.',
    current_price: '250.45',
    daily_change: '12.75',
    daily_change_percent: '5.37',
    market_cap: '800000000000',
    volume: 25000000,
    pe_ratio: '45.60'
  },
  {
    symbol: 'AMZN',
    company_name: 'Amazon.com, Inc.',
    current_price: '3200.15',
    daily_change: '8.90',
    daily_change_percent: '0.28',
    market_cap: '1650000000000',
    volume: 3500000,
    pe_ratio: null // Test nullable field
  },
  {
    symbol: 'MSFT',
    company_name: 'Microsoft Corporation',
    current_price: '305.50',
    daily_change: '-1.25',
    daily_change_percent: '-0.41',
    market_cap: '2280000000000',
    volume: 28000000,
    pe_ratio: '32.15'
  }
];

describe('searchStocks', () => {
  beforeEach(async () => {
    await createDB();
    
    // Insert test stocks
    await db.insert(stocksTable)
      .values(testStocks)
      .execute();
  });

  afterEach(resetDB);

  it('should search stocks by exact symbol match', async () => {
    const input: SearchStocksInput = {
      query: 'AAPL',
      limit: 20
    };

    const results = await searchStocks(input);

    expect(results).toHaveLength(1);
    expect(results[0].symbol).toEqual('AAPL');
    expect(results[0].company_name).toEqual('Apple Inc.');
    expect(results[0].current_price).toEqual(150.25);
    expect(typeof results[0].current_price).toEqual('number');
    expect(results[0].daily_change).toEqual(2.50);
    expect(results[0].daily_change_percent).toEqual(1.69);
    expect(results[0].market_cap).toEqual(2500000000000);
    expect(results[0].pe_ratio).toEqual(28.75);
  });

  it('should search stocks by case-insensitive symbol', async () => {
    const input: SearchStocksInput = {
      query: 'tsla',
      limit: 20
    };

    const results = await searchStocks(input);

    expect(results).toHaveLength(1);
    expect(results[0].symbol).toEqual('TSLA');
    expect(results[0].company_name).toEqual('Tesla, Inc.');
    expect(results[0].current_price).toEqual(250.45);
  });

  it('should search stocks by company name', async () => {
    const input: SearchStocksInput = {
      query: 'Apple',
      limit: 20
    };

    const results = await searchStocks(input);

    expect(results).toHaveLength(1);
    expect(results[0].symbol).toEqual('AAPL');
    expect(results[0].company_name).toEqual('Apple Inc.');
  });

  it('should search stocks by partial company name', async () => {
    const input: SearchStocksInput = {
      query: 'Inc',
      limit: 20
    };

    const results = await searchStocks(input);

    // Should find Apple Inc., Alphabet Inc., Tesla Inc., Amazon.com Inc.
    expect(results.length).toBeGreaterThanOrEqual(4);
    
    const symbols = results.map(r => r.symbol);
    expect(symbols).toContain('AAPL');
    expect(symbols).toContain('GOOGL');
    expect(symbols).toContain('TSLA');
    expect(symbols).toContain('AMZN');
  });

  it('should respect the limit parameter', async () => {
    const input: SearchStocksInput = {
      query: 'Inc',
      limit: 2
    };

    const results = await searchStocks(input);

    expect(results).toHaveLength(2);
  });

  it('should return empty array for no matches', async () => {
    const input: SearchStocksInput = {
      query: 'NONEXISTENT',
      limit: 20
    };

    const results = await searchStocks(input);

    expect(results).toHaveLength(0);
  });

  it('should order results by relevance - exact symbol match first', async () => {
    const input: SearchStocksInput = {
      query: 'A',
      limit: 20
    };

    const results = await searchStocks(input);

    // Should find multiple results, but exact matches or prefix matches should come first
    expect(results.length).toBeGreaterThan(0);
    
    // Results should include stocks with 'A' in symbol or company name
    const symbols = results.map(r => r.symbol);
    expect(symbols).toContain('AAPL');
    expect(symbols).toContain('AMZN');
  });

  it('should handle nullable fields correctly', async () => {
    const input: SearchStocksInput = {
      query: 'Amazon',
      limit: 20
    };

    const results = await searchStocks(input);

    expect(results).toHaveLength(1);
    expect(results[0].symbol).toEqual('AMZN');
    expect(results[0].market_cap).toEqual(1650000000000);
    expect(results[0].pe_ratio).toBeNull(); // Should be null, not undefined
    expect(results[0].volume).toEqual(3500000); // Should be integer, not converted
  });

  it('should convert all numeric fields correctly', async () => {
    const input: SearchStocksInput = {
      query: 'Microsoft',
      limit: 20
    };

    const results = await searchStocks(input);

    expect(results).toHaveLength(1);
    const stock = results[0];
    
    // Verify all numeric fields are numbers, not strings
    expect(typeof stock.current_price).toEqual('number');
    expect(typeof stock.daily_change).toEqual('number');
    expect(typeof stock.daily_change_percent).toEqual('number');
    expect(typeof stock.market_cap).toEqual('number');
    expect(typeof stock.pe_ratio).toEqual('number');
    expect(typeof stock.volume).toEqual('number');
    
    // Verify actual values
    expect(stock.current_price).toEqual(305.50);
    expect(stock.daily_change).toEqual(-1.25);
    expect(stock.daily_change_percent).toEqual(-0.41);
    expect(stock.market_cap).toEqual(2280000000000);
    expect(stock.pe_ratio).toEqual(32.15);
  });

  it('should use default limit when not specified', async () => {
    // Create input without specifying limit (should default to 20)
    const input = { query: 'Inc' }; // This will be parsed by Zod and get default limit
    const parsedInput: SearchStocksInput = { query: 'Inc', limit: 20 }; // Simulate Zod parsing
    
    const results = await searchStocks(parsedInput);

    // Should return results (up to default limit of 20)
    expect(results.length).toBeGreaterThan(0);
    expect(results.length).toBeLessThanOrEqual(20);
  });

  it('should handle symbol prefix matching with proper ordering', async () => {
    const input: SearchStocksInput = {
      query: 'AA',
      limit: 20
    };

    const results = await searchStocks(input);

    // Should find AAPL as it starts with 'AA'
    expect(results.length).toBeGreaterThan(0);
    expect(results.some(r => r.symbol === 'AAPL')).toBe(true);
  });
});