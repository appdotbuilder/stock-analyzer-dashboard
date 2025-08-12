import { db } from '../db';
import { stocksTable } from '../db/schema';
import { type Stock } from '../schema';
import { eq } from 'drizzle-orm';

export async function getStockBySymbol(symbol: string): Promise<Stock | null> {
  try {
    // Normalize symbol: trim whitespace and convert to uppercase
    const normalizedSymbol = symbol.trim().toUpperCase();
    
    if (!normalizedSymbol) {
      return null;
    }

    // Query the stock by symbol (case-insensitive)
    const result = await db.select()
      .from(stocksTable)
      .where(eq(stocksTable.symbol, normalizedSymbol))
      .limit(1)
      .execute();

    if (result.length === 0) {
      return null;
    }

    const stock = result[0];

    // Convert numeric fields back to numbers for the response
    return {
      ...stock,
      current_price: parseFloat(stock.current_price),
      daily_change: parseFloat(stock.daily_change),
      daily_change_percent: parseFloat(stock.daily_change_percent),
      market_cap: stock.market_cap ? parseFloat(stock.market_cap) : null,
      pe_ratio: stock.pe_ratio ? parseFloat(stock.pe_ratio) : null
    };
  } catch (error) {
    console.error('Failed to get stock by symbol:', error);
    throw error;
  }
}