import { Router, Request, Response } from 'express';
import { NotificationService } from '../services/notificationService';
import { mongoStore } from '../db/mongoStore';

export const notificationRouter = Router();

// Get recent SMS/WhatsApp/Push notification logs
notificationRouter.get('/logs', (req: Request, res: Response) => {
  const logs = NotificationService.getRecentLogs();
  return res.json({ success: true, logs });
});

// Get active platform broadcasts
notificationRouter.get('/broadcasts', (req: Request, res: Response) => {
  const broadcasts = mongoStore.getActiveBroadcasts();
  return res.json({ success: true, broadcasts });
});
