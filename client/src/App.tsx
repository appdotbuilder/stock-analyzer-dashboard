import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PieChart, 
  BarChart3,
  Wallet,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Zap
} from 'lucide-react';
import type { 
  PortfolioHolding, 
  PortfolioSummary, 
  WatchlistItem, 
  Stock,
  AddPortfolioHoldingInput,
  AddWatchlistItemInput
} from '../../server/src/schema';

// Import new components
import { StockDetailModal } from '@/components/StockDetailModal';
import { PortfolioChart } from '@/components/PortfolioChart';
import { StockSearch } from '@/components/StockSearch';
import { MarketOverview } from '@/components/MarketOverview';

// Mock data for demonstration (since handlers are stubs)
const mockPortfolioSummary: PortfolioSummary = {
  user_id: 'demo_user',
  total_value: 45780.50,
  total_cost: 42000.00,
  total_return: 3780.50,
  total_return_percent: 9.0,
  daily_change: 234.75,
  daily_change_percent: 0.52,
  holdings_count: 8,
  last_updated: new Date()
};

const mockPortfolioHoldings: PortfolioHolding[] = [
  {
    id: 1,
    user_id: 'demo_user',
    stock_id: 1,
    symbol: 'AAPL',
    quantity: 10,
    average_cost: 150.00,
    current_value: 1750.00,
    total_return: 250.00,
    total_return_percent: 16.67,
    created_at: new Date('2024-01-15'),
    updated_at: new Date()
  },
  {
    id: 2,
    user_id: 'demo_user',
    stock_id: 2,
    symbol: 'GOOGL',
    quantity: 5,
    average_cost: 2800.00,
    current_value: 14500.00,
    total_return: 500.00,
    total_return_percent: 3.57,
    created_at: new Date('2024-01-20'),
    updated_at: new Date()
  },
  {
    id: 3,
    user_id: 'demo_user',
    stock_id: 3,
    symbol: 'MSFT',
    quantity: 15,
    average_cost: 320.00,
    current_value: 5100.00,
    total_return: 300.00,
    total_return_percent: 6.25,
    created_at: new Date('2024-02-01'),
    updated_at: new Date()
  }
];

const mockWatchlist: WatchlistItem[] = [
  {
    id: 1,
    user_id: 'demo_user',
    stock_id: 4,
    symbol: 'TSLA',
    notes: 'Watching for entry point',
    created_at: new Date('2024-02-15')
  },
  {
    id: 2,
    user_id: 'demo_user',
    stock_id: 5,
    symbol: 'NVDA',
    notes: null,
    created_at: new Date('2024-02-20')
  }
];

const mockStockPrices: Record<string, { price: number; change: number; changePercent: number }> = {
  'AAPL': { price: 175.00, change: 2.50, changePercent: 1.45 },
  'GOOGL': { price: 2900.00, change: -15.00, changePercent: -0.51 },
  'MSFT': { price: 340.00, change: 5.25, changePercent: 1.57 },
  'TSLA': { price: 248.50, change: -3.25, changePercent: -1.29 },
  'NVDA': { price: 875.00, change: 12.75, changePercent: 1.48 }
};

function App() {
  const [portfolioSummary, setPortfolioSummary] = useState<PortfolioSummary | null>(null);
  const [portfolioHoldings, setPortfolioHoldings] = useState<PortfolioHolding[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStock, setSelectedStock] = useState<string | null>(null);
  const [showStockDetail, setShowStockDetail] = useState(false);

  const userId = 'demo_user';

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Using mock data since handlers are stubs
      setPortfolioSummary(mockPortfolioSummary);
      setPortfolioHoldings(mockPortfolioHoldings);
      setWatchlist(mockWatchlist);

      /* 
      STUB IMPLEMENTATION NOTICE:
      The backend handlers are currently stubs. In a real implementation:
      - const summary = await trpc.getPortfolioSummary.query({ user_id: userId });
      - const holdings = await trpc.getPortfolio.query({ user_id: userId });
      - const watchlistItems = await trpc.getWatchlist.query({ user_id: userId });
      
      Mock data is used to demonstrate the full functionality.
      */
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleStockSelect = (symbol: string) => {
    setSelectedStock(symbol);
    setShowStockDetail(true);
  };

  const addToPortfolio = async (input: AddPortfolioHoldingInput) => {
    try {
      // await trpc.addPortfolioHolding.mutate(input);
      await loadDashboardData();
    } catch (error) {
      console.error('Failed to add to portfolio:', error);
    }
  };

  const addToWatchlist = async (input: AddWatchlistItemInput) => {
    try {
      // await trpc.addWatchlistItem.mutate(input);
      await loadDashboardData();
    } catch (error) {
      console.error('Failed to add to watchlist:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercent = (percent: number) => {
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <BarChart3 className="h-8 w-8 text-blue-600" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">StockTracker</h1>
                  <p className="text-sm text-gray-500">Personal Stock Analysis Dashboard</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <StockSearch
                onAddToPortfolio={addToPortfolio}
                onAddToWatchlist={addToWatchlist}
                onStockSelect={handleStockSelect}
                className="w-80"
              />
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Activity className="h-4 w-4 text-green-500" />
                <span>Live data</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{/* Main content starts here */}

        {/* Portfolio Overview */}
        {portfolioSummary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(portfolioSummary.total_value)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Cost basis: {formatCurrency(portfolioSummary.total_cost)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Return</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${
                  portfolioSummary.total_return >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(portfolioSummary.total_return)}
                </div>
                <p className={`text-xs ${
                  portfolioSummary.total_return_percent >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatPercent(portfolioSummary.total_return_percent)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Daily Change</CardTitle>
                {portfolioSummary.daily_change >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${
                  portfolioSummary.daily_change >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(portfolioSummary.daily_change)}
                </div>
                <p className={`text-xs ${
                  portfolioSummary.daily_change_percent >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatPercent(portfolioSummary.daily_change_percent)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Holdings</CardTitle>
                <PieChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{portfolioSummary.holdings_count}</div>
                <p className="text-xs text-muted-foreground">
                  Active positions
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="market" className="flex items-center space-x-2">
              <Activity className="h-4 w-4" />
              <span>Market</span>
            </TabsTrigger>
            <TabsTrigger value="portfolio" className="flex items-center space-x-2">
              <Wallet className="h-4 w-4" />
              <span>Portfolio</span>
            </TabsTrigger>
            <TabsTrigger value="watchlist" className="flex items-center space-x-2">
              <Star className="h-4 w-4" />
              <span>Watchlist</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {portfolioSummary && portfolioHoldings.length > 0 && (
              <PortfolioChart
                holdings={portfolioHoldings}
                summary={portfolioSummary}
                onStockClick={handleStockSelect}
              />
            )}
            
            {portfolioHoldings.length === 0 && (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center">
                    <Zap className="h-16 w-16 text-blue-400 mx-auto mb-6" />
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Welcome to StockTracker!</h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                      Get started by searching for stocks above and adding them to your portfolio or watchlist.
                    </p>
                    <div className="flex justify-center space-x-4">
                      <Button onClick={() => document.querySelector('input')?.focus()}>
                        Start Searching
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="market" className="space-y-6">
            <MarketOverview onStockSelect={handleStockSelect} />
          </TabsContent>

          <TabsContent value="portfolio" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Your Holdings</span>
                  <Badge variant="secondary">{portfolioHoldings.length} positions</Badge>
                </CardTitle>
                <CardDescription>
                  Track your portfolio performance and individual stock positions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {portfolioHoldings.map((holding: PortfolioHolding) => {
                    const currentPrice = mockStockPrices[holding.symbol];
                    return (
                      <div 
                        key={holding.id} 
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer stock-card"
                        onClick={() => handleStockSelect(holding.symbol)}
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div>
                              <h3 className="font-semibold text-lg">{holding.symbol}</h3>
                              <p className="text-sm text-gray-600">
                                {holding.quantity} shares @ {formatCurrency(holding.average_cost)}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-lg">
                            {formatCurrency(holding.current_value)}
                          </div>
                          <div className={`flex items-center space-x-1 text-sm justify-end ${
                            holding.total_return >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {holding.total_return >= 0 ? (
                              <ArrowUpRight className="h-3 w-3" />
                            ) : (
                              <ArrowDownRight className="h-3 w-3" />
                            )}
                            <span>{formatCurrency(holding.total_return)}</span>
                            <span>({formatPercent(holding.total_return_percent)})</span>
                          </div>
                          {currentPrice && (
                            <div className={`text-xs ${
                              currentPrice.change >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              Today: {formatPercent(currentPrice.changePercent)}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  
                  {portfolioHoldings.length === 0 && (
                    <div className="text-center py-8">
                      <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No holdings yet. Search for stocks above to get started!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="watchlist" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Your Watchlist</span>
                  <Badge variant="secondary">{watchlist.length} stocks</Badge>
                </CardTitle>
                <CardDescription>
                  Monitor stocks you're interested in
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {watchlist.map((item: WatchlistItem) => {
                    const priceData = mockStockPrices[item.symbol];
                    return (
                      <div 
                        key={item.id} 
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer stock-card"
                        onClick={() => handleStockSelect(item.symbol)}
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div>
                              <h3 className="font-semibold text-lg">{item.symbol}</h3>
                              {item.notes && (
                                <p className="text-sm text-gray-600">{item.notes}</p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          {priceData ? (
                            <>
                              <div className="font-semibold text-lg">
                                {formatCurrency(priceData.price)}
                              </div>
                              <div className={`flex items-center space-x-1 text-sm justify-end ${
                                priceData.change >= 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {priceData.change >= 0 ? (
                                  <ArrowUpRight className="h-3 w-3" />
                                ) : (
                                  <ArrowDownRight className="h-3 w-3" />
                                )}
                                <span>{formatCurrency(priceData.change)}</span>
                                <span>({formatPercent(priceData.changePercent)})</span>
                              </div>
                            </>
                          ) : (
                            <div className="text-gray-400">Price unavailable</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  
                  {watchlist.length === 0 && (
                    <div className="text-center py-8">
                      <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No stocks in your watchlist. Search for stocks above to add them!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Stock Detail Modal */}
      <StockDetailModal
        symbol={selectedStock || ''}
        isOpen={showStockDetail}
        onClose={() => {
          setShowStockDetail(false);
          setSelectedStock(null);
        }}
      />
    </div>
  );
}

export default App;