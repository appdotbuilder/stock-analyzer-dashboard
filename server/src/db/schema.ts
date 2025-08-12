import { serial, text, pgTable, timestamp, numeric, integer, varchar } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Stocks table - stores general stock information
export const stocksTable = pgTable('stocks', {
  id: serial('id').primaryKey(),
  symbol: varchar('symbol', { length: 10 }).notNull().unique(),
  company_name: text('company_name').notNull(),
  current_price: numeric('current_price', { precision: 12, scale: 4 }).notNull(),
  daily_change: numeric('daily_change', { precision: 12, scale: 4 }).notNull(),
  daily_change_percent: numeric('daily_change_percent', { precision: 8, scale: 4 }).notNull(),
  market_cap: numeric('market_cap', { precision: 16, scale: 2 }), // Nullable
  volume: integer('volume'), // Nullable
  pe_ratio: numeric('pe_ratio', { precision: 8, scale: 2 }), // Nullable
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Portfolio holdings table - tracks user's stock positions
export const portfolioHoldingsTable = pgTable('portfolio_holdings', {
  id: serial('id').primaryKey(),
  user_id: varchar('user_id', { length: 255 }).notNull(),
  stock_id: integer('stock_id').notNull(),
  symbol: varchar('symbol', { length: 10 }).notNull(), // Denormalized for performance
  quantity: numeric('quantity', { precision: 12, scale: 4 }).notNull(),
  average_cost: numeric('average_cost', { precision: 12, scale: 4 }).notNull(),
  current_value: numeric('current_value', { precision: 16, scale: 2 }).notNull(),
  total_return: numeric('total_return', { precision: 16, scale: 2 }).notNull(),
  total_return_percent: numeric('total_return_percent', { precision: 8, scale: 4 }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Watchlist table - stores stocks users are monitoring
export const watchlistTable = pgTable('watchlist', {
  id: serial('id').primaryKey(),
  user_id: varchar('user_id', { length: 255 }).notNull(),
  stock_id: integer('stock_id').notNull(),
  symbol: varchar('symbol', { length: 10 }).notNull(), // Denormalized for performance
  notes: text('notes'), // Nullable
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Historical prices table - stores price history for charts
export const historicalPricesTable = pgTable('historical_prices', {
  id: serial('id').primaryKey(),
  stock_id: integer('stock_id').notNull(),
  symbol: varchar('symbol', { length: 10 }).notNull(), // Denormalized for performance
  price: numeric('price', { precision: 12, scale: 4 }).notNull(),
  volume: integer('volume'), // Nullable
  date: timestamp('date').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Define relations for proper query building
export const stocksRelations = relations(stocksTable, ({ many }) => ({
  portfolioHoldings: many(portfolioHoldingsTable),
  watchlistItems: many(watchlistTable),
  historicalPrices: many(historicalPricesTable)
}));

export const portfolioHoldingsRelations = relations(portfolioHoldingsTable, ({ one }) => ({
  stock: one(stocksTable, {
    fields: [portfolioHoldingsTable.stock_id],
    references: [stocksTable.id]
  })
}));

export const watchlistRelations = relations(watchlistTable, ({ one }) => ({
  stock: one(stocksTable, {
    fields: [watchlistTable.stock_id],
    references: [stocksTable.id]
  })
}));

export const historicalPricesRelations = relations(historicalPricesTable, ({ one }) => ({
  stock: one(stocksTable, {
    fields: [historicalPricesTable.stock_id],
    references: [stocksTable.id]
  })
}));

// TypeScript types for the table schemas
export type Stock = typeof stocksTable.$inferSelect;
export type NewStock = typeof stocksTable.$inferInsert;

export type PortfolioHolding = typeof portfolioHoldingsTable.$inferSelect;
export type NewPortfolioHolding = typeof portfolioHoldingsTable.$inferInsert;

export type WatchlistItem = typeof watchlistTable.$inferSelect;
export type NewWatchlistItem = typeof watchlistTable.$inferInsert;

export type HistoricalPrice = typeof historicalPricesTable.$inferSelect;
export type NewHistoricalPrice = typeof historicalPricesTable.$inferInsert;

// Export all tables for proper query building
export const tables = {
  stocks: stocksTable,
  portfolioHoldings: portfolioHoldingsTable,
  watchlist: watchlistTable,
  historicalPrices: historicalPricesTable
};