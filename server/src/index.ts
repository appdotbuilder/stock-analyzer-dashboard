import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schema types
import {
  createStockInputSchema,
  updateStockInputSchema,
  searchStocksInputSchema,
  addPortfolioHoldingInputSchema,
  updatePortfolioHoldingInputSchema,
  getPortfolioInputSchema,
  addWatchlistItemInputSchema,
  updateWatchlistItemInputSchema,
  getWatchlistInputSchema,
  addHistoricalPriceInputSchema,
  getHistoricalPricesInputSchema,
  deleteItemInputSchema
} from './schema';

// Import handlers
import { createStock } from './handlers/create_stock';
import { updateStock } from './handlers/update_stock';
import { searchStocks } from './handlers/search_stocks';
import { getStockBySymbol } from './handlers/get_stock_by_symbol';
import { addPortfolioHolding } from './handlers/add_portfolio_holding';
import { updatePortfolioHolding } from './handlers/update_portfolio_holding';
import { getPortfolio } from './handlers/get_portfolio';
import { getPortfolioSummary } from './handlers/get_portfolio_summary';
import { deletePortfolioHolding } from './handlers/delete_portfolio_holding';
import { addWatchlistItem } from './handlers/add_watchlist_item';
import { getWatchlist } from './handlers/get_watchlist';
import { updateWatchlistItem } from './handlers/update_watchlist_item';
import { deleteWatchlistItem } from './handlers/delete_watchlist_item';
import { addHistoricalPrice } from './handlers/add_historical_price';
import { getHistoricalPrices } from './handlers/get_historical_prices';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Stock management routes
  createStock: publicProcedure
    .input(createStockInputSchema)
    .mutation(({ input }) => createStock(input)),

  updateStock: publicProcedure
    .input(updateStockInputSchema)
    .mutation(({ input }) => updateStock(input)),

  searchStocks: publicProcedure
    .input(searchStocksInputSchema)
    .query(({ input }) => searchStocks(input)),

  getStockBySymbol: publicProcedure
    .input(z.string())
    .query(({ input }) => getStockBySymbol(input)),

  // Portfolio management routes
  addPortfolioHolding: publicProcedure
    .input(addPortfolioHoldingInputSchema)
    .mutation(({ input }) => addPortfolioHolding(input)),

  updatePortfolioHolding: publicProcedure
    .input(updatePortfolioHoldingInputSchema)
    .mutation(({ input }) => updatePortfolioHolding(input)),

  getPortfolio: publicProcedure
    .input(getPortfolioInputSchema)
    .query(({ input }) => getPortfolio(input)),

  getPortfolioSummary: publicProcedure
    .input(getPortfolioInputSchema)
    .query(({ input }) => getPortfolioSummary(input)),

  deletePortfolioHolding: publicProcedure
    .input(deleteItemInputSchema)
    .mutation(({ input }) => deletePortfolioHolding(input)),

  // Watchlist management routes
  addWatchlistItem: publicProcedure
    .input(addWatchlistItemInputSchema)
    .mutation(({ input }) => addWatchlistItem(input)),

  getWatchlist: publicProcedure
    .input(getWatchlistInputSchema)
    .query(({ input }) => getWatchlist(input)),

  updateWatchlistItem: publicProcedure
    .input(updateWatchlistItemInputSchema)
    .mutation(({ input }) => updateWatchlistItem(input)),

  deleteWatchlistItem: publicProcedure
    .input(deleteItemInputSchema)
    .mutation(({ input }) => deleteWatchlistItem(input)),

  // Historical data routes
  addHistoricalPrice: publicProcedure
    .input(addHistoricalPriceInputSchema)
    .mutation(({ input }) => addHistoricalPrice(input)),

  getHistoricalPrices: publicProcedure
    .input(getHistoricalPricesInputSchema)
    .query(({ input }) => getHistoricalPrices(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`Stock Analysis Dashboard TRPC server listening at port: ${port}`);
}

start();