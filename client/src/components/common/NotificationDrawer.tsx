import React, { useState, useEffect } from 'react';
import { Bell, X, MessageSquare, Smartphone, CheckCircle, Clock } from 'lucide-react';
import { apiFetch } from '../../utils/api';
import { getSocket } from '../../utils/socket';

interface NotificationItem {
  id: string;
  recipientPhone: string;
  recipientRole: 'CUSTOMER' | 'SHOP' | 'DELIVERY';
  channel: 'SMS' | 'WHATSAPP' | 'PUSH';
  title: string;
  body: string;
  orderNumber?: string;
  timestamp: string;
}

export const NotificationDrawer: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [hasNew, setHasNew] = useState(false);

  const fetchLogs = async () => {
    try {
      const res = await apiFetch<{ success: boolean; logs: NotificationItem[] }>('/notifications/logs');
      if (res.success) {
        setNotifications(res.logs);
      }
    } catch (err) {
      console.warn('Failed to fetch notification logs:', err);
    }
  };

  useEffect(() => {
    fetchLogs();

    const socket = getSocket();
    const handleOrderUpdate = () => {
      fetchLogs();
      setHasNew(true);
    };

    socket.on('incoming_job', handleOrderUpdate);
    socket.on('order_status_update', handleOrderUpdate);

    return () => {
      socket.off('incoming_job', handleOrderUpdate);
      socket.off('order_status_update', handleOrderUpdate);
    };
  }, []);

  return (
    <>
      {/* Bell Trigger Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          setHasNew(false);
        }}
        className="relative p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
        title="Live SMS & WhatsApp Notification Feed"
      >
        <Bell className="w-4 h-4" />
        {hasNew && (
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-brand-500 rounded-full animate-ping" />
        )}
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-brand-500 rounded-full" />
        )}
      </button>

      {/* Slide-over Notification Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-sm animate-fade-in flex justify-end">
          <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-brand-400" />
                <h3 className="font-semibold text-white text-sm">Live Dispatch Notifications</h3>
                <span className="text-[10px] bg-brand-500/20 text-brand-300 px-2 py-0.5 rounded-full font-medium">
                  SMS / WhatsApp / Push
                </span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Notification Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {notifications.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-sm">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No dispatch notifications yet.</p>
                  <p className="text-xs text-slate-600 mt-1">Place or advance an order to see live SMS/WhatsApp messages.</p>
                </div>
              ) : (
                notifications.map((n) => {
                  const isWhatsApp = n.channel === 'WHATSAPP';
                  const isSms = n.channel === 'SMS';
                  return (
                    <div
                      key={n.id}
                      className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:border-slate-600 transition-all text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                            isWhatsApp
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : isSms
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                          }`}
                        >
                          {isWhatsApp ? (
                            <MessageSquare className="w-2.5 h-2.5" />
                          ) : (
                            <Smartphone className="w-2.5 h-2.5" />
                          )}
                          {n.channel} • {n.recipientRole}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className="font-semibold text-slate-200">{n.title}</div>
                      <p className="text-slate-400 leading-relaxed">{n.body}</p>

                      <div className="text-[10px] text-slate-500 flex items-center gap-1.5 pt-1 border-t border-slate-700/40">
                        <span>To: {n.recipientPhone}</span>
                        {n.orderNumber && (
                          <span className="text-brand-400 font-mono font-medium">#{n.orderNumber}</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-800 text-center">
              <span className="text-[11px] text-slate-500">
                Connected to Twilio / WhatsApp Business & FCM Simulator
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
