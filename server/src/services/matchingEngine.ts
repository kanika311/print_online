import { mongoStore, geoDistanceKm, ShopDoc, OrderDoc } from '../db/mongoStore';

export interface PrintSpecsInput {
  paperSize: 'A4' | 'A3' | 'Legal' | 'Letter';
  printType: 'BW' | 'COLOR';
  paperType: 'Normal 75gsm' | 'Bond paper 85gsm' | 'Glossy 180gsm' | 'Cardstock 250gsm';
  copies: number;
  duplex: boolean;
  binding: 'None' | 'Corner Staple' | 'Spiral Ring Binding';
  customInstructions?: string;
}

export interface RankedShopResult {
  shop: ShopDoc;
  distanceKm: number;
  score: number;
  reason: string;
}

export class MatchingEngine {
  private static readonly SEARCH_RADIUS_KM = 8.0;
  private static pendingTimers: Map<string, NodeJS.Timeout> = new Map();

  /**
   * MongoDB GeoJSON matching: query shops within radius using [lng, lat]
   */
  public static findNearbyShops(
    userLng: number,
    userLat: number,
    specs: PrintSpecsInput,
    maxRadiusKm: number = this.SEARCH_RADIUS_KM
  ): RankedShopResult[] {
    const nearby = mongoStore.findShopsNear(userLng, userLat, maxRadiusKm);
    const qualified: RankedShopResult[] = [];

    for (const { shop, distanceKm } of nearby) {
      const caps = shop.capabilities;
      const supportsSize = caps.supportedSizes.includes(specs.paperSize);
      const supportsPaper = caps.supportedPapers.includes(specs.paperType);
      const supportsBinding = caps.supportedBindings.includes(specs.binding);
      const supportsColor = specs.printType === 'BW' || caps.colorPrinting;

      if (!supportsSize || !supportsPaper || !supportsBinding || !supportsColor) {
        continue;
      }

      if (shop.currentQueueCount >= 12) {
        continue;
      }

      // Ranking: Composite Score
      const ratingDeficit = Math.max(0, 5.0 - shop.rating);
      const score = parseFloat(
        (distanceKm * 1.5 + ratingDeficit * 2.0 + shop.currentQueueCount * 0.8).toFixed(2)
      );

      qualified.push({
        shop,
        distanceKm,
        score,
        reason: `${distanceKm}km away • ★${shop.rating} • ${shop.currentQueueCount} jobs in queue`,
      });
    }

    return qualified.sort((a, b) => a.score - b.score);
  }

  /**
   * Auto-reassignment timer: 45 seconds countdown
   */
  public static startAcceptTimeout(
    orderId: string,
    currentShopId: string,
    onTimeout: (reassignedShopId?: string) => void
  ) {
    if (this.pendingTimers.has(orderId)) {
      clearTimeout(this.pendingTimers.get(orderId)!);
    }

    const timer = setTimeout(() => {
      this.pendingTimers.delete(orderId);
      const order = mongoStore.getOrderById(orderId);
      if (!order || order.orderStatus !== 'DISPATCHED_TO_SHOP') {
        return;
      }

      console.log(`[MatchingEngine] Order ${order.orderNumber} timed out on shop ${currentShopId}. Auto-reassigning via MongoDB geo-search...`);

      const userLng = order.deliveryLocation?.coordinates[0] || 77.6245;
      const userLat = order.deliveryLocation?.coordinates[1] || 12.9352;

      const ranked = this.findNearbyShops(userLng, userLat, order.specs).filter(
        r => r.shop._id !== currentShopId
      );

      if (ranked.length > 0) {
        const nextShop = ranked[0].shop;
        order.shopId = nextShop._id;
        order.orderStatus = 'DISPATCHED_TO_SHOP';
        order.updatedAt = new Date().toISOString();
        mongoStore.saveOrder(order);
        onTimeout(nextShop._id);
        this.startAcceptTimeout(orderId, nextShop._id, onTimeout);
      } else {
        console.log(`[MatchingEngine] No alternate shops in MongoDB range for order ${order.orderNumber}`);
        onTimeout(undefined);
      }
    }, 45000);

    this.pendingTimers.set(orderId, timer);
  }

  public static clearAcceptTimeout(orderId: string) {
    if (this.pendingTimers.has(orderId)) {
      clearTimeout(this.pendingTimers.get(orderId)!);
      this.pendingTimers.delete(orderId);
    }
  }

  /**
   * Auto-assign delivery partner on READY status
   */
  public static assignDeliveryPartner(order: OrderDoc) {
    const partners = mongoStore.getAllDeliveryPartners().filter(p => p.isAvailable);
    if (partners.length > 0) {
      const partner = partners[0];
      partner.isAvailable = false;
      partner.currentOrderId = order._id;
      mongoStore.saveDeliveryPartner(partner);

      order.deliveryPartnerId = partner._id;
      mongoStore.saveOrder(order);
      return partner;
    }
    return undefined;
  }
}
