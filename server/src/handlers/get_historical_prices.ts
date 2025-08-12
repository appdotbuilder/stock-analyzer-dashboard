import { db } from '../db';
import { historicalPricesTable } from '../db/schema';
import { type GetHistoricalPricesInput, type HistoricalPrice } from '../schema';
import { eq, gte, lte, and, desc } from 'drizzle-orm';

export const getHistoricalPrices = async (input: GetHistoricalPricesInput): Promise<HistoricalPrice[]> => {
  try {
    // Build the query with symbol and date range filters
    const conditions = [
      eq(historicalPricesTable.symbol, input.symbol),
      gte(historicalPricesTable.date, input.start_date),
      lte(historicalPricesTable.date, input.end_date)
    ];

    // Build complete query in a single chain
    const results = await db.select()
      .from(historicalPricesTable)
      .where(and(...conditions))
      .orderBy(desc(historicalPricesTable.date))
      .limit(input.limit)
      .execute();

    // Convert numeric fields back to numbers
    return results.map(record => ({
      ...record,
      price: parseFloat(record.price),
      volume: record.volume // integer, no conversion needed
    }));
  } catch (error) {
    console.error('Get historical prices failed:', error);
    throw error;
  }
};