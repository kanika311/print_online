import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { mongoStore, ShopDoc } from '../db/mongoStore';
import { authenticateToken, AuthRequest } from '../middleware/auth';

export const shopRouter = Router();

// List all shops (or filter by online/verified)
shopRouter.get('/', (req: Request, res: Response) => {
  const { onlineOnly } = req.query;
  let shops = mongoStore.getAllShops();

  if (onlineOnly === 'true') {
    shops = shops.filter(s => s.isOnline && s.kycStatus === 'VERIFIED');
  }

  return res.json({ success: true, count: shops.length, shops });
});

// Get Shop Details by ID
shopRouter.get('/:id', (req: Request, res: Response) => {
  const shop = mongoStore.getShopById(req.params.id);
  if (!shop) {
    return res.status(404).json({ success: false, message: 'Shop not found.' });
  }

  const reviews = mongoStore.getReviewsByShopId(shop._id);
  const stock = mongoStore.getStockByShopId(shop._id);

  return res.json({
    success: true,
    shop,
    reviews,
    stock,
  });
});

// Partner App: Register Shop & KYC
shopRouter.post('/register', authenticateToken, (req: AuthRequest, res: Response) => {
  const { name, address, phone, lat, lng, tradeLicense, ownerIdProof, gstNumber, capabilities } = req.body;

  if (!name || !address || !phone || lat === undefined || lng === undefined) {
    return res.status(400).json({ success: false, message: 'Missing mandatory registration fields.' });
  }

  const ownerId = req.user?.id || 'usr_owner_dev';

  const newShop: ShopDoc = {
    _id: `shp_mongo_${uuidv4().substring(0, 8)}`,
    ownerId,
    name,
    address,
    location: {
      type: 'Point',
      coordinates: [parseFloat(lng), parseFloat(lat)], // GeoJSON [lng, lat]
    },
    phone,
    kycStatus: 'PENDING',
    kycDocs: {
      tradeLicense: tradeLicense || 'Uploaded',
      ownerIdProof: ownerIdProof || 'Uploaded',
      gstNumber: gstNumber || null,
      rejectionReason: null,
    },
    isOnline: false,
    isBusy: false,
    capabilities: capabilities || {
      supportedSizes: ['A4', 'Letter'],
      supportedPapers: ['Normal 75gsm'],
      supportedBindings: ['None', 'Corner Staple'],
      colorPrinting: true,
      duplexPrinting: true,
      maxDailyCapacity: 1000,
    },
    maxDailyCapacity: 1000,
    currentQueueCount: 0,
    rating: 5.0,
    reviewCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  mongoStore.saveShop(newShop);

  return res.status(201).json({
    success: true,
    message: 'Shop registered successfully. Pending Admin KYC verification.',
    shop: newShop,
  });
});

// Partner App: Toggle Availability (Online / Offline)
shopRouter.put('/:id/availability', authenticateToken, (req: AuthRequest, res: Response) => {
  const shop = mongoStore.getShopById(req.params.id);
  if (!shop) {
    return res.status(404).json({ success: false, message: 'Shop not found.' });
  }

  const { isOnline } = req.body;
  if (isOnline && shop.kycStatus !== 'VERIFIED') {
    return res.status(400).json({
      success: false,
      message: 'Cannot go online until your KYC documentation is approved by Admin.',
    });
  }

  shop.isOnline = Boolean(isOnline);
  shop.updatedAt = new Date().toISOString();
  mongoStore.saveShop(shop);

  return res.json({
    success: true,
    message: `Shop is now ${shop.isOnline ? 'ONLINE and accepting print orders' : 'OFFLINE'}`,
    isOnline: shop.isOnline,
  });
});

// Partner App: Update Capabilities
shopRouter.put('/:id/capabilities', authenticateToken, (req: AuthRequest, res: Response) => {
  const shop = mongoStore.getShopById(req.params.id);
  if (!shop) {
    return res.status(404).json({ success: false, message: 'Shop not found.' });
  }

  shop.capabilities = { ...shop.capabilities, ...req.body };
  shop.updatedAt = new Date().toISOString();
  mongoStore.saveShop(shop);

  return res.json({
    success: true,
    message: 'Shop print capabilities updated successfully.',
    capabilities: shop.capabilities,
  });
});

// Partner App: Get Stock Inventory
shopRouter.get('/:id/inventory', authenticateToken, (req: Request, res: Response) => {
  const stock = mongoStore.getStockByShopId(req.params.id);
  return res.json({ success: true, stock });
});

// Partner App: Update Stock Item (e.g. low stock / out of stock toggle)
shopRouter.put('/:id/inventory/:stockId', authenticateToken, (req: Request, res: Response) => {
  const { currentStock, isLowStock, isOutOfStock } = req.body;
  const stock = mongoStore.getStockByShopId(req.params.id);
  const item = stock.find(s => s._id === req.params.stockId);

  if (!item) {
    return res.status(404).json({ success: false, message: 'Stock item not found.' });
  }

  if (currentStock !== undefined) item.currentStock = currentStock;
  if (isLowStock !== undefined) item.isLowStock = isLowStock;
  if (isOutOfStock !== undefined) item.isOutOfStock = isOutOfStock;
  item.updatedAt = new Date().toISOString();

  mongoStore.saveStockItem(item);

  return res.json({ success: true, message: 'Stock item updated.', item });
});

// Partner App: Earnings & Revenue Analytics
shopRouter.get('/:id/earnings', authenticateToken, (req: Request, res: Response) => {
  const shopId = req.params.id;
  const orders = mongoStore.getOrders({ shopId });
  const transactions = mongoStore.getAllTransactions().filter(t => t.shopId === shopId);

  const completedOrders = orders.filter(o => o.orderStatus === 'COMPLETED');
  const grossRevenue = completedOrders.reduce((acc, o) => acc + o.shopEarnings, 0);

  // Today's orders
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayOrders = completedOrders.filter(o => new Date(o.createdAt) >= todayStart);
  const todayRevenue = todayOrders.reduce((acc, o) => acc + o.shopEarnings, 0);

  // Pending settlements
  const pendingSettlement = transactions
    .filter(t => t.settlementStatus === 'UNSETTLED')
    .reduce((acc, t) => acc + t.shopCut, 0);

  return res.json({
    success: true,
    metrics: {
      grossRevenue: parseFloat(grossRevenue.toFixed(2)),
      todayRevenue: parseFloat(todayRevenue.toFixed(2)),
      todayOrderCount: todayOrders.length,
      totalCompletedOrders: completedOrders.length,
      pendingSettlement: parseFloat(pendingSettlement.toFixed(2)),
      activeQueueCount: orders.filter(o => ['DISPATCHED_TO_SHOP', 'ACCEPTED', 'PRINTING'].includes(o.orderStatus)).length,
    },
  });
});
