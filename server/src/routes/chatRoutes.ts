import { Router, Request, Response } from 'express';
import { mongoStore, ChatMessageDoc } from '../db/mongoStore';
import { authenticateToken, AuthRequest } from '../middleware/auth';

export const chatRouter = Router();

// Get Chat Message History for Order
chatRouter.get('/:orderId', authenticateToken, (req: Request, res: Response) => {
  const messages = mongoStore.getChatMessagesByOrderId(req.params.orderId);
  return res.json({ success: true, messages });
});

// Post Chat Message
chatRouter.post('/:orderId', authenticateToken, (req: AuthRequest, res: Response) => {
  const { message } = req.body;
  const orderId = req.params.orderId;

  if (!message || !message.trim()) {
    return res.status(400).json({ success: false, message: 'Message content cannot be empty.' });
  }

  const senderId = req.user?.id || 'usr_customer_101';
  const senderName = req.user?.name || 'Customer';
  const senderRole = (req.user?.role === 'SHOP_OWNER' ? 'SHOP' : 'CUSTOMER') as any;

  const chatDoc: ChatMessageDoc = {
    _id: `msg_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    orderId,
    senderId,
    senderName,
    senderRole,
    message: message.trim(),
    createdAt: new Date().toISOString(),
  };

  mongoStore.saveChatMessage(chatDoc);

  return res.status(201).json({ success: true, message: chatDoc });
});
