import { Star } from 'lucide-react';
import { searchStocks } from '@/lib/actions/finnhub.actions';
import SearchCommand from '@/components/SearchCommand';
import { getAlertsForUser } from '@/lib/actions/alert.actions';
import { getWatchlistWithData } from '@/lib/actions/watchlist.actions';
import { WatchlistTable } from '@/components/WatchlistTable';
import AlertsList from '@/components/AlertsList';
import AlertHistory from '@/components/AlertHistory';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Watchlist = async () => {
    const watchlist = await getWatchlistWithData();
    const initialStocks = await searchStocks();
    const alerts = await getAlertsForUser();


    if (watchlist.length === 0) {
        return (
            <section className="flex watchlist-empty-container">
                <div className="watchlist-empty">
                    <Star className="watchlist-star" />
                    <h2 className="empty-title">Your watchlist is empty</h2>
                    <p className="empty-description">
                        Start building your watchlist by searching for stocks and clicking the star icon to add them.
                    </p>
                </div>
                <SearchCommand initialStocks={initialStocks} />
            </section>
        );
    }

    return (
        <section className="watchlist-container">
            <div className="watchlist">
                <div className="flex items-center justify-between">
                    <h2 className="watchlist-title">Watchlist</h2>
                    <SearchCommand initialStocks={initialStocks} />
                </div>
                <WatchlistTable watchlist={watchlist} />
            </div>
            <aside className="watchlist-alerts">
                <Tabs defaultValue="active" className="w-full h-full flex flex-col">

                    {/* Přepínací tlačítka */}
                    <TabsList className="grid w-full grid-cols-2 mb-4 bg-[#1a1a1a] text-gray-400">
                        <TabsTrigger value="active">Active Alerts</TabsTrigger>
                        <TabsTrigger value="history">History</TabsTrigger>
                    </TabsList>

                    {/* Záložka 1: Aktivní alerty */}
                    <TabsContent
                        value="active"
                        className="flex-1 overflow-y-auto pr-2 hide-scrollbar outline-none"
                    >
                        <AlertsList alerts={alerts} />
                    </TabsContent>

                    {/* Záložka 2: Historie proběhlých alertů */}
                    <TabsContent
                        value="history"
                        className="flex-1 overflow-y-auto pr-2 hide-scrollbar outline-none"
                    >
                        <AlertHistory />
                    </TabsContent>

                </Tabs>
            </aside>
        </section>
    );
};

export default Watchlist;