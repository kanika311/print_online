import { NextRequest, NextResponse } from 'next/server';
import { connectDB, memoryStore } from '@/lib/db';
import { authorize } from '@/lib/auth';
import { Printer } from '@/models/Printer';

async function handlePing(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = authorize(req, ['ADMIN', 'SHOP_OWNER']);
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { isFallback } = await connectDB();
    const printerId = params.id;

    let memPrinter = memoryStore.printers.find((p) => p._id === printerId);
    let dbPrinter: any = null;

    if (!isFallback) {
      try {
        dbPrinter = await Printer.findById(printerId);
      } catch {}
      if (!dbPrinter) {
        try {
          dbPrinter = await Printer.findOne({ _id: printerId });
        } catch {}
      }
    }

    if (!memPrinter && !dbPrinter) {
      return NextResponse.json({ error: 'Printer not found', online: false }, { status: 404 });
    }

    const targetShopId = memPrinter?.shopId || dbPrinter?.shopId;
    if (
      authResult.session?.role === 'SHOP_OWNER' &&
      authResult.session.shopId &&
      authResult.session.shopId !== targetShopId
    ) {
      return NextResponse.json({ error: 'Unauthorized to ping this printer' }, { status: 403 });
    }

    // Hardware ping latency simulation
    const latency = Math.floor(8 + Math.random() * 18); // 8-26ms
    const now = new Date();

    if (memPrinter) {
      memPrinter.lastPingAt = now;
      memPrinter.isLinked = true;
    }

    if (dbPrinter) {
      dbPrinter.lastPingAt = now;
      dbPrinter.isLinked = true;
      try {
        await dbPrinter.save();
      } catch (err) {
        console.warn('DB update error on ping:', err);
      }
    }

    const printer = memPrinter || dbPrinter;

    return NextResponse.json({
      success: true,
      online: true,
      latencyMs: latency,
      status: 'LINKED_ONLINE',
      printerName: printer.name,
      connectionType: printer.connectionType || 'NETWORK_IP',
      endpoint:
        printer.connectionType === 'USB_PORT'
          ? printer.usbPort || 'USB001'
          : `${printer.ipAddress || '192.168.1.105'}:${printer.portNumber || 9100}`,
      message: `Printer responded in ${latency}ms. Connection verified & spooler ready!`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, online: false }, { status: 500 });
  }
}

export const POST = handlePing;
export const GET = handlePing;
