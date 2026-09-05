import { NextRequest, NextResponse } from 'next/server';
import { connectDB, memoryStore } from '@/lib/db';
import { authorize } from '@/lib/auth';
import { PrinterStatusSchema } from '@/lib/validations';
import { emitSocketEvent } from '@/lib/socketServer';
import { Printer } from '@/models/Printer';

export async function PATCH(
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
    const body = await req.json();

    const parsed = PrinterStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { status, currentJobId, currentDocumentName } = parsed.data;

    let printer: any = null;
    if (!isFallback) {
      try {
        printer = await Printer.findById(printerId);
      } catch {
        // use memory store
      }
    }

    if (!printer) {
      printer = memoryStore.printers.find(
        (p) => p._id.toString() === printerId
      );
    }

    if (!printer) {
      return NextResponse.json({ error: 'Printer not found' }, { status: 404 });
    }

    printer.status = status;
    if (currentJobId !== undefined) printer.currentJobId = currentJobId;
    if (currentDocumentName !== undefined) printer.currentDocumentName = currentDocumentName;
    printer.updatedAt = new Date();

    if (!isFallback && typeof printer.save === 'function') {
      try {
        await printer.save();
      } catch (e) {
        console.warn('DB save error, updated in memory:', e);
      }
    }

    const eventPayload = {
      printerId,
      shopId: printer.shopId,
      status: printer.status,
      currentJobId: printer.currentJobId,
      currentDocumentName: printer.currentDocumentName,
    };

    // Emit live WebSocket update to shop and globally
    emitSocketEvent('printer:status_updated', eventPayload, `shop:${printer.shopId}`);
    emitSocketEvent('printer:status_updated', eventPayload);

    return NextResponse.json({
      success: true,
      message: `Printer status updated to ${status}`,
      printer,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update printer status' },
      { status: 500 }
    );
  }
}
