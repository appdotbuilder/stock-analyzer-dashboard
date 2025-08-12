import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Activity,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import type { Stock, HistoricalPrice } from '../../../server/src/schema';

interface StockDetailModalProps {
  symbol: string;
  isOpen: boolean;
  onClose: () => void;
}

// Mock data for demonstration
const mockStockDetails: Record<string, Stock> = {
  'AAPL': {
    id: 1,
    symbol: 'AAPL',
    company_name: 'Apple Inc.',
    current_price: 175.00,
    daily_change: 2.50,
    daily_change_percent: 1.45,
    market_cap: 2800000000000,
    volume: 65000000,
    pe_ratio: 28.5,
    created_at: new Date(),
    updated_at: new Date()
  },
  'GOOGL': {
    id: 2,
    symbol: 'GOOGL',
    company_name: 'Alphabet Inc.',
    current_price: 2900.00,
    daily_change: -15.00,
    daily_change_percent: -0.51,
    market_cap: 1850000000000,
    volume: 28000000,
    pe_ratio: 25.8,
    created_at: new Date(),
    updated_at: new Date()
  },
  'TSLA': {
    id: 4,
    symbol: 'TSLA',
    company_name: 'Tesla, Inc.',
    current_price: 248.50,
    daily_change: -3.25,
    daily_change_percent: -1.29,
    market_cap: 785000000000,
    volume: 85000000,
    pe_ratio: 62.3,
    created_at: new Date(),
    updated_at: new Date()
  }
};

const mockHistoricalData: HistoricalPrice[] = [
  { id: 1, stock_id: 1, symbol: 'AAPL', price: 170.00, volume: 45000000, date: new Date('2024-02-15'), created_at: new Date() },
  { id: 2, stock_id: 1, symbol: 'AAPL', price: 172.50, volume: 52000000, date: new Date('2024-02-16'), created_at: new Date() },
  { id: 3, stock_id: 1, symbol: 'AAPL', price: 168.75, volume: 48000000, date: new Date('2024-02-17'), created_at: new Date() },
  { id: 4, stock_id: 1, symbol: 'AAPL', price: 175.00, volume: 65000000, date: new Date('2024-02-18'), created_at: new Date() }
];

export function StockDetailModal({ symbol, isOpen, onClose }: StockDetailModalProps) {
  const [stock, setStock] = useState<Stock | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalPrice[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1D' | '1W' | '1M' | '3M' | '1Y'>('1M');

  useEffect(() => {
    if (isOpen && symbol) {
      // Mock data loading - in reality would be:
      // const stockData = await trpc.getStockBySymbol.query(symbol);
      // const historical = await trpc.getHistoricalPrices.query({
      //   symbol,
      //   start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      //   end_date: new Date()
      // });
      
      setStock(mockStockDetails[symbol] || null);
      setHistoricalData(mockHistoricalData);
    }
  }, [symbol, isOpen]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatLargeNumber = (num: number) => {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return formatCurrency(num);
  };

  const formatPercent = (percent: number) => {
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
  };

  if (!stock) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <h2 className="text-2xl font-bold">{stock.symbol}</h2>
                <p className="text-gray-600">{stock.company_name}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{formatCurrency(stock.current_price)}</div>
              <div className={`flex items-center space-x-1 justify-end ${
                stock.daily_change >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {stock.daily_change >= 0 ? (
                  <ArrowUpRight className="h-4 w-4" />
                ) : (
                  <ArrowDownRight className="h-4 w-4" />
                )}
                <span>{formatCurrency(stock.daily_change)}</span>
                <span>({formatPercent(stock.daily_change_percent)})</span>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Market Cap</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stock.market_cap ? formatLargeNumber(stock.market_cap) : 'N/A'}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Volume</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stock.volume ? stock.volume.toLocaleString() : 'N/A'}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">P/E Ratio</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stock.pe_ratio ? stock.pe_ratio.toFixed(2) : 'N/A'}
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="chart" className="space-y-4">
            <TabsList>
              <TabsTrigger value="chart">Price Chart</TabsTrigger>
              <TabsTrigger value="fundamentals">Fundamentals</TabsTrigger>
              <TabsTrigger value="news">News & Analysis</TabsTrigger>
            </TabsList>

            <TabsContent value="chart" className="space-y-4">
              {/* Timeframe Selection */}
              <div className="flex space-x-2">
                {['1D', '1W', '1M', '3M', '1Y'].map((timeframe) => (
                  <Button
                    key={timeframe}
                    variant={selectedTimeframe === timeframe ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedTimeframe(timeframe as any)}
                  >
                    {timeframe}
                  </Button>
                ))}
              </div>

              {/* Chart Placeholder */}
              <Card>
                <CardContent className="p-6">
                  <div className="h-80 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg flex items-center justify-center border border-blue-200">
                    <div className="text-center">
                      <BarChart3 className="h-16 w-16 text-blue-400 mx-auto mb-4" />
                      <p className="text-blue-600 font-medium">Interactive Price Chart</p>
                      <p className="text-blue-500 text-sm">
                        Historical data for {stock.symbol} ({selectedTimeframe} view)
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        Note: Chart functionality is a stub - would integrate with a charting library like Chart.js or Recharts
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Price Data */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Price History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {historicalData.slice(0, 5).map((price: HistoricalPrice) => (
                      <div key={price.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                        <span className="text-sm text-gray-600">
                          {price.date.toLocaleDateString()}
                        </span>
                        <div className="text-right">
                          <div className="font-medium">{formatCurrency(price.price)}</div>
                          {price.volume && (
                            <div className="text-xs text-gray-500">
                              Vol: {price.volume.toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="fundamentals">
              <Card>
                <CardHeader>
                  <CardTitle>Financial Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900">Valuation</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Market Cap</span>
                          <span className="font-medium">
                            {stock.market_cap ? formatLargeNumber(stock.market_cap) : 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">P/E Ratio</span>
                          <span className="font-medium">
                            {stock.pe_ratio ? stock.pe_ratio.toFixed(2) : 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Price/Share</span>
                          <span className="font-medium">{formatCurrency(stock.current_price)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900">Trading</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Daily Volume</span>
                          <span className="font-medium">
                            {stock.volume ? stock.volume.toLocaleString() : 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Daily Change</span>
                          <span className={`font-medium ${
                            stock.daily_change >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatPercent(stock.daily_change_percent)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="news">
              <Card>
                <CardHeader>
                  <CardTitle>News & Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">📰</div>
                    <p className="text-gray-600">News integration coming soon</p>
                    <p className="text-sm text-gray-500">
                      This would integrate with financial news APIs to show relevant articles and analyst reports
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}