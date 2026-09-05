import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  Clock,
  Printer,
  Bike,
  Package,
  Star,
  FileText,
  RotateCcw,
  MessageSquare,
  Send,
  X,
  ShieldAlert,
} from 'lucide-react';
import { Order, Shop } from '../../types';
import { MapVisualizer } from '../map/MapVisualizer';
import { getSocket } from '../../utils/socket';
import { apiFetch } from '../../utils/api';

interface LiveOrderTrackerProps {
  order: Order;
  onOrderUpdated: (updated: Order) => void;
  onReorder: (order: Order) => void;
}

export const LiveOrderTracker: React.FC<LiveOrderTrackerProps> = ({
  order,
  onOrderUpdated,
  onReorder,
}) => {
  const [shop, setShop] = useState<Shop | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isReviewSubmitted, setIsReviewSubmitted] = useState(false);

  // In-app chat modal state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessageText, setNewMessageText] = useState('');

  // Fetch shop details
  useEffect(() => {
    if (order.shopId) {
      apiFetch<{ success: boolean; shop: Shop }>(`/shops/${order.shopId}`)
        .then((res) => {
          if (res.success) setShop(res.shop);
        })
        .catch(console.warn);
    }
  }, [order.shopId]);

  // Listen to Socket real-time order updates and chat
  useEffect(() => {
    const socket = getSocket();
    socket.emit('join_order', order._id);

    const handleUpdate = (updatedOrder: any) => {
      if (updatedOrder._id === order._id || updatedOrder.orderId === order._id) {
        onOrderUpdated({ ...order, ...updatedOrder });
      }
    };

    const handleNewMessage = (msg: any) => {
      if (msg.orderId === order._id) {
        setChatMessages((prev) => [...prev, msg]);
      }
    };

    socket.on('order_status_update', handleUpdate);
    socket.on('new_message', handleNewMessage);

    // Fetch initial chat messages
    apiFetch<{ success: boolean; messages: any[] }>(`/chat/${order._id}`)
      .then((res) => {
        if (res.success) setChatMessages(res.messages);
      })
      .catch(console.warn);

    return () => {
      socket.off('order_status_update', handleUpdate);
      socket.off('new_message', handleNewMessage);
    };
  }, [order._id]);

  const handleSendMessage = async () => {
    if (!newMessageText.trim()) return;
    const socket = getSocket();
    socket.emit('send_message', {
      orderId: order._id,
      senderId: order.userId,
      senderName: 'Customer',
      senderRole: 'CUSTOMER',
      message: newMessageText.trim(),
    });
    setNewMessageText('');
  };

  const handleReviewSubmit = async () => {
    try {
      const res = await apiFetch(`/orders/${order._id}/review`, {
        method: 'POST',
        body: JSON.stringify({ rating, comment: reviewComment }),
      });
      if (res.success) {
        setIsReviewSubmitted(true);
        setTimeout(() => setIsReviewModalOpen(false), 1500);
      }
    } catch (err: any) {
      alert('Error submitting review: ' + err.message);
    }
  };

  const pipelineStages = [
    { key: 'DISPATCHED_TO_SHOP', label: 'Matching / Assigned', icon: Clock },
    { key: 'ACCEPTED', label: 'Shop Accepted', icon: CheckCircle },
    { key: 'PRINTING', label: 'Printing In Progress', icon: Printer },
    {
      key: 'READY',
      label: order.deliveryType === 'SELF_PICKUP' ? 'Ready for Pickup' : 'Packed for Courier',
      icon: Package,
    },
    {
      key: order.deliveryType === 'HOME_DELIVERY' ? 'OUT_FOR_DELIVERY' : 'COMPLETED',
      label: order.deliveryType === 'HOME_DELIVERY' ? 'Out for Delivery' : 'Completed',
      icon: order.deliveryType === 'HOME_DELIVERY' ? Bike : CheckCircle,
    },
    { key: 'COMPLETED', label: 'Delivered / Completed', icon: CheckCircle },
  ];

  const currentStageIndex = pipelineStages.findIndex((s) => s.key === order.orderStatus);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Order Status Stepper Card */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-400">
                Live Order Tracking
              </span>
              <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                #{order.orderNumber}
              </span>
            </div>
            <h2 className="text-lg font-bold text-white mt-0.5">{order.fileName}</h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Direct Chat with Print Shop */}
            <button
              onClick={() => setIsChatOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
              <span>Chat with Shop</span>
              {chatMessages.length > 0 && (
                <span className="text-[10px] bg-cyan-500/20 text-cyan-400 px-1.5 rounded-full font-bold">
                  {chatMessages.length}
                </span>
              )}
            </button>

            {/* Download Invoice */}
            <a
              href={`http://localhost:5000/api/orders/${order._id}/invoice`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-brand-400" />
              <span>Invoice</span>
            </a>
          </div>
        </div>

        {/* Real-time Visual Pipeline Stepper */}
        <div className="relative py-2">
          <div className="hidden sm:block absolute top-1/2 left-0 right-0 h-1 bg-slate-800 -translate-y-1/2 z-0" />
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 relative z-10">
            {pipelineStages.map((stage, idx) => {
              const Icon = stage.icon;
              const isPast = idx <= currentStageIndex;
              const isCurrent = idx === currentStageIndex;

              return (
                <div key={stage.key} className="flex flex-col items-center text-center">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                      isCurrent
                        ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/40 ring-4 ring-brand-500/20 scale-110'
                        : isPast
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-800 text-slate-500 border border-slate-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span
                    className={`text-[11px] mt-2 font-medium leading-tight ${
                      isCurrent ? 'text-brand-300 font-bold' : isPast ? 'text-slate-300' : 'text-slate-600'
                    }`}
                  >
                    {stage.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Interactive Map Visualizer */}
        <div className="pt-2">
          <MapVisualizer
            shopName={shop?.name || 'Assigned Cyber Cafe Hub'}
            orderStatus={order.orderStatus}
            deliveryType={order.deliveryType}
          />
        </div>

        {/* Partner Shop & Pricing Recap */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
            <div className="text-[10px] uppercase font-bold text-slate-400">Assigned Print Hub</div>
            <div className="font-semibold text-white text-sm">{shop?.name || 'Matching nearest partner...'}</div>
            <div className="text-xs text-slate-400">{shop?.address || 'Koramangala 5th Block, Bengaluru'}</div>
            <div className="text-xs text-brand-400 font-mono mt-1">Contact: {shop?.phone || '+91 98111 22233'}</div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
            <div className="text-[10px] uppercase font-bold text-slate-400">Payment & Specs</div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-300">
                {order.specs.paperSize} • {order.specs.printType} • {order.specs.paperType}
              </span>
              <span className="font-bold text-emerald-400 text-sm">₹{order.totalPrice}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-400 pt-1">
              <span>Mode: {order.paymentMode}</span>
              <span
                className={`font-semibold ${
                  order.paymentStatus === 'COLLECTED_BY_SHOP' || order.paymentStatus === 'PAID_OUT'
                    ? 'text-emerald-400'
                    : 'text-amber-400'
                }`}
              >
                Status: {order.paymentStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Actions for Completed Order */}
        {order.orderStatus === 'COMPLETED' && (
          <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <div>
                <div className="font-semibold text-white text-sm">Print Job Completed!</div>
                <div className="text-xs text-slate-400">
                  {order.paymentMode === 'COD'
                    ? 'Cash received & verified by shop partner.'
                    : 'Payment released from platform escrow.'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsReviewModalOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>Rate Shop</span>
              </button>

              <button
                onClick={() => onReorder(order)}
                className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-md shadow-brand-500/20"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reorder</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Direct In-App Chat Modal */}
      {isChatOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col h-[500px]">
            <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-cyan-400" />
                <div>
                  <div className="font-semibold text-white text-xs">Chat with {shop?.name || 'Shop'}</div>
                  <div className="text-[10px] text-slate-400">Order #{order.orderNumber}</div>
                </div>
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages list */}
            <div className="flex-1 p-3 overflow-y-auto space-y-2 text-xs">
              {chatMessages.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <p>No messages yet.</p>
                  <p className="text-[10px] text-slate-600 mt-1">Ask questions about your print quality or paper stock.</p>
                </div>
              ) : (
                chatMessages.map((msg) => {
                  const isMe = msg.senderRole === 'CUSTOMER';
                  return (
                    <div
                      key={msg._id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[80%] p-2.5 rounded-xl ${
                          isMe
                            ? 'bg-brand-600 text-white rounded-tr-none'
                            : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'
                        }`}
                      >
                        <p>{msg.message}</p>
                      </div>
                      <span className="text-[9px] text-slate-500 mt-0.5">
                        {msg.senderName} •{' '}
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Input */}
            <div className="p-2.5 border-t border-slate-800 flex items-center gap-2 bg-slate-950/50">
              <input
                type="text"
                value={newMessageText}
                onChange={(e) => setNewMessageText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type your message to the cyber cafe..."
                className="flex-1 p-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
              <button
                onClick={handleSendMessage}
                className="p-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-2xl space-y-4 text-center">
            <h3 className="font-bold text-white text-base">Rate Your Experience</h3>
            <p className="text-xs text-slate-400">
              How satisfied are you with the print quality and speed at {shop?.name}?
            </p>

            {/* Star selector */}
            <div className="flex justify-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  onClick={() => setRating(s)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`w-7 h-7 ${
                      s <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-600'
                    }`}
                  />
                </button>
              ))}
            </div>

            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Leave a helpful review for other print customers..."
              className="w-full h-20 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 resize-none"
            />

            {isReviewSubmitted ? (
              <div className="text-xs text-emerald-400 font-semibold flex items-center justify-center gap-1.5">
                <CheckCircle className="w-4 h-4" />
                <span>Review submitted. Thank you!</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsReviewModalOpen(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-400 text-xs font-semibold"
                >
                  Skip
                </button>
                <button
                  onClick={handleReviewSubmit}
                  className="flex-1 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md shadow-brand-500/30"
                >
                  Submit
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
