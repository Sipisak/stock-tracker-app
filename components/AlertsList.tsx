'use client';

import { IAlert } from '@/database/models/alert.model';
import { getAlertText } from '@/lib/utils';
import { Button } from './ui/button';
import { Trash2 } from 'lucide-react';
import { deleteAlert } from '@/lib/actions/alert.actions';
import { toast } from 'sonner';

const AlertsList = ({ alerts }: { alerts: IAlert[] }) => {
  const handleDelete = async (alertId: string) => {
    try {
      const result = await deleteAlert(alertId);
      if (result.success) {
        toast.success('Alert deleted successfully!');
      } else {
        toast.error('Failed to delete alert', {
          description: result.error,
        });
      }
    } catch (e) {
      toast.error('Failed to delete alert', {
        description:
            e instanceof Error ? e.message : 'An unexpected error occurred.',
      });
    }
  };

  return (
      <div className="alert-list">
        <h3 className="px-3 py-2 text-lg font-semibold text-gray-100">
          Active Alerts
        </h3>
        {alerts.length === 0 ? (
            <div className="alert-empty">
              <p>You have no active alerts.</p>
              <p className="text-sm text-gray-500">
                Add alerts from your watchlist to get notified.
              </p>
            </div>
        ) : (
            alerts.map((alert) => (
                <div key={alert._id} className="alert-item">
                  <div className="alert-details">
                    <div>
                      <p className="alert-name">{alert.symbol}</p>
                      <p className="alert-company">{alert.company}</p>
                    </div>
                    <p className="alert-price">{getAlertText(alert)}</p>
                  </div>
                  <div className="alert-actions">
                    <p className="text-xs text-gray-500">
                      Created: {new Date(alert.createdAt).toLocaleDateString()}
                    </p>
                    <Button variant="ghost" size="icon" className="alert-delete-btn" onClick={() => handleDelete(alert._id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
            ))
        )}
      </div>
  );
};

export default AlertsList;