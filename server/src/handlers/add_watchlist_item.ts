import { db } from '../db';
import { stocksTable, watchlistTable } from '../db/schema';
import { type AddWatchlistItemInput, type WatchlistItem } from '../schema';
import { eq } from 'drizzle-orm';

export const addWatchlistItem = async (input: AddWatchlistItemInput): Promise<WatchlistItem> => {
  try {
    // First, find the stock by symbol to get the stock_id
    const stock = await db.select()
      .from(stocksTable)
      .where(eq(stocksTable.symbol, input.symbol))
      .execute();

    if (stock.length === 0) {
      throw new Error(`Stock with symbol '${input.symbol}' not found`);
    }

    const stockRecord = stock[0];

    // Insert the watchlist item
    const result = await db.insert(watchlistTable)
      .values({
        user_id: input.user_id,
        stock_id: stockRecord.id,
        symbol: input.symbol,
        notes: input.notes
      })
      .returning()
      .execute();

    const watchlistItem = result[0];
    return {
      ...watchlistItem
    };
  } catch (error) {
    console.error('Add watchlist item failed:', error);
    throw error;
  }
};