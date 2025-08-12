import { db } from '../db';
import { portfolioHoldingsTable } from '../db/schema';
import { type GetPortfolioInput, type PortfolioSummary } from '../schema';
import { eq, sum } from 'drizzle-orm';

export const getPortfolioSummary = async (input: GetPortfolioInput): Promise<PortfolioSummary> => {
  try {
    // Get all portfolio holdings for the user
    const holdings = await db.select()
      .from(portfolioHoldingsTable)
      .where(eq(portfolioHoldingsTable.user_id, input.user_id))
      .execute();

    if (holdings.length === 0) {
      // Return empty portfolio summary if user has no holdings
      return {
        user_id: input.user_id,
        total_value: 0,
        total_cost: 0,
        total_return: 0,
        total_return_percent: 0,
        daily_change: 0,
        daily_change_percent: 0,
        holdings_count: 0,
        last_updated: new Date()
      };
    }

    // Calculate portfolio totals from holdings data
    let totalValue = 0;
    let totalCost = 0;
    let totalReturn = 0;
    let dailyChange = 0;

    for (const holding of holdings) {
      const holdingValue = parseFloat(holding.current_value);
      const holdingCost = parseFloat(holding.quantity) * parseFloat(holding.average_cost);
      const holdingReturn = parseFloat(holding.total_return);
      
      totalValue += holdingValue;
      totalCost += holdingCost;
      totalReturn += holdingReturn;
      
      // Calculate daily change based on current value and total return
      // Daily change = current return impact based on price movements
      const dailyReturnPercent = parseFloat(holding.total_return_percent);
      const holdingDailyChange = holdingValue * (dailyReturnPercent / 100) - holdingReturn;
      dailyChange += holdingDailyChange;
    }

    // Calculate percentages
    const totalReturnPercent = totalCost > 0 ? (totalReturn / totalCost) * 100 : 0;
    const dailyChangePercent = totalValue > 0 ? (dailyChange / (totalValue - dailyChange)) * 100 : 0;

    return {
      user_id: input.user_id,
      total_value: totalValue,
      total_cost: totalCost,
      total_return: totalReturn,
      total_return_percent: totalReturnPercent,
      daily_change: dailyChange,
      daily_change_percent: dailyChangePercent,
      holdings_count: holdings.length,
      last_updated: new Date()
    };
  } catch (error) {
    console.error('Portfolio summary calculation failed:', error);
    throw error;
  }
};