import { db } from '../db';
import { stocksTable, portfolioHoldingsTable } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { type AddPortfolioHoldingInput, type PortfolioHolding } from '../schema';

export const addPortfolioHolding = async (input: AddPortfolioHoldingInput): Promise<PortfolioHolding> => {
  try {
    // First, look up the stock by symbol to get stock_id and current_price
    const stocks = await db.select()
      .from(stocksTable)
      .where(eq(stocksTable.symbol, input.symbol))
      .execute();

    if (stocks.length === 0) {
      throw new Error(`Stock with symbol ${input.symbol} not found`);
    }

    const stock = stocks[0];
    const currentPrice = parseFloat(stock.current_price);

    // Check if user already has a holding for this stock
    const existingHoldings = await db.select()
      .from(portfolioHoldingsTable)
      .where(and(
        eq(portfolioHoldingsTable.user_id, input.user_id),
        eq(portfolioHoldingsTable.stock_id, stock.id)
      ))
      .execute();

    let result: PortfolioHolding;

    if (existingHoldings.length > 0) {
      // Update existing holding - calculate new average cost and total quantity
      const existingHolding = existingHoldings[0];
      const existingQuantity = parseFloat(existingHolding.quantity);
      const existingAverageCost = parseFloat(existingHolding.average_cost);
      
      const newTotalQuantity = existingQuantity + input.quantity;
      const newAverageCost = ((existingQuantity * existingAverageCost) + (input.quantity * input.average_cost)) / newTotalQuantity;
      
      const newCurrentValue = newTotalQuantity * currentPrice;
      const newTotalCost = newTotalQuantity * newAverageCost;
      const newTotalReturn = newCurrentValue - newTotalCost;
      const newTotalReturnPercent = newTotalCost > 0 ? (newTotalReturn / newTotalCost) * 100 : 0;

      const updatedResults = await db.update(portfolioHoldingsTable)
        .set({
          quantity: newTotalQuantity.toString(),
          average_cost: newAverageCost.toString(),
          current_value: newCurrentValue.toString(),
          total_return: newTotalReturn.toString(),
          total_return_percent: newTotalReturnPercent.toString(),
          updated_at: new Date()
        })
        .where(eq(portfolioHoldingsTable.id, existingHolding.id))
        .returning()
        .execute();

      const updated = updatedResults[0];
      result = {
        ...updated,
        quantity: parseFloat(updated.quantity),
        average_cost: parseFloat(updated.average_cost),
        current_value: parseFloat(updated.current_value),
        total_return: parseFloat(updated.total_return),
        total_return_percent: parseFloat(updated.total_return_percent)
      };
    } else {
      // Create new holding
      const currentValue = input.quantity * currentPrice;
      const totalCost = input.quantity * input.average_cost;
      const totalReturn = currentValue - totalCost;
      const totalReturnPercent = totalCost > 0 ? (totalReturn / totalCost) * 100 : 0;

      const insertResults = await db.insert(portfolioHoldingsTable)
        .values({
          user_id: input.user_id,
          stock_id: stock.id,
          symbol: input.symbol,
          quantity: input.quantity.toString(),
          average_cost: input.average_cost.toString(),
          current_value: currentValue.toString(),
          total_return: totalReturn.toString(),
          total_return_percent: totalReturnPercent.toString()
        })
        .returning()
        .execute();

      const inserted = insertResults[0];
      result = {
        ...inserted,
        quantity: parseFloat(inserted.quantity),
        average_cost: parseFloat(inserted.average_cost),
        current_value: parseFloat(inserted.current_value),
        total_return: parseFloat(inserted.total_return),
        total_return_percent: parseFloat(inserted.total_return_percent)
      };
    }

    return result;
  } catch (error) {
    console.error('Add portfolio holding failed:', error);
    throw error;
  }
};