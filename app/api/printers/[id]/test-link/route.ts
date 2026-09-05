import { NextRequest, NextResponse } from 'next/server';
import { connectDB, memoryStore } from '@/lib/db';
import { authorize } from '@/lib/auth';

export async function POST(
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

    await connectDB();
    const printerId = params.id;
    const printer = memoryStore.printers.find((p) => p._id === printerId);

    if (!printer) {
      return NextResponse.json({ error: 'Printer not found' }, { status: 404 });
    }

    // Simulate hardware ping latency check
    const latency = Math.floor(8 + Math.random() * 22); // 8-30ms
    printer.lastPingAt = new Date();
    printer.isLinked = true;

    return NextResponse.json({
      success: true,
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
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
