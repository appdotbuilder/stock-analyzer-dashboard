import { db } from '../db';
import { watchlistTable, stocksTable } from '../db/schema';
import { type GetWatchlistInput, type WatchlistItem } from '../schema';
import { eq } from 'drizzle-orm';

export const getWatchlist = async (input: GetWatchlistInput): Promise<WatchlistItem[]> => {
  try {
    // Join watchlist with stocks to get current stock information
    const results = await db.select()
      .from(watchlistTable)
      .innerJoin(stocksTable, eq(watchlistTable.stock_id, stocksTable.id))
      .where(eq(watchlistTable.user_id, input.user_id))
      .execute();

    // Transform the joined results into WatchlistItem format
    return results.map(result => ({
      id: result.watchlist.id,
      user_id: result.watchlist.user_id,
      stock_id: result.watchlist.stock_id,
      symbol: result.watchlist.symbol,
      notes: result.watchlist.notes,
      created_at: result.watchlist.created_at
    }));
  } catch (error) {
    console.error('Failed to get watchlist:', error);
    throw error;
  }
};