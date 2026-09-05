import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { mongoStore, BroadcastDoc } from '../db/mongoStore';
import { authenticateToken, requireRole } from '../middleware/auth';
import { SocketService } from '../services/socketService';

export const adminRouter = Router();

// Dashboard Overview & KPIs
adminRouter.get('/dashboard', authenticateToken, (req: Request, res: Response) => {
  const orders = mongoStore.getOrders();
  const shops = mongoStore.getAllShops();
  const transactions = mongoStore.getAllTransactions();

  const totalOrders = orders.length;
  const activeShops = shops.filter(s => s.isOnline && s.kycStatus === 'VERIFIED').length;
  const pendingKycShops = shops.filter(s => s.kycStatus === 'PENDING').length;

  const totalGmv = orders
    .filter(o => o.orderStatus === 'COMPLETED')
    .reduce((sum, o) => sum + o.totalPrice, 0);

  const totalPlatformCut = transactions
    .filter(t => t.status === 'SETTLED')
    .reduce((sum, t) => sum + t.platformCut, 0);

  // COD Pending Amount
  const codPendingOrders = orders.filter(
    o => o.paymentMode === 'COD' && o.paymentStatus === 'PENDING'
  );
  const codPendingAmount = codPendingOrders.reduce((sum, o) => sum + o.totalPrice, 0);

  // Demand Heatmap coordinates from orders
  const heatmapPoints = orders
    .filter(o => o.deliveryLocation?.coordinates)
    .map(o => ({
      lng: o.deliveryLocation!.coordinates[0],
      lat: o.deliveryLocation!.coordinates[1],
      intensity: o.totalPrice > 100 ? 1.0 : 0.6,
      orderNumber: o.orderNumber,
      status: o.orderStatus,
    }));

  return res.json({
    success: true,
    metrics: {
      totalOrders,
      activeShops,
      pendingKycShops,
      totalGmv: parseFloat(totalGmv.toFixed(2)),
      totalPlatformCut: parseFloat(totalPlatformCut.toFixed(2)),
      codPendingCount: codPendingOrders.length,
      codPendingAmount: parseFloat(codPendingAmount.toFixed(2)),
      onlineOrdersCount: orders.filter(o => o.paymentMode === 'ONLINE').length,
      codOrdersCount: orders.filter(o => o.paymentMode === 'COD').length,
    },
    heatmapPoints,
  });
});

// Shop Management: List all shops with KYC details
adminRouter.get('/shops', authenticateToken, (req: Request, res: Response) => {
  const shops = mongoStore.getAllShops();
  return res.json({ success: true, count: shops.length, shops });
});

// Shop Management: Approve or Reject KYC
adminRouter.put('/shops/:id/kyc', authenticateToken, (req: Request, res: Response) => {
  const { status, reason } = req.body; // 'VERIFIED' | 'REJECTED'
  const shop = mongoStore.getShopById(req.params.id);

  if (!shop) {
    return res.status(404).json({ success: false, message: 'Shop not found.' });
  }

  if (!['VERIFIED', 'REJECTED'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status. Must be VERIFIED or REJECTED.' });
  }

  shop.kycStatus = status;
  if (reason) {
    shop.kycDocs.rejectionReason = reason;
  }
  shop.updatedAt = new Date().toISOString();
  mongoStore.saveShop(shop);

  return res.json({
    success: true,
    message: `Shop KYC status updated to ${status}.`,
    shop,
  });
});

// Shop Management: Suspend / Ban / Toggle Online
adminRouter.put('/shops/:id/status', authenticateToken, (req: Request, res: Response) => {
  const { isOnline } = req.body;
  const shop = mongoStore.getShopById(req.params.id);

  if (!shop) {
    return res.status(404).json({ success: false, message: 'Shop not found.' });
  }

  shop.isOnline = Boolean(isOnline);
  shop.updatedAt = new Date().toISOString();
  mongoStore.saveShop(shop);

  return res.json({ success: true, message: 'Shop status updated.', shop });
});

// Order Management: View all platform orders
adminRouter.get('/orders', authenticateToken, (req: Request, res: Response) => {
  const orders = mongoStore.getOrders();
  return res.json({ success: true, count: orders.length, orders });
});

// Order Management: Manually reassign a stuck order to another shop
adminRouter.post('/orders/:id/reassign', authenticateToken, (req: Request, res: Response) => {
  const { newShopId } = req.body;
  const order = mongoStore.getOrderById(req.params.id);

  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found.' });
  }

  const targetShop = mongoStore.getShopById(newShopId);
  if (!targetShop) {
    return res.status(404).json({ success: false, message: 'Target shop not found.' });
  }

  order.shopId = targetShop._id;
  order.orderStatus = 'DISPATCHED_TO_SHOP';
  order.updatedAt = new Date().toISOString();
  mongoStore.saveOrder(order);

  // Notify new shop and customer
  SocketService.emitIncomingJob(targetShop._id, order);
  SocketService.emitOrderStatusUpdate(order._id, {
    orderId: order._id,
    orderStatus: 'DISPATCHED_TO_SHOP',
    shopName: targetShop.name,
    message: `Order manually reassigned to ${targetShop.name} by Platform Admin.`,
  });

  return res.json({
    success: true,
    message: `Order successfully reassigned to ${targetShop.name}.`,
    order,
  });
});

// COD Reconciliation: View all COD orders and settlement ledger
adminRouter.get('/cod-reconciliation', authenticateToken, (req: Request, res: Response) => {
  const orders = mongoStore.getOrders().filter(o => o.paymentMode === 'COD');
  const transactions = mongoStore.getAllTransactions().filter(t => t.mode === 'COD');

  const pendingConfirmation = orders.filter(o => o.paymentStatus === 'PENDING');
  const collectedByShop = orders.filter(o => o.paymentStatus === 'COLLECTED_BY_SHOP');

  return res.json({
    success: true,
    summary: {
      totalCodOrders: orders.length,
      pendingCount: pendingConfirmation.length,
      pendingAmount: pendingConfirmation.reduce((sum, o) => sum + o.totalPrice, 0),
      collectedCount: collectedByShop.length,
      collectedAmount: collectedByShop.reduce((sum, o) => sum + o.totalPrice, 0),
    },
    orders,
    transactions,
  });
});

// COD Reconciliation: Mark COD payout/settlement verified
adminRouter.post('/cod-reconciliation/:id/verify', authenticateToken, (req: Request, res: Response) => {
  const allTx = mongoStore.getAllTransactions().filter(t => t.orderId === req.params.id);
  if (allTx.length === 0) {
    return res.status(404).json({ success: false, message: 'Transaction record not found.' });
  }

  const tx = allTx[0];
  tx.settlementStatus = 'DISBURSED';
  tx.settledAt = new Date().toISOString();
  mongoStore.saveTransaction(tx);

  return res.json({
    success: true,
    message: 'COD settlement marked as reconciled and disbursed.',
    transaction: tx,
  });
});

// Broadcast Announcement to all shops or users
adminRouter.post('/broadcast', authenticateToken, (req: Request, res: Response) => {
  const { title, message, targetAudience, bannerType } = req.body;

  if (!title || !message) {
    return res.status(400).json({ success: false, message: 'Title and message are required.' });
  }

  const broadcast: BroadcastDoc = {
    _id: `bc_mongo_${uuidv4().substring(0, 8)}`,
    title,
    message,
    targetAudience: targetAudience || 'ALL',
    bannerType: bannerType || 'INFO',
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  mongoStore.saveBroadcast(broadcast);

  return res.status(201).json({
    success: true,
    message: 'Announcement broadcasted successfully.',
    broadcast,
  });
});
