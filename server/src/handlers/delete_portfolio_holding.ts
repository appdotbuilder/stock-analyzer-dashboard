import { db } from '../db';
import { portfolioHoldingsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type DeleteItemInput } from '../schema';

export const deletePortfolioHolding = async (input: DeleteItemInput): Promise<boolean> => {
  try {
    // Delete the portfolio holding record by ID
    const result = await db.delete(portfolioHoldingsTable)
      .where(eq(portfolioHoldingsTable.id, input.id))
      .returning()
      .execute();

    // Return true if a record was deleted, false if no record was found
    return result.length > 0;
  } catch (error) {
    console.error('Portfolio holding deletion failed:', error);
    throw error;
  }
};