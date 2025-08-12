import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Plus, 
  Eye, 
  TrendingUp, 
  TrendingDown, 
  X,
  Clock,
  Star,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import type { Stock, AddPortfolioHoldingInput, AddWatchlistItemInput } from '../../../server/src/schema';

interface StockSearchProps {
  onAddToPortfolio: (input: AddPortfolioHoldingInput) => Promise<void>;
  onAddToWatchlist: (input: AddWatchlistItemInput) => Promise<void>;
  onStockSelect?: (symbol: string) => void;
  className?: string;
}

// Mock popular stocks for quick access
const popularStocks = [
  'AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'NVDA', 'META', 'NFLX'
];

const recentSearches = [
  'AAPL', 'TSLA', 'NVDA'
];

export function StockSearch({ 
  onAddToPortfolio, 
  onAddToWatchlist, 
  onStockSelect,
  className = "" 
}: StockSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Stock[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const userId = 'demo_user'; // In a real app, this would come from auth context

  // Mock search results
  const mockSearchResults: Stock[] = [
    {
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
    {
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
    {
      id: 3,
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
    },
    {
      id: 4,
      symbol: 'NVDA',
      company_name: 'NVIDIA Corporation',
      current_price: 875.00,
      daily_change: 12.75,
      daily_change_percent: 1.48,
      market_cap: 2150000000000,
      volume: 45000000,
      pe_ratio: 68.2,
      created_at: new Date(),
      updated_at: new Date()
    }
  ];

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    
    try {
      // Mock search - in reality: await trpc.searchStocks.query({ query: searchQuery })
      const filteredResults = mockSearchResults.filter(stock => 
        stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stock.company_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));
      setResults(filteredResults);
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Handle clicks outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) return;

    const totalItems = results.length + (query ? 0 : popularStocks.length + recentSearches.length);

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % totalItems);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev <= 0 ? totalItems - 1 : prev - 1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          // Handle selection based on index
          if (query && results.length > 0 && selectedIndex < results.length) {
            handleStockSelect(results[selectedIndex].symbol);
          } else if (!query) {
            // Handle popular/recent stocks selection
            const allQuickOptions = [...recentSearches, ...popularStocks];
            if (selectedIndex < allQuickOptions.length) {
              setQuery(allQuickOptions[selectedIndex]);
              performSearch(allQuickOptions[selectedIndex]);
            }
          }
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setShowDropdown(true);
    setSelectedIndex(-1);
  };

  const handleInputFocus = () => {
    setShowDropdown(true);
  };

  const handleStockSelect = (symbol: string) => {
    onStockSelect?.(symbol);
    setShowDropdown(false);
    setQuery('');
  };

  const handleAddToPortfolio = async (stock: Stock, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await onAddToPortfolio({
        user_id: userId,
        symbol: stock.symbol,
        quantity: 1,
        average_cost: stock.current_price
      });
    } catch (error) {
      console.error('Failed to add to portfolio:', error);
    }
  };

  const handleAddToWatchlist = async (stock: Stock, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await onAddToWatchlist({
        user_id: userId,
        symbol: stock.symbol,
        notes: null
      });
    } catch (error) {
      console.error('Failed to add to watchlist:', error);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setShowDropdown(false);
    inputRef.current?.focus();
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

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search stocks by symbol or company name..."
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          className="pl-10 pr-10"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            onClick={clearSearch}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
        {isSearching && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>

      {/* Search Dropdown */}
      {showDropdown && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-96 overflow-y-auto shadow-lg">
          <CardContent className="p-0">
            {query ? (
              // Search Results
              <div>
                {results.length > 0 ? (
                  <div className="py-2">
                    <div className="px-3 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Search Results
                    </div>
                    {results.map((stock: Stock, index: number) => (
                      <div
                        key={stock.id}
                        className={`px-3 py-3 cursor-pointer transition-colors border-l-4 border-transparent hover:bg-gray-50 ${
                          selectedIndex === index ? 'bg-blue-50 border-l-blue-500' : ''
                        }`}
                        onClick={() => handleStockSelect(stock.symbol)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                  <span className="font-semibold text-lg">{stock.symbol}</span>
                                  <Badge variant="secondary" className="text-xs">
                                    {stock.market_cap && stock.market_cap > 1e12 ? 'Large Cap' : 
                                     stock.market_cap && stock.market_cap > 1e10 ? 'Mid Cap' : 'Small Cap'}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600 truncate">{stock.company_name}</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <div className="font-semibold">{formatCurrency(stock.current_price)}</div>
                              <div className={`text-sm flex items-center space-x-1 ${
                                stock.daily_change >= 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {stock.daily_change >= 0 ? (
                                  <ArrowUpRight className="h-3 w-3" />
                                ) : (
                                  <ArrowDownRight className="h-3 w-3" />
                                )}
                                <span>{formatPercent(stock.daily_change_percent)}</span>
                              </div>
                            </div>
                            <div className="flex space-x-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => handleAddToPortfolio(stock, e)}
                                className="h-8 w-8 p-0"
                                title="Add to Portfolio"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => handleAddToWatchlist(stock, e)}
                                className="h-8 w-8 p-0"
                                title="Add to Watchlist"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  !isSearching && (
                    <div className="px-3 py-8 text-center text-gray-500">
                      <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p>No stocks found for "{query}"</p>
                      <p className="text-sm text-gray-400">Try a different symbol or company name</p>
                    </div>
                  )
                )}
              </div>
            ) : (
              // Quick Options (when no search query)
              <div className="py-2">
                {recentSearches.length > 0 && (
                  <div className="mb-4">
                    <div className="px-3 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      Recent
                    </div>
                    {recentSearches.map((symbol, index) => (
                      <div
                        key={symbol}
                        className={`px-3 py-2 cursor-pointer transition-colors hover:bg-gray-50 ${
                          selectedIndex === index ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => {
                          setQuery(symbol);
                          performSearch(symbol);
                        }}
                      >
                        <span className="font-medium">{symbol}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                <div>
                  <div className="px-3 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center">
                    <Star className="h-3 w-3 mr-1" />
                    Popular
                  </div>
                  {popularStocks.map((symbol, index) => (
                    <div
                      key={symbol}
                      className={`px-3 py-2 cursor-pointer transition-colors hover:bg-gray-50 ${
                        selectedIndex === (recentSearches.length + index) ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => {
                        setQuery(symbol);
                        performSearch(symbol);
                      }}
                    >
                      <span className="font-medium">{symbol}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}