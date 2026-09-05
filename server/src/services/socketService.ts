import { Server as SocketIOServer, Socket } from 'socket.io';
import { mongoStore } from '../db/mongoStore';

export class SocketService {
  private static io: SocketIOServer | null = null;

  public static initialize(io: SocketIOServer) {
    this.io = io;

    io.on('connection', (socket: Socket) => {
      console.log(`⚡ [Socket.io] Client connected: ${socket.id}`);

      // Client joins their persona / user room
      socket.on('join_user', (userId: string) => {
        socket.join(`user:${userId}`);
        console.log(`👤 Socket ${socket.id} joined user:${userId}`);
      });

      // Shop joins their shop channel
      socket.on('join_shop', (shopId: string) => {
        socket.join(`shop:${shopId}`);
        console.log(`🏪 Socket ${socket.id} joined shop:${shopId}`);
      });

      // Admin joins admin telemetry channel
      socket.on('join_admin', () => {
        socket.join('admin');
        console.log(`🛡️ Socket ${socket.id} joined admin channel`);
      });

      // Join specific order room for live tracking and chat
      socket.on('join_order', (orderId: string) => {
        socket.join(`order:${orderId}`);
        console.log(`📦 Socket ${socket.id} joined order:${orderId}`);
      });

      // Handle delivery partner live coordinate streaming
      socket.on('delivery_location_update', (data: { orderId: string; lat: number; lng: number }) => {
        io.to(`order:${data.orderId}`).emit('delivery_location', {
          orderId: data.orderId,
          lat: data.lat,
          lng: data.lng,
          timestamp: new Date().toISOString(),
        });
      });

      // In-app chat message between customer and shop
      socket.on(
        'send_message',
        (data: {
          orderId: string;
          senderId: string;
          senderName: string;
          senderRole: 'CUSTOMER' | 'SHOP' | 'ADMIN';
          message: string;
        }) => {
          const chatDoc = {
            _id: `msg_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            orderId: data.orderId,
            senderId: data.senderId,
            senderName: data.senderName,
            senderRole: data.senderRole,
            message: data.message,
            createdAt: new Date().toISOString(),
          };

          mongoStore.saveChatMessage(chatDoc);

          // Broadcast to order room
          io.to(`order:${data.orderId}`).emit('new_message', chatDoc);
        }
      );

      socket.on('disconnect', () => {
        console.log(`🔌 [Socket.io] Client disconnected: ${socket.id}`);
      });
    });
  }

  // Broadcast methods
  public static emitOrderStatusUpdate(orderId: string, orderData: any) {
    if (!this.io) return;
    this.io.to(`order:${orderId}`).emit('order_status_update', orderData);
    if (orderData.userId) {
      this.io.to(`user:${orderData.userId}`).emit('user_order_update', orderData);
    }
    if (orderData.shopId) {
      this.io.to(`shop:${orderData.shopId}`).emit('shop_order_update', orderData);
    }
    this.io.to('admin').emit('admin_order_update', orderData);
  }

  public static emitIncomingJob(shopId: string, orderData: any) {
    if (!this.io) return;
    console.log(`🔔 Emitting incoming job #${orderData.orderNumber} to shop:${shopId}`);
    this.io.to(`shop:${shopId}`).emit('incoming_job', orderData);
  }

  public static emitAdminTelemetry(metricUpdate: any) {
    if (!this.io) return;
    this.io.to('admin').emit('telemetry_update', metricUpdate);
  }
}
