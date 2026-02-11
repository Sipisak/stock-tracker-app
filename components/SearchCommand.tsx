'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, Star, TrendingUp } from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandInput,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  addToWatchlist,
  removeFromWatchlist,
} from '@/lib/actions/watchlist.actions';
import { searchStocks } from '@/lib/actions/finnhub.actions';
import { useDebounce } from '@/hooks/useDebounce';

export default function SearchCommand({
                                        renderAs = 'button',
                                        label = 'Add stock',
                                        initialStocks,
                                      }: SearchCommandProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [stocks, setStocks] =
      useState<StockWithWatchlistStatus[]>(initialStocks);

  const isSearchMode = !!searchTerm.trim();
  const displayStocks = isSearchMode ? stocks : stocks?.slice(0, 10);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleSearch = async () => {
    if (!isSearchMode) return setStocks(initialStocks);

    setLoading(true);
    try {
      const results = await searchStocks(searchTerm.trim());
      setStocks(results);
    } catch {
      setStocks([]);
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = useDebounce(handleSearch, 300);

  useEffect(() => {
    debouncedSearch();
  }, [searchTerm]);

  const handleSelectStock = () => {
    setOpen(false);
    setSearchTerm('');
    setStocks(initialStocks);
  };

  const handleWatchlistChange = (symbol: string, isAdded: boolean) => {
    setStocks((prevStocks) =>
      prevStocks.map((stock) =>
        stock.symbol === symbol ? { ...stock, isInWatchlist: isAdded } : stock
      )
    );
  };

  const handleWatchlistClick = async (
    e: React.MouseEvent,
    stock: StockWithWatchlistStatus
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const originalStatus = stock.isInWatchlist;
    handleWatchlistChange(stock.symbol, !originalStatus); // Optimistic update

    try {
      originalStatus
        ? await removeFromWatchlist(stock.symbol)
        : await addToWatchlist(stock.symbol, stock.name);
    } catch (error) {
      handleWatchlistChange(stock.symbol, originalStatus); // Revert on error
    }
  };

  return (
      <>
        {renderAs === 'text' ? (
            <span onClick={() => setOpen(true)} className='search-text'>
          {label}
        </span>
        ) : (
            <Button onClick={() => setOpen(true)} className='search-btn'>
              {label}
            </Button>
        )}
        <CommandDialog
            open={open}
            onOpenChange={setOpen}
            className='search-dialog'
        >
          <div className='search-field'>
            <CommandInput
                value={searchTerm}
                onValueChange={setSearchTerm}
                placeholder='Search stocks...'
                className='search-input'
            />
            {loading && <Loader2 className='search-loader' />}
          </div>
          <CommandList className='search-list'>
            {loading ? (
                <CommandEmpty className='search-list-empty'>
                  Loading stocks...
                </CommandEmpty>
            ) : displayStocks?.length === 0 ? (
                <div className='search-list-indicator'>
                  {isSearchMode ? 'No results found' : 'No stocks available'}
                </div>
            ) : (
                <ul>
                  <div className='search-count'>
                    {isSearchMode ? 'Search results' : 'Popular stocks'}
                    {` `}({displayStocks?.length || 0})
                  </div>
                  {displayStocks?.map((stock, i) => (
                    <li key={stock.symbol} className='search-item'>
                      <div className='flex w-full items-center'>
                        <Link href={`/stocks/${stock.symbol}`} onClick={handleSelectStock} className='flex flex-1 items-center gap-2 p-2'>
                          <TrendingUp className='h-4 w-4 text-gray-500' />
                          <div className='flex-1'>
                            <div className='search-item-name'>{stock.name}</div>
                            <div className='text-sm text-gray-500'>
                              {stock.symbol} | {stock.exchange} | {stock.type}
                            </div>
                          </div>
                        </Link>
                        <div className='p-2'>
                          <Button
                            variant='ghost'
                            size='icon'
                            onClick={(e) => handleWatchlistClick(e, stock)}
                          >
                            <Star className={cn('size-4', stock.isInWatchlist && 'fill-yellow-400 text-yellow-500')} />
                          </Button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
            )}
          </CommandList>
        </CommandDialog>
      </>
  );
}