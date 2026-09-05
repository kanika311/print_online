import { v4 as uuidv4 } from 'uuid';
import { mongoStore, OrderDoc, TransactionDoc, UserDoc } from '../db/mongoStore';

export class PaymentService {
  /**
   * Fraud & Abuse check on repeated COD cancellations
   */
  public static canUseCOD(user: UserDoc): { allowed: boolean; reason?: string } {
    if (user.isBlocked) {
      return { allowed: false, reason: 'Your account has been restricted by platform administration.' };
    }
    if (user.codNoShows >= 2) {
      return {
        allowed: false,
        reason: 'COD is restricted due to repeated uncollected orders. Please choose Online payment.',
      };
    }
    return { allowed: true };
  }

  /**
   * Process Online Payment with Escrow hold
   */
  public static initiateOnlinePayment(order: OrderDoc): TransactionDoc {
    const tx: TransactionDoc = {
      _id: `tx_mongo_${uuidv4().substring(0, 8)}`,
      orderId: order._id,
      userId: order.userId,
      shopId: order.shopId,
      amount: order.totalPrice,
      platformCut: order.platformFee,
      shopCut: order.shopEarnings,
      mode: 'ONLINE',
      status: 'HELD_IN_ESCROW',
      settlementStatus: 'UNSETTLED',
      createdAt: new Date().toISOString(),
    };

    order.paymentStatus = 'ESCROW_HELD';
    mongoStore.saveOrder(order);
    mongoStore.saveTransaction(tx);
    return tx;
  }

  /**
   * Partner / Shop confirms "Cash Received" for COD orders
   */
  public static confirmCashReceived(
    orderId: string,
    shopOwnerId: string
  ): { success: boolean; order?: OrderDoc; message: string } {
    const order = mongoStore.getOrderById(orderId);
    if (!order) {
      return { success: false, message: 'Order not found in MongoDB database.' };
    }

    if (order.paymentMode !== 'COD') {
      return { success: false, message: 'This order is not marked as Cash on Delivery.' };
    }

    if (order.paymentStatus === 'COLLECTED_BY_SHOP') {
      return { success: false, message: 'Cash has already been marked as received for this order.' };
    }

    // Update order status
    order.paymentStatus = 'COLLECTED_BY_SHOP';
    order.orderStatus = 'COMPLETED';
    order.updatedAt = new Date().toISOString();
    mongoStore.saveOrder(order);

    // Create MongoDB transaction ledger entry
    const tx: TransactionDoc = {
      _id: `tx_cod_mongo_${uuidv4().substring(0, 8)}`,
      orderId: order._id,
      userId: order.userId,
      shopId: order.shopId,
      amount: order.totalPrice,
      platformCut: order.platformFee,
      shopCut: order.shopEarnings,
      mode: 'COD',
      status: 'SETTLED',
      settlementStatus: 'VERIFIED_BY_ADMIN',
      settledAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    mongoStore.saveTransaction(tx);

    // Update shop queue
    if (order.shopId) {
      const shop = mongoStore.getShopById(order.shopId);
      if (shop) {
        shop.currentQueueCount = Math.max(0, shop.currentQueueCount - 1);
        mongoStore.saveShop(shop);
      }
    }

    return {
      success: true,
      order,
      message: 'Cash payment confirmed and recorded in COD reconciliation ledger.',
    };
  }

  /**
   * Release Escrow payment to shop on order completion
   */
  public static releaseEscrow(orderId: string): boolean {
    const order = mongoStore.getOrderById(orderId);
    if (!order || order.paymentMode !== 'ONLINE') return false;

    const allTx = mongoStore.getAllTransactions().filter(t => t.orderId === orderId);
    if (allTx.length > 0) {
      const tx = allTx[0];
      tx.status = 'SETTLED';
      tx.settlementStatus = 'DISBURSED';
      tx.settledAt = new Date().toISOString();
      mongoStore.saveTransaction(tx);

      order.paymentStatus = 'PAID_OUT';
      mongoStore.saveOrder(order);

      // Credit shop owner balance
      if (order.shopId) {
        const shop = mongoStore.getShopById(order.shopId);
        if (shop) {
          const owner = mongoStore.getUserById(shop.ownerId);
          if (owner) {
            owner.walletBalance = parseFloat((owner.walletBalance + order.shopEarnings).toFixed(2));
            mongoStore.saveUser(owner);
          }
        }
      }
      return true;
    }
    return false;
  }
}
