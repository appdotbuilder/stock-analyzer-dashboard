import { db } from '../db';
import { portfolioHoldingsTable, stocksTable } from '../db/schema';
import { type GetPortfolioInput, type PortfolioHolding } from '../schema';
import { eq } from 'drizzle-orm';

export async function getPortfolio(input: GetPortfolioInput): Promise<PortfolioHolding[]> {
  try {
    // Fetch portfolio holdings with current stock data
    const results = await db.select()
      .from(portfolioHoldingsTable)
      .innerJoin(stocksTable, eq(portfolioHoldingsTable.stock_id, stocksTable.id))
      .where(eq(portfolioHoldingsTable.user_id, input.user_id))
      .execute();

    // Transform results and calculate current values
    return results.map(result => {
      const holding = result.portfolio_holdings;
      const stock = result.stocks;

      const quantity = parseFloat(holding.quantity);
      const averageCost = parseFloat(holding.average_cost);
      const currentPrice = parseFloat(stock.current_price);
      
      const currentValue = quantity * currentPrice;
      const totalCost = quantity * averageCost;
      const totalReturn = currentValue - totalCost;
      const totalReturnPercent = totalCost > 0 ? (totalReturn / totalCost) * 100 : 0;

      return {
        id: holding.id,
        user_id: holding.user_id,
        stock_id: holding.stock_id,
        symbol: holding.symbol,
        quantity: quantity,
        average_cost: averageCost,
        current_value: currentValue,
        total_return: totalReturn,
        total_return_percent: totalReturnPercent,
        created_at: holding.created_at,
        updated_at: holding.updated_at
      };
    });
  } catch (error) {
    console.error('Portfolio retrieval failed:', error);
    throw error;
  }
}