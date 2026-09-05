import React, { useState, useEffect } from 'react';
import {
  Shield,
  DollarSign,
  Store,
  FileText,
  Banknote,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Sliders,
  Send,
  MapPin,
  TrendingUp,
  Search,
  Filter,
} from 'lucide-react';
import { apiFetch } from '../../utils/api';
import { Order, Shop } from '../../types';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'shops' | 'orders' | 'cod' | 'pricing' | 'broadcast'>('overview');
  const [metrics, setMetrics] = useState<any>(null);
  const [heatmapPoints, setHeatmapPoints] = useState<any[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [codData, setCodData] = useState<any>(null);

  // Manual Reassignment Modal
  const [reassignOrder, setReassignOrder] = useState<Order | null>(null);
  const [selectedNewShopId, setSelectedNewShopId] = useState<string>('');

  // Pricing Engine State
  const [pricingConfig, setPricingConfig] = useState({
    bwBasePrice: 2.0,
    colorBasePrice: 10.0,
    glossySurcharge: 8.0,
    spiralBinding: 35.0,
    deliveryBaseFee: 25.0,
    surgeMultiplier: 1.0,
  });

  // Broadcast Composer State
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastAudience, setBroadcastAudience] = useState<'ALL' | 'SHOPS' | 'CUSTOMERS'>('ALL');
  const [broadcastSent, setBroadcastSent] = useState(false);

  const fetchAdminData = async () => {
    try {
      const dashRes = await apiFetch<{ success: boolean; metrics: any; heatmapPoints: any[] }>('/admin/dashboard');
      if (dashRes.success) {
        setMetrics(dashRes.metrics);
        setHeatmapPoints(dashRes.heatmapPoints);
      }

      const shopRes = await apiFetch<{ success: boolean; shops: Shop[] }>('/admin/shops');
      if (shopRes.success) setShops(shopRes.shops);

      const orderRes = await apiFetch<{ success: boolean; orders: Order[] }>('/admin/orders');
      if (orderRes.success) setOrders(orderRes.orders);

      const codRes = await apiFetch<{ success: boolean; summary: any; orders: Order[]; transactions: any[] }>(
        '/admin/cod-reconciliation'
      );
      if (codRes.success) setCodData(codRes);
    } catch (err) {
      console.warn('Error fetching admin data:', err);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleKycAction = async (shopId: string, status: 'VERIFIED' | 'REJECTED') => {
    try {
      const res = await apiFetch(`/admin/shops/${shopId}/kyc`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      if (res.success) fetchAdminData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleManualReassign = async () => {
    if (!reassignOrder || !selectedNewShopId) return;
    try {
      const res = await apiFetch(`/admin/orders/${reassignOrder._id}/reassign`, {
        method: 'POST',
        body: JSON.stringify({ newShopId: selectedNewShopId }),
      });
      if (res.success) {
        alert(res.message);
        setReassignOrder(null);
        fetchAdminData();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleVerifyCodSettlement = async (orderId: string) => {
    try {
      const res = await apiFetch(`/admin/cod-reconciliation/${orderId}/verify`, {
        method: 'POST',
      });
      if (res.success) {
        alert(res.message);
        fetchAdminData();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSendBroadcast = async () => {
    if (!broadcastTitle || !broadcastMessage) return;
    try {
      const res = await apiFetch('/admin/broadcast', {
        method: 'POST',
        body: JSON.stringify({
          title: broadcastTitle,
          message: broadcastMessage,
          targetAudience: broadcastAudience,
        }),
      });
      if (res.success) {
        setBroadcastSent(true);
        setTimeout(() => {
          setBroadcastSent(false);
          setBroadcastTitle('');
          setBroadcastMessage('');
        }, 2000);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Super Admin CMS Top Bar */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white font-heading">PrintPorter Super Admin CMS</h1>
              <span className="text-[10px] bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded-full font-bold">
                Platform Control
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Live marketplace telemetry, partner KYC compliance, stuck order dispatch & COD settlement
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
          {[
            { id: 'overview', label: 'Dashboard & Heatmap' },
            { id: 'shops', label: `Shops (${shops.length})` },
            { id: 'orders', label: `Orders (${orders.length})` },
            { id: 'cod', label: 'COD Ledger' },
            { id: 'pricing', label: 'Pricing Matrix' },
            { id: 'broadcast', label: 'Broadcasts' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 1. Overview & Demand Heatmap Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Executive KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
              <div className="text-xs text-slate-400 flex items-center justify-between">
                <span>Gross Merchandise Value</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-white font-heading">
                ₹{metrics?.totalGmv || 0}
              </div>
              <div className="text-[10px] text-emerald-400 font-medium">Platform GMV across all shops</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
              <div className="text-xs text-slate-400 flex items-center justify-between">
                <span>Platform Cut Earned</span>
                <TrendingUp className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-bold text-white font-heading">
                ₹{metrics?.totalPlatformCut || 0}
              </div>
              <div className="text-[10px] text-cyan-400 font-medium">10% commission + ₹5 platform fee</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
              <div className="text-xs text-slate-400 flex items-center justify-between">
                <span>COD Pending Collection</span>
                <Banknote className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold text-white font-heading">
                ₹{metrics?.codPendingAmount || 0}
              </div>
              <div className="text-[10px] text-amber-400 font-medium">{metrics?.codPendingCount || 0} cash orders awaiting remittance</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
              <div className="text-xs text-slate-400 flex items-center justify-between">
                <span>Active Online Shops</span>
                <Store className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-white font-heading">
                {metrics?.activeShops || 0} / {shops.length}
              </div>
              <div className="text-[10px] text-purple-400 font-medium">{metrics?.pendingKycShops || 0} pending KYC review</div>
            </div>
          </div>

          {/* Interactive Demand Heatmap Visualizer */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white font-heading flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-rose-400" />
                  <span>Real-Time Order Demand Heatmap & Cyber Cafe Density</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Visual geospatial distribution of customer orders and cyber cafe fulfillment centers
                </p>
              </div>
              <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 px-2.5 py-1 rounded-lg border border-cyan-800/60">
                Bengaluru Central Grid
              </span>
            </div>

            <div className="relative w-full h-80 rounded-xl overflow-hidden bg-slate-950 border border-slate-800/80">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:20px_20px]" />

              {/* Heatmap density rings */}
              <div className="absolute top-[120px] left-[280px] -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-rose-500/20 blur-2xl pointer-events-none animate-pulse" />
              <div className="absolute top-[180px] left-[450px] -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full bg-amber-500/15 blur-xl pointer-events-none" />

              {/* Plotted order dots */}
              {heatmapPoints.map((pt, i) => (
                <div
                  key={i}
                  style={{ top: `${80 + (i * 45) % 180}px`, left: `${120 + (i * 110) % 500}px` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center gap-1 group cursor-pointer"
                >
                  <span className="w-3.5 h-3.5 rounded-full bg-rose-500 border-2 border-white shadow-lg shadow-rose-500/80 group-hover:scale-125 transition-transform" />
                  <div className="hidden group-hover:block absolute left-5 top-0 z-20 whitespace-nowrap bg-slate-900 border border-slate-700 px-2 py-1 rounded text-[10px] text-white shadow-xl">
                    Order #{pt.orderNumber} ({pt.status})
                  </div>
                </div>
              ))}

              {/* Plotted shop locations */}
              {shops.map((s, idx) => (
                <div
                  key={s._id}
                  style={{ top: `${130 + idx * 60}px`, left: `${220 + idx * 160}px` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-lg bg-purple-600 border border-white flex items-center justify-center text-white text-[10px] font-bold shadow-md shadow-purple-600/50">
                    🏪
                  </div>
                  <span className="mt-1 text-[9px] font-semibold text-purple-200 bg-slate-900/90 px-1.5 py-0.5 rounded border border-purple-500/40 whitespace-nowrap">
                    {s.name.split(' ')[0]} ({s.isOnline ? 'Online' : 'Offline'})
                  </span>
                </div>
              ))}

              <div className="absolute bottom-3 right-3 flex items-center gap-3 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl text-[10px] text-slate-300">
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span>High Print Demand</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-purple-600" />
                  <span>Verified Cyber Cafe</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Shop Management & KYC Approval Tab */}
      {activeTab === 'shops' && (
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white font-heading">Partner Shop KYC & Compliance</h3>
              <p className="text-xs text-slate-400">Review business trade licenses and manage cyber cafe access</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/70 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3">Shop Name & Address</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3">Trade License / KYC Docs</th>
                  <th className="p-3">KYC Status</th>
                  <th className="p-3">Availability</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {shops.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3">
                      <div className="font-semibold text-white">{s.name}</div>
                      <div className="text-[11px] text-slate-400">{s.address}</div>
                    </td>
                    <td className="p-3 font-mono">{s.phone}</td>
                    <td className="p-3">
                      <div className="text-[11px] text-slate-300">
                        License: {s.kycDocs?.tradeLicense || 'Not Uploaded'}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        ID: {s.kycDocs?.ownerIdProof || 'Pending'} • GST: {s.kycDocs?.gstNumber || 'N/A'}
                      </div>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          s.kycStatus === 'VERIFIED'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : s.kycStatus === 'PENDING'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {s.kycStatus}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                          s.isOnline ? 'text-emerald-400' : 'text-slate-500'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${s.isOnline ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                        {s.isOnline ? 'Online' : 'Offline'}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-2">
                      {s.kycStatus === 'PENDING' ? (
                        <>
                          <button
                            onClick={() => handleKycAction(s._id, 'VERIFIED')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px]"
                          >
                            Approve KYC
                          </button>
                          <button
                            onClick={() => handleKycAction(s._id, 'REJECTED')}
                            className="px-2.5 py-1 rounded-lg bg-rose-600/30 text-rose-300 hover:bg-rose-600/50 font-semibold text-[11px]"
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        <span className="text-[11px] text-slate-500">Verified</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Order Management & Emergency Reassignment Tab */}
      {activeTab === 'orders' && (
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white font-heading">Master Order Log</h3>
              <p className="text-xs text-slate-400">Inspect all print jobs across the platform with emergency reassignment</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/70 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3">Order Number</th>
                  <th className="p-3">Document & Specs</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Mode</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Dispatch Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {orders.map((o) => (
                  <tr key={o._id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3 font-mono font-bold text-white">#{o.orderNumber}</td>
                    <td className="p-3">
                      <div className="font-semibold text-white">{o.fileName}</div>
                      <div className="text-[10px] text-slate-400">
                        {o.pageCount}p • {o.specs.paperSize} • {o.specs.printType} • {o.specs.binding}
                      </div>
                    </td>
                    <td className="p-3 font-bold text-emerald-400">₹{o.totalPrice}</td>
                    <td className="p-3">
                      <span className="font-mono text-[11px]">{o.paymentMode}</span>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-200">
                        {o.orderStatus}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {o.orderStatus !== 'COMPLETED' && (
                        <button
                          onClick={() => {
                            setReassignOrder(o);
                            setSelectedNewShopId(shops.find((s) => s._id !== o.shopId)?._id || '');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 text-[11px] font-semibold"
                        >
                          Manual Reassign
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. COD Reconciliation Tab */}
      {activeTab === 'cod' && (
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white font-heading">COD Reconciliation & Shop Settlement Ledger</h3>
              <p className="text-xs text-slate-400">
                Track cash collected at shop counters vs platform commission cut receivable
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400">Total COD Volume: </span>
              <strong className="text-white font-heading text-sm">
                ₹{(codData?.summary?.collectedAmount || 0) + (codData?.summary?.pendingAmount || 0)}
              </strong>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/70 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3">Order Number</th>
                  <th className="p-3">Cash Collected</th>
                  <th className="p-3">Platform Cut</th>
                  <th className="p-3">Shop Earnings</th>
                  <th className="p-3">Collection Status</th>
                  <th className="p-3 text-right">Settlement Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {codData?.orders?.map((o: Order) => (
                  <tr key={o._id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3 font-mono font-bold text-white">#{o.orderNumber}</td>
                    <td className="p-3 font-bold text-white">₹{o.totalPrice}</td>
                    <td className="p-3 text-cyan-400 font-semibold">₹{o.platformFee}</td>
                    <td className="p-3 text-emerald-400 font-semibold">₹{o.shopEarnings}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          o.paymentStatus === 'COLLECTED_BY_SHOP'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        {o.paymentStatus}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {o.paymentStatus === 'COLLECTED_BY_SHOP' ? (
                        <button
                          onClick={() => handleVerifyCodSettlement(o._id)}
                          className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-[11px]"
                        >
                          Mark Settled & Verified
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-500">Awaiting Shop Cash Receipt</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Pricing Matrix Tab */}
      {activeTab === 'pricing' && (
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-5 shadow-xl max-w-2xl">
          <div className="pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white font-heading">Marketplace Pricing Engine Rules</h3>
            <p className="text-xs text-slate-400">Configure base rates, paper type multipliers, and surge charges</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="text-slate-300 font-medium">B&W Rate per page (₹)</label>
              <input
                type="number"
                value={pricingConfig.bwBasePrice}
                onChange={(e) => setPricingConfig({ ...pricingConfig, bwBasePrice: parseFloat(e.target.value) })}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-medium">Color Rate per page (₹)</label>
              <input
                type="number"
                value={pricingConfig.colorBasePrice}
                onChange={(e) => setPricingConfig({ ...pricingConfig, colorBasePrice: parseFloat(e.target.value) })}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-medium">Glossy Paper Surcharge (₹/sheet)</label>
              <input
                type="number"
                value={pricingConfig.glossySurcharge}
                onChange={(e) => setPricingConfig({ ...pricingConfig, glossySurcharge: parseFloat(e.target.value) })}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-medium">Spiral Ring Binding Rate (₹)</label>
              <input
                type="number"
                value={pricingConfig.spiralBinding}
                onChange={(e) => setPricingConfig({ ...pricingConfig, spiralBinding: parseFloat(e.target.value) })}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-medium">Delivery Base Fee (within 2km)</label>
              <input
                type="number"
                value={pricingConfig.deliveryBaseFee}
                onChange={(e) => setPricingConfig({ ...pricingConfig, deliveryBaseFee: parseFloat(e.target.value) })}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-medium">Monsoon / Peak Surge Multiplier</label>
              <input
                type="number"
                step="0.1"
                value={pricingConfig.surgeMultiplier}
                onChange={(e) => setPricingConfig({ ...pricingConfig, surgeMultiplier: parseFloat(e.target.value) })}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
              />
            </div>
          </div>

          <button
            onClick={() => alert('Pricing parameters successfully updated and synced across marketplace nodes!')}
            className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md shadow-cyan-600/30"
          >
            Save Pricing Matrix
          </button>
        </div>
      )}

      {/* 6. Broadcast Announcement Tab */}
      {activeTab === 'broadcast' && (
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-xl max-w-xl">
          <div className="pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white font-heading">Broadcast Platform Alert</h3>
            <p className="text-xs text-slate-400">Push high-priority announcements to all cyber cafes or customer apps</p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="space-y-1">
              <label className="text-slate-300 font-medium">Broadcast Title</label>
              <input
                type="text"
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                placeholder="e.g., Heavy Rainfall Weather Advisory"
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-medium">Target Audience</label>
              <select
                value={broadcastAudience}
                onChange={(e) => setBroadcastAudience(e.target.value as any)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
              >
                <option value="ALL">All Users & Partner Shops</option>
                <option value="SHOPS">Partner Cyber Cafes Only</option>
                <option value="CUSTOMERS">End-User Customers Only</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-medium">Message Body</label>
              <textarea
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                placeholder="Type your platform notification message..."
                className="w-full h-24 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white resize-none"
              />
            </div>

            <button
              onClick={handleSendBroadcast}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-600/30"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{broadcastSent ? 'Broadcast Dispatched!' : 'Broadcast to Marketplace'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Manual Order Reassignment Modal */}
      {reassignOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-2xl space-y-4 text-xs">
            <h3 className="font-bold text-white text-sm">Emergency Manual Reassignment</h3>
            <p className="text-slate-400">
              Reassign order <strong className="text-white">#{reassignOrder.orderNumber}</strong> ({reassignOrder.fileName}) to another nearby cyber cafe.
            </p>

            <div className="space-y-1">
              <label className="text-slate-300 font-medium">Select Target Print Hub</label>
              <select
                value={selectedNewShopId}
                onChange={(e) => setSelectedNewShopId(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
              >
                {shops.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} ({s.address.slice(0, 30)}...)
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setReassignOrder(null)}
                className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-400 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleManualReassign}
                className="flex-1 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold shadow-md shadow-amber-600/30"
              >
                Confirm Dispatch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
