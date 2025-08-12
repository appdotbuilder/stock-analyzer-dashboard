import { db } from '../db';
import { portfolioHoldingsTable, stocksTable } from '../db/schema';
import { type UpdatePortfolioHoldingInput, type PortfolioHolding } from '../schema';
import { eq } from 'drizzle-orm';

export const updatePortfolioHolding = async (input: UpdatePortfolioHoldingInput): Promise<PortfolioHolding> => {
  try {
    // First, get the existing holding to verify it exists
    const existingHolding = await db.select()
      .from(portfolioHoldingsTable)
      .where(eq(portfolioHoldingsTable.id, input.id))
      .execute();

    if (existingHolding.length === 0) {
      throw new Error(`Portfolio holding with id ${input.id} not found`);
    }

    const holding = existingHolding[0];

    // Get current stock price for calculations
    const stockData = await db.select()
      .from(stocksTable)
      .where(eq(stocksTable.id, holding.stock_id))
      .execute();

    if (stockData.length === 0) {
      throw new Error(`Stock with id ${holding.stock_id} not found`);
    }

    const stock = stockData[0];
    const currentPrice = parseFloat(stock.current_price);

    // Use updated values or keep existing ones
    const newQuantity = input.quantity !== undefined ? input.quantity : parseFloat(holding.quantity);
    const newAverageCost = input.average_cost !== undefined ? input.average_cost : parseFloat(holding.average_cost);

    // Calculate new metrics
    const currentValue = newQuantity * currentPrice;
    const totalCost = newQuantity * newAverageCost;
    const totalReturn = currentValue - totalCost;
    const totalReturnPercent = totalCost > 0 ? (totalReturn / totalCost) * 100 : 0;

    // Build update object with only fields that should be updated
    const updateValues: any = {
      current_value: currentValue.toString(),
      total_return: totalReturn.toString(),
      total_return_percent: totalReturnPercent.toString(),
      updated_at: new Date()
    };

    if (input.quantity !== undefined) {
      updateValues.quantity = input.quantity.toString();
    }

    if (input.average_cost !== undefined) {
      updateValues.average_cost = input.average_cost.toString();
    }

    // Update the portfolio holding
    const result = await db.update(portfolioHoldingsTable)
      .set(updateValues)
      .where(eq(portfolioHoldingsTable.id, input.id))
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const updatedHolding = result[0];
    return {
      ...updatedHolding,
      quantity: parseFloat(updatedHolding.quantity),
      average_cost: parseFloat(updatedHolding.average_cost),
      current_value: parseFloat(updatedHolding.current_value),
      total_return: parseFloat(updatedHolding.total_return),
      total_return_percent: parseFloat(updatedHolding.total_return_percent)
    };
  } catch (error) {
    console.error('Portfolio holding update failed:', error);
    throw error;
  }
};