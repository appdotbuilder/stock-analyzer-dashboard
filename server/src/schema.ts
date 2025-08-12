import { z } from 'zod';

// Stock schema for general stock information
export const stockSchema = z.object({
  id: z.number(),
  symbol: z.string(),
  company_name: z.string(),
  current_price: z.number(),
  daily_change: z.number(),
  daily_change_percent: z.number(),
  market_cap: z.number().nullable(),
  volume: z.number().nullable(),
  pe_ratio: z.number().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Stock = z.infer<typeof stockSchema>;

// Portfolio holding schema
export const portfolioHoldingSchema = z.object({
  id: z.number(),
  user_id: z.string(), // User identifier
  stock_id: z.number(),
  symbol: z.string(), // Denormalized for easier queries
  quantity: z.number(),
  average_cost: z.number(),
  current_value: z.number(),
  total_return: z.number(),
  total_return_percent: z.number(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type PortfolioHolding = z.infer<typeof portfolioHoldingSchema>;

// Watchlist item schema
export const watchlistItemSchema = z.object({
  id: z.number(),
  user_id: z.string(),
  stock_id: z.number(),
  symbol: z.string(), // Denormalized for easier queries
  notes: z.string().nullable(),
  created_at: z.coerce.date()
});

export type WatchlistItem = z.infer<typeof watchlistItemSchema>;

// Historical price data schema
export const historicalPriceSchema = z.object({
  id: z.number(),
  stock_id: z.number(),
  symbol: z.string(),
  price: z.number(),
  volume: z.number().nullable(),
  date: z.coerce.date(),
  created_at: z.coerce.date()
});

export type HistoricalPrice = z.infer<typeof historicalPriceSchema>;

// Portfolio summary schema (calculated values)
export const portfolioSummarySchema = z.object({
  user_id: z.string(),
  total_value: z.number(),
  total_cost: z.number(),
  total_return: z.number(),
  total_return_percent: z.number(),
  daily_change: z.number(),
  daily_change_percent: z.number(),
  holdings_count: z.number(),
  last_updated: z.coerce.date()
});

export type PortfolioSummary = z.infer<typeof portfolioSummarySchema>;

// Input schemas for creating/updating data

// Create stock input
export const createStockInputSchema = z.object({
  symbol: z.string().min(1).max(10),
  company_name: z.string().min(1),
  current_price: z.number().positive(),
  daily_change: z.number(),
  daily_change_percent: z.number(),
  market_cap: z.number().positive().nullable(),
  volume: z.number().nonnegative().nullable(),
  pe_ratio: z.number().positive().nullable()
});

export type CreateStockInput = z.infer<typeof createStockInputSchema>;

// Update stock input
export const updateStockInputSchema = z.object({
  id: z.number(),
  current_price: z.number().positive().optional(),
  daily_change: z.number().optional(),
  daily_change_percent: z.number().optional(),
  market_cap: z.number().positive().nullable().optional(),
  volume: z.number().nonnegative().nullable().optional(),
  pe_ratio: z.number().positive().nullable().optional()
});

export type UpdateStockInput = z.infer<typeof updateStockInputSchema>;

// Add portfolio holding input
export const addPortfolioHoldingInputSchema = z.object({
  user_id: z.string().min(1),
  symbol: z.string().min(1).max(10),
  quantity: z.number().positive(),
  average_cost: z.number().positive()
});

export type AddPortfolioHoldingInput = z.infer<typeof addPortfolioHoldingInputSchema>;

// Update portfolio holding input
export const updatePortfolioHoldingInputSchema = z.object({
  id: z.number(),
  quantity: z.number().positive().optional(),
  average_cost: z.number().positive().optional()
});

export type UpdatePortfolioHoldingInput = z.infer<typeof updatePortfolioHoldingInputSchema>;

// Add watchlist item input
export const addWatchlistItemInputSchema = z.object({
  user_id: z.string().min(1),
  symbol: z.string().min(1).max(10),
  notes: z.string().nullable()
});

export type AddWatchlistItemInput = z.infer<typeof addWatchlistItemInputSchema>;

// Update watchlist item input
export const updateWatchlistItemInputSchema = z.object({
  id: z.number(),
  notes: z.string().nullable().optional()
});

export type UpdateWatchlistItemInput = z.infer<typeof updateWatchlistItemInputSchema>;

// Add historical price input
export const addHistoricalPriceInputSchema = z.object({
  stock_id: z.number(),
  symbol: z.string().min(1).max(10),
  price: z.number().positive(),
  volume: z.number().nonnegative().nullable(),
  date: z.coerce.date()
});

export type AddHistoricalPriceInput = z.infer<typeof addHistoricalPriceInputSchema>;

// Search stocks input
export const searchStocksInputSchema = z.object({
  query: z.string().min(1),
  limit: z.number().int().positive().max(100).default(20)
});

export type SearchStocksInput = z.infer<typeof searchStocksInputSchema>;

// Get historical prices input
export const getHistoricalPricesInputSchema = z.object({
  symbol: z.string().min(1).max(10),
  start_date: z.coerce.date(),
  end_date: z.coerce.date(),
  limit: z.number().int().positive().max(1000).default(100)
});

export type GetHistoricalPricesInput = z.infer<typeof getHistoricalPricesInputSchema>;

// Get portfolio input
export const getPortfolioInputSchema = z.object({
  user_id: z.string().min(1)
});

export type GetPortfolioInput = z.infer<typeof getPortfolioInputSchema>;

// Get watchlist input
export const getWatchlistInputSchema = z.object({
  user_id: z.string().min(1)
});

export type GetWatchlistInput = z.infer<typeof getWatchlistInputSchema>;

// Delete item input
export const deleteItemInputSchema = z.object({
  id: z.number()
});

export type DeleteItemInput = z.infer<typeof deleteItemInputSchema>;