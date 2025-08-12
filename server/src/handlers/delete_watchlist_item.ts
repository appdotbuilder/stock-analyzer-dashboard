import { db } from '../db';
import { watchlistTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type DeleteItemInput } from '../schema';

export const deleteWatchlistItem = async (input: DeleteItemInput): Promise<boolean> => {
  try {
    // Delete the watchlist item by ID
    const result = await db
      .delete(watchlistTable)
      .where(eq(watchlistTable.id, input.id))
      .execute();

    // Return true if a record was deleted, false if no record was found
    return result.rowCount !== null && result.rowCount > 0;
  } catch (error) {
    console.error('Watchlist item deletion failed:', error);
    throw error;
  }
};