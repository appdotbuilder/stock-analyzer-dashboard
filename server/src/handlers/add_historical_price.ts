import { db } from '../db';
import { historicalPricesTable, stocksTable } from '../db/schema';
import { type AddHistoricalPriceInput, type HistoricalPrice } from '../schema';
import { eq } from 'drizzle-orm';

export const addHistoricalPrice = async (input: AddHistoricalPriceInput): Promise<HistoricalPrice> => {
  try {
    // Verify that the stock exists
    const stock = await db.select()
      .from(stocksTable)
      .where(eq(stocksTable.id, input.stock_id))
      .execute();

    if (stock.length === 0) {
      throw new Error(`Stock with ID ${input.stock_id} does not exist`);
    }

    // Insert historical price record
    const result = await db.insert(historicalPricesTable)
      .values({
        stock_id: input.stock_id,
        symbol: input.symbol,
        price: input.price.toString(), // Convert number to string for numeric column
        volume: input.volume, // Integer column - no conversion needed
        date: input.date
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const historicalPrice = result[0];
    return {
      ...historicalPrice,
      price: parseFloat(historicalPrice.price) // Convert string back to number
    };
  } catch (error) {
    console.error('Historical price creation failed:', error);
    throw error;
  }
};