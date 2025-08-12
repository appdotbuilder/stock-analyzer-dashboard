import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  PieChart, 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  DollarSign
} from 'lucide-react';
import type { PortfolioHolding, PortfolioSummary } from '../../../server/src/schema';

interface PortfolioChartProps {
  holdings: PortfolioHolding[];
  summary: PortfolioSummary;
  onStockClick?: (symbol: string) => void;
}

export function PortfolioChart({ holdings, summary, onStockClick }: PortfolioChartProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercent = (percent: number) => {
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
  };

  // Calculate portfolio allocation percentages
  const totalValue = holdings.reduce((sum, holding) => sum + holding.current_value, 0);
  const holdingsWithAllocation = holdings.map(holding => ({
    ...holding,
    allocation: totalValue > 0 ? (holding.current_value / totalValue) * 100 : 0
  }));

  // Sort by current value (largest first)
  holdingsWithAllocation.sort((a, b) => b.current_value - a.current_value);

  // Color palette for portfolio visualization
  const colors = [
    'bg-blue-500',
    'bg-green-500', 
    'bg-purple-500',
    'bg-yellow-500',
    'bg-red-500',
    'bg-indigo-500',
    'bg-pink-500',
    'bg-teal-500'
  ];

  const textColors = [
    'text-blue-600',
    'text-green-600',
    'text-purple-600', 
    'text-yellow-600',
    'text-red-600',
    'text-indigo-600',
    'text-pink-600',
    'text-teal-600'
  ];

  const bgColors = [
    'bg-blue-50',
    'bg-green-50',
    'bg-purple-50',
    'bg-yellow-50', 
    'bg-red-50',
    'bg-indigo-50',
    'bg-pink-50',
    'bg-teal-50'
  ];

  return (
    <div className="space-y-6">
      {/* Portfolio Allocation Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <PieChart className="h-5 w-5" />
              <span>Portfolio Allocation</span>
            </CardTitle>
            <Badge variant="secondary">
              {formatCurrency(summary.total_value)} total
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Pie Chart Visualization (Simplified) */}
          <div className="space-y-4">
            {/* Chart Placeholder */}
            <div className="h-64 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg flex items-center justify-center border border-gray-200 mb-6">
              <div className="text-center">
                <PieChart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">Portfolio Allocation Chart</p>
                <p className="text-gray-500 text-sm">Visual representation of your holdings</p>
                <p className="text-xs text-gray-400 mt-2">
                  Note: Interactive chart would be implemented with a library like Chart.js
                </p>
              </div>
            </div>

            {/* Holdings Breakdown */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 mb-3">Holdings Breakdown</h4>
              {holdingsWithAllocation.map((holding, index) => (
                <div 
                  key={holding.id} 
                  className={`p-4 rounded-lg border transition-colors cursor-pointer hover:bg-gray-50 ${
                    onStockClick ? 'hover:border-gray-300' : ''
                  }`}
                  onClick={() => onStockClick?.(holding.symbol)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded ${colors[index % colors.length]}`} />
                      <div>
                        <div className="font-semibold text-lg">{holding.symbol}</div>
                        <div className="text-sm text-gray-600">
                          {holding.quantity} shares
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        {formatCurrency(holding.current_value)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {holding.allocation.toFixed(1)}% of portfolio
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mt-3">
                    <Progress value={holding.allocation} className="h-2" />
                  </div>
                  
                  {/* Performance */}
                  <div className="flex justify-between items-center mt-2">
                    <div className={`text-sm ${
                      holding.total_return >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {holding.total_return >= 0 ? (
                        <TrendingUp className="h-3 w-3 inline mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 inline mr-1" />
                      )}
                      {formatPercent(holding.total_return_percent)}
                    </div>
                    <div className="text-sm text-gray-600">
                      Avg: {formatCurrency(holding.average_cost)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Performance Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Winners */}
            <div>
              <h4 className="font-medium text-green-600 mb-3 flex items-center">
                <TrendingUp className="h-4 w-4 mr-1" />
                Top Performers
              </h4>
              <div className="space-y-2">
                {holdingsWithAllocation
                  .filter(h => h.total_return_percent > 0)
                  .sort((a, b) => b.total_return_percent - a.total_return_percent)
                  .slice(0, 3)
                  .map((holding, index) => (
                    <div 
                      key={holding.id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${bgColors[1]} hover:${bgColors[1]}`}
                      onClick={() => onStockClick?.(holding.symbol)}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold">{holding.symbol}</span>
                          <Badge variant="secondary" className="text-xs">
                            #{index + 1}
                          </Badge>
                        </div>
                        <div className={`font-medium ${textColors[1]}`}>
                          {formatPercent(holding.total_return_percent)}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Losers */}
            <div>
              <h4 className="font-medium text-red-600 mb-3 flex items-center">
                <TrendingDown className="h-4 w-4 mr-1" />
                Needs Attention
              </h4>
              <div className="space-y-2">
                {holdingsWithAllocation
                  .filter(h => h.total_return_percent < 0)
                  .sort((a, b) => a.total_return_percent - b.total_return_percent)
                  .slice(0, 3)
                  .map((holding, index) => (
                    <div 
                      key={holding.id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${bgColors[4]} hover:${bgColors[4]}`}
                      onClick={() => onStockClick?.(holding.symbol)}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold">{holding.symbol}</span>
                        </div>
                        <div className={`font-medium ${textColors[4]}`}>
                          {formatPercent(holding.total_return_percent)}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Overall Performance */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(summary.total_return)}
                </div>
                <div className={`text-sm ${
                  summary.total_return >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  Total Return ({formatPercent(summary.total_return_percent)})
                </div>
              </div>
              
              <div className="text-center">
                <div className={`text-2xl font-bold ${
                  summary.daily_change >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(summary.daily_change)}
                </div>
                <div className={`text-sm ${
                  summary.daily_change >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  Today ({formatPercent(summary.daily_change_percent)})
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {summary.holdings_count}
                </div>
                <div className="text-sm text-gray-600">
                  Active Positions
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}