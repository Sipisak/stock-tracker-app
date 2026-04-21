import { getUserAlertHistory } from '@/lib/actions/alert.actions';

export default async function AlertHistory() {
    const history = await getUserAlertHistory();

    if (history.length === 0) {
        return <p className="text-gray-500">Zatím se nespustil žádný alert.</p>;
    }

    return (
        <div className="overflow-x-auto mt-6">
            <h3 className="text-xl font-semibold mb-4">Historie spuštění</h3>
            <table className="w-full text-left text-sm">
                <thead>
                <tr className="border-b">
                    <th className="pb-2">Symbol</th>
                    <th className="pb-2">Podmínka</th>
                    <th className="pb-2">Zasažená cena</th>
                    <th className="pb-2">Čas</th>
                    <th className="pb-2">Latence zpracování</th>
                </tr>
                </thead>
                <tbody>
                {history.map((event: any) => {
                    // Výpočet latence (Rozdíl mezi přijetím na server a zápisem do DB)
                    let latencyMsg = "-";
                    if (event.timings?.receivedAt && event.timings?.savedAt) {
                        const ms = event.timings.savedAt - event.timings.receivedAt;
                        latencyMsg = `${ms} ms`;
                    }

                    return (
                        <tr key={event._id} className="border-b last:border-0">
                            <td className="py-3 font-bold">{event.symbol}</td>
                            <td className="py-3">
                                {event.condition === 'upper' ? 'Stoupla nad' : 'Klesla pod'} {event.threshold}
                            </td>
                            <td className="py-3 text-green-600 font-semibold">${event.triggerPrice}</td>
                            <td className="py-3">{new Date(event.triggeredAt).toLocaleString()}</td>
                            <td className="py-3 text-xs text-gray-500">{latencyMsg}</td>
                        </tr>
                    );
                })}
                </tbody>
            </table>
        </div>
    );
}