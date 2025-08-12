import { db } from '../db';
import { stocksTable } from '../db/schema';
import { type SearchStocksInput, type Stock } from '../schema';
import { or, ilike, sql } from 'drizzle-orm';

export const searchStocks = async (input: SearchStocksInput): Promise<Stock[]> => {
  try {
    const { query, limit } = input;
    
    // Prepare search pattern for SQL ILIKE operator (case-insensitive pattern matching)
    const searchPattern = `%${query.toLowerCase()}%`;
    
    // Search in both symbol and company_name fields
    // Order by relevance: exact symbol matches first, then symbol prefix matches, then company name matches
    const results = await db.select()
      .from(stocksTable)
      .where(
        or(
          ilike(stocksTable.symbol, searchPattern),
          ilike(stocksTable.company_name, searchPattern)
        )
      )
      .orderBy(
        // Use CASE WHEN for custom ordering by relevance
        sql`CASE 
          WHEN LOWER(${stocksTable.symbol}) = LOWER(${query}) THEN 1
          WHEN LOWER(${stocksTable.symbol}) LIKE LOWER(${query}) || '%' THEN 2
          WHEN LOWER(${stocksTable.company_name}) LIKE '%' || LOWER(${query}) || '%' THEN 3
          ELSE 4
        END`,
        stocksTable.symbol // Secondary sort by symbol alphabetically
      )
      .limit(limit)
      .execute();

    // Convert numeric fields from string to number for all results
    return results.map(stock => ({
      ...stock,
      current_price: parseFloat(stock.current_price),
      daily_change: parseFloat(stock.daily_change),
      daily_change_percent: parseFloat(stock.daily_change_percent),
      market_cap: stock.market_cap ? parseFloat(stock.market_cap) : null,
      pe_ratio: stock.pe_ratio ? parseFloat(stock.pe_ratio) : null
    }));
  } catch (error) {
    console.error('Stock search failed:', error);
    throw error;
  }
};