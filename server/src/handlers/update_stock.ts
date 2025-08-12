import { db } from '../db';
import { stocksTable } from '../db/schema';
import { type UpdateStockInput, type Stock } from '../schema';
import { eq } from 'drizzle-orm';

export const updateStock = async (input: UpdateStockInput): Promise<Stock> => {
  try {
    // Build update values object with only provided fields
    const updateValues: any = {};
    
    if (input.current_price !== undefined) {
      updateValues.current_price = input.current_price.toString();
    }
    if (input.daily_change !== undefined) {
      updateValues.daily_change = input.daily_change.toString();
    }
    if (input.daily_change_percent !== undefined) {
      updateValues.daily_change_percent = input.daily_change_percent.toString();
    }
    if (input.market_cap !== undefined) {
      updateValues.market_cap = input.market_cap?.toString() || null;
    }
    if (input.volume !== undefined) {
      updateValues.volume = input.volume;
    }
    if (input.pe_ratio !== undefined) {
      updateValues.pe_ratio = input.pe_ratio?.toString() || null;
    }

    // Always update the timestamp
    updateValues.updated_at = new Date();

    // Update stock record
    const result = await db.update(stocksTable)
      .set(updateValues)
      .where(eq(stocksTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Stock with id ${input.id} not found`);
    }

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
    console.error('Stock update failed:', error);
    throw error;
  }
};