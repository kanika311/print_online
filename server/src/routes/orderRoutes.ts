import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { mongoStore, OrderDoc, ReviewDoc } from '../db/mongoStore';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { PricingEngine } from '../services/pricingEngine';
import { MatchingEngine } from '../services/matchingEngine';
import { PaymentService } from '../services/paymentService';
import { SocketService } from '../services/socketService';
import { NotificationService } from '../services/notificationService';
import { upload } from '../services/storageService';

export const orderRouter = Router();

// Live Price Calculator
orderRouter.post('/calculate-price', (req: Request, res: Response) => {
  const { specs, pageCount, deliveryType, distanceKm } = req.body;

  if (!specs || !pageCount) {
    return res.status(400).json({ success: false, message: 'Print specs and pageCount are required.' });
  }

  const breakdown = PricingEngine.calculate(
    specs,
    Number(pageCount),
    deliveryType || 'SELF_PICKUP',
    distanceKm || 2.5
  );

  return res.json({ success: true, breakdown });
});

// Matching Engine: Query nearby shops
orderRouter.post('/match-shops', (req: Request, res: Response) => {
  const { userLng, userLat, specs, maxRadiusKm } = req.body;

  const lng = parseFloat(userLng || 77.6245);
  const lat = parseFloat(userLat || 12.9352);

  const matched = MatchingEngine.findNearbyShops(lng, lat, specs, maxRadiusKm || 8.0);

  return res.json({
    success: true,
    count: matched.length,
    matchedShops: matched,
  });
});

// Upload Document (PDF)
orderRouter.post('/upload', upload.single('file'), (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No PDF file uploaded.' });
  }

  const fileUrl = `/uploads/${req.file.filename}`;
  const fileSizeMb = parseFloat((req.file.size / (1024 * 1024)).toFixed(2));

  return res.json({
    success: true,
    fileUrl,
    fileName: req.file.originalname,
    fileSizeMb,
  });
});

// Create / Place Print Order
orderRouter.post('/create', authenticateToken, (req: AuthRequest, res: Response) => {
  const {
    fileName,
    fileUrl,
    fileSizeMb,
    pageCount,
    specs,
    deliveryType,
    deliveryAddress,
    deliveryLat,
    deliveryLng,
    paymentMode,
    customNotes,
    preferredShopId,
  } = req.body;

  const userId = req.user?.id || 'usr_customer_101';
  const user = mongoStore.getUserById(userId);

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  // Check COD fraud guard
  if (paymentMode === 'COD') {
    const codCheck = PaymentService.canUseCOD(user);
    if (!codCheck.allowed) {
      return res.status(403).json({ success: false, message: codCheck.reason });
    }
  }

  const uLng = parseFloat(deliveryLng || 77.6245);
  const uLat = parseFloat(deliveryLat || 12.9352);

  // Match or assign shop
  let targetShop = null;
  if (preferredShopId) {
    targetShop = mongoStore.getShopById(preferredShopId);
  }

  if (!targetShop) {
    const matched = MatchingEngine.findNearbyShops(uLng, uLat, specs);
    if (matched.length > 0) {
      targetShop = matched[0].shop;
    }
  }

  // Calculate pricing breakdown
  const distKm = targetShop ? MatchingEngine.findNearbyShops(uLng, uLat, specs)[0]?.distanceKm || 2.0 : 2.5;
  const breakdown = PricingEngine.calculate(specs, Number(pageCount || 1), deliveryType || 'SELF_PICKUP', distKm);

  const orderNum = `PP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const newOrder: OrderDoc = {
    _id: `ord_mongo_${uuidv4().substring(0, 8)}`,
    orderNumber: orderNum,
    userId: user._id,
    shopId: targetShop?._id,
    fileName: fileName || 'Document.pdf',
    fileUrl: fileUrl || '/uploads/sample_report.pdf',
    fileSizeMb: fileSizeMb || 1.2,
    pageCount: Number(pageCount || 1),
    specs,
    totalPrice: breakdown.totalPrice,
    platformFee: breakdown.platformFee,
    shopEarnings: breakdown.shopEarnings,
    deliveryFee: breakdown.deliveryFee,
    paymentMode: paymentMode || 'COD',
    paymentStatus: paymentMode === 'ONLINE' ? 'ESCROW_HELD' : 'PENDING',
    orderStatus: targetShop ? 'DISPATCHED_TO_SHOP' : 'MATCHING',
    deliveryType: deliveryType || 'SELF_PICKUP',
    deliveryAddress,
    deliveryLocation: { type: 'Point', coordinates: [uLng, uLat] },
    customNotes,
    // Auto-delete sensitive document after 24 hours
    autoDeleteAt: new Date(Date.now() + 86400000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  mongoStore.saveOrder(newOrder);

  // If online, hold in escrow
  if (paymentMode === 'ONLINE') {
    PaymentService.initiateOnlinePayment(newOrder);
  }

  // If assigned to a shop, start 45-second accept timer and send notifications
  if (targetShop) {
    targetShop.currentQueueCount += 1;
    mongoStore.saveShop(targetShop);

    SocketService.emitIncomingJob(targetShop._id, newOrder);
    NotificationService.notifyShopNewJob(targetShop.phone, newOrder.orderNumber, newOrder.pageCount, newOrder.specs.copies);
    NotificationService.notifyOrderPlaced(user.phone, newOrder.orderNumber, targetShop.name);

    MatchingEngine.startAcceptTimeout(newOrder._id, targetShop._id, reassignedShopId => {
      if (reassignedShopId) {
        const nextShop = mongoStore.getShopById(reassignedShopId);
        if (nextShop) {
          SocketService.emitIncomingJob(nextShop._id, newOrder);
          SocketService.emitOrderStatusUpdate(newOrder._id, {
            orderId: newOrder._id,
            orderStatus: 'DISPATCHED_TO_SHOP',
            shopName: nextShop.name,
            message: `Previous shop timed out. Reassigned to ${nextShop.name}.`,
          });
        }
      }
    });
  }

  return res.status(201).json({
    success: true,
    message: 'Order created successfully.',
    order: newOrder,
    shop: targetShop,
  });
});

// Get Order Details with shop, tracking, and delivery partner
orderRouter.get('/:id', (req: Request, res: Response) => {
  const order = mongoStore.getOrderById(req.params.id);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found.' });
  }

  const shop = order.shopId ? mongoStore.getShopById(order.shopId) : null;
  const deliveryPartner = order.deliveryPartnerId ? mongoStore.getDeliveryPartnerById(order.deliveryPartnerId) : null;
  const user = mongoStore.getUserById(order.userId);

  return res.json({
    success: true,
    order,
    shop,
    deliveryPartner,
    customerName: user?.name,
  });
});

// List orders (filtered by user or shop)
orderRouter.get('/', authenticateToken, (req: AuthRequest, res: Response) => {
  const { userId, shopId, status } = req.query;
  const orders = mongoStore.getOrders({
    userId: userId as string,
    shopId: shopId as string,
    status: status as string,
  });

  return res.json({ success: true, count: orders.length, orders });
});

// Update Order Status (Pipeline Progression)
orderRouter.put('/:id/status', authenticateToken, (req: AuthRequest, res: Response) => {
  const { status } = req.body;
  const order = mongoStore.getOrderById(req.params.id);

  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found.' });
  }

  const validStatuses = [
    'ACCEPTED',
    'PRINTING',
    'READY',
    'OUT_FOR_DELIVERY',
    'COMPLETED',
    'CANCELLED',
  ];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: `Invalid status: ${status}` });
  }

  // Clear timeout if accepted
  if (status === 'ACCEPTED') {
    MatchingEngine.clearAcceptTimeout(order._id);
  }

  // If READY and HOME_DELIVERY, assign delivery partner
  if (status === 'READY' && order.deliveryType === 'HOME_DELIVERY' && !order.deliveryPartnerId) {
    const partner = MatchingEngine.assignDeliveryPartner(order);
    if (partner) {
      SocketService.emitOrderStatusUpdate(order._id, {
        orderId: order._id,
        orderStatus: 'READY',
        deliveryPartnerName: partner.name,
      });
    }
  }

  // If COMPLETED and ONLINE, release escrow
  if (status === 'COMPLETED' && order.paymentMode === 'ONLINE') {
    PaymentService.releaseEscrow(order._id);
  }

  order.orderStatus = status;
  order.updatedAt = new Date().toISOString();
  mongoStore.saveOrder(order);

  // Broadcast real-time status update to all parties
  SocketService.emitOrderStatusUpdate(order._id, order);

  // Send SMS/WhatsApp alerts on key transitions
  const user = mongoStore.getUserById(order.userId);
  if (user) {
    if (status === 'READY') {
      NotificationService.notifyOrderReady(user.phone, order.orderNumber, order.deliveryType);
    }
  }

  return res.json({
    success: true,
    message: `Order status updated to ${status}.`,
    order,
  });
});

// Partner: Confirm Cash Received for COD Order
orderRouter.post('/:id/confirm-cash', authenticateToken, (req: AuthRequest, res: Response) => {
  const orderId = req.params.id;
  const shopOwnerId = req.user?.id || 'usr_owner_201';

  const result = PaymentService.confirmCashReceived(orderId, shopOwnerId);
  if (!result.success) {
    return res.status(400).json({ success: false, message: result.message });
  }

  // Broadcast completion update
  SocketService.emitOrderStatusUpdate(orderId, result.order);

  return res.json({
    success: true,
    message: result.message,
    order: result.order,
  });
});

// Customer: Submit Review & Rating
orderRouter.post('/:id/review', authenticateToken, (req: AuthRequest, res: Response) => {
  const { rating, comment } = req.body;
  const order = mongoStore.getOrderById(req.params.id);

  if (!order || !order.shopId) {
    return res.status(404).json({ success: false, message: 'Order or shop not found.' });
  }

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5.' });
  }

  const user = mongoStore.getUserById(order.userId);

  const review: ReviewDoc = {
    _id: `rev_mongo_${uuidv4().substring(0, 8)}`,
    orderId: order._id,
    shopId: order.shopId,
    userId: order.userId,
    userName: user?.name || 'Customer',
    rating: Number(rating),
    comment: comment || '',
    createdAt: new Date().toISOString(),
  };

  mongoStore.saveReview(review);

  return res.json({
    success: true,
    message: 'Thank you for your rating!',
    review,
  });
});

// Download / View Invoice Summary
orderRouter.get('/:id/invoice', (req: Request, res: Response) => {
  const order = mongoStore.getOrderById(req.params.id);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found.' });
  }

  const shop = order.shopId ? mongoStore.getShopById(order.shopId) : null;
  const user = mongoStore.getUserById(order.userId);

  return res.json({
    success: true,
    invoice: {
      invoiceNumber: `INV-${order.orderNumber.replace('PP-', '')}`,
      date: order.createdAt,
      customer: {
        name: user?.name,
        phone: user?.phone,
        address: order.deliveryAddress || user?.address,
      },
      shop: {
        name: shop?.name,
        address: shop?.address,
        phone: shop?.phone,
        gstNumber: shop?.kycDocs?.gstNumber || 'Unregistered',
      },
      specs: order.specs,
      pageCount: order.pageCount,
      copies: order.specs.copies,
      totalPrice: order.totalPrice,
      platformFee: order.platformFee,
      deliveryFee: order.deliveryFee,
      paymentMode: order.paymentMode,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
    },
  });
});
