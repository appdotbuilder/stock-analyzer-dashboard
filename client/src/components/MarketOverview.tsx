import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight,
  ArrowDownRight,
  Globe,
  Zap,
  Activity
} from 'lucide-react';

interface MarketIndex {
  symbol: string;
  name: string;
  value: number;
  change: number;
  changePercent: number;
}

interface TrendingStock {
  symbol: string;
  company: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
}

interface MarketOverviewProps {
  onStockSelect?: (symbol: string) => void;
}

// Mock market data
const marketIndices: MarketIndex[] = [
  {
    symbol: 'SPX',
    name: 'S&P 500',
    value: 4756.50,
    change: 12.45,
    changePercent: 0.26
  },
  {
    symbol: 'DJI',
    name: 'Dow Jones',
    value: 37863.80,
    change: -45.20,
    changePercent: -0.12
  },
  {
    symbol: 'IXIC',
    name: 'NASDAQ',
    value: 14878.50,
    change: 28.75,
    changePercent: 0.19
  },
  {
    symbol: 'RUT',
    name: 'Russell 2000',
    value: 2045.30,
    change: 5.85,
    changePercent: 0.29
  }
];

const trendingStocks: TrendingStock[] = [
  {
    symbol: 'NVDA',
    company: 'NVIDIA Corporation',
    price: 875.00,
    change: 12.75,
    changePercent: 1.48,
    volume: 45000000,
    marketCap: 2150000000000
  },
  {
    symbol: 'TSLA',
    company: 'Tesla, Inc.',
    price: 248.50,
    change: -3.25,
    changePercent: -1.29,
    volume: 85000000,
    marketCap: 785000000000
  },
  {
    symbol: 'META',
    company: 'Meta Platforms',
    price: 485.20,
    change: 8.45,
    changePercent: 1.77,
    volume: 22000000,
    marketCap: 1230000000000
  },
  {
    symbol: 'AMD',
    company: 'Advanced Micro Devices',
    price: 185.75,
    change: -2.35,
    changePercent: -1.25,
    volume: 38000000,
    marketCap: 300000000000
  }
];

export function MarketOverview({ onStockSelect }: MarketOverviewProps) {
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

  return (
    <div className="space-y-6">
      {/* Market Indices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="h-5 w-5" />
            <span>Market Indices</span>
            <Badge variant="secondary" className="ml-auto">Live</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {marketIndices.map((index: MarketIndex) => (
              <div key={index.symbol} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-lg">{index.symbol}</h3>
                    <p className="text-sm text-gray-600">{index.name}</p>
                  </div>
                  {index.changePercent >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                </div>
                <div className="space-y-1">
                  <div className="text-xl font-bold">
                    {index.value.toLocaleString()}
                  </div>
                  <div className={`flex items-center space-x-1 text-sm ${
                    index.change >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {index.change >= 0 ? (
                      <ArrowUpRight className="h-3 w-3" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3" />
                    )}
                    <span>{index.change >= 0 ? '+' : ''}{index.change.toFixed(2)}</span>
                    <span>({formatPercent(index.changePercent)})</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Trending Stocks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Movers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5" />
              <span>Top Movers</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {trendingStocks
                .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
                .slice(0, 4)
                .map((stock: TrendingStock) => (
                  <div
                    key={stock.symbol}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => onStockSelect?.(stock.symbol)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold">{stock.symbol}</span>
                        <Badge variant="outline" className="text-xs">
                          {Math.abs(stock.changePercent) > 2 ? 'High Vol' : 'Active'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 truncate">{stock.company}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(stock.price)}</div>
                      <div className={`text-sm flex items-center space-x-1 justify-end ${
                        stock.change >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {stock.change >= 0 ? (
                          <ArrowUpRight className="h-3 w-3" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3" />
                        )}
                        <span>{formatPercent(stock.changePercent)}</span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Most Active */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Most Active</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {trendingStocks
                .sort((a, b) => b.volume - a.volume)
                .map((stock: TrendingStock) => (
                  <div
                    key={stock.symbol}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => onStockSelect?.(stock.symbol)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold">{stock.symbol}</span>
                        <Badge variant="outline" className="text-xs">
                          Vol: {(stock.volume / 1000000).toFixed(1)}M
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 truncate">{stock.company}</p>
                      <p className="text-xs text-gray-500">
                        Market Cap: {formatLargeNumber(stock.marketCap)}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(stock.price)}</div>
                      <div className={`text-sm flex items-center space-x-1 justify-end ${
                        stock.change >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {stock.change >= 0 ? (
                          <ArrowUpRight className="h-3 w-3" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3" />
                        )}
                        <span>{formatPercent(stock.changePercent)}</span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Market Status */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="font-medium text-green-700">Market Open</span>
              </div>
              <span className="text-sm text-gray-600">
                Last updated: {new Date().toLocaleTimeString()}
              </span>
            </div>
            <div className="text-sm text-gray-500">
              Eastern Time
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}