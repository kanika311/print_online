import { NextRequest, NextResponse } from 'next/server';
import { connectDB, memoryStore } from '@/lib/db';
import { authorize } from '@/lib/auth';
import { PrinterCreateSchema } from '@/lib/validations';
import { emitSocketEvent } from '@/lib/socketServer';
import { Printer } from '@/models/Printer';

export async function GET(req: NextRequest) {
  try {
    const { isFallback } = await connectDB();
    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get('shopId');

    let printers: any[] = [];
    if (!isFallback) {
      try {
        const query = shopId ? { shopId } : {};
        printers = await Printer.find(query).lean();
      } catch (err) {
        console.warn('DB query error in printers:', err);
        printers = memoryStore.printers;
      }
    } else {
      printers = memoryStore.printers;
    }

    if (shopId) {
      printers = printers.filter((p) => p.shopId === shopId);
    }

    return NextResponse.json({ printers });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch printers' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = authorize(req, ['ADMIN', 'SHOP_OWNER']);
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { isFallback } = await connectDB();
    const body = await req.json();

    const parsed = PrinterCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Verify shop ownership if shop owner
    if (
      authResult.session?.role === 'SHOP_OWNER' &&
      authResult.session.shopId &&
      authResult.session.shopId !== data.shopId
    ) {
      return NextResponse.json(
        { error: 'You can only add printers to your own shop' },
        { status: 403 }
      );
    }

    const printerId = `prn_${Date.now()}`;
    const newPrinter = {
      _id: printerId,
      shopId: data.shopId,
      name: data.name,
      model: data.model,
      type: data.type,
      paperSizes: data.paperSizes,
      status: 'AVAILABLE' as const,
      ppmSpeed: data.ppmSpeed,
      currentJobId: null,
      currentDocumentName: null,
      queueCount: 0,
      totalPrintsCompleted: 0,
      supportsDuplex: data.supportsDuplex,
      connectionType: data.connectionType || 'NETWORK_IP',
      ipAddress: data.ipAddress || (data.connectionType === 'NETWORK_IP' ? '192.168.1.110' : undefined),
      portNumber: data.portNumber || 9100,
      usbPort: data.usbPort,
      pairingCode: data.pairingCode || `PP-${Math.floor(1000 + Math.random() * 9000)}`,
      isLinked: data.isLinked !== undefined ? data.isLinked : true,
      lastPingAt: new Date(),
      notes: data.notes || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (!isFallback) {
      try {
        await Printer.create(newPrinter);
      } catch {
        memoryStore.printers.push(newPrinter);
      }
    } else {
      memoryStore.printers.push(newPrinter);
    }

    emitSocketEvent('printer:added', newPrinter, `shop:${data.shopId}`);

    return NextResponse.json({
      success: true,
      message: 'Printer added to fleet successfully!',
      printer: newPrinter,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create printer' },
      { status: 500 }
    );
  }
}
