export interface NotificationLog {
  id: string;
  recipientPhone: string;
  recipientRole: 'CUSTOMER' | 'SHOP' | 'DELIVERY';
  channel: 'SMS' | 'WHATSAPP' | 'PUSH';
  title: string;
  body: string;
  orderNumber?: string;
  timestamp: string;
}

export class NotificationService {
  private static logs: NotificationLog[] = [];

  public static send(
    channel: 'SMS' | 'WHATSAPP' | 'PUSH',
    recipientRole: 'CUSTOMER' | 'SHOP' | 'DELIVERY',
    recipientPhone: string,
    title: string,
    body: string,
    orderNumber?: string
  ): NotificationLog {
    const log: NotificationLog = {
      id: `notif_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      recipientPhone,
      recipientRole,
      channel,
      title,
      body,
      orderNumber,
      timestamp: new Date().toISOString(),
    };

    this.logs.unshift(log);
    if (this.logs.length > 50) this.logs.pop(); // keep last 50

    // Console broadcast for real-time visibility
    console.log(`📢 [${channel}] to ${recipientRole} (${recipientPhone}): ${title} - ${body}`);
    return log;
  }

  public static getRecentLogs(): NotificationLog[] {
    return this.logs;
  }

  // Pre-configured notification shortcuts
  public static notifyOrderPlaced(phone: string, orderNumber: string, shopName: string) {
    this.send(
      'WHATSAPP',
      'CUSTOMER',
      phone,
      'Order Confirmed 🎉',
      `Your print job #${orderNumber} has been received and routed to ${shopName}. We'll notify you once printing begins!`,
      orderNumber
    );
  }

  public static notifyOrderReady(phone: string, orderNumber: string, deliveryType: string) {
    const actionText =
      deliveryType === 'SELF_PICKUP'
        ? 'is ready for counter pickup! Please present your order ID.'
        : 'is packed and our delivery partner is picking it up right now.';
    this.send(
      'SMS',
      'CUSTOMER',
      phone,
      'Print Completed 🖨️',
      `Your order #${orderNumber} ${actionText}`,
      orderNumber
    );
  }

  public static notifyShopNewJob(phone: string, orderNumber: string, pageCount: number, copies: number) {
    this.send(
      'PUSH',
      'SHOP',
      phone,
      '🚨 New Print Job Dispatched!',
      `Job #${orderNumber}: ${pageCount} pages × ${copies} copies. Please accept within 45 seconds.`,
      orderNumber
    );
  }
}
