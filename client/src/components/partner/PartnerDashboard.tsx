import React, { useState, useEffect } from 'react';
import {
  Store,
  Wifi,
  WifiOff,
  Clock,
  Printer,
  CheckCircle,
  AlertTriangle,
  Banknote,
  DollarSign,
  Layers,
  FileText,
  MessageSquare,
  Send,
  X,
  Eye,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Order, Shop, StockItem } from '../../types';
import { apiFetch } from '../../utils/api';
import { getSocket } from '../../utils/socket';
import confetti from 'canvas-confetti';

export const PartnerDashboard: React.FC = () => {
  const { shop, user, refreshUser } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [earnings, setEarnings] = useState<any>(null);
  const [isOnline, setIsOnline] = useState<boolean>(shop?.isOnline || true);
  const [selectedOrderForPreview, setSelectedOrderForPreview] = useState<Order | null>(null);

  // Countdown timer for incoming jobs (45s)
  const [countdown, setCountdown] = useState<number>(45);
  const [incomingJob, setIncomingJob] = useState<Order | null>(null);

  // Chat state with customer
  const [activeChatOrder, setActiveChatOrder] = useState<Order | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [replyText, setReplyText] = useState('');

  // Capabilities modal state
  const [isCapabilitiesModalOpen, setIsCapabilitiesModalOpen] = useState(false);
  const [capabilities, setCapabilities] = useState(
    shop?.capabilities || {
      supportedSizes: ['A4', 'A3', 'Legal', 'Letter'],
      supportedPapers: ['Normal 75gsm', 'Bond paper 85gsm', 'Glossy 180gsm', 'Cardstock 250gsm'],
      supportedBindings: ['None', 'Corner Staple', 'Spiral Ring Binding'],
      colorPrinting: true,
      duplexPrinting: true,
      maxDailyCapacity: 2500,
    }
  );

  const shopId = shop?._id || 'shp_koramangala_01';

  const fetchData = async () => {
    try {
      // 1. Orders
      const orderRes = await apiFetch<{ success: boolean; orders: Order[] }>(
        `/orders?shopId=${shopId}`
      );
      if (orderRes.success) {
        setOrders(orderRes.orders);
        // Find if any order is dispatched to shop and pending accept
        const pending = orderRes.orders.find((o) => o.orderStatus === 'DISPATCHED_TO_SHOP');
        if (pending && !incomingJob) {
          setIncomingJob(pending);
          setCountdown(45);
        }
      }

      // 2. Earnings
      const earnRes = await apiFetch<{ success: boolean; metrics: any }>(
        `/shops/${shopId}/earnings`
      );
      if (earnRes.success) setEarnings(earnRes.metrics);

      // 3. Stock
      const stockRes = await apiFetch<{ success: boolean; stock: StockItem[] }>(
        `/shops/${shopId}/inventory`
      );
      if (stockRes.success) setStockItems(stockRes.stock);
    } catch (err) {
      console.warn('Error fetching partner data:', err);
    }
  };

  useEffect(() => {
    fetchData();

    const socket = getSocket();
    socket.emit('join_shop', shopId);

    const handleIncoming = (newOrder: Order) => {
      console.log('🚨 New print job arrived:', newOrder);
      setIncomingJob(newOrder);
      setCountdown(45);
      fetchData();
    };

    const handleStatusUpdate = () => {
      fetchData();
    };

    socket.on('incoming_job', handleIncoming);
    socket.on('shop_order_update', handleStatusUpdate);

    return () => {
      socket.off('incoming_job', handleIncoming);
      socket.off('shop_order_update', handleStatusUpdate);
    };
  }, [shopId]);

  // 45-second accept timer ticker
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (incomingJob && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setIncomingJob(null); // timed out and auto-reassigned by backend
            fetchData();
            return 45;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [incomingJob, countdown]);

  const toggleAvailability = async () => {
    try {
      const res = await apiFetch(`/shops/${shopId}/availability`, {
        method: 'PUT',
        body: JSON.stringify({ isOnline: !isOnline }),
      });
      if (res.success) {
        setIsOnline(res.isOnline);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await apiFetch(`/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.success) {
        if (incomingJob?._id === orderId) {
          setIncomingJob(null);
        }
        fetchData();
      }
    } catch (err: any) {
      alert('Error updating status: ' + err.message);
    }
  };

  const handleConfirmCashReceived = async (orderId: string) => {
    try {
      const res = await apiFetch(`/orders/${orderId}/confirm-cash`, {
        method: 'POST',
      });
      if (res.success) {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
        });
        fetchData();
      }
    } catch (err: any) {
      alert('Error confirming cash: ' + err.message);
    }
  };

  const toggleStockStatus = async (item: StockItem) => {
    try {
      const res = await apiFetch(`/shops/${shopId}/inventory/${item._id}`, {
        method: 'PUT',
        body: JSON.stringify({ isOutOfStock: !item.isOutOfStock }),
      });
      if (res.success) {
        fetchData();
      }
    } catch (err: any) {
      alert('Error toggling stock: ' + err.message);
    }
  };

  const openChat = async (order: Order) => {
    setActiveChatOrder(order);
    try {
      const res = await apiFetch<{ success: boolean; messages: any[] }>(`/chat/${order._id}`);
      if (res.success) setChatMessages(res.messages);
    } catch (err) {
      console.warn(err);
    }
  };

  const sendChatMessage = () => {
    if (!replyText.trim() || !activeChatOrder) return;
    const socket = getSocket();
    socket.emit('send_message', {
      orderId: activeChatOrder._id,
      senderId: shopId,
      senderName: shop?.name || 'Patel Cyber Cafe',
      senderRole: 'SHOP',
      message: replyText.trim(),
    });
    setReplyText('');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Shop Control Bar */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white font-heading">
                {shop?.name || 'Patel Cyber Cafe & High-Speed Xerox'}
              </h1>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                KYC Verified
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {shop?.address || 'Shop 12, Cyber Hub, Koramangala 5th Block, Bengaluru'} • ★{shop?.rating || 4.88} ({shop?.reviewCount || 184} reviews)
            </p>
          </div>
        </div>

        {/* Status Toggles & Settings */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCapabilitiesModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
          >
            <Sliders className="w-3.5 h-3.5 text-brand-400" />
            <span>Service Capabilities</span>
          </button>

          {/* Online/Offline Driver-style Toggle */}
          <button
            onClick={toggleAvailability}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
              isOnline
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 ring-2 ring-emerald-500/20'
                : 'bg-rose-950/60 border border-rose-800 text-rose-300 hover:bg-rose-900/60'
            }`}
          >
            {isOnline ? (
              <>
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <Wifi className="w-3.5 h-3.5" />
                <span>ONLINE (Accepting Jobs)</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5" />
                <span>OFFLINE (Paused)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Urgent Incoming Job Card with 45-Second Countdown Alert */}
      {incomingJob && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/80 via-indigo-950/80 to-slate-900 border-2 border-purple-500/80 shadow-2xl shadow-purple-900/40 animate-pulse-fast space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-purple-800/60">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-purple-400 animate-ping" />
              <span className="font-extrabold text-sm uppercase tracking-wider text-purple-200 font-heading">
                🚨 Incoming Print Job Dispatched!
              </span>
              <span className="text-xs font-mono bg-purple-900/80 text-purple-200 px-2 py-0.5 rounded font-bold">
                #{incomingJob.orderNumber}
              </span>
            </div>

            {/* Countdown Badge */}
            <div className="flex items-center gap-2 bg-purple-900/90 border border-purple-400/50 px-3 py-1 rounded-xl text-white font-mono font-bold text-xs">
              <Clock className="w-3.5 h-3.5 text-cyan-300 animate-spin-slow" />
              <span>Auto-reassigning in {countdown}s</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div className="space-y-1">
              <div className="text-slate-400">Document</div>
              <div className="font-bold text-white text-sm truncate">{incomingJob.fileName}</div>
              <div className="text-slate-300">
                {incomingJob.pageCount} Pages • {incomingJob.specs.copies} {incomingJob.specs.copies === 1 ? 'Copy' : 'Copies'}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-slate-400">Specifications</div>
              <div className="font-semibold text-purple-200">
                {incomingJob.specs.paperSize} • {incomingJob.specs.printType} • {incomingJob.specs.paperType}
              </div>
              <div className="text-slate-300">
                Binding: {incomingJob.specs.binding} • {incomingJob.specs.duplex ? 'Duplex' : 'Single-sided'}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-slate-400">Shop Earnings (Net)</div>
              <div className="text-xl font-extrabold text-emerald-400 font-heading">
                ₹{incomingJob.shopEarnings}
              </div>
              <div className="text-[10px] text-slate-400">Mode: {incomingJob.paymentMode}</div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => updateOrderStatus(incomingJob._id, 'ACCEPTED')}
                className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/40 transition-all flex items-center justify-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Accept Job</span>
              </button>
              <button
                onClick={() => setIncomingJob(null)}
                className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white font-semibold text-xs border border-slate-700 transition-colors"
              >
                Pass
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revenue & KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Today's Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-white font-heading">
            ₹{earnings?.todayRevenue || 0}
          </div>
          <div className="text-[10px] text-emerald-400">{earnings?.todayOrderCount || 0} orders today</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Gross Revenue</span>
            <DollarSign className="w-4 h-4 text-brand-400" />
          </div>
          <div className="text-xl font-bold text-white font-heading">
            ₹{earnings?.grossRevenue || 0}
          </div>
          <div className="text-[10px] text-slate-400">{earnings?.totalCompletedOrders || 0} completed lifetime</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Pending Payout</span>
            <Banknote className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-white font-heading">
            ₹{earnings?.pendingSettlement || 0}
          </div>
          <div className="text-[10px] text-amber-400">Weekly bank disbursement</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Active Queue Load</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-bold text-white font-heading">
            {earnings?.activeQueueCount || 0} Jobs
          </div>
          <div className="text-[10px] text-slate-400">Max capacity: 2500 p/day</div>
        </div>
      </div>

      {/* Main Split: Print Queue Pipeline vs Inventory Tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Print Job Pipeline */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Printer className="w-4 h-4 text-brand-400" />
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
                Active Print Pipeline
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">{orders.length} Total Orders</span>
          </div>

          <div className="space-y-3">
            {orders.length === 0 ? (
              <div className="text-center py-12 bg-slate-900/40 rounded-2xl border border-slate-800 text-slate-500 text-xs">
                No orders in pipeline right now.
              </div>
            ) : (
              orders.map((order) => {
                const isAccepted = order.orderStatus === 'ACCEPTED';
                const isPrinting = order.orderStatus === 'PRINTING';
                const isReady = order.orderStatus === 'READY';
                const isCompleted = order.orderStatus === 'COMPLETED';

                return (
                  <div
                    key={order._id}
                    className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 transition-all space-y-3 text-xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-300">
                            #{order.orderNumber}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              isCompleted
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : isReady
                                ? 'bg-cyan-500/20 text-cyan-400'
                                : isPrinting
                                ? 'bg-amber-500/20 text-amber-400 animate-pulse'
                                : 'bg-purple-500/20 text-purple-300'
                            }`}
                          >
                            {order.orderStatus}
                          </span>
                          <span className="text-slate-500 text-[11px]">
                            {order.deliveryType === 'HOME_DELIVERY' ? 'Door Delivery' : 'Self Pickup'}
                          </span>
                        </div>
                        <div className="font-semibold text-white text-sm mt-1">{order.fileName}</div>
                      </div>

                      <div className="text-right">
                        <div className="text-base font-extrabold text-white font-heading">
                          ₹{order.shopEarnings}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {order.paymentMode} ({order.paymentStatus})
                        </div>
                      </div>
                    </div>

                    {/* Specs Checklist */}
                    <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/60 flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-300">
                      <span>
                        Size: <strong className="text-white">{order.specs.paperSize}</strong>
                      </span>
                      <span>
                        Type: <strong className="text-white">{order.specs.printType}</strong>
                      </span>
                      <span>
                        Paper: <strong className="text-white">{order.specs.paperType}</strong>
                      </span>
                      <span>
                        Pages: <strong className="text-white">{order.pageCount}p</strong>
                      </span>
                      <span>
                        Copies: <strong className="text-white">{order.specs.copies}</strong>
                      </span>
                      <span>
                        Binding: <strong className="text-white">{order.specs.binding}</strong>
                      </span>
                      {order.specs.customInstructions && (
                        <div className="w-full text-amber-300 text-[11px] pt-1">
                          Note: "{order.specs.customInstructions}"
                        </div>
                      )}
                    </div>

                    {/* Action Pipeline Buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
                      <div className="flex items-center gap-2">
                        {/* PDF Preview */}
                        <button
                          onClick={() => setSelectedOrderForPreview(order)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1 font-medium transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5 text-brand-400" />
                          <span>View PDF</span>
                        </button>

                        {/* Customer Chat */}
                        <button
                          onClick={() => openChat(order)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1 font-medium transition-colors"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Customer Chat</span>
                        </button>
                      </div>

                      {/* Status Advancer */}
                      <div className="flex items-center gap-2">
                        {order.orderStatus === 'DISPATCHED_TO_SHOP' && (
                          <button
                            onClick={() => updateOrderStatus(order._id, 'ACCEPTED')}
                            className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold transition-all shadow-md shadow-purple-600/30"
                          >
                            Accept Order
                          </button>
                        )}

                        {isAccepted && (
                          <button
                            onClick={() => updateOrderStatus(order._id, 'PRINTING')}
                            className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-bold transition-all shadow-md shadow-brand-500/30 flex items-center gap-1"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Start Printing</span>
                          </button>
                        )}

                        {isPrinting && (
                          <button
                            onClick={() => updateOrderStatus(order._id, 'READY')}
                            className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-all shadow-md shadow-cyan-600/30 flex items-center gap-1"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Mark Ready</span>
                          </button>
                        )}

                        {/* Critical Module 2 & 5 Requirement: Cash Received Confirmation for COD */}
                        {isReady && order.paymentMode === 'COD' && order.paymentStatus !== 'COLLECTED_BY_SHOP' && (
                          <button
                            onClick={() => handleConfirmCashReceived(order._id)}
                            className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 font-black flex items-center gap-1.5 shadow-lg shadow-amber-500/30 animate-pulse"
                          >
                            <Banknote className="w-4 h-4" />
                            <span>Confirm Cash Received (₹{order.totalPrice})</span>
                          </button>
                        )}

                        {isReady && order.paymentMode === 'ONLINE' && (
                          <button
                            onClick={() => updateOrderStatus(order._id, 'COMPLETED')}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md shadow-emerald-600/30"
                          >
                            Hand Over & Complete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Col: Paper & Toner Stock Management */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
                Inventory & Supplies
              </h2>
            </div>
          </div>

          <div className="space-y-2.5">
            {stockItems.map((item) => (
              <div
                key={item._id}
                className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">{item.itemName}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      item.isOutOfStock
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : item.isLowStock
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-400'
                    }`}
                  >
                    {item.isOutOfStock ? 'OUT OF STOCK' : item.isLowStock ? 'LOW STOCK' : 'IN STOCK'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-400">
                  <span>
                    Remaining: <strong className="text-white">{item.currentStock}</strong> {item.unit}
                  </span>
                  <button
                    onClick={() => toggleStockStatus(item)}
                    className={`px-2 py-1 rounded text-[10px] font-semibold transition-colors ${
                      item.isOutOfStock
                        ? 'bg-emerald-600/30 text-emerald-300 hover:bg-emerald-600/50'
                        : 'bg-rose-600/30 text-rose-300 hover:bg-rose-600/50'
                    }`}
                  >
                    {item.isOutOfStock ? 'Mark Available' : 'Mark Out of Stock'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PDF Document Preview Modal */}
      {selectedOrderForPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col h-[600px] overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-brand-400" />
                <div>
                  <h3 className="font-bold text-white text-sm">{selectedOrderForPreview.fileName}</h3>
                  <p className="text-xs text-slate-400">
                    {selectedOrderForPreview.pageCount} Pages • {selectedOrderForPreview.specs.copies} Copies • {selectedOrderForPreview.specs.paperSize}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrderForPreview(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Simulated PDF Document Canvas Preview */}
            <div className="flex-1 bg-slate-950 p-6 flex flex-col items-center justify-center overflow-y-auto">
              <div className="w-72 sm:w-96 h-[420px] bg-white rounded-lg shadow-2xl p-6 text-slate-900 space-y-3 relative overflow-hidden border border-slate-200">
                <div className="w-24 h-4 bg-slate-300 rounded" />
                <div className="w-full h-6 bg-slate-800 rounded" />
                <div className="w-3/4 h-4 bg-slate-400 rounded" />
                <div className="space-y-2 pt-4">
                  <div className="w-full h-2.5 bg-slate-200 rounded" />
                  <div className="w-full h-2.5 bg-slate-200 rounded" />
                  <div className="w-5/6 h-2.5 bg-slate-200 rounded" />
                  <div className="w-4/6 h-2.5 bg-slate-200 rounded" />
                </div>
                <div className="absolute bottom-4 right-4 text-[10px] font-mono text-slate-400">
                  Page 1 of {selectedOrderForPreview.pageCount}
                </div>
              </div>
            </div>

            <div className="p-3.5 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs">
              <span className="text-slate-400">
                Customer Instructions: {selectedOrderForPreview.specs.customInstructions || 'Standard print'}
              </span>
              <button
                onClick={() => setSelectedOrderForPreview(null)}
                className="px-4 py-1.5 rounded-xl bg-brand-600 text-white font-semibold"
              >
                Done Inspecting
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Direct Chat Drawer */}
      {activeChatOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col h-[480px]">
            <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
              <div>
                <div className="font-semibold text-white text-xs">Chat with Customer</div>
                <div className="text-[10px] text-slate-400">Order #{activeChatOrder.orderNumber}</div>
              </div>
              <button
                onClick={() => setActiveChatOrder(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 p-3 overflow-y-auto space-y-2 text-xs">
              {chatMessages.map((msg) => {
                const isShop = msg.senderRole === 'SHOP';
                return (
                  <div
                    key={msg._id}
                    className={`flex flex-col ${isShop ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-2.5 rounded-xl ${
                        isShop
                          ? 'bg-purple-600 text-white rounded-tr-none'
                          : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'
                      }`}
                    >
                      <p>{msg.message}</p>
                    </div>
                    <span className="text-[9px] text-slate-500 mt-0.5">{msg.senderName}</span>
                  </div>
                );
              })}
            </div>

            <div className="p-2.5 border-t border-slate-800 flex items-center gap-2 bg-slate-950/50">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
                placeholder="Reply to customer..."
                className="flex-1 p-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
              />
              <button
                onClick={sendChatMessage}
                className="p-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
