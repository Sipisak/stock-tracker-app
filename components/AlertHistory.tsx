import { getUserAlertHistory } from '@/lib/actions/alert.actions';

export default async function AlertHistory() {
    const history = await getUserAlertHistory();

    if (history.length === 0) {
        return (
            <div className="flex h-40 items-center justify-center text-sm text-gray-500 italic">
                No history records found.
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3 pb-4 hide-scrollbar">
            {history.map((event: any) => {
                let latencyMsg = "-";
                if (event.timings?.receivedAt && event.timings?.savedAt) {
                    const ms = event.timings.savedAt - event.timings.receivedAt;
                    latencyMsg = `${ms} ms`;
                }

                const dateObj = new Date(event.triggeredAt);
                const dateStr = dateObj.toLocaleDateString();
                const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

                return (
                    <div
                        key={event._id}
                        className="p-4 rounded-lg bg-gray-800 border border-gray-600 transition-all hover:border-gray-500 group"
                    >
                        {/* Symbol a Cena */}
                        <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-yellow-500 text-lg uppercase">
                                {event.symbol}
                            </span>
                            <span className="text-teal-400 font-bold">
                                ${event.triggerPrice.toLocaleString()}
                            </span>
                        </div>

                        {/* Podmínka */}
                        <div className="text-sm text-gray-400 mb-4">
                            {event.condition === 'upper' ? 'Price rose above' : 'Price dropped below'}{' '}
                            <span className="text-gray-100 font-medium">{event.threshold}</span>
                        </div>

                        {/* Footer: Čas a Latence */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-700/50 text-[10px] uppercase tracking-wider text-gray-500">
                            <div className="flex gap-2">
                                <span>{dateStr}</span>
                                <span className="text-gray-600">|</span>
                                <span>{timeStr}</span>
                            </div>
                            <div className="flex items-center gap-1 bg-gray-900/50 px-2 py-1 rounded border border-gray-700">
                                <span className="opacity-70">LATENCY:</span>
                                <span className="font-mono text-gray-300">{latencyMsg}</span>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}