import { db } from '../db';
import { stocksTable } from '../db/schema';
import { type CreateStockInput, type Stock } from '../schema';

export const createStock = async (input: CreateStockInput): Promise<Stock> => {
  try {
    // Insert stock record
    const result = await db.insert(stocksTable)
      .values({
        symbol: input.symbol,
        company_name: input.company_name,
        current_price: input.current_price.toString(), // Convert number to string for numeric column
        daily_change: input.daily_change.toString(), // Convert number to string for numeric column
        daily_change_percent: input.daily_change_percent.toString(), // Convert number to string for numeric column
        market_cap: input.market_cap ? input.market_cap.toString() : null, // Handle nullable field
        volume: input.volume, // Integer column - no conversion needed
        pe_ratio: input.pe_ratio ? input.pe_ratio.toString() : null // Handle nullable field
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const stock = result[0];
    return {
      ...stock,
      current_price: parseFloat(stock.current_price),
      daily_change: parseFloat(stock.daily_change),
      daily_change_percent: parseFloat(stock.daily_change_percent),
      market_cap: stock.market_cap ? parseFloat(stock.market_cap) : null,
      pe_ratio: stock.pe_ratio ? parseFloat(stock.pe_ratio) : null
    };
  } catch (error) {
    console.error('Stock creation failed:', error);
    throw error;
  }
};