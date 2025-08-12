import { db } from '../db';
import { watchlistTable } from '../db/schema';
import { type UpdateWatchlistItemInput, type WatchlistItem } from '../schema';
import { eq } from 'drizzle-orm';

export const updateWatchlistItem = async (input: UpdateWatchlistItemInput): Promise<WatchlistItem> => {
  try {
    // First check if the watchlist item exists
    const existingItem = await db.select()
      .from(watchlistTable)
      .where(eq(watchlistTable.id, input.id))
      .execute();

    if (existingItem.length === 0) {
      throw new Error(`Watchlist item with ID ${input.id} not found`);
    }

    // Build update values - only include fields that are provided
    const updateValues: any = {};
    
    if (input.notes !== undefined) {
      updateValues.notes = input.notes;
    }

    // If no fields to update, return existing item
    if (Object.keys(updateValues).length === 0) {
      return {
        ...existingItem[0],
        // No numeric conversions needed for watchlist table
      };
    }

    // Update the watchlist item
    const result = await db.update(watchlistTable)
      .set(updateValues)
      .where(eq(watchlistTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Failed to update watchlist item with ID ${input.id}`);
    }

    // Return the updated item - no numeric conversions needed
    return {
      ...result[0],
    };
  } catch (error) {
    console.error('Watchlist item update failed:', error);
    throw error;
  }
};